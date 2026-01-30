/**
 * AI 챗봇 로직 (Google Gemini / Groq)
 * 
 * 목적: 사용자 질문에 대한 AI 답변 생성
 * 
 * 비용 최적화:
 * - maxTokens: 300 제한 (간결한 응답)
 * - Flash 계열 모델 사용 (빠르고 저렴)
 * - 시스템 프롬프트로 핵심만 간결하게 답변하도록 유도
 * 
 * SDK 사용:
 * - Google: @google/generative-ai (공식 SDK, lib/ai-explanation.ts와 동일)
 * - Groq: @ai-sdk/groq (Vercel AI SDK)
 */

import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'google' | 'groq';

export interface ChatInput {
  prompt: string;
  provider: AIProvider;
}

export interface ChatOutput {
  response: string;
  provider: AIProvider;
  latencyMs: number;
  tokensUsed?: number;
}

/**
 * AI 챗봇 답변 생성
 * 
 * @throws Error - API 키 없음, Quota 초과, 네트워크 오류 등
 */
export async function generateChatResponse(input: ChatInput): Promise<ChatOutput> {
  // Provider별 분기 처리 (각 provider는 다른 SDK 사용)
  if (input.provider === 'google') {
    return generateGoogleResponse(input);
  } else if (input.provider === 'groq') {
    return generateGroqResponse(input);
  } else {
    throw new Error(`Unsupported provider: ${input.provider}`);
  }
}

/**
 * Google Gemini 답변 생성 (@google/generative-ai SDK 사용)
 * 
 * Fallback chain을 통해 사용 가능한 모델 자동 선택
 */
