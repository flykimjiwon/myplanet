import { createClient } from './client'

export interface TravelMemory {
  country_code: string
  photo_url: string | null
  title: string | null
  text: string | null
}

// 여행 일기 가져오기
export async function getTravelMemory(countryCode: string): Promise<TravelMemory | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('travel_memories')
    .select('country_code, photo_url, title, text')
    .eq('user_id', user.id)
    .eq('country_code', countryCode)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // 데이터 없음
      return null
    }
    console.error('여행 일기 조회 실패:', error)
    return null
  }

  return data
}

// 여행 일기 저장/업데이트
export async function saveTravelMemory(
  countryCode: string,
  photoUrl: string | null,
  title: string | null,
  text: string | null
): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { error } = await (supabase
    .from('travel_memories') as any)
    .upsert({
      user_id: user.id,
      country_code: countryCode,
      photo_url: photoUrl,
      title,
      text,
    }, {
      onConflict: 'user_id,country_code'
    })

  if (error) {
    console.error('여행 일기 저장 실패:', error)
    return false
  }

  return true
}

// 여행 일기 삭제
export async function deleteTravelMemory(countryCode: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { error } = await supabase
    .from('travel_memories')
    .delete()
    .eq('user_id', user.id)
    .eq('country_code', countryCode)

  if (error) {
    console.error('여행 일기 삭제 실패:', error)
    return false
  }

  return true
}

