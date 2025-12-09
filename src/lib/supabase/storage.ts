import { createClient } from './client'

const BUCKET_NAME = 'travel-photos'

// 이미지 업로드
export async function uploadPhoto(
  countryCode: string,
  file: File
): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // 파일 경로: {user_id}/{country_code}/photo.{확장자}
  const fileExt = file.name.split('.').pop()
  const fileName = `photo.${fileExt}`
  const filePath = `${user.id}/${countryCode}/${fileName}`

  // 기존 파일이 있으면 삭제
  await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  // 새 파일 업로드
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    console.error('이미지 업로드 실패:', error)
    return null
  }

  // 공개 URL 가져오기
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return publicUrl
}

// 이미지 삭제
export async function deletePhoto(countryCode: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const filePath = `${user.id}/${countryCode}/photo.*`

  // 와일드카드가 작동하지 않으므로, 폴더 내 모든 파일 삭제
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`${user.id}/${countryCode}`)

  if (listError) {
    console.error('파일 목록 조회 실패:', listError)
    return false
  }

  if (files && files.length > 0) {
    const filePaths = files.map(file => `${user.id}/${countryCode}/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths)

    if (deleteError) {
      console.error('이미지 삭제 실패:', deleteError)
      return false
    }
  }

  return true
}

// 이미지 URL 가져오기
export async function getPhotoUrl(countryCode: string): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // 파일 목록 조회
  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`${user.id}/${countryCode}`)

  if (error || !files || files.length === 0) {
    return null
  }

  // 첫 번째 이미지 파일 찾기
  const imageFile = files.find(file => 
    file.name.startsWith('photo.') && 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
  )

  if (!imageFile) {
    return null
  }

  const filePath = `${user.id}/${countryCode}/${imageFile.name}`
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return publicUrl
}

