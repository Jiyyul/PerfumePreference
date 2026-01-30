import { NextRequest } from 'next/server';
import { requireUser } from '@/app/api/_shared/auth';
import { ok, badRequest, serverError, unauthorized } from '@/app/api/_shared/response';
import { generateChatResponse, type AIProvider } from '@/lib/ai-chat';
import { z } from 'zod';

/**
 * POST /api/ai/chat
 * 
 * 역할: AI 챗봇 질문/답변 처리
 * 
 * Request Body:
 * - prompt: string (사용자 질문)
 * - provider: "google" | "groq" (AI provider)
 * 
 * Response:
 * - response: string (AI 답변)
 * - provider: string (사용된 provider)
 * - latencyMs: number (응답 시간)
 * 
 * 데이터 흐름:
 * 1. 사용자 인증 확인
 * 2. Request body 검증
 * 3. AI 답변 생성 (lib/ai-chat.ts)
 * 4. ai_responses 테이블에 저장
 * 5. 응답 반환
 * 
 * 에러 처리:
 * - API 키 없음 → 500 에러
 * - Quota 초과 → 500 에러 (UI에서 Groq로 전환 안내)
 * - DB 저장 실패 → 로그만 출력, 응답은 정상 반환
 */

// Request body 스키마
const chatRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  provider: z.enum(['google', 'groq']),
});

