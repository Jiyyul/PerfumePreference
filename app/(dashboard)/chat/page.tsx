'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

type AIProvider = 'google' | 'groq';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * AI 챗봇 페이지
 * 
 * 기능:
 * - 사용자 질문 입력
 * - AI provider 선택 (Google Gemini / Groq)
 * - 채팅 메시지 표시 (말풍선)
 * - AI 답변 마크다운 렌더링
 * - 로딩/에러 처리
 */
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [provider, setProvider] = useState<AIProvider>('google');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // 사용자 메시지 추가
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          provider,
        }),
      });

      if (!response.ok) {
        // 서버에서 내려준 에러 메시지를 그대로 사용
        const errorData = await response.json().catch(() => ({ 
          error: `서버 오류 (HTTP ${response.status})` 
        }));
        
        const errorCode = response.headers.get('X-Error-Code');
        const errorMessage = errorData.error || `HTTP ${response.status} 오류`;
        
        // 상세 에러 로깅
        console.error('[Chat] ========== API ERROR ==========');
        console.error('[Chat] Provider:', provider);
        console.error('[Chat] Status:', response.status);
        console.error('[Chat] Error Code:', errorCode);
        console.error('[Chat] Error Message:', errorMessage);
        console.error('[Chat] Full Response:', errorData);
        console.error('[Chat] ====================================');
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.data) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.data.response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        console.log(`[Chat] Response received in ${result.data.latencyMs}ms from ${result.data.provider}`);
      } else {
        throw new Error('응답 데이터가 없습니다.');
      }
    } catch (err) {
      // 서버에서 받은 에러 메시지를 그대로 표시
      const message = err instanceof Error ? err.message : 'AI 답변 생성에 실패했습니다.';
      setError(message);
      
      // 상세 에러 로그
      console.error('[Chat] Client Error:', {
        message,
        provider,
        error: err,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Dashboard로</span>
            </button>
          </Link>
          <h1 className="text-3xl font-bold">AI 챗봇</h1>
        </div>
        <p className="text-gray-600 mb-4">
          질문을 입력하면 AI가 답변합니다. 대화는 DB에 저장됩니다.
        </p>

        {/* Provider 선택 */}
        <div className="flex items-center gap-4">
          <label htmlFor="provider-select" className="text-sm font-medium text-gray-700">
            AI Provider:
          </label>
          <select
            id="provider-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProvider)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="google">Google Gemini (Flash)</option>
            <option value="groq">Groq (Llama)</option>
          </select>
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-2">대화를 시작해보세요!</p>
            <p className="text-sm">질문을 입력하고 전송 버튼을 눌러주세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          // 코드 블록 스타일링
                          code: (props) => {
                            const { children, className, ...rest } = props;
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...rest}>
                                {children}
                              </code>
                            ) : (
                              <code className="block bg-gray-100 p-2 rounded text-sm overflow-x-auto" {...rest}>
                                {children}
                              </code>
                            );
                          },
                          // 링크 스타일링
                          a: (props) => (
                            <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <p className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* 로딩 표시 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-600">답변 생성 중...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          {error.includes('할당량') && (
            <p className="text-sm text-red-600 mt-2">
              💡 팁: 위의 Provider를 <strong>Groq</strong>로 변경하여 다시 시도해 보세요.
            </p>
          )}
        </div>
      )}

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="질문을 입력하세요... (Shift+Enter: 줄바꿈, Enter: 전송)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>전송 중</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>전송</span>
            </>
          )}
        </button>
      </form>

      {/* 안내 문구 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>💡 답변은 최대 300 토큰으로 제한됩니다 (비용 절감)</p>
        <p>모든 대화는 Supabase의 ai_responses 테이블에 저장됩니다</p>
      </div>
    </div>
  );
}
