import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: '메시지 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // gpt-5-nano: 가성비 좋은 모델 ($0.05/$0.005/$0.40)
    // 참고: temperature는 지원하지 않음 (기본값 1 고정)
    // max_tokens 대신 max_completion_tokens 사용
    const model = 'gpt-5-nano';

    const systemPrompt = `당신은 전문 여행 추천 AI 어시스턴트입니다. 사용자의 여행 선호도, 예산, 관심사에 맞춰 최적의 여행지를 추천해주세요. 
다음 정보를 고려하여 친절하고 상세한 추천을 제공하세요:
- 예산 범위
- 선호하는 여행 스타일 (휴양, 모험, 문화 탐방, 음식 여행 등)
- 가고 싶은 대륙이나 국가
- 여행 기간
- 동반자 (혼자, 커플, 가족, 친구 등)

한국어로 답변하며, 이모지를 적절히 사용하여 친근하고 따뜻한 톤으로 대화하세요.`;

    // gpt-5-nano 전용 설정
    // 문제: reasoning_tokens가 모든 토큰을 사용하여 content가 비어있음
    // 해결: max_completion_tokens를 늘려서 reasoning 이후에도 실제 content 생성 가능하도록
    // - max_completion_tokens: 최대 출력 토큰 수 (reasoning + content 포함)
    //   참고: reasoning_tokens가 많이 사용되므로 충분한 여유 필요
    // - temperature: 지원하지 않음 (기본값 1 고정, 파라미터 제거)
    // - stream: true - SSE 스트리밍 활성화
    const requestBody = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      max_completion_tokens: 2000, // reasoning + content를 위해 충분한 토큰 할당
      stream: true, // SSE 스트리밍 활성화
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API 오류:', errorData);
      
      // OpenAI API 오류 메시지 추출
      const errorMessage = errorData.error?.message || 
                          errorData.error?.code || 
                          'AI 응답을 생성하는 중 오류가 발생했습니다.';
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorData 
        },
        { status: response.status }
      );
    }

    // SSE 스트리밍 응답 생성
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  controller.close();
                  return;
                }
                
                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content || '';
                  
                  if (content) {
                    // SSE 형식으로 전송
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                    );
                  }
                } catch (e) {
                  // JSON 파싱 오류는 무시
                }
              }
            }
          }
        } catch (error) {
          console.error('스트리밍 오류:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('챗봇 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

