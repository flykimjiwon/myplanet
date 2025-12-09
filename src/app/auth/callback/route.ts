import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL에 'redirect_to' 파라미터가 있으면 그곳으로, 없으면 홈으로
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/'
  return NextResponse.redirect(`${origin}${redirectTo}`)
}