export async function POST(request: NextRequest) {
  // 1. 권한 체크
  const auth = await requireUser();
  if (!auth.ok) {
    return unauthorized('Unauthorized');
  }

  const { supabase, user } = auth;

  try {
    // 2. Request body 파싱 및 검증
    const body = await request.json();
    const parseResult = chatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequest(parseResult.error.errors[0].message);
    }

    const { prompt, provider } = parseResult.data;

    console.log(`[POST /api/ai/chat] User: ${user.id}, Provider: ${provider}`);
    console.log(`[POST /api/ai/chat] Prompt: ${prompt.substring(0, 50)}...`);

    // 3. AI 답변 생성
    let chatResult;
    try {
      chatResult = await generateChatResponse({
        prompt,
        provider: provider as AIProvider,
      });
    } catch (error: unknown) {
      // 에러 상세 로깅
      console.error('[POST /api/ai/chat] ========== AI GENERATION ERROR ==========');
      console.error('[POST /api/ai/chat] Provider:', provider);
      console.error('[POST /api/ai/chat] User ID:', user.id);
      console.error('[POST /api/ai/chat] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[POST /api/ai/chat] Error message:', error instanceof Error ? error.message : String(error));
      
      // 추가 에러 정보
      if (error && typeof error === 'object') {
        const err = error as any;
        if (err.code) console.error('[POST /api/ai/chat] Error code:', err.code);
        if (err.statusCode) console.error('[POST /api/ai/chat] Status code:', err.statusCode);
        if (err.cause) console.error('[POST /api/ai/chat] Cause:', err.cause);
      }
      
      console.error('[POST /api/ai/chat] Error stack:', error instanceof Error ? error.stack : 'N/A');
      console.error('[POST /api/ai/chat] ===============================================');

      // 특정 에러 타입별 처리
      if (error instanceof Error) {
        const errorMsg = error.message;
        
        // Quota Exceeded
        if (errorMsg === 'QUOTA_EXCEEDED' || errorMsg.includes('quota')) {
          console.error('[POST /api/ai/chat] 📊 Detected: Quota exceeded');
          return serverError('구글 할당량이 초과되었습니다. Groq 엔진으로 변경하여 시도해 보세요.', {
            headers: { 'X-Error-Code': 'QUOTA_EXCEEDED' }
          });
        }

        // Google API Key 누락
        if (errorMsg === 'GOOGLE_API_KEY_MISSING') {
          console.error('[POST /api/ai/chat] 🔑 Detected: Google API key is missing');
          console.error('[POST /api/ai/chat] 💡 Hint: GOOGLE_GENERATIVE_AI_API_KEY 환경변수를 확인하세요');
          return serverError('Google API 키가 설정되지 않았습니다. (환경변수: GOOGLE_GENERATIVE_AI_API_KEY)', {
            headers: { 'X-Error-Code': 'GOOGLE_API_KEY_MISSING' }
          });
        }

        // Groq API Key 누락
        if (errorMsg === 'GROQ_API_KEY_MISSING') {
          console.error('[POST /api/ai/chat] 🔑 Detected: Groq API key is missing');
          return serverError('Groq API 키가 설정되지 않았습니다. (환경변수: GROQ_API_KEY)', {
            headers: { 'X-Error-Code': 'GROQ_API_KEY_MISSING' }
          });
        }

        // Invalid API Key
        if (errorMsg === 'INVALID_API_KEY' || errorMsg.includes('unauthorized') || errorMsg.includes('invalid key')) {
          console.error('[POST /api/ai/chat] 🔑 Detected: Invalid API key');
          return serverError(`${provider === 'google' ? 'Google' : 'Groq'} API 키가 유효하지 않습니다.`, {
            headers: { 'X-Error-Code': 'INVALID_API_KEY' }
          });
        }

        // Model Error
        if (errorMsg.startsWith('MODEL_ERROR:') || errorMsg.includes('model') || errorMsg.includes('not found')) {
          console.error('[POST /api/ai/chat] 🤖 Detected: Model error');
          console.error('[POST /api/ai/chat] 💡 Hint: Google 모델명/SDK 버전 불일치 가능성');
          
          // UI용 간결한 메시지
          return serverError('Google 모델 설정 문제로 응답 생성에 실패했습니다. (모델명/버전 불일치)', {
            headers: { 'X-Error-Code': 'MODEL_ERROR' }
          });
        }

        // 원본 에러 메시지 (민감정보 제외)
        const safeErrorMessage = errorMsg
          .replace(/[A-Za-z0-9_-]{30,}/g, '[REDACTED]') // API 키 같은 긴 문자열 제거
          .substring(0, 200); // 최대 200자
        
        console.error('[POST /api/ai/chat] 📝 Safe error message:', safeErrorMessage);
        
        return serverError(`AI 답변 생성 실패: ${safeErrorMessage}`, {
          headers: { 'X-Error-Code': 'AI_GENERATION_FAILED' }
        });
      }

      // 알 수 없는 에러
      return serverError('AI 답변 생성에 실패했습니다. 서버 로그를 확인해주세요.', {
        headers: { 'X-Error-Code': 'UNKNOWN_ERROR' }
      });
    }

    // 4. DB에 저장 (저장 실패해도 응답은 반환)
    try {
      const { error: saveError } = await supabase
        .from('ai_responses')
        .insert({
          user_id: user.id,
          prompt,
          response: chatResult.response,
          provider: chatResult.provider,
          category: 'chatbot',
          latency_ms: chatResult.latencyMs,
        });

      if (saveError) {
        console.error('[POST /api/ai/chat] Failed to save to DB:', saveError);
        // DB 저장 실패해도 응답은 반환 (사용자 경험 우선)
      } else {
        console.log('[POST /api/ai/chat] Successfully saved to DB');
      }
    } catch (dbError) {
      console.error('[POST /api/ai/chat] DB save exception:', dbError);
      // 저장 실패해도 계속 진행
    }

    // 5. 응답 반환
    console.log(`[POST /api/ai/chat] Response sent successfully`);
    console.log(`[POST /api/ai/chat] Latency: ${chatResult.latencyMs}ms`);
    console.log(`[POST /api/ai/chat] Tokens: ${chatResult.tokensUsed || 'N/A'}`);

    return ok({
      response: chatResult.response,
      provider: chatResult.provider,
      latencyMs: chatResult.latencyMs,
    });
  } catch (error) {
    console.error('[POST /api/ai/chat] Unexpected error:', error);
    return serverError('Internal server error');
  }
}
