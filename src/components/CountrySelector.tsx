"use client";

import { useState } from 'react';
import { Country, continents } from '@/lib/countries';
import { getCountryRating } from '@/lib/localStorage';

interface CountrySelectorProps {
  countries: Country[];
  visitedCountries: Map<string, number>;
  onToggleCountry: (code: string) => void;
  onIncreaseVisits: (code: string) => void;
  onDecreaseVisits: (code: string) => void;
  onResetAll: () => void;
  onOpenRating?: (code: string) => void; // 평점 추가 버튼 클릭 시
  mode?: 'globe' | 'flat' | 'board'; // 현재 모드
}

// 대륙별 아이콘 및 색상
const continentStyles: Record<string, { icon: string; color: string; bgColor: string }> = {
  "전체": { icon: "🌍", color: "text-blue-400", bgColor: "from-blue-500/20 to-blue-600/20 border-blue-500/50" },
  "아시아": { icon: "🏯", color: "text-red-400", bgColor: "from-red-500/20 to-red-600/20 border-red-500/50" },
  "아프리카": { icon: "🦁", color: "text-amber-400", bgColor: "from-amber-500/20 to-amber-600/20 border-amber-500/50" },
  "유럽": { icon: "🏰", color: "text-indigo-400", bgColor: "from-indigo-500/20 to-indigo-600/20 border-indigo-500/50" },
  "북아메리카": { icon: "🗽", color: "text-emerald-400", bgColor: "from-emerald-500/20 to-emerald-600/20 border-emerald-500/50" },
  "남아메리카": { icon: "🌴", color: "text-green-400", bgColor: "from-green-500/20 to-green-600/20 border-green-500/50" },
  "오세아니아": { icon: "🦘", color: "text-cyan-400", bgColor: "from-cyan-500/20 to-cyan-600/20 border-cyan-500/50" },
};

