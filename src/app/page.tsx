"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CountrySelector from '@/components/CountrySelector';
import ModeToggle from '@/components/ModeToggle';
import FlatMap from '@/components/FlatMap';
import BoardGame from '@/components/BoardGame';
import { countries } from '@/lib/countries';
import { loadVisitedCountries, saveVisitedCountries, clearVisitedCountries, getCountryRating, saveCountryRating } from '@/lib/localStorage';
import { getVisitedCountries, syncVisitedCountries, upsertVisitedCountry, deleteVisitedCountry } from '@/lib/supabase/visitedCountries';
import { getCountryRating as getSupabaseRating, saveCountryRating as saveSupabaseRating } from '@/lib/supabase/ratings';
import { getCurrentUser, signOut } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';

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
  const router = useRouter();
  const [visitedCountries, setVisitedCountries] = useState<Map<string, number>>(new Map());
  const [mode, setMode] = useState<ViewMode>('globe');
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 초기 로드 중인지 추적
  const [ratingModal, setRatingModal] = useState<{ open: boolean; countryCode: string | null }>({ open: false, countryCode: null });
  const [statsCardCollapsed, setStatsCardCollapsed] = useState(false);
  const [statsCardPosition, setStatsCardPosition] = useState({ x: 0, y: 0 });
  const [isDraggingStats, setIsDraggingStats] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 인앱 브라우저 주소창 대응: 실제 뷰포트 높이 계산
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // 인앱 브라우저에서 주소창이 사라질 때를 대비한 지연 실행
    setTimeout(setVH, 100);
    setTimeout(setVH, 500);
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // 클라이언트에서만 마운트되도록 처리 (hydration 오류 방지)
  useEffect(() => {
    setMounted(true);
    
    // 인증 상태 확인 및 데이터 로드
    const loadData = async () => {
      setIsInitialLoad(true); // 초기 로드 시작
      const user = await getCurrentUser();
      setIsAuthenticated(user !== null);
      
      if (user) {
        // 로그인된 경우: Supabase에서만 데이터 로드
        console.log('📥 [page.tsx] 로그인 상태 - Supabase에서 데이터 로드');
        const supabaseData = await getVisitedCountries();
        if (supabaseData.size > 0) {
          console.log('✅ [page.tsx] Supabase에서 방문 국가 로드 성공:', supabaseData.size, '개');
          setVisitedCountries(supabaseData);
        } else {
          console.log('ℹ️ [page.tsx] Supabase에 방문 국가 없음');
          setVisitedCountries(new Map());
        }
      } else {
        // 로그인 안 된 경우: 상태 관리만 사용 (휘발성, 새로고침 시 초기화)
        console.log('📥 [page.tsx] 비로그인 상태 - 상태 관리만 사용 (휘발성)');
        setVisitedCountries(new Map());
      }
      
      // 초기 로드 완료
      setTimeout(() => {
        setIsInitialLoad(false);
        console.log('✅ [page.tsx] 초기 로드 완료, 자동 저장 활성화');
      }, 1000); // 데이터 로드 후 1초 대기
    };
    
    loadData();
  }, []);

  // 방문한 나라 상태가 변경될 때마다 저장 (로그인 상태에서만)
  useEffect(() => {
    // 초기 로드 중이거나 마운트되지 않았거나 로그인하지 않은 경우 저장하지 않음
    if (!mounted || !isAuthenticated || isInitialLoad) {
      if (isInitialLoad) {
        console.log('⏸️ [자동 저장] 초기 로드 중이므로 저장 건너뜀');
      }
      return;
    }
    
    const saveData = async () => {
      // 로그인 상태에서만 Supabase에 저장
      console.log('💾 [자동 저장] 시작:', { 
        방문국가수: visitedCountries.size, 
        isAuthenticated,
        국가목록: Array.from(visitedCountries.entries())
      });
      
      console.log('☁️ [자동 저장] Supabase 동기화 시작...');
      const success = await syncVisitedCountries(visitedCountries);
      if (success) {
        console.log('✅ [자동 저장] Supabase 동기화 성공');
      } else {
        console.warn('⚠️ [자동 저장] Supabase 저장 실패 (이메일 인증 미완료 등)');
      }
    };
    
    // 디바운싱: 너무 자주 저장하지 않도록
    const timeoutId = setTimeout(() => {
      saveData();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [visitedCountries, mounted, isAuthenticated, isInitialLoad]);

  const handleToggleCountry = async (code: string) => {
    console.log('🔄 [방문 국가 토글] 시작:', { code, isAuthenticated, 현재상태: visitedCountries.has(code) });
    const newMap = new Map(visitedCountries);
    if (newMap.has(code)) {
      newMap.delete(code);
      console.log('🗑️ [방문 국가 삭제] 국가 코드:', code);
      // Supabase에서 삭제
      if (isAuthenticated) {
        console.log('☁️ [Supabase] 삭제 요청 시작...');
        const result = await deleteVisitedCountry(code);
        console.log('☁️ [Supabase] 삭제 결과:', result ? '✅ 성공' : '❌ 실패');
      } else {
        console.log('💭 [상태 관리] 삭제 (휘발성)');
      }
    } else {
      newMap.set(code, 1);
      console.log('➕ [방문 국가 추가] 국가 코드:', code, '방문 횟수: 1');
      // Supabase에 추가
      if (isAuthenticated) {
        console.log('☁️ [Supabase] 추가 요청 시작...');
        const result = await upsertVisitedCountry(code, 1);
        console.log('☁️ [Supabase] 추가 결과:', result ? '✅ 성공' : '❌ 실패');
      } else {
        console.log('💭 [상태 관리] 추가 (휘발성)');
      }
    }
    setVisitedCountries(newMap);
    console.log('✅ [방문 국가 토글] 완료, 새로운 상태:', Array.from(newMap.entries()));
  };

  const handleIncreaseVisits = async (code: string) => {
    const current = visitedCountries.get(code) || 0;
    const newVisits = current + 1;
    console.log('➕ [방문 횟수 증가] 국가 코드:', code, `현재: ${current} → 새로운: ${newVisits}`, { isAuthenticated });
    const newMap = new Map(visitedCountries);
    newMap.set(code, newVisits);
    setVisitedCountries(newMap);
    
    // 로그인 상태에서만 Supabase에 업데이트
    if (isAuthenticated) {
      console.log('☁️ [Supabase] 업데이트 요청 시작...');
      const result = await upsertVisitedCountry(code, newVisits);
      console.log('☁️ [Supabase] 업데이트 결과:', result ? '✅ 성공' : '❌ 실패');
    } else {
      console.log('💭 [상태 관리] 업데이트 (휘발성)');
    }
  };

  const handleDecreaseVisits = async (code: string) => {
    const current = visitedCountries.get(code) || 0;
    console.log('➖ [방문 횟수 감소] 국가 코드:', code, `현재: ${current}`, { isAuthenticated });
    const newMap = new Map(visitedCountries);
    if (current > 1) {
      const newVisits = current - 1;
      newMap.set(code, newVisits);
      setVisitedCountries(newMap);
      console.log('📉 [방문 횟수 감소] 새로운 횟수:', newVisits);
      // 로그인 상태에서만 Supabase에 업데이트
      if (isAuthenticated) {
        console.log('☁️ [Supabase] 업데이트 요청 시작...');
        const result = await upsertVisitedCountry(code, newVisits);
        console.log('☁️ [Supabase] 업데이트 결과:', result ? '✅ 성공' : '❌ 실패');
      } else {
        console.log('💭 [상태 관리] 업데이트 (휘발성)');
      }
    } else {
      newMap.delete(code);
      setVisitedCountries(newMap);
      console.log('🗑️ [방문 국가 삭제] (방문 횟수가 0이 됨)');
      // 로그인 상태에서만 Supabase에서 삭제
      if (isAuthenticated) {
        console.log('☁️ [Supabase] 삭제 요청 시작...');
        const result = await deleteVisitedCountry(code);
        console.log('☁️ [Supabase] 삭제 결과:', result ? '✅ 성공' : '❌ 실패');
      } else {
        console.log('💭 [상태 관리] 삭제 (휘발성)');
      }
    }
  };

  const handleResetAll = async () => {
    if (confirm('모든 방문 기록을 초기화하시겠습니까?')) {
      setVisitedCountries(new Map());
      if (isAuthenticated) {
        await syncVisitedCountries(new Map());
      } else {
        clearVisitedCountries();
      }
    }
  };

  const handleLogout = async () => {
    if (confirm('로그아웃하시겠습니까?')) {
      const success = await signOut();
      if (success) {
        // 인증 상태 업데이트
        setIsAuthenticated(false);
        // 방문 국가 데이터 초기화 (Supabase 데이터 제거)
        setVisitedCountries(new Map());
        // 메인 화면으로 이동
        window.location.href = '/';
      }
    }
  };

  const toggleMode = (newMode: 'globe' | 'flat' | 'board') => {
    setMode(newMode);
  };

  // 통계 카드 드래그 핸들러
  const handleStatsMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // 버튼 클릭 시 드래그 방지
    setIsDraggingStats(true);
    setDragStart({
      x: e.clientX - statsCardPosition.x,
      y: e.clientY - statsCardPosition.y,
    });
  };

  const handleStatsMouseMove = (e: MouseEvent) => {
    if (!isDraggingStats) return;
    setStatsCardPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleStatsMouseUp = () => {
    setIsDraggingStats(false);
  };

  // 터치 드래그 핸들러
  const handleStatsTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.touches.length === 1) {
      setIsDraggingStats(true);
      setDragStart({
        x: e.touches[0].clientX - statsCardPosition.x,
        y: e.touches[0].clientY - statsCardPosition.y,
      });
    }
  };

  const handleStatsTouchMove = (e: TouchEvent) => {
    if (!isDraggingStats || e.touches.length !== 1) return;
    e.preventDefault();
    setStatsCardPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleStatsTouchEnd = () => {
    setIsDraggingStats(false);
  };

  useEffect(() => {
    if (isDraggingStats) {
      window.addEventListener('mousemove', handleStatsMouseMove);
      window.addEventListener('mouseup', handleStatsMouseUp);
      window.addEventListener('touchmove', handleStatsTouchMove as EventListener, { passive: false });
      window.addEventListener('touchend', handleStatsTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleStatsMouseMove);
        window.removeEventListener('mouseup', handleStatsMouseUp);
        window.removeEventListener('touchmove', handleStatsTouchMove as EventListener);
        window.removeEventListener('touchend', handleStatsTouchEnd);
      };
    }
  }, [isDraggingStats, dragStart]);

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
    <main className="w-screen overflow-hidden" style={{ 
      backgroundColor: '#FCECA3',
      height: 'calc(var(--vh, 1vh) * 100)',
      minHeight: 'calc(var(--vh, 1vh) * 100)',
      maxHeight: 'calc(var(--vh, 1vh) * 100)'
    }}>
      {/* 이메일 인증 안내 배너 */}
      {isAuthenticated && <EmailVerificationBanner />}
      
      {/* 로그인/로그아웃 버튼 */}
      <div className="absolute top-2 right-2 z-50 flex gap-2">
        {isAuthenticated ? (
          <>
            <button
              onClick={() => router.push('/mypage')}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95"
              style={{
                backgroundColor: '#5AA8E5',
                border: '2px solid #1F6FB8',
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              마이페이지
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95"
              style={{
                backgroundColor: '#EA3E38',
                border: '2px solid #D72C2A',
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95"
              style={{
                backgroundColor: '#5AA8E5',
                border: '2px solid #1F6FB8',
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              로그인
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95"
              style={{
                backgroundColor: '#F8D348',
                border: '2px solid #F2B705',
                color: '#163C69',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              회원가입
            </button>
          </>
        )}
      </div>

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
              mode={mode}
            />
          </div>

        {/* 지구본/지도 뷰 */}
        <div className="flex-1 h-[65%] sm:h-[72%] lg:h-full relative flex flex-col overflow-hidden min-h-[300px]">
          {/* 모드 토글 */}
          <div className="absolute top-2 md:top-6 left-1/2 transform -translate-x-1/2 z-10">
            <ModeToggle mode={mode} onToggle={(newMode) => toggleMode(newMode)} />
          </div>

          {/* 뷰 영역 - 모바일에서 스크롤 가능 */}
          <div className="flex-1 relative overflow-y-auto lg:overflow-hidden">
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
                
                {/* 안내 텍스트 - 모바일에서 지구본에 가깝게 배치 */}
                <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 lg:bottom-4 left-1/2 transform -translate-x-1/2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full" style={{ 
                  backgroundColor: '#5AA8E5', 
                  border: '2px solid #1F6FB8',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
                }}>
                  <p className="text-[10px] sm:text-xs md:text-sm text-center font-semibold whitespace-nowrap" style={{ color: '#FFFFFF' }}>
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
            ) : mode === 'board' ? (
              <BoardGame 
                visitedCountries={visitedCountries} 
                countries={countries}
                onSelectCountry={(country) => {
                  if (!visitedCountries.has(country.code)) {
                    handleToggleCountry(country.code);
                  }
                }}
                onIncreaseVisits={handleIncreaseVisits}
                onDecreaseVisits={handleDecreaseVisits}
              />
            ) : null}

            {/* 로고 & 통계 */}
            <div 
              className="absolute rounded-xl scale-[0.8] md:scale-100 z-20 select-none"
              style={{ 
                backgroundColor: '#5AA8E5', 
                border: '2px solid #1F6FB8', 
                padding: 'clamp(0.5rem, 1.2vw, 0.875rem)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)',
                minWidth: 'clamp(180px, 25vw, 220px)',
                width: 'auto',
                opacity: 0.8,
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
                cursor: isDraggingStats ? 'grabbing' : 'grab',
                ...(statsCardPosition.x !== 0 || statsCardPosition.y !== 0 ? {
                  top: `${statsCardPosition.y}px`,
                  left: `${statsCardPosition.x}px`,
                  bottom: 'auto',
                  right: 'auto',
                } : {
                  bottom: '8px',
                  left: '8px',
                  top: 'auto',
                  right: 'auto',
                }),
              }}
              onMouseDown={handleStatsMouseDown}
              onTouchStart={handleStatsTouchStart}
            >
              {/* 헤더 (드래그 가능 영역) */}
              <div className="flex items-center justify-between mb-1 cursor-grab active:cursor-grabbing">
                <div className="flex-1">
                  <h2 className="text-sm md:text-base font-bold mb-0.5" style={{ color: '#F8D348' }}>
                    My Planet
                  </h2>
                  <p className="text-[9px] md:text-[10px] font-semibold opacity-90" style={{ color: '#FFFFFF' }}>나만의 여행 지도</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatsCardCollapsed(!statsCardCollapsed);
                  }}
                  className="ml-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all active:scale-90"
                  style={{
                    backgroundColor: '#1F6FB8',
                    color: '#FFFFFF',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {statsCardCollapsed ? '▼' : '▲'}
                </button>
              </div>
              
              {!statsCardCollapsed && (
                <>
              
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
                </>
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
    const loadRating = async () => {
      const user = await getCurrentUser();
      if (user) {
        // Supabase에서 로드
        const saved = await getSupabaseRating(countryCode);
        if (saved) {
          setRating(saved.rating);
          setReview(saved.review || '');
        } else {
          setRating(0);
          setReview('');
        }
      } else {
        // localStorage에서 로드 (하위 호환)
        const saved = getCountryRating(countryCode);
        if (saved) {
          setRating(saved.rating);
          setReview(saved.review);
        } else {
          setRating(0);
          setReview('');
        }
      }
    };
    loadRating();
  }, [countryCode]);

  const handleSave = async () => {
    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }
    
    const user = await getCurrentUser();
    if (user) {
      // Supabase에 저장
      await saveSupabaseRating(countryCode, rating, review || null);
    } else {
      // localStorage에 저장 (하위 호환)
      saveCountryRating(countryCode, rating, review);
    }
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