async function generateGoogleResponse(input: ChatInput): Promise<ChatOutput> {
  const startTime = Date.now();

  // 1. API 키 검증 (상세 로깅 추가)
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  console.log(`[AI Chat] ========================================`);
  console.log(`[AI Chat] 🔍 Environment Check:`);
  console.log(`[AI Chat]    - GOOGLE_GENERATIVE_AI_API_KEY exists: ${!!apiKey}`);
  console.log(`[AI Chat]    - API Key length: ${apiKey?.length || 0}`);
  console.log(`[AI Chat]    - API Key preview: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);
  
  if (!apiKey || apiKey.trim() === '') {
    console.error('[AI Chat] ❌ GOOGLE_GENERATIVE_AI_API_KEY is missing or empty');
    throw new Error('GOOGLE_API_KEY_MISSING');
  }

  // 2. Gemini 클라이언트 초기화
  console.log(`[AI Chat] 🔧 Initializing Google Generative AI client...`);
  const genAI = new GoogleGenerativeAI(apiKey);
  console.log(`[AI Chat] ✅ Client initialized successfully`);
  
  // 3. Fallback chain: 우선순위대로 시도 (stable 모델 우선)
  const modelCandidates = [
    'gemini-2.5-flash',         // 1순위: 최신 stable (2026년 권장)
    'gemini-2.0-flash',         // 2순위: 2세대 stable
    'gemini-1.5-flash',         // 3순위: 1세대 legacy
  ];

  console.log(`[AI Chat] Provider: google`);
  console.log(`[AI Chat] SDK: @google/generative-ai (공식 SDK)`);
  console.log(`[AI Chat] Fallback chain: ${modelCandidates.join(' → ')}`);
  console.log(`[AI Chat] Input prompt length: ${input.prompt.length} chars`);

  // 4. Fallback chain으로 모델 시도
  let lastError: Error | null = null;
  
  for (const modelName of modelCandidates) {
    try {
      console.log(`[AI Chat] 🔄 Trying model: ${modelName}`);
      
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 300, // 챗봇은 간결하게
          temperature: 0.7,
        },
      });

      // 프롬프트 구성 (시스템 프롬프트 포함)
      const prompt = `당신은 친절하고 정확한 AI 어시스턴트입니다.

중요한 규칙:
- 핵심만 간결하게 답변하세요 (최대 300 토큰)
- 불필요한 인사말이나 긴 서론은 생략하세요
- 사용자의 질문에 직접적으로 답변하세요
- 모르는 내용은 솔직하게 "잘 모르겠습니다"라고 답하세요

질문: ${input.prompt}`;

      console.log(`[AI Chat] 📤 Sending request to API...`);
      
      // API 호출
      const result = await model.generateContent(prompt);
      
      console.log(`[AI Chat] 📥 Received response from API`);
      console.log(`[AI Chat] 🔍 Response object exists: ${!!result}`);
      console.log(`[AI Chat] 🔍 Response.response exists: ${!!result?.response}`);
      
      const response = result.response;
      
      // 응답 상세 디버깅
      console.log(`[AI Chat] 🔍 Response details:`);
      console.log(`[AI Chat]    - candidates: ${response.candidates?.length || 0}`);
      console.log(`[AI Chat]    - promptFeedback: ${JSON.stringify(response.promptFeedback || {})}`);
      
      // 안전성 필터링으로 차단된 경우
      if (response.candidates && response.candidates.length === 0) {
        console.error(`[AI Chat] ❌ Response blocked - no candidates returned`);
        console.error(`[AI Chat] 💡 Possible reason: Content filtered by safety settings`);
        throw new Error('Response blocked by safety filters');
      }
      
      // 텍스트 추출
      let text: string;
      try {
        text = response.text();
        console.log(`[AI Chat] ✅ Text extracted successfully`);
        console.log(`[AI Chat] 🔍 Text length: ${text?.length || 0} chars`);
        console.log(`[AI Chat] 🔍 Text preview: ${text?.substring(0, 50) || 'EMPTY'}...`);
      } catch (textError) {
        console.error(`[AI Chat] ❌ Failed to extract text from response`);
        console.error(`[AI Chat] 💡 Error: ${textError instanceof Error ? textError.message : String(textError)}`);
        console.error(`[AI Chat] 💡 Raw response: ${JSON.stringify(response, null, 2)}`);
        throw new Error(`Failed to extract text: ${textError instanceof Error ? textError.message : 'Unknown error'}`);
      }

      // 빈 응답 체크
      if (!text || text.trim() === '') {
        console.error(`[AI Chat] ❌ Empty response received`);
        console.error(`[AI Chat] 💡 Text is empty or whitespace only`);
        console.error(`[AI Chat] 💡 Raw text value: "${text}"`);
        throw new Error('Empty response from API');
      }

      const latencyMs = Date.now() - startTime;
      const tokensUsed = estimateTokens(text);

      // 성공!
      console.log(`[AI Chat] ✅ SUCCESS with model: ${modelName}`);
      console.log(`[AI Chat] ⏱️  Latency: ${latencyMs}ms`);
      console.log(`[AI Chat] 🔢 Tokens used (estimated): ${tokensUsed}`);
      console.log(`[AI Chat] 📝 Response preview: ${text.substring(0, 100)}...`);
      console.log(`[AI Chat] ========================================`);

      return {
        response: text,
        provider: 'google',
        latencyMs,
        tokensUsed,
      };
    } catch (error: unknown) {
      // 이 모델은 실패, 다음 모델 시도
      console.error(`[AI Chat] ❌ Failed with model: ${modelName}`);
      
      if (error instanceof Error) {
        console.error(`[AI Chat]    ⚠️  Error type: ${error.constructor.name}`);
        console.error(`[AI Chat]    ⚠️  Error message: ${error.message}`);
        console.error(`[AI Chat]    ⚠️  Error stack: ${error.stack?.substring(0, 200)}...`);
        lastError = error;

        const errorMsg = error.message.toLowerCase();
        
        // Quota/API Key 문제는 모델 변경으로 해결 불가 → 즉시 throw
        if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('resource_exhausted')) {
          console.error('[AI Chat] 🚫 Quota exceeded - stopping fallback chain');
          throw new Error('QUOTA_EXCEEDED');
        }
        
        if (errorMsg.includes('api key') || errorMsg.includes('unauthorized') || errorMsg.includes('invalid key')) {
          console.error('[AI Chat] 🚫 Invalid API key - stopping fallback chain');
          throw new Error('INVALID_API_KEY');
        }
        
        // 빈 응답 에러는 fallback 계속 시도
        if (errorMsg.includes('empty response') || errorMsg.includes('text length: 0')) {
          console.error('[AI Chat] ⚠️  Empty response - trying next model');
          continue;
        }
      } else {
        console.error(`[AI Chat]    ⚠️  Unknown error type: ${typeof error}`);
        console.error(`[AI Chat]    ⚠️  Error value: ${String(error)}`);
      }
      
      // 다음 모델 시도
      continue;
    }
  }

  // 모든 모델 실패
  console.error('[AI Chat] ========== ALL MODELS FAILED ==========');
  console.error('[AI Chat] 🚫 Tried models:', modelCandidates.join(', '));
  console.error('[AI Chat] 🚫 Last error type:', lastError?.constructor.name);
  console.error('[AI Chat] 🚫 Last error message:', lastError?.message);
  console.error('[AI Chat] 🚫 Last error stack:', lastError?.stack);
  console.error('[AI Chat] ===============================================');

  if (lastError) {
    const errorMsg = lastError.message;
    if (errorMsg.toLowerCase().includes('model') || errorMsg.toLowerCase().includes('not found')) {
      throw new Error(`MODEL_ERROR: All models failed. Last: ${errorMsg.substring(0, 150)}`);
    }
    
    // 원본 에러 메시지를 포함하여 throw
    throw new Error(`All models failed. Last error: ${errorMsg.substring(0, 200)}`);
  }

  throw new Error('MODEL_ERROR: All fallback models failed with unknown error');
}

/**
 * Groq 답변 생성 (@ai-sdk/groq SDK 사용)
 * 기존 방식 유지 (정상 동작 중)
 */
async function generateGroqResponse(input: ChatInput): Promise<ChatOutput> {
  const startTime = Date.now();

  // 1. API 키 검증 (상세 로깅 추가)
  const apiKey = process.env.GROQ_API_KEY;
  console.log(`[AI Chat] ========================================`);
  console.log(`[AI Chat] 🔍 Environment Check:`);
  console.log(`[AI Chat]    - GROQ_API_KEY exists: ${!!apiKey}`);
  console.log(`[AI Chat]    - API Key length: ${apiKey?.length || 0}`);
  console.log(`[AI Chat]    - API Key preview: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);
  
  if (!apiKey || apiKey.trim() === '') {
    console.error('[AI Chat] ❌ GROQ_API_KEY is missing or empty');
    throw new Error('GROQ_API_KEY_MISSING');
  }

  // 2. 모델 초기화
  console.log(`[AI Chat] 🔧 Initializing Groq model...`);
  const model = groq('llama-3.3-70b-versatile');
  console.log(`[AI Chat] ✅ Model initialized successfully`);
  
  // 3. 시스템 프롬프트
  const systemPrompt = `당신은 친절하고 정확한 AI 어시스턴트입니다.

중요한 규칙:
- 핵심만 간결하게 답변하세요 (최대 300 토큰)
- 불필요한 인사말이나 긴 서론은 생략하세요
- 사용자의 질문에 직접적으로 답변하세요
- 모르는 내용은 솔직하게 "잘 모르겠습니다"라고 답하세요`.trim();

  console.log(`[AI Chat] Provider: groq`);
  console.log(`[AI Chat] Model: llama-3.3-70b-versatile`);
  console.log(`[AI Chat] SDK: @ai-sdk/groq (Vercel AI SDK)`);
  console.log(`[AI Chat] Input prompt length: ${input.prompt.length} chars`);
  console.log(`[AI Chat] 📤 Sending request to API...`);
  
  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: input.prompt,
      temperature: 0.7,
    });

    console.log(`[AI Chat] 📥 Received response from API`);
    console.log(`[AI Chat] 🔍 Result object exists: ${!!result}`);
    console.log(`[AI Chat] 🔍 Result.text exists: ${!!result?.text}`);
    console.log(`[AI Chat] 🔍 Text length: ${result.text?.length || 0} chars`);
    console.log(`[AI Chat] 🔍 Text preview: ${result.text?.substring(0, 50) || 'EMPTY'}...`);

    // 빈 응답 체크
    if (!result.text || result.text.trim() === '') {
      console.error(`[AI Chat] ❌ Empty response received from Groq`);
      console.error(`[AI Chat] 💡 Text is empty or whitespace only`);
      console.error(`[AI Chat] 💡 Raw text value: "${result.text}"`);
      throw new Error('Empty response from Groq API');
    }

    const latencyMs = Date.now() - startTime;
    const tokensUsed = estimateTokens(result.text);

    console.log(`[AI Chat] ✅ Response generated successfully`);
    console.log(`[AI Chat] ⏱️  Latency: ${latencyMs}ms`);
    console.log(`[AI Chat] 🔢 Tokens used (estimated): ${tokensUsed}`);
    console.log(`[AI Chat] 📝 Response preview: ${result.text.substring(0, 100)}...`);
    console.log(`[AI Chat] ========================================`);

    return {
      response: result.text,
      provider: 'groq',
      latencyMs,
      tokensUsed,
    };
  } catch (error: unknown) {
    // 에러 로깅 (상세화)
    console.error('[AI Chat] ========== GROQ ERROR ==========');
    console.error('[AI Chat] ❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[AI Chat] ❌ Error message:', error instanceof Error ? error.message : String(error));
    
    if (error && typeof error === 'object') {
      const err = error as any;
      if (err.code) console.error('[AI Chat] 💡 Error code:', err.code);
      if (err.statusCode) console.error('[AI Chat] 💡 Status code:', err.statusCode);
      if (err.cause) console.error('[AI Chat] 💡 Cause:', err.cause);
    }
    
    console.error('[AI Chat] ❌ Error stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('[AI Chat] ❌ Full error object:', JSON.stringify(error, null, 2));
    console.error('[AI Chat] =========================================');

    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      // Quota/Rate limit
      if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('resource_exhausted') || errorMsg.includes('rate limit')) {
        console.error('[AI Chat] 🚫 Detected: Quota/Rate limit exceeded');
        throw new Error('QUOTA_EXCEEDED');
      }
      
      // API Key 문제
      if (errorMsg.includes('api key') || errorMsg.includes('unauthorized') || errorMsg.includes('invalid key') || errorMsg.includes('authentication')) {
        console.error('[AI Chat] 🚫 Detected: API key issue');
        throw new Error('INVALID_API_KEY');
      }
      
      // Model 문제
      if (errorMsg.includes('model') || errorMsg.includes('not found') || errorMsg.includes('unsupported')) {
        console.error('[AI Chat] 🚫 Detected: Model error');
        throw new Error(`MODEL_ERROR: ${error.message}`);
      }
      
      // 빈 응답 에러
      if (errorMsg.includes('empty response')) {
        console.error('[AI Chat] 🚫 Detected: Empty response error');
        throw new Error('Empty response from Groq API');
      }
    }

    // 원본 에러 re-throw
    throw error;
  }
}

/**
 * 토큰 수 추정 (대략적인 계산)
 * 
 * 영어: ~4자 = 1토큰
 * 한글: ~2자 = 1토큰
 */
function estimateTokens(text: string): number {
  const koreanChars = (text.match(/[\u3131-\uD79D]/g) || []).length;
  const otherChars = text.length - koreanChars;
  
  return Math.ceil(koreanChars / 2 + otherChars / 4);
}
