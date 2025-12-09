"use client";

import { useState } from 'react';
import AIChatbot from './AIChatbot';

export default function AIRobotButton() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-4 left-4 z-40 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        style={{ opacity: 0.9 }}
        aria-label="AI 여행지 추천 챗봇 열기"
      >
        <span className="text-3xl">🤖</span>
      </button>
      <AIChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </>
  );
}

