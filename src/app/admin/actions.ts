'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AdminUser {
  id: string
  email: string
  created_at: string
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  phone: string | null
}

export async function getUsers(): Promise<AdminUser[]> {
  const supabase = await createClient()
  
  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.email?.toLowerCase() !== 'flykimjiwun@naver.com') {
    throw new Error('관리자 권한이 없습니다.')
  }

  try {
    // Admin API 클라이언트로 사용자 목록 가져오기
    const adminClient = createAdminClient()
    const { data: { users }, error } = await adminClient.auth.admin.listUsers()

    if (error) {
      console.error('사용자 목록 조회 실패:', error)
      throw new Error('사용자 목록을 불러올 수 없습니다.')
    }

    // 사용자 정보 변환
    return users.map((user) => ({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      phone: user.phone || null,
    }))
  } catch (err) {
    console.error('Admin API 호출 실패:', err)
    throw err
  }
}

