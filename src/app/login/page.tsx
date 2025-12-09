"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // 로그인 성공 - 메인 화면으로 이동
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

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

      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg" style={{ backgroundColor: '#FFFFFF', border: '3px solid #5AA8E5' }}>
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🌍</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#163C69' }}>My Planet</h1>
          <p className="text-sm" style={{ color: '#5AA8E5' }}>로그인</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#163C69' }}>
              이메일 (아이디)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: '#5AA8E5',
                backgroundColor: '#E3F2FD',
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
                borderColor: '#5AA8E5',
                backgroundColor: '#E3F2FD',
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
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            style={{
              backgroundColor: '#5AA8E5',
              border: '2px solid #163C69',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: '#5AA8E5' }}>
            계정이 없으신가요?{' '}
            <Link href="/signup" className="font-bold underline" style={{ color: '#163C69' }}>
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

