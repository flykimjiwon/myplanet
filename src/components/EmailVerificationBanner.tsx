"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EmailVerificationBanner() {
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && !session.user.email_confirmed_at) {
        setNeedsVerification(true);
      }
      setIsLoading(false);
    };

    checkVerification();

    // 세션 변경 감지
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && !session.user.email_confirmed_at) {
        setNeedsVerification(true);
      } else {
        setNeedsVerification(false);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  if (isLoading || !needsVerification) {
    return null;
  }

  return (
    <div className="px-4 py-2 rounded-lg text-xs font-semibold mb-2" style={{
      backgroundColor: '#FEE2E2',
      border: '2px solid #DC2626',
      color: '#DC2626',
    }}>
      ⚠️ 이메일 인증이 필요합니다. 이메일을 확인하여 인증을 완료해주세요.
    </div>
  );
}

