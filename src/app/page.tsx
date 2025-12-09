"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import CountrySelector from '@/components/CountrySelector';
import ModeToggle from '@/components/ModeToggle';
import FlatMap from '@/components/FlatMap';
import BoardGame from '@/components/BoardGame';
import { countries } from '@/lib/countries';

// Scene 컴포넌트는 클라이언트에서만 렌더링 (SSR 방지)
const Scene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#FCECA3' }}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mb-4" style={{ borderColor: '#5AA8E5' }}></div>
        <p className="text-lg font-medium" style={{ color: '#163C69' }}>지구본 로딩중...</p>
      </div>
    </div>
  ),
});

type ViewMode = 'globe' | 'flat' | 'board';

export default function Home() {
  const [visitedCountries, setVisitedCountries] = useState<Map<string, number>>(new Map());
  const [mode, setMode] = useState<ViewMode>('globe');

  const handleToggleCountry = (code: string) => {
    setVisitedCountries((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(code)) {
        newMap.delete(code);
      } else {
        newMap.set(code, 1);
      }
      return newMap;
    });
  };

  const handleIncreaseVisits = (code: string) => {
    setVisitedCountries((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(code) || 0;
      newMap.set(code, current + 1);
      return newMap;
    });
  };

  const handleDecreaseVisits = (code: string) => {
    setVisitedCountries((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(code) || 0;
      if (current > 1) {
        newMap.set(code, current - 1);
      } else {
        newMap.delete(code);
      }
      return newMap;
    });
  };

  const handleResetAll = () => {
    if (confirm('모든 방문 기록을 초기화하시겠습니까?')) {
      setVisitedCountries(new Map());
    }
  };

  const toggleMode = (newMode: 'globe' | 'flat' | 'board') => {
    setMode(newMode);
  };

  // 통계 계산
  const visitedCount = visitedCountries.size;
  const totalVisits = Array.from(visitedCountries.values()).reduce((sum, count) => sum + count, 0);

  return (
    <main className="h-screen w-screen overflow-hidden" style={{ backgroundColor: '#FCECA3' }}>
      <div className="h-full w-full flex flex-col lg:flex-row">
        {/* 국가 선택 사이드바 */}
        <div className="w-full lg:w-96 h-[35%] lg:h-full overflow-hidden">
          <CountrySelector
            countries={countries}
            visitedCountries={visitedCountries}
            onToggleCountry={handleToggleCountry}
            onIncreaseVisits={handleIncreaseVisits}
            onDecreaseVisits={handleDecreaseVisits}
            onResetAll={handleResetAll}
          />
        </div>

        {/* 지구본/지도 뷰 */}
        <div className="flex-1 h-[65%] lg:h-full relative flex flex-col">
          {/* 모드 토글 */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
            <ModeToggle mode={mode} onToggle={(newMode) => toggleMode(newMode)} />
          </div>

          {/* 뷰 영역 */}
          <div className="flex-1 relative">
            {mode === 'globe' ? (
              <>
                <Scene 
                  visitedCountries={visitedCountries} 
                  countries={countries}
                  onSelectCountry={(country) => {
                    if (!visitedCountries.has(country.code)) {
                      handleToggleCountry(country.code);
                    }
                  }}
                />
                
                {/* 안내 텍스트 */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-5 py-2.5 rounded-full" style={{ 
                  backgroundColor: '#5AA8E5', 
                  border: '2px solid #1F6FB8',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
                }}>
                  <p className="text-xs md:text-sm text-center font-semibold" style={{ color: '#FFFFFF' }}>
                    🖱️ 드래그로 회전 | 스크롤로 확대/축소
                  </p>
                </div>
              </>
            ) : mode === 'flat' ? (
              <FlatMap 
                visitedCountries={visitedCountries} 
                countries={countries}
                onSelectCountry={(country) => {
                  if (!visitedCountries.has(country.code)) {
                    handleToggleCountry(country.code);
                  }
                }}
              />
            ) : (
              <BoardGame 
                visitedCountries={visitedCountries} 
                countries={countries}
                onSelectCountry={(country) => {
                  if (!visitedCountries.has(country.code)) {
                    handleToggleCountry(country.code);
                  }
                }}
              />
            )}

            {/* 로고 & 통계 */}
            <div className="absolute bottom-2 right-2 md:top-4 md:right-4 md:bottom-auto rounded-xl scale-[0.8] md:scale-100" style={{ 
              backgroundColor: '#5AA8E5', 
              border: '2px solid #1F6FB8', 
              padding: 'clamp(0.5rem, 1.2vw, 0.875rem)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)',
              transformOrigin: 'bottom right',
            }}>
              <h2 className="text-sm md:text-base font-bold mb-0.5" style={{ color: '#F8D348' }}>
                My Planet
              </h2>
              <p className="text-[9px] md:text-[10px] mb-1.5 font-semibold opacity-90" style={{ color: '#FFFFFF' }}>나만의 여행 지도</p>
              
              {visitedCount === 0 ? (
                <p className="text-[9px] md:text-[10px] max-w-[110px] md:max-w-[130px] leading-tight" style={{ color: '#FFFFFF' }}>
                  지구는 아직 당신을 모릅니다.<br />
                  이제 슬슬 발자국을 남겨볼까요?
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <div className="rounded-lg flex-1 relative overflow-hidden" style={{ 
                      backgroundColor: '#EA3E38', 
                      border: '2px solid #D72C2A', 
                      padding: 'clamp(0.375rem, 0.9vw, 0.625rem)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <div className="absolute top-0 right-0 text-[20px] opacity-20">🌍</div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[10px]">🌍</span>
                        <p className="text-[8px] md:text-[9px] font-bold" style={{ color: '#FFFFFF' }}>방문한 국가</p>
                      </div>
                      <p className="text-xs md:text-sm font-bold leading-tight" style={{ color: '#F8D348', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{visitedCount}개국</p>
                    </div>
                    <div className="rounded-lg flex-1 relative overflow-hidden" style={{ 
                      backgroundColor: '#F8D348', 
                      border: '2px solid #F2B705', 
                      padding: 'clamp(0.375rem, 0.9vw, 0.625rem)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <div className="absolute top-0 right-0 text-[20px] opacity-20">✈️</div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[10px]">✈️</span>
                        <p className="text-[8px] md:text-[9px] font-bold" style={{ color: '#163C69' }}>총 방문 횟수</p>
                      </div>
                      <p className="text-xs md:text-sm font-bold leading-tight" style={{ color: '#163C69', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{totalVisits}회</p>
                    </div>
                  </div>
                  {visitedCount >= 30 && (
                    <div className="rounded-lg px-2 py-1 text-center" style={{ 
                      backgroundColor: '#F2B705',
                      border: '2px solid #F8D348',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <p className="text-[8px] md:text-[9px] font-bold" style={{ color: '#163C69' }}>
                        🏆 이 정도면 거의 트래블마블 세계정복 빌런!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
