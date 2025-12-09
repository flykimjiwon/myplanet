"use client";

interface ModeToggleProps {
  mode: 'globe' | 'flat' | 'board';
  onToggle: (newMode: 'globe' | 'flat' | 'board') => void;
}

export default function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center p-1.5 rounded-xl gap-1" style={{ 
        backgroundColor: '#5AA8E5', 
        border: '2px solid #1F6FB8',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => onToggle('globe')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 min-w-[100px] justify-center border-2 active:scale-95"
          style={mode === 'globe' ? {
            backgroundColor: '#F8D348',
            borderColor: '#F2B705',
            color: '#163C69',
            boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
          } : {
            backgroundColor: '#FFFFFF',
            borderColor: '#1F6FB8',
            color: '#163C69',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)'
          }}
          onMouseEnter={(e) => {
            if (mode !== 'globe') {
              e.currentTarget.style.backgroundColor = '#F7F9FA';
              e.currentTarget.style.borderColor = '#5AA8E5';
              e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.8)';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'globe') {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#1F6FB8';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)';
            }
          }}
        >
          <span className="text-base">🌐</span>
          <span className="font-semibold text-xs whitespace-nowrap">둥근</span>
        </button>
        
        <button
          onClick={() => onToggle('flat')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 min-w-[100px] justify-center border-2 active:scale-95"
          style={mode === 'flat' ? {
            backgroundColor: '#EA3E38',
            borderColor: '#D72C2A',
            color: '#FFFFFF',
            boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
          } : {
            backgroundColor: '#FFFFFF',
            borderColor: '#1F6FB8',
            color: '#163C69',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)'
          }}
          onMouseEnter={(e) => {
            if (mode !== 'flat') {
              e.currentTarget.style.backgroundColor = '#F7F9FA';
              e.currentTarget.style.borderColor = '#5AA8E5';
              e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.8)';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'flat') {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#1F6FB8';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)';
            }
          }}
        >
          <span className="text-base">🗺️</span>
          <span className="font-semibold text-xs whitespace-nowrap">평평</span>
        </button>

        <button
          onClick={() => onToggle('board')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 min-w-[100px] justify-center border-2 active:scale-95"
          style={mode === 'board' ? {
            backgroundColor: '#9ED4F5',
            borderColor: '#5AA8E5',
            color: '#163C69',
            boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -2px 2px rgba(0,0,0,0.1)'
          } : {
            backgroundColor: '#FFFFFF',
            borderColor: '#1F6FB8',
            color: '#163C69',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)'
          }}
          onMouseEnter={(e) => {
            if (mode !== 'board') {
              e.currentTarget.style.backgroundColor = '#F7F9FA';
              e.currentTarget.style.borderColor = '#5AA8E5';
              e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.8)';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'board') {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#1F6FB8';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)';
            }
          }}
        >
          <span className="text-base">🎲</span>
          <span className="font-semibold text-xs whitespace-nowrap">트래블마블</span>
        </button>
      </div>
      
      {/* 설명 텍스트 */}
      <div className="px-4 py-1.5 rounded-full border-2" style={{ 
        backgroundColor: '#1F6FB8', 
        borderColor: '#163C69',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)'
      }}>
        {mode === 'globe' ? (
          <p className="text-xs font-semibold" style={{ color: '#F8D348' }}>
            🌐 과학적으로 검증된 지구 모드
          </p>
        ) : mode === 'flat' ? (
          <p className="text-xs font-semibold" style={{ color: '#F8D348' }}>
            🗺️ 오늘만큼은 평평파 모드!
          </p>
        ) : (
          <p className="text-xs font-semibold" style={{ color: '#F8D348' }}>
            🎲 보드게임 스타일 트래블마블 모드!
          </p>
        )}
      </div>
    </div>
  );
}
