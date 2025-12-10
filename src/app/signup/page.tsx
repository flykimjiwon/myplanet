"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (!email || !password || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      // 프로덕션 URL 우선, 없으면 현재 origin 사용
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (signUpError) {
        // 중복 계정 에러 메시지 개선
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
          setError('이미 가입된 이메일입니다. 로그인 페이지로 이동하시겠습니까?');
        } else {
          setError(signUpError.message || '회원가입에 실패했습니다.');
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // 회원가입 성공 - 이메일 인증 안내
        alert('회원가입이 완료되었습니다!\n\n이메일 인증을 완료해주세요.\n이메일을 확인하여 인증 링크를 클릭하시면 모든 기능을 사용하실 수 있습니다.');
        // 메인 화면으로 이동
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
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
          <p className="text-sm" style={{ color: '#5AA8E5' }}>회원가입</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
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
              placeholder="최소 6자 이상"
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: '#5AA8E5',
                backgroundColor: '#E3F2FD',
                color: '#163C69',
              }}
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2" style={{ color: '#163C69' }}>
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: '#5AA8E5',
                backgroundColor: '#E3F2FD',
                color: '#163C69',
              }}
              required
              minLength={6}
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
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: '#5AA8E5' }}>
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-bold underline" style={{ color: '#163C69' }}>
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

