/**
 * 테스트 계정 생성 스크립트
 * 
 * 사용 방법:
 * 1. .env.local 파일에 SUPABASE_SERVICE_ROLE_KEY가 설정되어 있어야 합니다
 * 2. npx tsx scripts/create-test-accounts.ts 실행
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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

async function createTestAccounts() {
  console.log('🧪 테스트 계정 생성 시작...\n');

  for (const account of TEST_ACCOUNTS) {
    try {
      // 기존 계정 확인
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === account.email);

      if (existingUser) {
        console.log(`⚠️  ${account.email} - 이미 존재하는 계정 (건너뜀)`);
        continue;
      }

      // 새 계정 생성
      const { data, error } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // 이메일 인증 자동 완료
      });

      if (error) {
        console.error(`❌ ${account.email} - 생성 실패:`, error.message);
      } else {
        console.log(`✅ ${account.email} - 생성 완료`);
      }
    } catch (err: any) {
      console.error(`❌ ${account.email} - 오류:`, err.message);
    }
  }

  console.log('\n✨ 테스트 계정 생성 완료!');
}

createTestAccounts();

