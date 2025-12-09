"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CountrySelector from '@/components/CountrySelector';
import ModeToggle from '@/components/ModeToggle';
import FlatMap from '@/components/FlatMap';
import BoardGame from '@/components/BoardGame';
import { countries } from '@/lib/countries';
import { loadVisitedCountries, saveVisitedCountries, clearVisitedCountries, getCountryRating, saveCountryRating } from '@/lib/localStorage';

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
  const [mounted, setMounted] = useState(false);
  const [ratingModal, setRatingModal] = useState<{ open: boolean; countryCode: string | null }>({ open: false, countryCode: null });

  // 클라이언트에서만 마운트되도록 처리 (hydration 오류 방지)
  useEffect(() => {
    setMounted(true);
    // 로컬스토리지에서 방문한 나라 데이터 불러오기
    const saved = loadVisitedCountries();
    if (saved.size > 0) {
      setVisitedCountries(saved);
    }

  }, []);

  // 방문한 나라 상태가 변경될 때마다 로컬스토리지에 저장
  useEffect(() => {
    if (mounted) {
      saveVisitedCountries(visitedCountries);
    }
  }, [visitedCountries, mounted]);

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
      clearVisitedCountries();
    }
  };

  const toggleMode = (newMode: 'globe' | 'flat' | 'board') => {
    setMode(newMode);
  };

  // 통계 계산
  const visitedCount = visitedCountries.size;
  const totalVisits = Array.from(visitedCountries.values()).reduce((sum, count) => sum + count, 0);

  // 클라이언트에서만 렌더링 (hydration 오류 방지)
  if (!mounted) {
    return (
      <main className="h-screen w-screen overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#FCECA3' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mb-4" style={{ borderColor: '#5AA8E5' }}></div>
          <p className="text-lg font-medium" style={{ color: '#163C69' }}>로딩 중...</p>
        </div>
      </main>
    );
  }

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
              onOpenRating={(code) => {
                setRatingModal({ open: true, countryCode: code });
              }}
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
              minWidth: 'clamp(180px, 25vw, 220px)',
              width: 'auto',
              opacity: 0.9,
            }}>
              <h2 className="text-sm md:text-base font-bold mb-0.5" style={{ color: '#F8D348' }}>
                My Planet
              </h2>
              <p className="text-[9px] md:text-[10px] mb-1.5 font-semibold opacity-90" style={{ color: '#FFFFFF' }}>나만의 여행 지도</p>
              
              {visitedCount === 0 ? (
                <p className="text-[9px] md:text-[10px] leading-tight" style={{ color: '#FFFFFF' }}>
                  지구는 아직 당신을 모릅니다.<br />
                  이제 슬슬 발자국을 남겨볼까요?
                </p>
              ) : (
                <div className="flex flex-col gap-1.5" style={{ width: '100%' }}>
                  <div className="flex gap-1.5">
                    <div className="rounded-lg flex-1 relative overflow-hidden" style={{ 
                      backgroundColor: '#EA3E38', 
                      border: '2px solid #D72C2A', 
                      padding: 'clamp(0.375rem, 0.9vw, 0.625rem)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)',
                      flex: '1 1 45.5%',
                      minWidth: 0
                    }}>
                      <div className="absolute top-0 right-0 text-[20px] opacity-20">🌍</div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[10px]">🌍</span>
                        <p className="text-[8px] md:text-[9px] font-bold whitespace-nowrap" style={{ color: '#FFFFFF' }}>방문한 국가</p>
                      </div>
                      <p className="text-xs md:text-sm font-bold leading-tight" style={{ color: '#F8D348', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{visitedCount}개국</p>
                    </div>
                    <div className="rounded-lg flex-1 relative overflow-hidden" style={{ 
                      backgroundColor: '#F8D348', 
                      border: '2px solid #F2B705', 
                      padding: 'clamp(0.375rem, 0.9vw, 0.625rem)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)',
                      flex: '1 1 45.5%',
                      minWidth: 0
                    }}>
                      <div className="absolute top-0 right-0 text-[20px] opacity-20">✈️</div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[10px]">✈️</span>
                        <p className="text-[8px] md:text-[9px] font-bold whitespace-nowrap" style={{ color: '#163C69' }}>총 방문 횟수</p>
                      </div>
                      <p className="text-xs md:text-sm font-bold leading-tight" style={{ color: '#163C69', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{totalVisits}회</p>
                    </div>
                  </div>
                  {(() => {
                    let message = '';
                    if (visitedCount >= 0 && visitedCount < 5) {
                      message = '🌱 여행의 첫걸음을 시작했어요!';
                    } else if (visitedCount >= 5 && visitedCount < 10) {
                      message = '✈️ 여행자로서 성장 중이에요!';
                    } else if (visitedCount >= 10 && visitedCount < 20) {
                      message = '🌍 진정한 여행자가 되어가고 있어요!';
                    } else if (visitedCount >= 20 && visitedCount < 30) {
                      message = '🏆 세계를 탐험하는 모험가!';
                    } else if (visitedCount >= 30 && visitedCount < 50) {
                      message = '🌟 이 정도면 거의 트래블마블 세계정복 빌런!';
                    } else if (visitedCount >= 50 && visitedCount < 100) {
                      message = '👑 세계 정복의 길을 걷고 있어요!';
                    } else if (visitedCount >= 100) {
                      message = '🌐 전설적인 여행자! 당신은 진정한 세계인!';
                    }
                    
                    return message ? (
                      <div className="rounded-lg px-2 py-1 text-center" style={{ 
                        backgroundColor: '#F2B705',
                        border: '2px solid #F8D348',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)'
                      }}>
                        <p className="text-[8px] md:text-[9px] font-bold" style={{ color: '#163C69' }}>
                          {message}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 평점 모달 */}
      {ratingModal.open && ratingModal.countryCode && (
        <RatingModal
          countryCode={ratingModal.countryCode}
          country={countries.find(c => c.code === ratingModal.countryCode)!}
          onClose={() => setRatingModal({ open: false, countryCode: null })}
        />
      )}
    </main>
  );
}

// 평점 모달 컴포넌트
function RatingModal({ countryCode, country, onClose }: { countryCode: string; country: any; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    const saved = getCountryRating(countryCode);
    if (saved) {
      setRating(saved.rating);
      setReview(saved.review);
    }
  }, [countryCode]);

  const handleSave = () => {
    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }
    saveCountryRating(countryCode, rating, review);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#FCECA3', border: '3px solid #5AA8E5' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: '#163C69' }}>
            {country.flag} {country.name} 평점
          </h3>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:opacity-70 transition-opacity"
            style={{ color: '#EA3E38' }}
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#163C69' }}>
            별점
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="text-3xl transition-transform hover:scale-110"
              >
                {(hoveredRating >= star || (!hoveredRating && rating >= star)) ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#163C69' }}>
            한줄평
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="이 나라에 대한 한줄평을 작성해주세요..."
            className="w-full p-3 rounded-lg border-2 resize-none"
            style={{ 
              borderColor: '#5AA8E5',
              backgroundColor: '#FFFFFF',
              color: '#163C69',
              minHeight: '80px'
            }}
            maxLength={100}
          />
          <p className="text-xs mt-1 text-right" style={{ color: '#5AA8E5' }}>
            {review.length}/100
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg font-semibold transition-all"
            style={{ 
              backgroundColor: '#E3F2FD',
              border: '2px solid #5AA8E5',
              color: '#163C69'
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-lg font-semibold transition-all"
            style={{ 
              backgroundColor: '#5AA8E5',
              border: '2px solid #1F6FB8',
              color: '#FFFFFF'
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
