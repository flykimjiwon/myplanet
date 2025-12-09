"use client";

import { Country } from '@/lib/countries';

interface FlatMapProps {
  visitedCountries: Map<string, number>;
  countries: Country[];
}

export default function FlatMap({ visitedCountries, countries }: FlatMapProps) {
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 overflow-hidden">
      {/* 평면 세계지도 배경 */}
      <svg
        viewBox="0 0 2000 1000"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))' }}
      >
        {/* 대륙 형태 (간단한 버전) */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 그리드 라인 */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * 50}
            x2="2000"
            y2={i * 50}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 40 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 50}
            y1="0"
            x2={i * 50}
            y2="1000"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* 대륙들 (추상화된 형태) */}
        {/* 아시아 */}
        <ellipse cx="1400" cy="400" rx="300" ry="200" fill="#22c55e" opacity="0.7" />
        
        {/* 유럽 */}
        <ellipse cx="1100" cy="350" rx="150" ry="100" fill="#22c55e" opacity="0.7" />
        
        {/* 아프리카 */}
        <ellipse cx="1100" cy="550" rx="120" ry="180" fill="#22c55e" opacity="0.7" />
        
        {/* 북미 */}
        <ellipse cx="400" cy="350" rx="200" ry="180" fill="#22c55e" opacity="0.7" />
        
        {/* 남미 */}
        <ellipse cx="500" cy="650" rx="100" ry="150" fill="#22c55e" opacity="0.7" />
        
        {/* 호주 */}
        <ellipse cx="1600" cy="700" rx="120" ry="80" fill="#22c55e" opacity="0.7" />

        {/* 방문한 국가 마커 */}
        {countries
          .filter((country) => visitedCountries.has(country.code))
          .map((country) => {
            // 위도/경도를 SVG 좌표로 변환
            const x = ((country.lng + 180) / 360) * 2000;
            const y = ((90 - country.lat) / 180) * 1000;
            const visits = visitedCountries.get(country.code) || 1;
            const size = 15 + visits * 3;

            return (
              <g key={country.code} transform={`translate(${x}, ${y})`}>
                {/* 글로우 효과 */}
                <circle
                  r={size + 10}
                  fill="#fbbf24"
                  opacity="0.3"
                  filter="url(#glow)"
                />
                
                {/* 깃발 기둥 */}
                <rect
                  x="-2"
                  y="-30"
                  width="4"
                  height="30"
                  fill="#fbbf24"
                />
                
                {/* 깃발 */}
                <path
                  d="M 0,-30 L 20,-25 L 0,-20 Z"
                  fill="#ef4444"
                />
                
                {/* 마커 점 */}
                <circle r={size} fill="#fbbf24" />
                <circle r={size - 3} fill="#fcd34d" />
                
                {/* 방문 횟수 텍스트 */}
                {visits > 1 && (
                  <>
                    <circle r="12" fill="#dc2626" cy="15" />
                    <text
                      y="20"
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {visits}
                    </text>
                  </>
                )}
                
                {/* 국가 이름 */}
                <text
                  y="35"
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                  {country.flag} {country.name}
                </text>
              </g>
            );
          })}
      </svg>

      {/* 타이틀 */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm px-6 py-3 rounded-full border border-yellow-500">
        <p className="text-yellow-400 text-lg font-bold">
          🗺️ 지구는 평평하다 모드
        </p>
        <p className="text-slate-300 text-xs text-center mt-1">
          ※ 과학적으로는 둥글지만, 마음만은 오늘 평평파가 되어봅시다
        </p>
      </div>
    </div>
  );
}



