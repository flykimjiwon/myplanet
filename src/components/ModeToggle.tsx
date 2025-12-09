"use client";

interface ModeToggleProps {
  mode: 'globe' | 'flat';
  onToggle: () => void;
}

export default function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4 bg-slate-800 p-2 rounded-full border border-slate-700">
        <button
          onClick={() => mode === 'flat' && onToggle()}
          className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
            mode === 'globe'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-2xl">🌐</span>
          <span className="font-bold">지구는 둥글다</span>
        </button>
        
        <div className="w-px h-8 bg-slate-700" />
        
        <button
          onClick={() => mode === 'globe' && onToggle()}
          className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
            mode === 'flat'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-2xl">🗺️</span>
          <span className="font-bold">지구는 평평하다</span>
        </button>
      </div>
      
      {/* 설명 텍스트 */}
      <div className="text-center max-w-md">
        {mode === 'globe' ? (
          <p className="text-slate-400 text-sm">
            🌐 과학적으로 검증된 지구 모드입니다
          </p>
        ) : (
          <p className="text-yellow-400 text-sm">
            🗺️ 오늘만큼은 평평파 모드로 감상해볼까요?
          </p>
        )}
      </div>
    </div>
  );
}



