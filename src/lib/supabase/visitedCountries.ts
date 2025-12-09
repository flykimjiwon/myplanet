import { createClient } from './client'

export interface VisitedCountry {
  country_code: string
  visits: number
}

// 방문한 국가 목록 가져오기
export async function getVisitedCountries(): Promise<Map<string, number>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('visited_countries')
    .select('country_code, visits')
    .eq('user_id', user.id)

  if (error) {
    console.error('방문 국가 조회 실패:', error)
    return new Map()
  }

  const map = new Map<string, number>()
  data?.forEach((item) => {
    map.set(item.country_code, item.visits)
  })

  return map
}

// 방문한 국가 추가/업데이트
export async function upsertVisitedCountry(countryCode: string, visits: number): Promise<boolean> {
  console.log('📤 [Supabase upsertVisitedCountry] 요청:', { countryCode, visits });
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('❌ [Supabase upsertVisitedCountry] 사용자 없음');
    return false
  }

  console.log('👤 [Supabase upsertVisitedCountry] 사용자 ID:', user.id);

  const { data, error } = await supabase
    .from('visited_countries')
    .upsert({
      user_id: user.id,
      country_code: countryCode,
      visits,
    }, {
      onConflict: 'user_id,country_code'
    })
    .select()

  if (error) {
    console.error('❌ [Supabase upsertVisitedCountry] 저장 실패:', {
      error,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return false
  }

  console.log('✅ [Supabase upsertVisitedCountry] 저장 성공:', data);
  return true
}

// 방문한 국가 삭제
export async function deleteVisitedCountry(countryCode: string): Promise<boolean> {
  console.log('📤 [Supabase deleteVisitedCountry] 요청:', { countryCode });
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('❌ [Supabase deleteVisitedCountry] 사용자 없음');
    return false
  }

  console.log('👤 [Supabase deleteVisitedCountry] 사용자 ID:', user.id);

  const { data, error } = await supabase
    .from('visited_countries')
    .delete()
    .eq('user_id', user.id)
    .eq('country_code', countryCode)
    .select()

  if (error) {
    console.error('❌ [Supabase deleteVisitedCountry] 삭제 실패:', {
      error,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return false
  }

  console.log('✅ [Supabase deleteVisitedCountry] 삭제 성공:', data);
  return true
}

// 모든 방문 국가 동기화 (배치 업데이트)
export async function syncVisitedCountries(visitedCountries: Map<string, number>): Promise<boolean> {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user || userError) {
    return false
  }

  // 이메일 인증 확인
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user.email_confirmed_at) {
    console.warn('이메일 인증이 완료되지 않았습니다. 데이터 저장을 위해 이메일 인증이 필요합니다.')
    return false
  }

  const records = Array.from(visitedCountries.entries()).map(([country_code, visits]) => ({
    user_id: user.id,
    country_code,
    visits,
  }))

  if (records.length === 0) {
    // 모든 데이터 삭제
    const { error } = await supabase
      .from('visited_countries')
      .delete()
      .eq('user_id', user.id)
    
    return !error
  }

  // 기존 데이터 삭제 후 새로 삽입
  const { error: deleteError } = await supabase
    .from('visited_countries')
    .delete()
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('기존 데이터 삭제 실패:', deleteError)
    return false
  }

  const { error: insertError } = await supabase
    .from('visited_countries')
    .insert(records)

  if (insertError) {
    // 에러 객체가 비어있거나 권한 관련 에러인 경우 조용히 처리
    const errorMessage = insertError.message || ''
    const errorCode = insertError.code || ''
    const errorDetails = insertError.details || ''
    
    // 이메일 인증 미완료로 인한 권한 에러는 조용히 처리 (콘솔 에러 방지)
    if (
      errorMessage.includes('permission') || 
      errorMessage.includes('policy') || 
      errorMessage.includes('RLS') ||
      errorCode.includes('PGRST') ||
      errorDetails.includes('permission')
    ) {
      // 이메일 인증이 완료되지 않아서 발생하는 에러는 조용히 처리
      return false
    }
    
    // 다른 에러는 로그만 남기고 실패 반환
    if (errorMessage || errorCode) {
      console.warn('방문 국가 동기화 실패:', errorMessage || errorCode)
    }
    return false
  }

  return true
}

