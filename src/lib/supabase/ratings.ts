import { createClient } from './client'

export interface CountryRating {
  country_code: string
  rating: number
  review: string | null
}

// 국가별 평점 가져오기
export async function getCountryRating(countryCode: string): Promise<CountryRating | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('country_ratings')
    .select('country_code, rating, review')
    .eq('user_id', user.id)
    .eq('country_code', countryCode)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // 데이터 없음
      return null
    }
    console.error('평점 조회 실패:', error)
    return null
  }

  return data
}

// 모든 평점 가져오기
export async function getAllRatings(): Promise<Map<string, CountryRating>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('country_ratings')
    .select('country_code, rating, review')
    .eq('user_id', user.id)

  if (error) {
    console.error('평점 조회 실패:', error)
    return new Map()
  }

  const map = new Map<string, CountryRating>()
  data?.forEach((item) => {
    map.set(item.country_code, {
      country_code: item.country_code,
      rating: item.rating,
      review: item.review,
    })
  })

  return map
}

// 국가별 평점 저장/업데이트
export async function saveCountryRating(
  countryCode: string,
  rating: number,
  review: string | null
): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { error } = await supabase
    .from('country_ratings')
    .upsert({
      user_id: user.id,
      country_code: countryCode,
      rating,
      review,
    }, {
      onConflict: 'user_id,country_code'
    })

  if (error) {
    console.error('평점 저장 실패:', error)
    return false
  }

  return true
}

// 국가별 평점 삭제
export async function deleteCountryRating(countryCode: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { error } = await supabase
    .from('country_ratings')
    .delete()
    .eq('user_id', user.id)
    .eq('country_code', countryCode)

  if (error) {
    console.error('평점 삭제 실패:', error)
    return false
  }

  return true
}

