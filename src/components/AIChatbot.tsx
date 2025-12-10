"use client";

import { useState, useRef, useEffect } from 'react';
import { getRandomQuestions, type TravelQuestion } from '@/lib/travelQuestions';

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  visitedCountries: Map<string, number>;
}

type TravelProfile = Record<string, string>;

type Step = 'initial' | 'loginRequired' | 'question' | 'loading' | 'result' | 'limitReached';

interface RecommendationResult {
  country: {
    code: string;
    name: string;
    nameEn: string;
    flag: string;
  };
  message: string;
  slogan: string;
  reasons: string[];
  exchangeRate?: {
    currency: string;
    rate: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export default function AIChatbot({ isOpen, onClose, visitedCountries }: AIChatbotProps) {
  const [step, setStep] = useState<Step>('initial');
  const [profile, setProfile] = useState<TravelProfile>({});
  const [questions, setQuestions] = useState<TravelQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [remainingCount, setRemainingCount] = useState(100);
  const [dailyLimit, setDailyLimit] = useState(100);
  const [showRichDiagnosis, setShowRichDiagnosis] = useState(true);
  const [showFullscreenDialog, setShowFullscreenDialog] = useState(false);
  const [hasSeenRichDiagnosis, setHasSeenRichDiagnosis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 하루 남은 횟수 로드 및 로그인 상태 확인
  useEffect(() => {
    const loadRemainingCount = async () => {
      try {
        const response = await fetch('/api/travel/recommend/remaining');
        if (response.ok) {
          const data = await response.json();
          setRemainingCount(data.remainingCount || 10);
          setDailyLimit(data.dailyLimit || 10);
          if (data.remainingCount === 0) {
            setStep('limitReached');
          } else {
            // 남은 횟수가 있으면 초기 화면으로
            setStep('initial');
          }
        } else if (response.status === 401) {
          // 비로그인 사용자
          setStep('loginRequired');
        }
      } catch (error) {
        console.error('남은 횟수 로드 실패:', error);
      }
    };
    if (isOpen) {
      loadRemainingCount();
    } else {
      // 닫혔을 때 초기화
      setStep('initial');
      setProfile({ difficulty: null, distance: null, budget: null });
      setRecommendation(null);
    }
  }, [isOpen]);

  // 방문 국가 수 계산
  const visitCount = visitedCountries.size;
  const visitCountArray = Array.from(visitedCountries.values());
  const totalVisits = visitCountArray.reduce((sum, count) => sum + count, 0);

  // 부자 진단: 최근 3년간 8개 이상 또는 같은 해에 3번 이상
  const isRich = visitCount >= 8 || totalVisits >= 10;

  useEffect(() => {
    // LocalStorage에서 부자 진단 표시 여부 확인
    const seen = localStorage.getItem('rich_diagnosis_seen');
    if (seen === 'true') {
      setHasSeenRichDiagnosis(true);
      setShowRichDiagnosis(false);
    }
  }, []);

  useEffect(() => {
    if (step === 'result' || step === 'loading') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [step, recommendation]);

  const handleStartRecommendation = () => {
    // 랜덤하게 3개 질문 선택
    const randomQuestions = getRandomQuestions(3);
    setQuestions(randomQuestions);
    setCurrentQuestionIndex(0);
    setProfile({});
    setStep('question');
  };

  const handleQuestionSelect = (option: TravelQuestion['options'][0]) => {
    const newProfile = { ...profile };
    
    // "둘다 상관없어"가 아닌 경우에만 프로필에 추가
    if (option.profileValue !== 'both') {
      newProfile[option.profileKey] = option.profileValue;
    }
    
    setProfile(newProfile);
    
    // 다음 질문으로 이동
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 마지막 질문이면 추천 요청
      setStep('loading');
      getRecommendation(newProfile);
    }
  };

  const getRecommendation = async (finalProfile: TravelProfile) => {
    try {
      const response = await fetch('/api/travel/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: finalProfile,
        }),
      });

      if (!response.ok) {
        // 비스트리밍 에러 응답 처리
        if (response.headers.get('content-type')?.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            // 비로그인 사용자
            setStep('initial');
            return;
          }
          if (response.status === 429 || errorData.limitReached) {
            // 하루 제한 도달
            setRemainingCount(0);
            setStep('limitReached');
            return;
          }
          throw new Error(errorData.error || '추천을 받는 중 오류가 발생했습니다.');
        } else {
          throw new Error('추천을 받는 중 오류가 발생했습니다.');
        }
      }

      // SSE 스트리밍 처리
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('스트림을 읽을 수 없습니다.');
      }