export default function CountrySelector({
  countries,
  visitedCountries,
  onToggleCountry,
  onIncreaseVisits,
  onDecreaseVisits,
  onResetAll,
  onOpenRating,
  mode = 'globe',
}: CountrySelectorProps) {
  const [selectedContinent, setSelectedContinent] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = countries.filter((country) => {
    const matchesContinent = selectedContinent === "전체" || country.continent === selectedContinent;
    const matchesSearch = 
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesContinent && matchesSearch;
  });

  const visitedCount = visitedCountries.size;
  const totalCount = countries.length;
  const percentage = Math.round((visitedCount / totalCount) * 100);

  return (
    <div className="flex flex-col h-full p-4 lg:p-6 rounded-t-none lg:rounded-2xl rounded-b-2xl shadow-lg" style={{ 
      backgroundColor: '#5AA8E5', 
      border: '2px solid #1F6FB8',
      transition: 'height 0.3s ease-in-out',
    }}>
      {/* 헤더 */}
      <div className="mb-2 lg:mb-4 flex-shrink-0">
        <h1 className="text-xl lg:text-3xl font-bold mb-0.5 lg:mb-1.5" style={{ color: '#F8D348', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          🌍 My Planet
        </h1>
        <p className="text-[10px] lg:text-xs font-medium opacity-90" style={{ color: '#FFFFFF' }}>
          {mode === 'globe' 
            ? '지구본을 돌려보세요! 당신의 여행 기록을 확인하세요'
            : mode === 'flat'
            ? '평평한 지도에서 당신의 여행 발자국을 찾아보세요!'
            : '트래블마블 보드에서 방문한 국가를 클릭해보세요!'
          }
        </p>
      </div>

      {/* 통계 */}
      <div className="mb-2 lg:mb-4 p-2 lg:p-3 rounded-xl flex-shrink-0" style={{
        backgroundColor: '#1F6FB8', 
        border: '2px solid #163C69',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15)'
      }}>
        <div className="flex items-center justify-between mb-1 lg:mb-2">
          <span className="text-[10px] lg:text-xs font-semibold" style={{ color: '#FFFFFF' }}>방문한 국가</span>
          <span className="text-base lg:text-xl font-bold" style={{ color: '#F8D348' }}>
            {visitedCount} / {totalCount}
          </span>
        </div>
        <div className="w-full rounded-full h-2 lg:h-2.5 mb-1 lg:mb-1.5" style={{
          backgroundColor: '#163C69',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
        }}>
          <div
            className="h-2.5 rounded-full transition-all duration-300"
            style={{ 
              width: `${percentage}%`, 
              backgroundColor: '#F8D348',
              boxShadow: '0 2px 4px rgba(248, 211, 72, 0.4), inset 0 -1px 2px rgba(0,0,0,0.1)'
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] lg:text-xs text-right font-semibold" style={{ color: '#F8D348' }}>
            세계 정복률 {percentage}%
          </p>
          {visitedCount > 0 && (
            <button
              onClick={onResetAll}
              className="px-2 py-1 rounded-md text-[10px] font-semibold transition-all active:scale-95"
              style={{
                backgroundColor: '#EA3E38',
                border: '2px solid #D72C2A',
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#D72C2A';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2), inset 0 -1px 1px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#EA3E38';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)';
              }}
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 검색 */}
      <div className="mb-2 lg:mb-3 flex-shrink-0">
        <div className="relative">
          <span className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-lg lg:text-xl" style={{ color: '#F8D348' }}>🔍</span>
        <input
          type="text"
            placeholder="국가 이름을 입력하세요..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 lg:pl-4 pr-10 lg:pr-12 py-2.5 lg:py-4 rounded-lg focus:outline-none text-sm lg:text-base font-medium transition-all"
            style={{ 
              backgroundColor: '#E3F2FD', 
              border: '2px solid #1F6FB8',
              color: '#163C69',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#F8D348';
              e.target.style.backgroundColor = '#FFFFFF';
              e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1), 0 0 0 3px rgba(248, 211, 72, 0.2), 0 2px 4px rgba(0,0,0,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#1F6FB8';
              e.target.style.backgroundColor = '#E3F2FD';
              e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)';
            }}
          />
        </div>
      </div>

      {/* 대륙 필터 */}
      <div className="mb-2 lg:mb-3 flex-shrink-0">
        <div className="grid grid-cols-7 gap-1 lg:grid-cols-4 lg:gap-1.5">
          {["전체", ...continents].map((continent) => {
            const style = continentStyles[continent] || continentStyles["전체"];
            const isSelected = selectedContinent === continent;
            const countryCount = continent === "전체" 
              ? countries.length 
              : countries.filter(c => c.continent === continent).length;
            
            return (
          <button
            key={continent}
            onClick={() => setSelectedContinent(continent)}
                className="flex flex-col items-center p-1 lg:p-1.5 rounded-lg transition-all duration-200 border-2 active:scale-95"
                style={isSelected ? {
                  backgroundColor: '#F8D348',
                  borderColor: '#F2B705',
                  color: '#163C69',
                  boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
                } : {
                  backgroundColor: '#E3F2FD',
                  borderColor: '#1F6FB8',
                  color: '#163C69',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.5)'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#BBDEFB';
                    e.currentTarget.style.borderColor = '#5AA8E5';
                    e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#E3F2FD';
                    e.currentTarget.style.borderColor = '#1F6FB8';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.5)';
                  }
                }}
              >
                <span className="text-base lg:text-lg mb-0.5">{style.icon}</span>
                <span className="text-xs lg:text-sm font-bold whitespace-nowrap leading-tight">
                  {continent === "북아메리카" ? "북미" : continent === "남아메리카" ? "남미" : continent}
                </span>
                <span className="text-[9px] lg:text-[10px] opacity-80 font-semibold">
                  {countryCount}
                </span>
          </button>
            );
          })}
        </div>
      </div>

      {/* 국가 목록 */}
      <div 
        className="flex-1 overflow-y-auto space-y-1 lg:space-y-1.5 pr-1 custom-scrollbar"
        style={{
          minHeight: 'clamp(200px, 35vh, 285px)', // 최소 2개 국가 카드가 완전히 보이도록 설정 (모바일 최적화)
        }}
      >
        {filteredCountries.length === 0 ? (
          <div className="text-center py-8" style={{ color: '#F8D348' }}>
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm font-semibold">검색 결과가 없습니다</p>
          </div>
        ) : (
          filteredCountries.map((country) => {
          const visits = visitedCountries.get(country.code) || 0;
          const isVisited = visits > 0;
            const rating = isVisited ? getCountryRating(country.code) : null;
            const getRatingEmoji = (rating: number | null) => {
              if (!rating) return null;
              if (rating === 5) return '😄';
              if (rating === 4) return '🙂';
              if (rating === 3) return '😐';
              if (rating === 2) return '😕';
              if (rating === 1) return '😠';
              return null;
            };
            const ratingEmoji = getRatingEmoji(rating?.rating || null);
          return (
            <div
              key={country.code}
                className="w-full p-2 lg:p-2.5 rounded-lg transition-all duration-200 border-2"
                style={isVisited ? {
                  backgroundColor: '#EA3E38',
                  borderColor: '#D72C2A',
                  color: '#FFFFFF',
                  boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
                } : {
                  backgroundColor: '#E3F2FD',
                  borderColor: '#1F6FB8',
                  color: '#163C69',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.5)'
                }}
                onMouseEnter={(e) => {
                  if (!isVisited) {
                    e.currentTarget.style.backgroundColor = '#BBDEFB';
                    e.currentTarget.style.borderColor = '#5AA8E5';
                    e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isVisited) {
                    e.currentTarget.style.backgroundColor = '#E3F2FD';
                    e.currentTarget.style.borderColor = '#1F6FB8';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.5)';
                  }
                }}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onToggleCountry(country.code)}
                    className="flex items-center gap-2 lg:gap-2.5 flex-1 min-w-0"
                  >
                    <span className="text-lg lg:text-xl flex-shrink-0">{country.flag}</span>
                    <div className="text-left min-w-0 flex-1">
                      <div className="flex items-center gap-1 lg:gap-1.5">
                        <p className="font-semibold text-xs lg:text-sm truncate" style={{ color: isVisited ? '#FFFFFF' : '#163C69' }}>{country.name}</p>
                        {ratingEmoji && (
                          <span 
                            className="text-sm lg:text-base cursor-pointer flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenRating) {
                                onOpenRating(country.code);
                              }
                            }}
                            title={`평점: ${rating?.rating}점`}
                          >
                            {ratingEmoji}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] lg:text-xs truncate opacity-80" style={{ color: isVisited ? '#F8D348' : '#5AA8E5' }}>{country.nameEn} · {country.continent}</p>
                  </div>
                </button>
                
                {isVisited && (
                    <div className="flex items-center gap-1 lg:gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDecreaseVisits(country.code);
                      }}
                        className="w-6 h-6 lg:w-7 lg:h-7 rounded-md flex items-center justify-center font-bold transition-all text-xs lg:text-sm border-2 active:scale-90"
                        style={{ 
                          backgroundColor: '#D72C2A',
                          borderColor: '#A8201A',
                          color: '#FFFFFF',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#A8201A';
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2), inset 0 -1px 1px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#D72C2A';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.2)';
                        }}
                    >
                      −
                    </button>
                      <div className="min-w-[35px] lg:min-w-[40px] text-center">
                        <p className="font-bold text-xs lg:text-sm" style={{ color: '#F8D348' }}>{visits}회</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onIncreaseVisits(country.code);
                      }}
                        className="w-6 h-6 lg:w-7 lg:h-7 rounded-md flex items-center justify-center font-bold transition-all text-xs lg:text-sm border-2 active:scale-90"
                        style={{ 
                          backgroundColor: '#F8D348',
                          borderColor: '#F2B705',
                          color: '#163C69',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F2B705';
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2), inset 0 -1px 1px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#F8D348';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)';
                        }}
                    >
                      +
                    </button>
                      {onOpenRating && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRating(country.code);
                          }}
                          className="px-2 py-1 rounded-md flex items-center gap-1 font-semibold text-xs border-2 active:scale-90 transition-all"
                          style={{ 
                            backgroundColor: '#5AA8E5',
                            borderColor: '#1F6FB8',
                            color: '#FFFFFF',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1F6FB8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#5AA8E5';
                          }}
                        >
                          ⭐ {ratingEmoji ? '수정' : '평점'}
                        </button>
                      )}
                  </div>
                )}
              </div>
            </div>
          );
          })
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1F6FB8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #F8D348;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F2B705;
        }
      `}</style>
    </div>
  );
}
