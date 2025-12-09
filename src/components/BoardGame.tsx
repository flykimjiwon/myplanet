"use client";

import { useState, useEffect } from 'react';
import { Country } from '@/lib/countries';
import { imageToBase64 } from '@/lib/indexedDB';
import { getCountryRating, saveCountryRating } from '@/lib/localStorage';
import { getTravelMemory, saveTravelMemory } from '@/lib/supabase/memories';
import { getCountryRating as getSupabaseRating, saveCountryRating as saveSupabaseRating } from '@/lib/supabase/ratings';
import { uploadPhoto, getPhotoUrl, deletePhoto as deleteSupabasePhoto } from '@/lib/supabase/storage';
import { getCurrentUser } from '@/lib/auth';

interface BoardGameProps {
  visitedCountries: Map<string, number>;
  countries: Country[];
  onSelectCountry?: (country: Country) => void;
  onIncreaseVisits?: (code: string) => void;
  onDecreaseVisits?: (code: string) => void;
}

type TabType = 'memory' | 'info' | 'benefit';

// 대륙을 4개 그룹으로 묶기 (각 변에 배치)
const continentGroups = {
  '아시아/오세아니아': ['아시아', '오세아니아'],  // 변 0 (상단)
  '유럽': ['유럽'],                                 // 변 1 (우측)
  '북미/남미': ['북아메리카', '남아메리카'],        // 변 2 (하단)
  '아프리카': ['아프리카'],                         // 변 3 (좌측)
};

// 각 그룹별 색상
const groupColors: Record<string, { bg: string; border: string; text: string }> = {
  '아시아/오세아니아': { bg: '#F8D348', border: '#F2B705', text: '#163C69' },
  '유럽': { bg: '#5AA8E5', border: '#1F6FB8', text: '#FFFFFF' },
  '북미/남미': { bg: '#EA3E38', border: '#D72C2A', text: '#FFFFFF' },
  '아프리카': { bg: '#9ED4F5', border: '#5AA8E5', text: '#163C69' },
};

