"use client";

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatbot({ isOpen, onClose }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 🌍 여행지 추천 AI 챗봇입니다. 어떤 여행지를 찾고 계신가요? 예산, 선호하는 여행 스타일, 가고 싶은 대륙 등을 알려주시면 맞춤 추천을 해드릴게요! ✈️'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 스트리밍 응답을 위한 빈 assistant 메시지 추가
    const assistantMessageId = Date.now();
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: '' 
    }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || '응답을 받는 중 오류가 발생했습니다.';
        const detailsMsg = errorData.details?.error?.message || errorData.details?.message || '';
        
        console.error('❌ 챗봇 API 오류:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          details: errorData.details
        });
        
        // 할당량 초과 오류에 대한 특별 처리
        let userFriendlyMessage = '';
        if (errorMsg.includes('quota') || errorMsg.includes('exceeded') || detailsMsg.includes('quota') || detailsMsg.includes('exceeded')) {
          userFriendlyMessage = `⚠️ API 할당량 초과\n\nOpenAI API의 사용 할당량이 초과되었습니다.\n\n해결 방법:\n1. OpenAI 플랫폼(https://platform.openai.com)에서 계정 확인\n2. 결제 정보 설정 및 크레딧 추가\n3. 사용 플랜 확인\n\n일시적으로 사용할 수 없습니다. 죄송합니다. 😔`;
        } else {
          userFriendlyMessage = `⚠️ ${errorMsg}\n\n${detailsMsg ? `자세한 오류: ${detailsMsg}` : '알 수 없는 오류가 발생했습니다.'}\n\n잠시 후 다시 시도해주세요.`;
        }
        
        // 마지막 메시지(빈 assistant 메시지)를 오류 메시지로 교체
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: userFriendlyMessage
          };
          return newMessages;
        });
        return;
      }

      // SSE 스트리밍 처리
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('스트리밍 응답을 받을 수 없습니다.');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              break;
            }

            try {
              const json = JSON.parse(data);
              const content = json.content || '';
              
              if (content) {
                accumulatedContent += content;
                
                // 실시간으로 메시지 업데이트
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex]?.role === 'assistant') {
                    newMessages[lastIndex] = {
                      role: 'assistant',
                      content: accumulatedContent
                    };
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              // JSON 파싱 오류는 무시
            }
          }
        }
      }

      // 최종 메시지 확인
      if (!accumulatedContent) {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.'
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('챗봇 오류:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: `⚠️ 네트워크 오류가 발생했습니다.\n\n${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}\n\n잠시 후 다시 시도해주세요.`
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md h-[80vh] max-h-[600px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg font-semibold">여행지 추천 AI</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="여행지 추천을 요청하세요..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

