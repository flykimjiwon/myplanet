import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 관리자 여부 확인
function isAdmin(userEmail: string | undefined): boolean {
  if (!userEmail) return false;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  return adminEmails.includes(userEmail);
}

// 일일 추천 제한 횟수 가져오기
function getDailyLimit(userEmail: string | undefined): number {
  return isAdmin(userEmail) ? 100 : 100; // 일반 사용자도 100회
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { remainingCount: 0, dailyLimit: 100, requiresAuth: true },
        { status: 401 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayUsage, error: usageError } = await supabase
      .from('travel_recommendations')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const currentCount = todayUsage?.count || 0;
    const dailyLimit = getDailyLimit(user.email);
    const remainingCount = Math.max(0, dailyLimit - currentCount);

    return NextResponse.json({
      remainingCount,
      dailyLimit,
      usedCount: currentCount
    });

  } catch (error) {
    console.error('남은 횟수 조회 오류:', error);
    return NextResponse.json(
      { remainingCount: 100, dailyLimit: 100 },
      { status: 200 }
    );
  }
}