      let accumulatedContent = '';
      let currentRecommendation: RecommendationResult | null = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              continue;
            }
            
            try {
              const json = JSON.parse(data);
              
              // 디버깅: 받은 모든 데이터 로그
              console.log('[클라이언트] 받은 데이터 타입:', json.type, '전체:', json);
              
              if (json.type === 'country') {
                // 국가 정보 수신
                currentRecommendation = {
                  country: json.country,
                  message: '',
                  slogan: '',
                  reasons: json.reasons || [],
                  exchangeRate: json.exchangeRate,
                };
                // recommendation은 설정하되, step은 loading 유지 (content가 올 때까지)
              } else if (json.type === 'content') {
                // 콘텐츠 청크 수신 - 실시간 스트리밍
                console.log('[클라이언트] Content 청크 수신:', json.content?.substring(0, 50), '전체 길이:', json.content?.length);
                accumulatedContent += json.content;
                console.log('[클라이언트] 누적된 콘텐츠 길이:', accumulatedContent.length);
                
                // 국가 정보가 없으면 임시로 생성
                if (!currentRecommendation) {
                  console.log('[클라이언트] 국가 정보 없음 - 임시 생성');
                  currentRecommendation = {
                    country: { code: '', name: '추천 중...', nameEn: '', flag: '🌍' },
                    message: '',
                    slogan: '',
                    reasons: [],
                  };
                }
                
                // 첫 콘텐츠가 오면 result 화면으로 전환 (step 상태 체크 없이 바로 전환)
                if (accumulatedContent.trim()) {
                  console.log('[클라이언트] step을 result로 변경');
                  setStep('result');
                }
                
                // 실시간으로 메시지 업데이트 (타이핑 효과)
                const newRecommendation = {
                  ...currentRecommendation,
                  message: accumulatedContent,
                };
                console.log('[클라이언트] Recommendation 업데이트:', newRecommendation);
                setRecommendation(newRecommendation);
              } else if (json.type === 'slogan') {
                // 슬로건 수신
                if (currentRecommendation) {
                  setRecommendation({
                    ...currentRecommendation,
                    slogan: json.slogan,
                  });
                }
              } else if (json.type === 'done') {
                // 완료 신호
                setRemainingCount(json.remainingCount || 0);
                setDailyLimit(json.dailyLimit || 10);
                if (currentRecommendation && accumulatedContent) {
                  // 최종 메시지 설정
                  const finalRecommendation = {
                    ...currentRecommendation,
                    message: accumulatedContent,
                  };
                  setRecommendation(finalRecommendation);
                  // 전체화면 대화 모달 표시
                  setShowFullscreenDialog(true);
                }
              }
            } catch (e) {
              // JSON 파싱 오류는 무시
              console.warn('JSON 파싱 오류:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('추천 오류:', error);
      setStep('initial');
    }
  };

  const handleCloseRichDiagnosis = () => {
    setShowRichDiagnosis(false);
    setHasSeenRichDiagnosis(true);
    localStorage.setItem('rich_diagnosis_seen', 'true');
  };

  const handleReset = () => {
    setStep('initial');
    setProfile({});
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setRecommendation(null);
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (!isOpen) return null;

  return (
    <>
      {/* 전체화면 대화 모달 - 게임 스타일 */}
      {showFullscreenDialog && recommendation && (
        <div 
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-end p-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => setShowFullscreenDialog(false)}
        >
          {/* 캐릭터 이미지 - 대화창과 겹치게 배치 (채팅창과 동일한 스타일, 크기만 확대) */}
          <div className="absolute bottom-[45vh] sm:bottom-[50vh] left-1/2 transform -translate-x-1/2 z-10">
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0" style={{ border: '2px solid #1F6FB8', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <img 
                src="/traveler-character.png" 
                alt="여행자 캐릭터" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 대화창 - 하단 고정 */}
          <div 
            className="w-full max-w-5xl rounded-t-3xl p-4 sm:p-6 lg:p-6 flex flex-col relative"
            style={{
              backgroundColor: '#5AA8E5',
              border: '4px solid #1F6FB8',
              borderBottom: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.5), inset 0 4px 4px rgba(255,255,255,0.1)',
              maxHeight: '60vh',
              minHeight: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 (대화창 내 우측 상단) */}
            <button
              onClick={() => setShowFullscreenDialog(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold transition-all hover:scale-110"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                backdropFilter: 'blur(10px)',
              }}
            >
              ×
            </button>

            {/* 캐릭터 이름 표시 (대화창 위) */}
            <div className="mb-3 px-4 py-2 rounded-lg inline-block self-start" style={{ backgroundColor: '#1F6FB8' }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">{recommendation.country.flag}</span>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: '#FFFFFF' }}>
                  {recommendation.country.name} 추천
                </h3>
                {recommendation.slogan && (
                  <span className="text-xs sm:text-sm opacity-90" style={{ color: '#F8D348' }}>
                    · {recommendation.slogan}
                  </span>
                )}
              </div>
            </div>

            {/* 대화 내용 (스크롤 가능) */}
            <div 
              className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-4"
              style={{ 
                minHeight: '200px',
                maxHeight: 'calc(60vh - 280px)',
              }}
            >
              <p 
                className="text-sm sm:text-base lg:text-lg leading-relaxed whitespace-pre-wrap"
                style={{ color: '#FFFFFF', lineHeight: '1.8' }}
              >
                {recommendation.message}
              </p>
            </div>

            {/* 여행 준비 랜덤박스 섹션 - 고정 하단 */}
            <div className="pt-4 border-t-2" style={{ borderColor: '#1F6FB8' }}>
              <p className="text-xs sm:text-sm font-semibold mb-2" style={{ color: '#F8D348' }}>
                ✈️ 여행 준비도 랜덤박스처럼 채워볼까?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                {/* 로밍 */}
                <div 
                  className="p-1.5 sm:p-2 rounded-lg text-center"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div className="text-lg sm:text-xl mb-0.5">🌐</div>
                  <div className="text-[10px] sm:text-xs font-semibold" style={{ color: '#FFFFFF' }}>로밍</div>
                </div>
                
                {/* 스타링크 */}
                <div 
                  className="p-1.5 sm:p-2 rounded-lg text-center"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div className="text-lg sm:text-xl mb-0.5">🛰️</div>
                  <div className="text-[10px] sm:text-xs font-semibold" style={{ color: '#FFFFFF' }}>스타링크</div>
                </div>
                
                {/* 트래블카드 */}
                <div 
                  className="p-1.5 sm:p-2 rounded-lg text-center"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div className="text-lg sm:text-xl mb-0.5">💳</div>
                  <div className="text-[10px] sm:text-xs font-semibold" style={{ color: '#FFFFFF' }}>트래블카드</div>
                </div>
                
                {/* 여행자보험 */}
                <div 
                  className="p-1.5 sm:p-2 rounded-lg text-center"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div className="text-lg sm:text-xl mb-0.5">🛡️</div>
                  <div className="text-[10px] sm:text-xs font-semibold" style={{ color: '#FFFFFF' }}>여행자보험</div>
                </div>
              </div>
              <p className="text-xs opacity-70 mt-2 mb-0 text-center" style={{ color: '#FFFFFF' }}>
                제휴 문의: flykimjiwon@gmail.com
              </p>
            </div>
          </div>

          {/* 닫기 버튼 (우측 상단) */}
          <button
            onClick={() => setShowFullscreenDialog(false)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-all hover:scale-110"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              backdropFilter: 'blur(10px)',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* 데스크톱: 우측 하단 고정 팝업 */}
      <div 
        className="hidden lg:flex fixed bottom-20 right-4 z-[9999] w-96 h-[600px] flex flex-col"
        style={{ maxHeight: 'calc(100vh - 120px)' }}
      >
        <div 
          className="rounded-xl flex flex-col h-full"
          style={{
            backgroundColor: '#5AA8E5',
            border: '2px solid #1F6FB8',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)',
            opacity: 1,
          }}
        >
          {/* 헤더 */}
          <div className="p-4 rounded-t-xl flex items-center justify-between" style={{ borderBottom: '2px solid #1F6FB8' }}>
            <div className="flex items-center gap-2">
              {/* 캐릭터 이미지 */}
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0" style={{ border: '2px solid #1F6FB8', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <img src="/traveler-character.png" alt="여행자 캐릭터" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-lg font-bold" style={{ color: '#F8D348' }}>랜덤 여행 뽑기</h2>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                backgroundColor: '#1F6FB8',
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 컨텐츠 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            {/* 부자 진단 카드 (1회만) */}
            {showRichDiagnosis && !hasSeenRichDiagnosis && (
              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#FFFFFF', border: '2px solid #F8D348', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-sm" style={{ color: '#163C69' }}>너 여행 패턴 한 줄 코멘트</h3>
                  <button onClick={handleCloseRichDiagnosis} className="text-gray-400 hover:text-gray-600">×</button>
                </div>
                <p className="text-xs" style={{ color: '#163C69' }}>
                  {isRich 
                    ? '너 여행 기록 쭉 보니까…\n혹시 부자야…?\n적어도 월급이 통장에서 그대로 있진 않을 것 같은데…? 🤔\n\n해외를 이렇게 자주 나갔다고…?\n최소한 \'평범한 월급쟁이\'는 아닌 것 같아.\n혹시… 사업하시죠 사장님? 😏'
                    : '여행 기록이 너무 조용한데…\n우리 같이 통장 울리지 않는 선에서 어딘가 한 번 찍고오자. ✈️'}
                </p>
              </div>
            )}

            {/* 하루 제한 카운터 */}
            <div className="text-center mb-4">
              <p className="text-xs font-semibold" style={{ color: '#F8D348' }}>
                💸 오늘 남은 무료 추천: {remainingCount} / {dailyLimit}회
              </p>
              <p className="text-[10px] opacity-80" style={{ color: '#FFFFFF' }}>
                (서버비 아끼는 가난한 개발자 보호 모드 ON)
              </p>
            </div>

            {/* 로그인 필요 화면 */}
            {step === 'loginRequired' && (
              <div className="space-y-4 text-center py-8">
                <div className="text-4xl mb-4">🔒</div>
                <p className="text-base font-bold mb-2" style={{ color: '#F8D348' }}>
                  로그인이 필요해요!
                </p>
                <p className="text-sm mb-6" style={{ color: '#FFFFFF' }}>
                  추천을 받고 싶으면<br />
                  로그인하고 사용해!
                </p>
                <button
                  onClick={() => {
                    window.location.href = '/login';
                  }}
                  className="w-full py-3 rounded-lg font-bold text-base transition-all active:scale-95"
                  style={{
                    backgroundColor: '#F8D348',
                    border: '2px solid #F2B705',
                    color: '#163C69',
                    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  로그인하러 가기
                </button>
              </div>
            )}

            {/* 초기 화면 */}
            {step === 'initial' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm mb-4" style={{ color: '#FFFFFF' }}>
                    마구잡이 추천같지만, 사실은<br />
                    세계 축제 + 환율 + 너 취향 + 가본 나라까지 다 섞어서<br />
                    고르는 미친 AI 알고리즘이에요.
                  </p>
                </div>
                <button
                  onClick={handleStartRecommendation}
                  disabled={remainingCount === 0}
                  className="w-full py-3 rounded-lg font-bold text-base transition-all active:scale-95"
                  style={
                    remainingCount === 0
                      ? {
                          backgroundColor: '#E3F2FD',
                          border: '2px solid #5AA8E5',
                          color: '#5AA8E5',
                          cursor: 'not-allowed',
                          opacity: 0.5
                        }
                      : {
                          backgroundColor: '#F8D348',
                          border: '2px solid #F2B705',
                          color: '#163C69',
                          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
                        }
                  }
                  onMouseEnter={(e) => {
                    if (remainingCount > 0) {
                      e.currentTarget.style.backgroundColor = '#F2B705';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (remainingCount > 0) {
                      e.currentTarget.style.backgroundColor = '#F8D348';
                    }
                  }}
                >
                  🎁 랜덤 여행 뽑기
                </button>
              </div>
            )}

            {/* 랜덤 질문 */}
            {step === 'question' && currentQuestion && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-xs opacity-70" style={{ color: '#FFFFFF' }}>
                    {currentQuestionIndex + 1} / {questions.length}
                  </p>
                </div>
                <p className="text-sm font-semibold text-center" style={{ color: '#FFFFFF' }}>
                  Q. {currentQuestion.question}
                </p>
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleQuestionSelect(option)}
                    className="w-full py-3 rounded-lg font-semibold transition-all active:scale-95 text-left px-4"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #1F6FB8',
                      color: '#163C69',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#F8D348';
                      e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#1F6FB8';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)';
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {/* 로딩 */}
            {step === 'loading' && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
                  <span className="text-3xl animate-spin">🌍</span>
                </div>
                <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                  알고리즘이 열심히 계산 중...
                </p>
                <p className="text-xs mt-2 opacity-80" style={{ color: '#FFFFFF' }}>
                  축제, 환율, 계절, 너의 취향까지 다 갈아 넣고 있어요
                </p>
              </div>
            )}

            {/* 추천 결과 */}
            {step === 'result' && recommendation && (
              <div className="space-y-4">
                <div className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '2px solid #F8D348', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div className="text-center mb-3">
                    <p className="text-2xl mb-2">{recommendation.country.flag}</p>
                    <h3 className="text-xl font-bold" style={{ color: '#163C69' }}>
                      {recommendation.country.name}
                    </h3>
                    <p className="text-xs opacity-70" style={{ color: '#163C69' }}>
                      {recommendation.country.nameEn}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#163C69' }}>
                      {recommendation.message}
                    </p>
                  </div>

                  <div className="pt-3 border-t" style={{ borderColor: '#F8D348' }}>
                    <p className="text-xs font-semibold text-center" style={{ color: '#F2B705' }}>
                      {recommendation.slogan}
                    </p>
                  </div>
                </div>

                {/* 제휴 영역 */}
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#FFFFFF' }}>
                    ✈️ 여행 준비도 랜덤박스처럼 채워볼까?
                  </p>
                  <div className="space-y-1 text-xs" style={{ color: '#FFFFFF' }}>
                    <p>🌐 스타링크 로밍</p>
                    <p>💳 트래블 카드</p>
                    <p>🛡 여행자 보험</p>
                  </div>
                  <button
                    className="w-full mt-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
                    style={{
                      backgroundColor: '#1F6FB8',
                      border: '1px solid #163C69',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    onClick={() => window.open('mailto:flykimjiwon@gmail.com', '_blank')}
                  >
                    🤝 제휴·광고 문의
                  </button>
                  <p className="text-[10px] mt-2 text-center opacity-70" style={{ color: '#FFFFFF' }}>
                    스타링크, 카드사, 보험사분들… 저 여기 있어요. 연락주세요… (가난한 개발자 올림)
                  </p>
                </div>

                {/* 알고리즘 설명 */}
                <div className="text-center">
                  <p className="text-[10px] opacity-60" style={{ color: '#FFFFFF' }}>
                    ※ 이 추천은 주관적 감과 빡센 알고리즘의 적당한 혼합물입니다.
                    어디까지 믿을지는 당신의 몫 🙃
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-2 rounded-lg font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: '#F8D348',
                    border: '2px solid #F2B705',
                    color: '#163C69',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  다시 뽑기
                </button>
              </div>
            )}

            {/* 하루 제한 초과 */}
            {step === 'limitReached' && (
              <div className="text-center py-8">
                <p className="text-lg font-bold mb-4" style={{ color: '#F8D348' }}>
                  오늘은 여기까지!
                </p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: '#FFFFFF' }}>
                  너도 여행 고민하느라 힘들고,{'\n'}
                  나도 서버비 내느라 힘들어…{'\n\n'}
                  우리 내일 다시 만날까? 😂
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 모바일: 위아래 8%씩 여백 (84% 높이) */}
      <div 
        className="lg:hidden fixed inset-y-[8%] left-2 right-2 z-[9999] flex items-center justify-center"
      >
        <div 
          className="rounded-xl w-full h-full flex flex-col"
          style={{
            backgroundColor: '#5AA8E5',
            border: '2px solid #1F6FB8',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)',
            opacity: 1,
          }}
        >
          {/* 헤더 */}
          <div className="p-4 rounded-t-xl flex items-center justify-between" style={{ borderBottom: '2px solid #1F6FB8' }}>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0" style={{ border: '2px solid #1F6FB8', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <img src="/traveler-character.png" alt="여행자 캐릭터" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-base font-bold" style={{ color: '#F8D348' }}>랜덤 여행 뽑기</h2>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                backgroundColor: '#1F6FB8',
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 컨텐츠 영역 (모바일 버전도 동일한 로직) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            {/* 부자 진단 카드 */}
            {showRichDiagnosis && !hasSeenRichDiagnosis && (
              <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: '#FFFFFF', border: '2px solid #F8D348', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-xs" style={{ color: '#163C69' }}>너 여행 패턴 한 줄 코멘트</h3>
                  <button onClick={handleCloseRichDiagnosis} className="text-gray-400 hover:text-gray-600 text-sm">×</button>
                </div>
                <p className="text-[10px] whitespace-pre-wrap" style={{ color: '#163C69' }}>
                  {isRich 
                    ? '너 여행 기록 쭉 보니까…\n혹시 부자야…?\n적어도 월급이 통장에서 그대로 있진 않을 것 같은데…? 🤔'
                    : '여행 기록이 너무 조용한데…\n우리 같이 통장 울리지 않는 선에서 어딘가 한 번 찍고오자. ✈️'}
                </p>
              </div>
            )}

            {/* 하루 제한 카운터 */}
            <div className="text-center mb-4">
              <p className="text-xs font-semibold" style={{ color: '#F8D348' }}>
                💸 오늘 남은 무료 추천: {remainingCount} / {dailyLimit}회
              </p>
              <p className="text-[10px] opacity-80" style={{ color: '#FFFFFF' }}>
                (서버비 아끼는 가난한 개발자 보호 모드 ON)
              </p>
            </div>

            {/* 로그인 필요 화면 */}
            {step === 'loginRequired' && (
              <div className="space-y-4 text-center py-8">
                <div className="text-3xl mb-4">🔒</div>
                <p className="text-sm font-bold mb-2" style={{ color: '#F8D348' }}>
                  로그인이 필요해요!
                </p>
                <p className="text-xs mb-6" style={{ color: '#FFFFFF' }}>
                  추천을 받고 싶으면<br />
                  로그인하고 사용해!
                </p>
                <button
                  onClick={() => {
                    window.location.href = '/login';
                  }}
                  className="w-full py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95"
                  style={{
                    backgroundColor: '#F8D348',
                    border: '2px solid #F2B705',
                    color: '#163C69',
                    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  로그인하러 가기
                </button>
              </div>
            )}

            {/* 초기 화면 */}
            {step === 'initial' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs mb-4" style={{ color: '#FFFFFF' }}>
                    마구잡이 추천같지만, 사실은<br />
                    세계 축제 + 환율 + 너 취향 + 가본 나라까지 다 섞어서<br />
                    고르는 미친 AI 알고리즘이에요.
                  </p>
                </div>
                <button
                  onClick={handleStartRecommendation}
                  disabled={remainingCount === 0}
                  className="w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95"
                  style={
                    remainingCount === 0
                      ? {
                          backgroundColor: '#E3F2FD',
                          border: '2px solid #5AA8E5',
                          color: '#5AA8E5',
                          cursor: 'not-allowed',
                          opacity: 0.5
                        }
                      : {
                          backgroundColor: '#F8D348',
                          border: '2px solid #F2B705',
                          color: '#163C69',
                          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
                        }
                  }
                >
                  🎁 랜덤 여행 뽑기
                </button>
              </div>
            )}

            {/* 랜덤 질문 (모바일) */}
            {step === 'question' && currentQuestion && (
              <div className="space-y-3">
                <div className="text-center mb-2">
                  <p className="text-[10px] opacity-70" style={{ color: '#FFFFFF' }}>
                    {currentQuestionIndex + 1} / {questions.length}
                  </p>
                </div>
                <p className="text-xs font-semibold text-center" style={{ color: '#FFFFFF' }}>
                  Q. {currentQuestion.question}
                </p>
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleQuestionSelect(option)}
                    className="w-full py-2.5 rounded-lg font-semibold transition-all active:scale-95 text-left px-3 text-xs"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #1F6FB8',
                      color: '#163C69',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {/* 로딩 */}
            {step === 'loading' && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
                  <span className="text-2xl animate-spin">🌍</span>
                </div>
                <p className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>
                  알고리즘이 열심히 계산 중...
                </p>
              </div>
            )}

            {/* 추천 결과 */}
            {step === 'result' && recommendation && (
              <div className="space-y-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: '#FFFFFF', border: '2px solid #F8D348', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div className="text-center mb-2">
                    <p className="text-xl mb-1">{recommendation.country.flag}</p>
                    <h3 className="text-lg font-bold" style={{ color: '#163C69' }}>
                      {recommendation.country.name}
                    </h3>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-xs whitespace-pre-wrap" style={{ color: '#163C69' }}>
                      {recommendation.message}
                    </p>
                  </div>

                  <div className="pt-2 border-t" style={{ borderColor: '#F8D348' }}>
                    <p className="text-[10px] font-semibold text-center" style={{ color: '#F2B705' }}>
                      {recommendation.slogan}
                    </p>
                  </div>
                </div>

                {/* 제휴 영역 */}
                <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <p className="text-[10px] font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                    ✈️ 여행 준비도 랜덤박스처럼 채워볼까?
                  </p>
                  <button
                    className="w-full mt-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
                    style={{
                      backgroundColor: '#1F6FB8',
                      border: '1px solid #163C69',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    onClick={() => window.open('mailto:flykimjiwon@gmail.com', '_blank')}
                  >
                    🤝 제휴·광고 문의
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-2 rounded-lg font-semibold text-xs transition-all active:scale-95"
                  style={{
                    backgroundColor: '#F8D348',
                    border: '2px solid #F2B705',
                    color: '#163C69',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  다시 뽑기
                </button>
              </div>
            )}

            {/* 하루 제한 초과 */}
            {step === 'limitReached' && (
              <div className="text-center py-8">
                <p className="text-base font-bold mb-4" style={{ color: '#F8D348' }}>
                  오늘은 여기까지!
                </p>
                <p className="text-xs whitespace-pre-wrap" style={{ color: '#FFFFFF' }}>
                  너도 여행 고민하느라 힘들고,{'\n'}
                  나도 서버비 내느라 힘들어…{'\n\n'}
                  우리 내일 다시 만날까? 😂
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </>
  );
}
