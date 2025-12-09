// Supabase 연결 테스트 유틸리티
// 개발 중에만 사용하세요

import { createClient } from './client'

export async function testConnection() {
  try {
    const supabase = createClient()
    
    // 인증 상태 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('✅ Supabase 연결 성공!')
    console.log('Session:', session ? '로그인됨' : '로그인 안됨')
    
    if (sessionError) {
      console.error('❌ 세션 에러:', sessionError)
      return false
    }
    
    // 데이터베이스 연결 테스트 (간단한 쿼리)
    const { data, error } = await supabase
      .from('visited_countries')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ 데이터베이스 연결 에러:', error.message)
      console.log('💡 테이블이 생성되지 않았을 수 있습니다. supabase/schema.sql을 실행하세요.')
      return false
    }
    
    console.log('✅ 데이터베이스 연결 성공!')
    return true
  } catch (error) {
    console.error('❌ 연결 실패:', error)
    return false
  }
}

