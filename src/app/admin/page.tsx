"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

const ADMIN_EMAIL = 'flykimjiwun@naver.com';
const ADMIN_PASSWORD = '4742!wndgml';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 관리자 인증 확인
  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAuthenticated(true);
        loadUsers();
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAdmin();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 클라이언트 사이드 검증
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setError('관리자 이메일 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (loginError) {
        // 에러 메시지 개선
        if (loginError.message.includes('Invalid login credentials') || loginError.message.includes('Invalid')) {
          setError('관리자 계정이 존재하지 않거나 비밀번호가 올바르지 않습니다.\n\n관리자 계정을 먼저 생성해주세요.');
        } else {
          setError(loginError.message || '로그인에 실패했습니다.');
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // 이메일 확인 (대소문자 구분 없이)
        if (data.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setIsAuthenticated(true);
          loadUsers();
        } else {
          setError('관리자 권한이 없습니다.');
          setIsLoading(false);
        }
      } else {
        setError('로그인에 실패했습니다.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/admin/api/users');
      if (!response.ok) {
        throw new Error('사용자 목록을 불러올 수 없습니다.');
      }
      const userList = await response.json();
      setUsers(userList);
      setError(null);
    } catch (err) {
      console.error('사용자 목록 로드 실패:', err);
      setError('사용자 목록을 불러올 수 없습니다. Supabase Dashboard를 확인해주세요.');
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUsers([]);
    // 완전한 로그아웃을 위해 페이지 새로고침
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FCECA3' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mb-4" style={{ borderColor: '#5AA8E5' }}></div>
          <p className="text-lg font-medium" style={{ color: '#163C69' }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FCECA3' }}>
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 left-4 px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95"
          style={{
            backgroundColor: '#E3F2FD',
            border: '2px solid #5AA8E5',
            color: '#163C69',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          ← 메인으로
        </button>

        <div className="w-full max-w-md p-8 rounded-2xl shadow-lg" style={{ backgroundColor: '#FFFFFF', border: '3px solid #EA3E38' }}>
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#163C69' }}>관리자 로그인</h1>
            <p className="text-sm" style={{ color: '#5AA8E5' }}>관리자만 접근 가능합니다</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#163C69' }}>
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="flykimjiwun@naver.com"
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: '#EA3E38',
                  backgroundColor: '#FEE2E2',
                  color: '#163C69',
                }}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#163C69' }}>
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: '#EA3E38',
                  backgroundColor: '#FEE2E2',
                  color: '#163C69',
                }}
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              style={{
                backgroundColor: '#EA3E38',
                border: '2px solid #D72C2A',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {isLoading ? '로그인 중...' : '관리자 로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FCECA3' }}>
      {/* 헤더 */}
      <div className="bg-white border-b-2 p-4" style={{ borderColor: '#EA3E38' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#163C69' }}>🔐 관리자 페이지</h1>
            <p className="text-sm" style={{ color: '#5AA8E5' }}>회원 관리</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95"
              style={{
                backgroundColor: '#E3F2FD',
                border: '2px solid #5AA8E5',
                color: '#163C69',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              메인으로
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
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl p-6 shadow-lg" style={{ border: '3px solid #EA3E38' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#163C69' }}>회원 목록</h2>
            <button
              onClick={loadUsers}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95"
              style={{
                backgroundColor: '#5AA8E5',
                border: '2px solid #1F6FB8',
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              🔄 새로고침
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              {error}
            </div>
          )}

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#E3F2FD', border: '2px solid #5AA8E5' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#163C69' }}>총 회원 수</p>
              <p className="text-2xl font-bold" style={{ color: '#5AA8E5' }}>
                {users.length}명
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '2px solid #EA3E38' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#163C69' }}>이메일 인증 완료</p>
              <p className="text-2xl font-bold" style={{ color: '#EA3E38' }}>
                {users.filter(u => u.email_confirmed_at).length}명
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '2px solid #F8D348' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#163C69' }}>미인증 회원</p>
              <p className="text-2xl font-bold" style={{ color: '#F2B705' }}>
                {users.filter(u => !u.email_confirmed_at).length}명
              </p>
            </div>
          </div>

          {/* 사용자 목록 테이블 */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '2px solid #5AA8E5' }}>
                  <th className="px-4 py-3 text-left text-sm font-bold" style={{ color: '#163C69' }}>이메일</th>
                  <th className="px-4 py-3 text-left text-sm font-bold" style={{ color: '#163C69' }}>가입일</th>
                  <th className="px-4 py-3 text-left text-sm font-bold" style={{ color: '#163C69' }}>이메일 인증</th>
                  <th className="px-4 py-3 text-left text-sm font-bold" style={{ color: '#163C69' }}>최근 로그인</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center" style={{ color: '#5AA8E5' }}>
                      <p className="text-sm font-semibold mb-2">사용자가 없습니다</p>
                      <p className="text-xs">또는 사용자 목록을 불러올 수 없습니다.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #E3F2FD' }}>
                      <td className="px-4 py-3 text-sm" style={{ color: '#163C69' }}>
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#5AA8E5' }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.email_confirmed_at ? (
                          <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                            ✓ 인증완료
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                            ⚠ 미인증
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#5AA8E5' }}>
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '없음'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {users.length > 0 && (
            <div className="mt-4 text-center text-sm font-semibold" style={{ color: '#163C69' }}>
              총 {users.length}명의 회원
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '2px solid #F8D348' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#163C69' }}>
              💡 참고사항
            </p>
            <ul className="text-xs space-y-1" style={{ color: '#5AA8E5' }}>
              <li>• 사용자 목록은 실시간으로 업데이트됩니다. 새로고침 버튼을 눌러 최신 정보를 확인하세요.</li>
              <li>• 이메일 인증 상태와 최근 로그인 정보를 확인할 수 있습니다.</li>
              <li>• 더 자세한 정보는 <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a>에서 확인할 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

