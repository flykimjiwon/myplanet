"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface TravelPreference {
  id: string;
  question: string;
  options: {
    label: string;
    value: string;
  }[];
}

const TRAVEL_PREFERENCES: TravelPreference[] = [
  {
    id: 'vacation_style',
    question: '휴양지 스타일',
    options: [
      { label: '🏖️ 휴양지에서 쉬기', value: 'relax' },
      { label: '🗺️ 모험과 탐험', value: 'adventure' },
      { label: '✨ 둘다 좋음', value: 'both' },
    ],
  },
  {
    id: 'budget',
    question: '여행 예산',
    options: [
      { label: '💰 저렴한 여행', value: 'budget' },
      { label: '💎 호화로운 여행', value: 'luxury' },
      { label: '✨ 둘다 좋음', value: 'both' },
    ],
  },
  {
    id: 'accommodation',
    question: '숙박 스타일',
    options: [
      { label: '🏨 호화로운 숙박', value: 'luxury' },
      { label: '🛏️ 잠만 자면 됨', value: 'simple' },
      { label: '✨ 둘다 좋음', value: 'both' },
    ],
  },
  {
    id: 'food',
    question: '음식 중요도',
    options: [
      { label: '🍽️ 음식이 중요해', value: 'important' },
      { label: '🍱 간단하게', value: 'simple' },
      { label: '✨ 둘다 좋음', value: 'both' },
    ],
  },
  {
    id: 'activity',
    question: '활동 선호도',
    options: [
      { label: '🎯 계획된 일정', value: 'planned' },
      { label: '🎲 즉흥적인 여행', value: 'spontaneous' },
      { label: '✨ 둘다 좋음', value: 'both' },
    ],
  },
  {
    id: 'group_size',
    question: '여행 동반자',
    options: [
      { label: '👥 그룹 여행', value: 'group' },
      { label: '🚶 혼자 여행', value: 'solo' },
      { label: '✨ 둘다 좋음', value: 'both' },
    ],
  },
  {
    id: 'culture',
    question: '문화 체험',
    options: [
      { label: '🏛️ 문화 유적지', value: 'historical' },
      { label: '🎨 현대적 경험', value: 'modern' },
      { label: '✨ 둘다 좋음', value: 'both' },
    ],
  },
  {
    id: 'nature',
    question: '자연 vs 도시',
    options: [
      { label: '🌲 자연 속에서', value: 'nature' },
      { label: '🏙️ 도시 탐험', value: 'city' },
      { label: '✨ 둘다 좋음', value: 'both' },
    ],
  },
  {
    id: 'nightlife',
    question: '야경/야생활',
    options: [
      { label: '🌃 밤 문화 즐기기', value: 'active' },
      { label: '🌙 일찍 자고 일찍 일어나기', value: 'early' },
      { label: '✨ 둘다 좋음', value: 'both' },
    ],
  },
  {
    id: 'transport',
    question: '교통 수단',
    options: [
      { label: '🚗 자유로운 이동', value: 'flexible' },
      { label: '🚌 대중교통', value: 'public' },
      { label: '✨ 둘다 좋음', value: 'both' },
    ],
  },
];

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [travelPreferences, setTravelPreferences] = useState<Record<string, string>>({});
  const [travelPreferencesTemp, setTravelPreferencesTemp] = useState<Record<string, string>>({}); // 임시 저장용
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      // 여행 성향 로드
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from('user_preferences')
          .select('travel_preferences')
          .eq('user_id', authUser.id)
          .single<{ travel_preferences: Record<string, string> | null }>();

        if (data?.travel_preferences) {
          setTravelPreferences(data.travel_preferences);
          setTravelPreferencesTemp(data.travel_preferences);
        } else {
          // 저장된 데이터가 없으면 모든 항목을 "둘다 좋음"으로 기본 설정
          const defaultPreferences: Record<string, string> = {};
          TRAVEL_PREFERENCES.forEach((pref) => {
            defaultPreferences[pref.id] = 'both';
          });
          setTravelPreferencesTemp(defaultPreferences);
        }
      }

      setLoading(false);
    };

    loadUserData();
  }, [router]);

  const handlePreferenceChange = (id: string, value: string) => {
    const newPreferences = { ...travelPreferencesTemp, [id]: value };
    setTravelPreferencesTemp(newPreferences);
    setPreferencesSaved(false); // 변경되면 저장 상태 초기화
  };

  const handleSavePreferences = async () => {
    // 모든 항목이 선택되었는지 확인
    const allSelected = TRAVEL_PREFERENCES.every(
      (pref) => travelPreferencesTemp[pref.id]
    );

    if (!allSelected) {
      setPasswordError('모든 여행 성향을 선택해주세요.');
      return;
    }

    setSavingPreferences(true);
    setPreferencesSaved(false);

    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      // @ts-ignore - Supabase 타입 추론 문제 (travel_preferences 컬럼 타입 인식 불가)
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: authUser.id,
          travel_preferences: travelPreferencesTemp,
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('여행 성향 저장 실패:', error);
        setSavingPreferences(false);
      } else {
        console.log('✅ 여행 성향 저장 성공');
        setTravelPreferences(travelPreferencesTemp);
        setPreferencesSaved(true);
        setSavingPreferences(false);
        setTimeout(() => setPreferencesSaved(false), 3000);
      }
    } else {
      setSavingPreferences(false);
    }
  };

  // 모든 항목이 선택되었는지 확인
  const isAllPreferencesSelected = TRAVEL_PREFERENCES.every(
    (pref) => travelPreferencesTemp[pref.id]
  );

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      console.log('🔐 [비밀번호 변경] 시작');
      const supabase = createClient();
      
      // 현재 사용자 확인
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        console.error('❌ [비밀번호 변경] 사용자 확인 실패:', userError);
        setPasswordError('사용자 인증에 실패했습니다. 다시 로그인해주세요.');
        return;
      }
      
      console.log('✅ [비밀번호 변경] 사용자 확인 완료:', currentUser.email);
      console.log('🔄 [비밀번호 변경] 새 비밀번호로 업데이트 시도...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        console.error('❌ [비밀번호 변경] 실패:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        
        // 에러 메시지 한국어 번역
        let errorMessage = error.message;
        if (error.message.includes('should be different from the old password')) {
          errorMessage = '새 비밀번호는 기존 비밀번호와 달라야 합니다.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
        } else if (error.message.includes('Invalid')) {
          errorMessage = '유효하지 않은 비밀번호입니다.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = '너무 자주 시도했습니다. 잠시 후 다시 시도해주세요.';
        }
        setPasswordError(errorMessage);
        return;
      }

      console.log('✅ [비밀번호 변경] 성공:', data);
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      console.error('❌ [비밀번호 변경] 예외 발생:', error);
      setPasswordError('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FCECA3' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: '#5AA8E5' }}></div>
          <p className="text-lg font-medium" style={{ color: '#163C69' }}>로딩중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen overflow-y-auto p-4 md:p-6" style={{ backgroundColor: '#FCECA3' }}>
      <div className="max-w-4xl mx-auto pb-8">
        {/* 헤더 */}
        <div className="mb-6">
          <Link href="/" className="inline-block mb-4">
            <button className="px-4 py-2 rounded-lg font-semibold text-sm" style={{ backgroundColor: '#5AA8E5', color: '#FFFFFF' }}>
              ← 메인으로
            </button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#163C69' }}>
            👤 마이페이지
          </h1>
        </div>

        {/* 기본 정보 */}
        <div className="mb-6 p-6 rounded-xl" style={{ backgroundColor: '#E8F4FD', border: '2px solid #5AA8E5', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#163C69' }}>기본 정보</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm mb-1" style={{ color: '#5AA8E5' }}>이메일</p>
              <p className="text-lg font-semibold" style={{ color: '#163C69' }}>{user.email}</p>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: '#5AA8E5' }}>가입일</p>
              <p className="text-lg" style={{ color: '#163C69' }}>
                {new Date(user.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
            {user.email_confirmed_at ? (
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <p className="text-sm" style={{ color: '#163C69' }}>이메일 인증 완료</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">⚠</span>
                <p className="text-sm" style={{ color: '#163C69' }}>이메일 인증 필요</p>
              </div>
            )}
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <div className="mb-6 p-6 rounded-xl" style={{ backgroundColor: '#E8F4FD', border: '2px solid #5AA8E5', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#163C69' }}>비밀번호 변경</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#163C69' }}>현재 비밀번호</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 bg-white"
                style={{ borderColor: '#5AA8E5' }}
                placeholder="현재 비밀번호 입력"
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#163C69' }}>새 비밀번호</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 bg-white"
                style={{ borderColor: '#5AA8E5' }}
                placeholder="새 비밀번호 입력 (최소 6자)"
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#163C69' }}>새 비밀번호 확인</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 bg-white"
                style={{ borderColor: '#5AA8E5' }}
                placeholder="새 비밀번호 다시 입력"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-600">✓ 비밀번호가 성공적으로 변경되었습니다.</p>
            )}
            <button
              type="submit"
              className="px-6 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95"
              style={{
                backgroundColor: '#5AA8E5',
                border: '2px solid #1F6FB8',
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              비밀번호 변경
            </button>
          </form>
        </div>

        {/* 여행 성향 */}
        <div className="mb-6 p-6 rounded-xl" style={{ backgroundColor: '#E8F4FD', border: '2px solid #5AA8E5', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#163C69' }}>
            ✈️ 나의 여행 성향
          </h2>
          <div className="space-y-6 mb-6">
            {TRAVEL_PREFERENCES.map((pref) => (
              <div key={pref.id}>
                <p className="text-sm font-semibold mb-3" style={{ color: '#163C69' }}>
                  {pref.question}
                </p>
                <div className="flex flex-wrap gap-3">
                  {pref.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePreferenceChange(pref.id, option.value)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95 ${
                        travelPreferencesTemp[pref.id] === option.value
                          ? 'text-white'
                          : 'text-gray-700'
                      }`}
                      style={
                        travelPreferencesTemp[pref.id] === option.value
                          ? {
                              backgroundColor: '#5AA8E5',
                              border: '2px solid #1F6FB8',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }
                          : {
                              backgroundColor: '#F3F4F6',
                              border: '2px solid #E5E7EB',
                            }
                      }
                      onMouseEnter={(e) => {
                        if (travelPreferencesTemp[pref.id] !== option.value) {
                          e.currentTarget.style.backgroundColor = '#E5E7EB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (travelPreferencesTemp[pref.id] !== option.value) {
                          e.currentTarget.style.backgroundColor = '#F3F4F6';
                        }
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* 저장 버튼 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSavePreferences}
              disabled={savingPreferences || !isAllPreferencesSelected}
              className="px-6 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={
                savingPreferences || !isAllPreferencesSelected
                  ? {
                      backgroundColor: '#9CA3AF',
                      border: '2px solid #6B7280',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }
                  : {
                      backgroundColor: '#5AA8E5',
                      border: '2px solid #1F6FB8',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }
              }
            >
              {savingPreferences ? '저장 중...' : '저장하기'}
            </button>
            {preferencesSaved && (
              <p className="text-sm text-green-600">✓ 저장되었습니다!</p>
            )}
            {!isAllPreferencesSelected && (
              <p className="text-sm" style={{ color: '#5AA8E5' }}>
                모든 항목을 선택해주세요 ({Object.keys(travelPreferencesTemp).length}/{TRAVEL_PREFERENCES.length})
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

