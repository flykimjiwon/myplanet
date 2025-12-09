// Supabase Admin API 클라이언트 (서버 사이드 전용)
// service_role key를 사용하여 모든 사용자 정보에 접근 가능

import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.')
  }

  // service_role key를 사용하여 Admin API 클라이언트 생성
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

