"use client";

import { useState, useEffect } from 'react';
import AIChatbot from './AIChatbot';
import { getVisitedCountries } from '@/lib/supabase/visitedCountries';

export default function AIRobotButton() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [visitedCountries, setVisitedCountries] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const loadVisitedCountries = async () => {
      const data = await getVisitedCountries();
      setVisitedCountries(data);
    };
    loadVisitedCountries();
  }, [isChatbotOpen]); // 챗봇이 열릴 때마다 최신 데이터 로드

  return (
    <>
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-4 right-4 z-[9998] w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 group"
        style={{
          background: 'linear-gradient(135deg, #5AA8E5 0%, #1F6FB8 50%, #163C69 100%)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 -4px 8px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
        }}
        aria-label="랜덤 여행지 추천 열기"
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 -4px 8px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.3)';
        }}
      >
        {/* 지구본 패턴 (대륙 모양) */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {/* 대륙 모양을 간단한 원과 타원으로 표현 */}
          <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-green-400 opacity-60"></div>
          <div className="absolute top-4 right-2 w-4 h-2 rounded-full bg-green-500 opacity-70"></div>
          <div className="absolute bottom-3 left-2 w-2 h-3 rounded-full bg-green-400 opacity-60"></div>
          <div className="absolute bottom-4 right-4 w-3 h-2 rounded-full bg-green-500 opacity-70"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-400 opacity-50"></div>
        </div>
        
        {/* 물음표 아이콘 */}
        <div className="relative z-10 flex items-center justify-center">
          <span 
            className="text-2xl font-bold drop-shadow-lg"
            style={{ 
              color: '#F8D348',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5), 0 0 8px rgba(248, 211, 72, 0.5)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
            }}
          >
            ?
          </span>
        </div>
        
        {/* 반짝이는 효과 */}
        <div 
          className="absolute top-1 left-1 w-3 h-3 rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
            boxShadow: '0 0 8px rgba(255,255,255,0.6)'
          }}
        ></div>
      </button>
      <AIChatbot 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)}
        visitedCountries={visitedCountries}
      />
    </>
  );
}