export default function BoardGame({ visitedCountries, countries, onSelectCountry, onIncreaseVisits, onDecreaseVisits }: BoardGameProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('memory');
  const [rotationX, setRotationX] = useState(15);
  const [rotationY, setRotationY] = useState(-25);
  const [rotationZ, setRotationZ] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryText, setDiaryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedContinentGroup, setSelectedContinentGroup] = useState<string | null>(null);
  const [airplaneAngle, setAirplaneAngle] = useState(0);
  
  // 비행기 애니메이션 - 지구본 주변을 천천히 회전
  useEffect(() => {
    const interval = setInterval(() => {
      setAirplaneAngle(prev => (prev + 0.3) % 360); // 더 천천히 회전 (0.3도씩)
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  const rotateBoard = (delta: number) => setRotationZ((prev) => prev + delta);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5));
  };

  // 데이터 로드
  useEffect(() => {
    if (selectedCountry) {
      const loadData = async () => {
        const user = await getCurrentUser();
        
        if (user) {
          // 로그인 시: Supabase에서만 로드
          console.log('📥 [BoardGame] 데이터 로드 시작:', { countryCode: selectedCountry.code, isAuthenticated: true });
          
          // Supabase에서 로드
          const memory = await getTravelMemory(selectedCountry.code);
          if (memory) {
            console.log('✅ [BoardGame] Supabase에서 메모리 로드 성공');
            // 이미지 URL이 있으면 로드
            if (memory.photo_url) {
              setPhoto(memory.photo_url);
            } else {
              setPhoto(null);
            }
            setDiaryTitle(memory.title || '');
            setDiaryText(memory.text || '');
          } else {
            console.log('ℹ️ [BoardGame] Supabase에 메모리 없음');
            setPhoto(null);
            setDiaryTitle('');
            setDiaryText('');
          }
          
          // 평점도 Supabase에서만 로드
          const savedRating = await getSupabaseRating(selectedCountry.code);
          if (savedRating) {
            console.log('✅ [BoardGame] Supabase에서 평점 로드 성공');
            setRating(savedRating.rating);
            setReview(savedRating.review || '');
          } else {
            console.log('ℹ️ [BoardGame] Supabase에 평점 없음');
            setRating(0);
            setReview('');
          }
        } else {
          // 비로그인 시: 여행 일기는 휘발성, 평점/한줄평은 localStorage에서 로드 (동기화)
          console.log('📥 [BoardGame] 데이터 로드 시작:', { countryCode: selectedCountry.code, isAuthenticated: false });
          
          // 여행 일기는 휘발성 (상태 관리만 사용)
          setPhoto(null);
          setDiaryTitle('');
          setDiaryText('');
          
          // 평점/한줄평은 localStorage에서 로드 (CountrySelector와 동기화)
          const savedRating = getCountryRating(selectedCountry.code);
          if (savedRating) {
            console.log('✅ [BoardGame] localStorage에서 평점 로드 성공');
            setRating(savedRating.rating);
            setReview(savedRating.review);
          } else {
            console.log('ℹ️ [BoardGame] localStorage에 평점 없음');
            setRating(0);
            setReview('');
          }
        }
      };
      
      loadData();
    }
  }, [selectedCountry]);

  // 사진 업로드
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCountry) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('사진 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      
      if (user) {
        // Supabase Storage에 업로드
        const photoUrl = await uploadPhoto(selectedCountry.code, file);
        if (photoUrl) {
          setPhoto(photoUrl);
          // 메모리 저장
          await saveTravelMemory(selectedCountry.code, photoUrl, diaryTitle, diaryText);
        } else {
          alert('사진 업로드에 실패했습니다.');
        }
      } else {
        // 비로그인 상태: 상태 관리만 사용 (휘발성)
        console.log('💭 [BoardGame] 비로그인 상태 - 사진 업로드 (휘발성)');
        const base64 = await imageToBase64(file);
        setPhoto(base64);
        // localStorage에 저장하지 않음 (상태 관리만 사용)
      }
    } catch (error) {
      console.error('사진 업로드 실패:', error);
      alert('사진 업로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사진 삭제
  const handlePhotoDelete = async () => {
    if (!selectedCountry) return;
    
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      
      if (user) {
        // Supabase Storage에서 삭제
        await deleteSupabasePhoto(selectedCountry.code);
        setPhoto(null);
        // 메모리 업데이트
        await saveTravelMemory(selectedCountry.code, null, diaryTitle, diaryText);
      } else {
        // 비로그인 상태: 상태 관리만 사용 (휘발성)
        console.log('💭 [BoardGame] 비로그인 상태 - 사진 삭제 (휘발성)');
        setPhoto(null);
        // localStorage에 저장하지 않음 (상태 관리만 사용)
      }
    } catch (error) {
      console.error('사진 삭제 실패:', error);
      alert('사진 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 여행일기 저장
  const handleDiarySave = async () => {
    if (!selectedCountry) return;
    
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      
      if (user) {
        // Supabase에 저장
        await saveTravelMemory(selectedCountry.code, photo, diaryTitle, diaryText);
        alert('저장되었습니다!');
      } else {
        // 비로그인 상태: 상태 관리만 사용 (휘발성)
        console.log('💭 [BoardGame] 비로그인 상태 - 일기 저장 (휘발성)');
        // localStorage에 저장하지 않음 (상태 관리만 사용)
        alert('저장되었습니다! (새로고침 시 초기화됩니다)');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  // 대륙별로 국가 그룹화
  const groupedCountries: Record<string, Country[]> = {};
  
  Object.keys(continentGroups).forEach((groupName) => {
    const continents = continentGroups[groupName as keyof typeof continentGroups];
    groupedCountries[groupName] = countries.filter(c => 
      continents.includes(c.continent)
    );
  });

  // 4개 변에 국가 배치 (각 그룹의 모든 국가를 해당 변에 배치)
  const sides: Country[][] = [];
  
  // 각 그룹의 순서대로 변에 배치
  Object.keys(continentGroups).forEach((groupName) => {
    const groupCountries = groupedCountries[groupName];
    // 해당 그룹의 모든 국가를 해당 변에 배치
    sides.push([...groupCountries]);
  });

  // 마우스 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    setRotationY(prev => prev + deltaX * 0.5);
    setRotationX(prev => Math.max(-30, Math.min(60, prev - deltaY * 0.5)));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 터치 드래그 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const deltaX = e.touches[0].clientX - lastMousePos.x;
    const deltaY = e.touches[0].clientY - lastMousePos.y;
    
    setRotationY(prev => prev + deltaX * 0.5);
    setRotationX(prev => Math.max(-30, Math.min(60, prev - deltaY * 0.5)));
    setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full h-full relative overflow-auto" style={{ backgroundColor: '#FCECA3' }}>
      <div className="min-h-full flex items-center justify-center p-4 md:p-8 relative" style={{
        perspective: '1000px',
        perspectiveOrigin: 'center center'
      }}>
        {/* 확대/축소 버튼 */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-50">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
            style={{
              backgroundColor: '#5AA8E5',
              border: '2px solid #1F6FB8',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1F6FB8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5AA8E5';
            }}
          >
            <span className="text-xl font-bold" style={{ color: '#F8D348' }}>+</span>
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
            style={{
              backgroundColor: '#5AA8E5',
              border: '2px solid #1F6FB8',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1F6FB8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5AA8E5';
            }}
          >
            <span className="text-xl font-bold" style={{ color: '#F8D348' }}>−</span>
          </button>
        </div>
        {/* 회전 컨트롤 - 모바일에서 확대/축소 버튼 아래에 세로 배치 */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-50 md:flex-row md:gap-2" style={{ top: 'calc(50px + 2 * 42px)' }}>
          <button
            onClick={() => rotateBoard(-90)}
            className="w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2 rounded-lg border-2 text-xs md:text-sm font-bold active:scale-95 transition-all flex items-center justify-center"
            style={{
              backgroundColor: '#5AA8E5',
              border: '2px solid #1F6FB8',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1F6FB8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5AA8E5';
            }}
          >
            <span className="text-2xl md:text-xl font-bold" style={{ color: '#F8D348' }}>↺</span>
            <span className="hidden md:inline ml-1" style={{ color: '#F8D348' }}>90°</span>
          </button>
          <button
            onClick={() => rotateBoard(90)}
            className="w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2 rounded-lg border-2 text-xs md:text-sm font-bold active:scale-95 transition-all flex items-center justify-center"
            style={{
              backgroundColor: '#5AA8E5',
              border: '2px solid #1F6FB8',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1F6FB8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5AA8E5';
            }}
          >
            <span className="text-2xl md:text-xl font-bold" style={{ color: '#F8D348' }}>↻</span>
            <span className="hidden md:inline ml-1" style={{ color: '#F8D348' }}>90°</span>
          </button>
        </div>
        <div 
          className="relative"
          style={{ 
            width: 'min(90vw, 800px)', 
            height: 'min(90vw, 800px)',
            transform: `scale(${zoom}) rotateX(${rotationX}deg) rotateY(${rotationY}deg) rotateZ(${rotationZ}deg)`,
            transformStyle: 'preserve-3d',
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 보드 배경 */}
          <div className="absolute inset-0 rounded-2xl" style={{
            backgroundColor: '#FFFFFF',
            border: '4px solid #1F6FB8',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.1)',
            transform: 'translateZ(0)'
          }}></div>

          {/* 중앙 영역 - 국가 상세 정보 */}
          <div className="absolute inset-8 md:inset-12 rounded-xl overflow-hidden" style={{
            backgroundColor: '#E3F2FD',
            border: '3px solid #5AA8E5',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.15)',
            transform: 'translateZ(20px)'
          }}>
            {selectedCountry && visitedCountries.has(selectedCountry.code) ? (
              <div className="h-full flex flex-col">
                {/* 헤더 */}
                <div className="p-3 md:p-4 border-b-2 relative" style={{ borderColor: '#5AA8E5' }}>
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all active:scale-90"
                    style={{
                      backgroundColor: '#EA3E38',
                      border: '2px solid #D72C2A',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    ×
                  </button>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl md:text-4xl">{selectedCountry.flag}</span>
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-bold" style={{ color: '#163C69' }}>
                        {selectedCountry.name}
                      </h3>
                      <p className="text-xs md:text-sm font-medium" style={{ color: '#5AA8E5' }}>
                        {selectedCountry.nameEn}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold" style={{ color: '#163C69' }}>
                    방문 횟수: {visitedCountries.get(selectedCountry.code)}회
                  </div>
                </div>

                {/* 탭 */}
                <div className="flex border-b-2" style={{ borderColor: '#5AA8E5' }}>
                  {[
                    { id: 'memory' as TabType, label: '⭐ 평점', icon: '⭐' },
                    { id: 'info' as TabType, label: 'ℹ️ 정보', icon: 'ℹ️' },
                    { id: 'benefit' as TabType, label: '🎁 혜택', icon: '🎁' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex-1 py-2 px-2 text-xs md:text-sm font-semibold transition-all border-r-2 last:border-r-0"
                      style={{
                        backgroundColor: activeTab === tab.id ? '#5AA8E5' : 'transparent',
                        borderColor: '#5AA8E5',
                        color: activeTab === tab.id ? '#FFFFFF' : '#163C69',
                        boxShadow: activeTab === tab.id ? 'inset 0 -2px 0 #1F6FB8' : 'none'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 탭 콘텐츠 */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4">
                  {activeTab === 'memory' && (
                    <div className="space-y-4">
                      {/* 방문 횟수 조정 섹션 */}
                      {visitedCountries.has(selectedCountry.code) && (
                        <div className="rounded-lg p-3" style={{ backgroundColor: '#FFFFFF', border: '2px solid #5AA8E5' }}>
                          <h4 className="text-sm font-bold mb-3" style={{ color: '#163C69' }}>✈️ 방문 횟수</h4>
                          <div className="flex items-center justify-center gap-4">
                            <button
                              onClick={() => onDecreaseVisits?.(selectedCountry.code)}
                              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 font-bold"
                              style={{
                                backgroundColor: '#EA3E38',
                                border: '2px solid #D72C2A',
                                color: '#FFFFFF',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#D72C2A';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#EA3E38';
                              }}
                            >
                              −
                            </button>
                            <div className="text-center">
                              <p className="text-2xl font-bold" style={{ color: '#163C69' }}>
                                {visitedCountries.get(selectedCountry.code) || 0}
                              </p>
                              <p className="text-xs" style={{ color: '#5AA8E5' }}>회</p>
                            </div>
                            <button
                              onClick={() => onIncreaseVisits?.(selectedCountry.code)}
                              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 font-bold"
                              style={{
                                backgroundColor: '#5AA8E5',
                                border: '2px solid #1F6FB8',
                                color: '#FFFFFF',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1F6FB8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#5AA8E5';
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* 별점 섹션 */}
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#FFFFFF', border: '2px solid #5AA8E5' }}>
                        <h4 className="text-sm font-bold mb-3" style={{ color: '#163C69' }}>⭐ 별점</h4>
                        <div className="flex gap-2 justify-center mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={async () => {
                                const newRating = star;
                                setRating(newRating);
                                const user = await getCurrentUser();
                                // 별점만 저장 (기존 한줄평 유지)
                                if (user) {
                                  await saveSupabaseRating(selectedCountry.code, newRating, review || null);
                                } else {
                                  saveCountryRating(selectedCountry.code, newRating, review);
                                }
                              }}
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              className="text-3xl transition-transform hover:scale-110 active:scale-95"
                            >
                              {(hoveredRating >= star || (!hoveredRating && rating >= star)) ? '⭐' : '☆'}
                            </button>
                          ))}
                        </div>
                        {rating > 0 && (
                          <p className="text-center text-xs font-semibold" style={{ color: '#5AA8E5' }}>
                            {rating}점을 선택하셨습니다
                          </p>
                        )}
                      </div>

                      {/* 한줄평 섹션 */}
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#FFFFFF', border: '2px solid #5AA8E5' }}>
                        <h4 className="text-sm font-bold mb-3" style={{ color: '#163C69' }}>💬 한줄평</h4>
                        <textarea
                          value={review}
                          onChange={(e) => {
                            setReview(e.target.value);
                          }}
                          placeholder="이 나라에 대한 한줄평을 작성해주세요..."
                          rows={4}
                          className="w-full px-3 py-2 rounded-lg text-xs border-2 focus:outline-none resize-none"
                          style={{
                            borderColor: '#5AA8E5',
                            color: '#163C69',
                          }}
                          maxLength={100}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs" style={{ color: '#5AA8E5' }}>
                            {review.length}/100
                          </p>
                          <button
                            onClick={async () => {
                              const user = await getCurrentUser();
                              if (user) {
                                await saveSupabaseRating(selectedCountry.code, rating || 0, review || null);
                              } else {
                                saveCountryRating(selectedCountry.code, rating || 0, review);
                              }
                              // 저장 완료 피드백
                              alert('한줄평이 저장되었습니다!');
                            }}
                            disabled={!review.trim() && rating === 0}
                            className="px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: review.trim() || rating > 0 ? '#5AA8E5' : '#CCCCCC',
                              border: '2px solid',
                              borderColor: review.trim() || rating > 0 ? '#1F6FB8' : '#999999',
                              color: '#FFFFFF',
                            }}
                          >
                            💾 저장
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'info' && (
                    <div className="space-y-3">
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#FFFFFF', border: '2px solid #5AA8E5' }}>
                        <h4 className="text-sm font-bold mb-2" style={{ color: '#163C69' }}>📍 주요 여행지</h4>
                        {selectedCountry.attractions && selectedCountry.attractions.length > 0 ? (
                          <ul className="space-y-1 text-xs" style={{ color: '#5AA8E5' }}>
                            {selectedCountry.attractions.map((attraction, index) => (
                              <li key={index}>• {attraction}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400">정보 준비 중입니다</p>
                        )}
                      </div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#FFFFFF', border: '2px solid #5AA8E5' }}>
                        <h4 className="text-sm font-bold mb-2" style={{ color: '#163C69' }}>ℹ️ 국가 정보</h4>
                        <div className="text-xs space-y-1" style={{ color: '#5AA8E5' }}>
                          {selectedCountry.info && selectedCountry.info.length > 0 ? (
                            selectedCountry.info.map((info, index) => (
                              <p key={index}>{info}</p>
                            ))
                          ) : (
                            <>
                              <p><strong>대륙:</strong> {selectedCountry.continent}</p>
                              <p><strong>위치:</strong> 위도 {selectedCountry.lat.toFixed(2)}°, 경도 {selectedCountry.lng.toFixed(2)}°</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'benefit' && (
                    <div className="space-y-3">
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#F8D348', border: '2px solid #F2B705' }}>
                        <h4 className="text-sm font-bold mb-2" style={{ color: '#163C69' }}>🌐 로밍 상품</h4>
                        <p className="text-xs mb-2" style={{ color: '#163C69' }}>
                          {selectedCountry.name} 여행에 최적화된 로밍 상품
                        </p>
                        <button className="w-full py-2 rounded-md text-xs font-semibold transition-all active:scale-95"
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '2px solid #F2B705',
                            color: '#163C69',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          상품 보기
                        </button>
                      </div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#EA3E38', border: '2px solid #D72C2A' }}>
                        <h4 className="text-sm font-bold mb-2" style={{ color: '#FFFFFF' }}>💳 트래블 카드</h4>
                        <p className="text-xs mb-2" style={{ color: '#FFFFFF' }}>
                          해외 여행 시 환율 혜택과 안전한 결제
                        </p>
                        <button className="w-full py-2 rounded-md text-xs font-semibold transition-all active:scale-95"
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '2px solid #D72C2A',
                            color: '#163C69',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          카드 신청
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center relative overflow-hidden">
                {/* 비행기 애니메이션 - 지구본 주변을 원형으로 회전 */}
                <div
                  className="absolute"
                  style={{
                    width: 'clamp(250px, 30vw, 400px)',
                    height: 'clamp(250px, 30vw, 400px)',
                    transform: `rotate(${airplaneAngle}deg)`,
                    transition: 'transform 0.05s linear',
                  }}
                >
                  <div
                    className="absolute top-0 left-1/2 text-3xl md:text-4xl"
                    style={{
                      transform: 'translateX(-50%) rotate(90deg)',
                      filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                    }}
                  >
                    ✈️
                  </div>
                </div>
                
                <div className="text-center relative z-10">
                  <div className="mb-2" style={{ fontSize: 'clamp(4.8rem, 12vw, 10.8rem)' }}>🌍</div>
                  <div className="text-3xl md:text-[4.5rem] font-bold mb-2" style={{ color: '#163C69', fontSize: 'clamp(1.875rem, 4.5vw, 4.5rem)' }}>My Planet</div>
                  <div className="text-lg md:text-2xl font-semibold mb-4" style={{ color: '#5AA8E5', fontSize: 'clamp(1.125rem, 2.5vw, 2rem)' }}>
                    트래블마블 모드
                  </div>
                  <p className="text-base md:text-xl px-4" style={{ color: '#5AA8E5', fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>
                    방문한 국가를 클릭하면<br />
                    상세 정보를 확인할 수 있습니다
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4개 변에 국가 배치 */}
          {sides.map((sideCountries, sideIndex) => {
            const groupName = Object.keys(continentGroups)[sideIndex];
            const colors = groupColors[groupName];
            const cellsPerSide = sideCountries.length;
            
            return (
              <div
                key={sideIndex}
                className="absolute"
                style={{
                  ...getSidePosition(sideIndex, 'min(90vw, 800px)'),
                  transform: 'translateZ(10px)',
                }}
              >
                {/* 변 라벨 */}
                {(() => {
                  const labelPos = getSideLabelPosition(sideIndex);
                  // 해당 그룹의 방문한 국가 목록
                  const visitedInGroup = sideCountries.filter(c => visitedCountries.has(c.code));
                  const hasVisitedCountries = visitedInGroup.length > 0;
                  
                  return (
                    <div
                      className="absolute text-center font-bold text-base md:text-lg px-4 py-2.5 rounded-lg cursor-pointer transition-all active:scale-95"
                      style={{
                        ...labelPos.position,
                        backgroundColor: colors.bg,
                        border: `4px solid ${colors.border}`,
                        color: colors.text,
                        boxShadow: '0 12px 24px rgba(0,0,0,0.5), inset 0 -2px 2px rgba(0,0,0,0.1)',
                        zIndex: 300, // 더 위로 올라가게
                        transform: labelPos.transform,
                        textShadow: '0 4px 8px rgba(0,0,0,0.4)',
                        opacity: hasVisitedCountries ? 1 : 0.6,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasVisitedCountries) {
                          setSelectedContinentGroup(groupName);
                        }
                      }}
                    >
                      {groupName}
                      {hasVisitedCountries && (
                        <span className="block text-xs mt-1 opacity-80">
                          {visitedInGroup.length}개국
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* 국가 칸들 */}
                {sideCountries.map((country, cellIndex) => {
                  const isVisited = visitedCountries.has(country.code);
                  const isSelected = selectedCountry?.code === country.code;
                  const visits = visitedCountries.get(country.code) || 0;
                  
                  return (
                    <div
                      key={country.code}
                      className="absolute flex flex-col items-center justify-center rounded-md border-2 transition-all hover:scale-110"
                      style={{
                        ...getCellPosition(sideIndex, cellIndex, cellsPerSide, 'min(90vw, 800px)', isVisited, isSelected),
                        backgroundColor: isVisited ? colors.bg : '#FFFFFF',
                        borderColor: isSelected ? '#F8D348' : (isVisited ? colors.border : '#C8D3DF'),
                        borderWidth: isSelected ? '3px' : '2px',
                        boxShadow: isSelected
                          ? '0 10px 16px rgba(0,0,0,0.45), 0 0 0 2px rgba(248, 211, 72, 0.6), inset 0 -2px 2px rgba(0,0,0,0.1)'
                          : isVisited 
                          ? '0 6px 12px rgba(0,0,0,0.35), inset 0 -2px 2px rgba(0,0,0,0.1)'
                          : '0 3px 6px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.8)',
                        width: isSelected ? 'clamp(68px, 6.8vw, 105px)' : (isVisited ? 'clamp(60px, 6vw, 92px)' : 'clamp(45px, 4.5vw, 70px)'),
                        height: isSelected ? 'clamp(105px, 10.5vw, 150px)' : (isVisited ? 'clamp(88px, 8.8vw, 125px)' : 'clamp(60px, 6vw, 90px)'),
                        cursor: isVisited ? 'pointer' : 'default',
                        zIndex: isSelected ? 180 : (isVisited ? 120 : 1),
                        transform: `${getCellPosition(sideIndex, cellIndex, cellsPerSide, 'min(90vw, 800px)', isVisited, isSelected).transform} ${isSelected ? 'scale(1.12)' : ''}`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isVisited) {
                          setSelectedCountry(country);
                          setActiveTab('memory');
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (isVisited) {
                          const tooltip = document.createElement('div');
                          tooltip.id = `tooltip-${country.code}`;
                          tooltip.textContent = country.name;
                          tooltip.style.cssText = `
                            position: absolute;
                            background-color: #163C69;
                            color: #FFFFFF;
                            padding: 6px 12px;
                            border-radius: 6px;
                            font-size: 12px;
                            font-weight: bold;
                            pointer-events: none;
                            z-index: 1000;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                            white-space: nowrap;
                          `;
                          document.body.appendChild(tooltip);
                          const rect = e.currentTarget.getBoundingClientRect();
                          tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
                          tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
                        }
                      }}
                      onMouseLeave={() => {
                        const tooltip = document.getElementById(`tooltip-${country.code}`);
                        if (tooltip) {
                          tooltip.remove();
                        }
                      }}
                    >
                      {/* 떠 있는 국기 배지 (카드 상단) */}
                      {isVisited && (
                        <div
                          className="absolute flex items-center justify-center rounded-full border-2"
                          style={{
                            ...getFlagBadgePosition(sideIndex),
                            backgroundColor: '#FFFFFF',
                            borderColor: isSelected ? '#F8D348' : '#C8D3DF',
                            boxShadow: '0 8px 14px rgba(0,0,0,0.35)',
                            padding: '8px',
                            zIndex: 260,
                          }}
                        >
                          <div 
                            className={isSelected ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'}
                            style={{ 
                              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.45))',
                              textShadow: '0 4px 8px rgba(0,0,0,0.45)',
                            }}
                          >
                            {country.flag}
                          </div>
                        </div>
                      )}

                      {/* 국기 표시 - 카드 내부 보조 (방문한 나라만) */}
                      {isVisited && (
                        <div 
                          className={`${isSelected ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}
                          style={{ 
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))',
                            opacity: 0.8,
                            marginTop: '18px'
                          }}
                        >
                          {country.flag}
                        </div>
                      )}

                      
                      {/* 선택된 카드 표시 */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{
                          backgroundColor: '#F8D348',
                          border: '2px solid #F2B705',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                          <span className="text-[10px]">✓</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 대륙별 방문한 국가 목록 모달 */}
      {selectedContinentGroup && (() => {
        const groupIndex = Object.keys(continentGroups).indexOf(selectedContinentGroup);
        const groupCountries = sides[groupIndex] || [];
        const visitedInGroup = groupCountries.filter(c => visitedCountries.has(c.code));
        const colors = groupColors[selectedContinentGroup];
        
        return (
          <div 
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
            onClick={() => setSelectedContinentGroup(null)}
          >
            <div 
              className="w-[90%] max-w-md max-h-[80vh] rounded-xl overflow-hidden flex flex-col"
              style={{ 
                backgroundColor: '#FCECA3',
                border: `3px solid ${colors.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="p-4 flex items-center justify-between" style={{ backgroundColor: colors.bg, borderBottom: `2px solid ${colors.border}` }}>
                <h3 className="text-lg font-bold" style={{ color: colors.text }}>
                  {selectedContinentGroup} 방문 국가
                </h3>
                <button
                  onClick={() => setSelectedContinentGroup(null)}
                  className="text-2xl font-bold hover:opacity-70 transition-opacity"
                  style={{ color: colors.text }}
                >
                  ×
                </button>
              </div>

              {/* 국가 목록 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {visitedInGroup.length === 0 ? (
                  <p className="text-center text-sm" style={{ color: '#5AA8E5' }}>
                    방문한 국가가 없습니다
                  </p>
                ) : (
                  visitedInGroup.map((country) => {
                    const visits = visitedCountries.get(country.code) || 0;
                    return (
                      <button
                        key={country.code}
                        onClick={() => {
                          setSelectedCountry(country);
                          setActiveTab('memory');
                          setSelectedContinentGroup(null);
                        }}
                        className="w-full p-3 rounded-lg border-2 transition-all active:scale-95 text-left"
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                          color: colors.text,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{country.flag}</span>
                            <div>
                              <p className="font-semibold text-sm">{country.name}</p>
                              <p className="text-xs opacity-80">{country.nameEn}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold opacity-80">방문 횟수</p>
                            <p className="text-sm font-bold">{visits}회</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// 각 변의 위치 계산
function getSidePosition(sideIndex: number, boardSize: string): React.CSSProperties {
  // CSS calc 값을 직접 사용 (parseFloat 대신)
  const paddingPercent = '15%';
  
  switch (sideIndex) {
    case 0: // 상단 (아시아/오세아니아)
      return {
        top: 0,
        left: paddingPercent,
        width: `calc(100% - ${paddingPercent} * 2)`,
        height: paddingPercent,
      };
    case 1: // 우측 (유럽)
      return {
        top: paddingPercent,
        right: 0,
        width: paddingPercent,
        height: `calc(100% - ${paddingPercent} * 2)`,
      };
    case 2: // 하단 (북미/남미)
      return {
        bottom: 0,
        left: paddingPercent,
        width: `calc(100% - ${paddingPercent} * 2)`,
        height: paddingPercent,
      };
    case 3: // 좌측 (아프리카)
      return {
        top: paddingPercent,
        left: 0,
        width: paddingPercent,
        height: `calc(100% - ${paddingPercent} * 2)`,
      };
    default:
      return {};
  }
}

// 변 라벨 위치
function getSideLabelPosition(sideIndex: number): { position: React.CSSProperties; transform: string } {
  const z = 320; // 더 위로 튀어나오게 (240 -> 320)
  switch (sideIndex) {
    case 0: // 상단 (아시아/오세아니아) - 위쪽으로 더 올려서 배치, 정상 방향
      return { 
        position: { top: '50%', left: '50%' }, 
        transform: `translate(-50%, -120%) translateZ(${z}px)` 
      };
    case 1: // 우측 (유럽) - 오른쪽으로 더 밀어서 배치, 90도 회전
      return { 
        position: { top: '50%', right: '10px' }, 
        transform: `translateY(-50%) translateX(35px) rotate(90deg) translateZ(${z}px)` 
      };
    case 2: // 하단 (북미/남미) - 아래쪽으로 더 내려서 배치, 180도 회전
      return { 
        position: { bottom: '50%', left: '50%' }, 
        transform: `translate(-50%, 120%) rotate(180deg) translateZ(${z}px)` 
      };
    case 3: // 좌측 (아프리카) - 왼쪽으로 더 밀어서 배치, -90도 회전
      return { 
        position: { top: '50%', left: '10px' }, 
        transform: `translateY(-50%) translateX(-35px) rotate(-90deg) translateZ(${z}px)` 
      };
    default:
      return { position: {}, transform: '' };
  }
}

// 국기 배지 위치 (각 변 방향에 따라 위/오른쪽/아래/왼쪽 배치)
function getFlagBadgePosition(sideIndex: number): React.CSSProperties {
  const offset = '16px';
  const z = 240;
  switch (sideIndex) {
    case 0: // 상단
      return { top: `-${offset}`, left: '50%', transform: `translate(-50%, -50%) translateZ(${z}px)` };
    case 1: // 우측
      return { right: `-${offset}`, top: '50%', transform: `translate(50%, -50%) translateZ(${z}px)` };
    case 2: // 하단
      return { bottom: `-${offset}`, left: '50%', transform: `translate(-50%, 50%) translateZ(${z}px)` };
    case 3: // 좌측
      return { left: `-${offset}`, top: '50%', transform: `translate(-50%, -50%) translateZ(${z}px)` };
    default:
      return {};
  }
}

// 각 칸의 위치 계산
function getCellPosition(
  sideIndex: number,
  cellIndex: number,
  totalCells: number,
  boardSize: string,
  isVisited: boolean = false,
  isSelected: boolean = false
): React.CSSProperties {
  // CSS calc를 사용하여 퍼센트 기반으로 계산
  const cellWidth = 100 / totalCells;
  const position = cellIndex * cellWidth + cellWidth / 2;
  // 선택된 나라 > 방문한 나라 > 방문하지 않은 나라 순으로 높이 조정 (더 강하게 돌출)
  const zOffset = isSelected ? 240 : (isVisited ? 180 : 60);
  
  switch (sideIndex) {
    case 0: // 상단 (왼쪽에서 오른쪽으로)
      return {
        left: `${position}%`,
        top: '50%',
        transform: `translate(-50%, -50%) translateZ(${zOffset}px)`,
      };
    case 1: // 우측 (위에서 아래로)
      return {
        top: `${position}%`,
        right: '50%',
        transform: `translate(50%, -50%) translateZ(${zOffset}px)`,
      };
    case 2: // 하단 (오른쪽에서 왼쪽으로)
      return {
        right: `${position}%`,
        bottom: '50%',
        transform: `translate(50%, 50%) translateZ(${zOffset}px)`,
      };
    case 3: // 좌측 (아래에서 위로)
      return {
        bottom: `${position}%`,
        left: '50%',
        transform: `translate(-50%, 50%) translateZ(${zOffset}px)`,
      };
    default:
      return {};
  }
}

