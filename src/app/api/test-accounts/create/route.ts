import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_ACCOUNTS = [
  { email: 'test1@test.com', password: 'test123!' },
  { email: 'test2@test.com', password: 'test123!' },
  { email: 'test3@test.com', password: 'test123!' },
  { email: 'test4@test.com', password: 'test123!' },
  { email: 'test5@test.com', password: 'test123!' },
  { email: 'test6@test.com', password: 'test123!' },
  { email: 'test7@test.com', password: 'test123!' },
  { email: 'test8@test.com', password: 'test123!' },
  { email: 'test9@test.com', password: 'test123!' },
  { email: 'test10@test.com', password: 'test123!' },
];

export async function POST() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: '환경 변수가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const results = [];

  for (const account of TEST_ACCOUNTS) {
    try {
      // 기존 계정 확인
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === account.email);

      if (existingUser) {
        results.push({
          email: account.email,
          status: 'exists',
          message: '이미 존재하는 계정'
        });
        continue;
      }

      // 새 계정 생성
      const { data, error } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // 이메일 인증 자동 완료
      });

      if (error) {
        results.push({
          email: account.email,
          status: 'error',
          message: error.message
        });
      } else {
        results.push({
          email: account.email,
          status: 'created',
          message: '생성 완료'
        });
      }
    } catch (err: any) {
      results.push({
        email: account.email,
        status: 'error',
        message: err.message || '알 수 없는 오류'
      });
    }
  }

  return NextResponse.json({
    success: true,
    results
  });
}

