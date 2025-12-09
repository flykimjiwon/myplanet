import { getUsers } from '../../actions'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const users = await getUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '사용자 목록을 불러올 수 없습니다.' },
      { status: 403 }
    )
  }
}

