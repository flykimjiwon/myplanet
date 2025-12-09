"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import CountrySelector from '@/components/CountrySelector';
import ModeToggle from '@/components/ModeToggle';
import FlatMap from '@/components/FlatMap';
import { countries } from '@/lib/countries';

// Scene 컴포넌트는 클라이언트에서만 렌더링 (SSR 방지)
const Scene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-white text-lg">지구본 로딩중...</p>
      </div>
    </div>
  ),
});

type ViewMode = 'globe' | 'flat';

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

  const toggleMode = () => {
    setMode((prev) => (prev === 'globe' ? 'flat' : 'globe'));
  };

  // 통계 계산
  const visitedCount = visitedCountries.size;
  const totalVisits = Array.from(visitedCountries.values()).reduce((sum, count) => sum + count, 0);

  return (
    <main className="h-screen w-screen overflow-hidden bg-slate-950">
      <div className="h-full w-full flex flex-col lg:flex-row">
        {/* 국가 선택 사이드바 */}
        <div className="w-full lg:w-96 h-1/3 lg:h-full overflow-hidden">
          <CountrySelector
            countries={countries}
            visitedCountries={visitedCountries}
            onToggleCountry={handleToggleCountry}
            onIncreaseVisits={handleIncreaseVisits}
            onDecreaseVisits={handleDecreaseVisits}
          />
        </div>

        {/* 지구본/지도 뷰 */}
        <div className="flex-1 h-2/3 lg:h-full relative flex flex-col">
          {/* 모드 토글 */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
            <ModeToggle mode={mode} onToggle={toggleMode} />
          </div>

          {/* 뷰 영역 */}
          <div className="flex-1 relative">
            {mode === 'globe' ? (
              <>
                <Scene visitedCountries={visitedCountries} countries={countries} />
                
                {/* 안내 텍스트 */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-700">
                  <p className="text-white text-sm text-center">
                    🖱️ 드래그로 회전 | 스크롤로 확대/축소
                  </p>
                </div>
              </>
            ) : (
              <FlatMap visitedCountries={visitedCountries} countries={countries} />
            )}

            {/* 로고 & 통계 */}
            <div className="absolute top-24 right-6 text-right bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                My Planet
              </h2>
              <p className="text-slate-400 text-xs mb-4">나만의 여행 지도</p>
              
              {visitedCount === 0 ? (
                <p className="text-slate-400 text-sm max-w-[200px]">
                  지구는 아직 당신을 모릅니다.<br />
                  이제 슬슬 발자국을 남겨볼까요?
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="bg-blue-500/20 rounded-lg p-2">
                    <p className="text-blue-400 text-xs">방문한 국가</p>
                    <p className="text-white text-2xl font-bold">{visitedCount}개국</p>
                  </div>
                  <div className="bg-purple-500/20 rounded-lg p-2">
                    <p className="text-purple-400 text-xs">총 방문 횟수</p>
                    <p className="text-white text-2xl font-bold">{totalVisits}회</p>
                  </div>
                  {visitedCount >= 30 && (
                    <p className="text-yellow-400 text-xs mt-2">
                      🏆 이 정도면 거의<br />부르마블 세계정복 빌런!
                    </p>
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
