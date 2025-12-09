"use client";

import { useState, useEffect, useRef } from 'react';
import { Country } from '@/lib/countries';

interface FlatMapProps {
  visitedCountries: Map<string, number>;
  countries: Country[];
  onSelectCountry?: (country: Country) => void;
}

// 위도/경도를 SVG 좌표로 변환 (Equirectangular projection)
const toX = (lng: number) => ((lng + 180) / 360) * 2000;
const toY = (lat: number) => ((90 - lat) / 180) * 1000;

export default function FlatMap({ visitedCountries, countries, onSelectCountry }: FlatMapProps) {
  const [mapImageLoaded, setMapImageLoaded] = useState(false);
  const [useImageMap, setUseImageMap] = useState(true);

  // 실제 세계지도 이미지 로드 시도
  useEffect(() => {
    const img = new Image();
    const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg';
    
    img.onload = () => {
      setMapImageLoaded(true);
    };
    img.onerror = () => {
      setMapImageLoaded(false);
      setUseImageMap(false);
    };
    img.src = imageUrl;
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: '#FCECA3' }}>
      {/* 평면 세계지도 배경 */}
      <svg
        viewBox="0 0 2000 1000"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))' }}
      >
        <defs>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="50%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="landShadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* 바다 배경 */}
        <rect width="2000" height="1000" fill="url(#oceanGradient)" />

        {/* 실제 세계지도 이미지 사용 (로드 성공 시) */}
        {mapImageLoaded && useImageMap ? (
          <image
            href="https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg"
            x="0"
            y="0"
            width="2000"
            height="1000"
            preserveAspectRatio="xMidYMid meet"
            opacity="0.9"
          />
        ) : (
          /* 대체: 정밀한 SVG 경로로 그린 지도 */
          <g filter="url(#landShadow)">
            {/* 더 정밀한 대륙 좌표 사용 */}
            {/* 북미 - 알래스카 (더 정밀) */}
            <path
              d={`M ${toX(-170)} ${toY(70)} 
                 C ${toX(-165)} ${toY(71)} ${toX(-160)} ${toY(72)} ${toX(-155)} ${toY(71)}
                 C ${toX(-150)} ${toY(70)} ${toX(-145)} ${toY(69)} ${toX(-140)} ${toY(68)}
                 L ${toX(-135)} ${toY(65)}
                 L ${toX(-130)} ${toY(60)}
                 C ${toX(-132)} ${toY(58)} ${toX(-135)} ${toY(56)} ${toX(-140)} ${toY(55)}
                 L ${toX(-150)} ${toY(55)}
                 L ${toX(-160)} ${toY(56)}
                 L ${toX(-165)} ${toY(58)}
                 L ${toX(-170)} ${toY(62)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />
            
            {/* 북미 - 캐나다 + 미국 (더 정밀) */}
            <path
              d={`M ${toX(-130)} ${toY(70)}
                 C ${toX(-120)} ${toY(71)} ${toX(-110)} ${toY(71.5)} ${toX(-100)} ${toY(72)}
                 C ${toX(-90)} ${toY(72)} ${toX(-80)} ${toY(71.5)} ${toX(-70)} ${toY(71)}
                 C ${toX(-65)} ${toY(70)} ${toX(-60)} ${toY(69)} ${toX(-60)} ${toY(68)}
                 L ${toX(-58)} ${toY(65)}
                 L ${toX(-56)} ${toY(60)}
                 L ${toX(-55)} ${toY(55)}
                 L ${toX(-55)} ${toY(50)}
                 C ${toX(-57)} ${toY(47)} ${toX(-60)} ${toY(45)} ${toX(-65)} ${toY(43)}
                 C ${toX(-70)} ${toY(42)} ${toX(-75)} ${toY(41)} ${toX(-80)} ${toY(40)}
                 L ${toX(-85)} ${toY(38)}
                 L ${toX(-90)} ${toY(35)}
                 L ${toX(-95)} ${toY(33)}
                 L ${toX(-100)} ${toY(30)}
                 C ${toX(-105)} ${toY(32)} ${toX(-110)} ${toY(33.5)} ${toX(-115)} ${toY(34)}
                 L ${toX(-120)} ${toY(35)}
                 L ${toX(-125)} ${toY(40)}
                 L ${toX(-128)} ${toY(45)}
                 L ${toX(-130)} ${toY(50)}
                 L ${toX(-130)} ${toY(60)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 그린란드 (더 정밀) */}
            <path
              d={`M ${toX(-45)} ${toY(83)}
                 L ${toX(-35)} ${toY(83)}
                 L ${toX(-25)} ${toY(83)}
                 L ${toX(-20)} ${toY(83)}
                 L ${toX(-20)} ${toY(75)}
                 L ${toX(-22)} ${toY(70)}
                 L ${toX(-25)} ${toY(65)}
                 L ${toX(-30)} ${toY(62)}
                 L ${toX(-35)} ${toY(60)}
                 L ${toX(-40)} ${toY(60)}
                 L ${toX(-45)} ${toY(62)}
                 L ${toX(-45)} ${toY(70)}
                 Z`}
              fill="#e0f2fe"
              opacity="0.9"
            />

            {/* 멕시코 + 중앙아메리카 (더 정밀) */}
            <path
              d={`M ${toX(-115)} ${toY(30)}
                 C ${toX(-110)} ${toY(29)} ${toX(-105)} ${toY(28)} ${toX(-100)} ${toY(27)}
                 C ${toX(-95)} ${toY(26)} ${toX(-90)} ${toY(25.5)} ${toX(-85)} ${toY(25)}
                 L ${toX(-85)} ${toY(20)}
                 L ${toX(-85)} ${toY(15)}
                 C ${toX(-87)} ${toY(13)} ${toX(-88)} ${toY(11)} ${toX(-85)} ${toY(10)}
                 C ${toX(-90)} ${toY(12)} ${toX(-95)} ${toY(14)} ${toX(-100)} ${toY(16)}
                 L ${toX(-105)} ${toY(18)}
                 L ${toX(-110)} ${toY(22)}
                 L ${toX(-115)} ${toY(26)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 남미 (더 정밀) */}
            <path
              d={`M ${toX(-80)} ${toY(10)}
                 C ${toX(-75)} ${toY(8)} ${toX(-70)} ${toY(5)} ${toX(-65)} ${toY(2)}
                 C ${toX(-60)} ${toY(0)} ${toX(-55)} ${toY(-2)} ${toX(-50)} ${toY(-5)}
                 L ${toX(-48)} ${toY(-8)}
                 L ${toX(-45)} ${toY(-12)}
                 L ${toX(-42)} ${toY(-15)}
                 L ${toX(-40)} ${toY(-18)}
                 C ${toX(-42)} ${toY(-22)} ${toX(-45)} ${toY(-25)} ${toX(-48)} ${toY(-28)}
                 C ${toX(-50)} ${toY(-30)} ${toX(-52)} ${toY(-32)} ${toX(-55)} ${toY(-35)}
                 L ${toX(-58)} ${toY(-38)}
                 L ${toX(-62)} ${toY(-42)}
                 L ${toX(-65)} ${toY(-45)}
                 L ${toX(-70)} ${toY(-50)}
                 L ${toX(-72)} ${toY(-52)}
                 L ${toX(-75)} ${toY(-48)}
                 L ${toX(-78)} ${toY(-40)}
                 L ${toX(-80)} ${toY(-30)}
                 L ${toX(-80)} ${toY(-20)}
                 L ${toX(-80)} ${toY(-10)}
                 L ${toX(-80)} ${toY(0)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 유럽 (더 정밀) */}
            <path
              d={`M ${toX(-10)} ${toY(70)}
                 C ${toX(-5)} ${toY(71)} ${toX(0)} ${toY(71.5)} ${toX(5)} ${toY(72)}
                 C ${toX(10)} ${toY(72)} ${toX(15)} ${toY(71.5)} ${toX(20)} ${toY(71)}
                 C ${toX(25)} ${toY(70)} ${toX(28)} ${toY(69)} ${toX(30)} ${toY(68)}
                 L ${toX(32)} ${toY(65)}
                 L ${toX(35)} ${toY(60)}
                 C ${toX(33)} ${toY(55)} ${toX(30)} ${toY(50)} ${toX(25)} ${toY(47)}
                 C ${toX(20)} ${toY(45)} ${toX(15)} ${toY(43)} ${toX(10)} ${toY(42)}
                 L ${toX(5)} ${toY(41)}
                 L ${toX(0)} ${toY(40)}
                 L ${toX(-5)} ${toY(40)}
                 L ${toX(-8)} ${toY(42)}
                 L ${toX(-10)} ${toY(45)}
                 L ${toX(-10)} ${toY(50)}
                 L ${toX(-10)} ${toY(60)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 스칸디나비아 (더 정밀) */}
            <path
              d={`M ${toX(5)} ${toY(70)}
                 C ${toX(10)} ${toY(71)} ${toX(15)} ${toY(71.5)} ${toX(20)} ${toY(72)}
                 C ${toX(25)} ${toY(71.5)} ${toX(28)} ${toY(70)} ${toX(30)} ${toY(68)}
                 L ${toX(28)} ${toY(65)}
                 L ${toX(25)} ${toY(60)}
                 L ${toX(20)} ${toY(58)}
                 L ${toX(15)} ${toY(57)}
                 L ${toX(10)} ${toY(56)}
                 L ${toX(5)} ${toY(58)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 영국/아일랜드 */}
            <circle cx={toX(-5)} cy={toY(55)} r="25" fill="#22c55e" opacity="0.85" />
            <circle cx={toX(-8)} cy={toY(54)} r="15" fill="#22c55e" opacity="0.85" />

            {/* 이베리아 반도 */}
            <path
              d={`M ${toX(-10)} ${toY(40)}
                 C ${toX(-7)} ${toY(39)} ${toX(-3)} ${toY(39.5)} ${toX(0)} ${toY(40)}
                 L ${toX(3)} ${toY(40.5)}
                 L ${toX(5)} ${toY(42)}
                 L ${toX(5)} ${toY(38)}
                 L ${toX(3)} ${toY(36)}
                 L ${toX(0)} ${toY(35)}
                 L ${toX(-5)} ${toY(34)}
                 L ${toX(-8)} ${toY(36)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 이탈리아 */}
            <path
              d={`M ${toX(12)} ${toY(45)}
                 C ${toX(14)} ${toY(44.5)} ${toX(16)} ${toY(44.5)} ${toX(18)} ${toY(45)}
                 L ${toX(19)} ${toY(47)}
                 L ${toX(20)} ${toY(50)}
                 L ${toX(19.5)} ${toY(45)}
                 L ${toX(19)} ${toY(40)}
                 L ${toX(17)} ${toY(38)}
                 L ${toX(15)} ${toY(36)}
                 L ${toX(13)} ${toY(37)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 아프리카 (더 정밀) */}
            <path
              d={`M ${toX(-15)} ${toY(35)}
                 C ${toX(-10)} ${toY(36)} ${toX(-5)} ${toY(36.5)} ${toX(0)} ${toY(37)}
                 C ${toX(5)} ${toY(37)} ${toX(10)} ${toY(36.5)} ${toX(15)} ${toY(36)}
                 C ${toX(20)} ${toY(35.5)} ${toX(25)} ${toY(35)} ${toX(30)} ${toY(34.5)}
                 C ${toX(35)} ${toY(34)} ${toX(38)} ${toY(33.5)} ${toX(40)} ${toY(33)}
                 L ${toX(42)} ${toY(30)}
                 L ${toX(44)} ${toY(25)}
                 L ${toX(45)} ${toY(20)}
                 C ${toX(44)} ${toY(15)} ${toX(42)} ${toY(10)} ${toX(40)} ${toY(5)}
                 C ${toX(38)} ${toY(0)} ${toX(35)} ${toY(-5)} ${toX(32)} ${toY(-10)}
                 C ${toX(30)} ${toY(-15)} ${toX(25)} ${toY(-20)} ${toX(20)} ${toY(-25)}
                 L ${toX(15)} ${toY(-30)}
                 L ${toX(10)} ${toY(-33)}
                 L ${toX(5)} ${toY(-35)}
                 L ${toX(0)} ${toY(-30)}
                 L ${toX(-5)} ${toY(-20)}
                 L ${toX(-10)} ${toY(-10)}
                 L ${toX(-12)} ${toY(0)}
                 L ${toX(-15)} ${toY(10)}
                 L ${toX(-15)} ${toY(20)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 마다가스카르 */}
            <path
              d={`M ${toX(43)} ${toY(12)}
                 L ${toX(46)} ${toY(12)}
                 L ${toX(50)} ${toY(12)}
                 L ${toX(50)} ${toY(5)}
                 L ${toX(50)} ${toY(0)}
                 L ${toX(50)} ${toY(-5)}
                 L ${toX(50)} ${toY(-12)}
                 L ${toX(46)} ${toY(-12)}
                 L ${toX(43)} ${toY(-12)}
                 L ${toX(43)} ${toY(-5)}
                 L ${toX(43)} ${toY(0)}
                 L ${toX(43)} ${toY(5)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 아시아 - 러시아 (더 정밀) */}
            <path
              d={`M ${toX(30)} ${toY(75)}
                 C ${toX(40)} ${toY(76)} ${toX(50)} ${toY(76.5)} ${toX(60)} ${toY(77)}
                 C ${toX(70)} ${toY(76.5)} ${toX(80)} ${toY(76)} ${toX(90)} ${toY(75.5)}
                 C ${toX(100)} ${toY(75)} ${toX(110)} ${toY(74.5)} ${toX(120)} ${toY(74)}
                 C ${toX(130)} ${toY(73.5)} ${toX(140)} ${toY(73)} ${toX(150)} ${toY(72.5)}
                 C ${toX(160)} ${toY(72)} ${toX(170)} ${toY(71)} ${toX(180)} ${toY(70)}
                 L ${toX(180)} ${toY(65)}
                 L ${toX(180)} ${toY(60)}
                 L ${toX(180)} ${toY(55)}
                 L ${toX(180)} ${toY(50)}
                 C ${toX(170)} ${toY(48)} ${toX(160)} ${toY(46)} ${toX(150)} ${toY(45)}
                 C ${toX(140)} ${toY(46)} ${toX(130)} ${toY(47)} ${toX(120)} ${toY(48)}
                 C ${toX(110)} ${toY(49)} ${toX(100)} ${toY(49.5)} ${toX(90)} ${toY(50)}
                 C ${toX(80)} ${toY(50.5)} ${toX(70)} ${toY(51)} ${toX(60)} ${toY(51.5)}
                 L ${toX(50)} ${toY(52)}
                 L ${toX(45)} ${toY(55)}
                 L ${toX(40)} ${toY(60)}
                 L ${toX(35)} ${toY(65)}
                 L ${toX(32)} ${toY(70)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 중동 (더 정밀) */}
            <path
              d={`M ${toX(25)} ${toY(40)}
                 C ${toX(30)} ${toY(41)} ${toX(35)} ${toY(41.5)} ${toX(40)} ${toY(42)}
                 C ${toX(45)} ${toY(41.5)} ${toX(50)} ${toY(41)} ${toX(55)} ${toY(40)}
                 L ${toX(58)} ${toY(38)}
                 L ${toX(60)} ${toY(35)}
                 L ${toX(60)} ${toY(30)}
                 L ${toX(60)} ${toY(28)}
                 C ${toX(58)} ${toY(25)} ${toX(55)} ${toY(22)} ${toX(52)} ${toY(20)}
                 C ${toX(50)} ${toY(18)} ${toX(47)} ${toY(16)} ${toX(45)} ${toY(15)}
                 C ${toX(42)} ${toY(14)} ${toX(38)} ${toY(13)} ${toX(35)} ${toY(12)}
                 L ${toX(32)} ${toY(15)}
                 L ${toX(30)} ${toY(20)}
                 L ${toX(28)} ${toY(25)}
                 L ${toX(25)} ${toY(30)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 인도 (더 정밀) */}
            <path
              d={`M ${toX(65)} ${toY(35)}
                 C ${toX(70)} ${toY(35.5)} ${toX(75)} ${toY(36)} ${toX(80)} ${toY(36)}
                 C ${toX(83)} ${toY(35.5)} ${toX(85)} ${toY(35)} ${toX(88)} ${toY(34.5)}
                 L ${toX(90)} ${toY(34)}
                 L ${toX(89)} ${toY(30)}
                 L ${toX(88)} ${toY(25)}
                 C ${toX(86)} ${toY(20)} ${toX(83)} ${toY(15)} ${toX(80)} ${toY(12)}
                 C ${toX(77)} ${toY(10)} ${toX(75)} ${toY(10)} ${toX(72)} ${toY(11)}
                 L ${toX(68)} ${toY(12)}
                 L ${toX(66)} ${toY(15)}
                 L ${toX(65)} ${toY(20)}
                 L ${toX(65)} ${toY(25)}
                 L ${toX(65)} ${toY(30)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 동아시아 (중국) - 더 정밀 */}
            <path
              d={`M ${toX(75)} ${toY(55)}
                 C ${toX(85)} ${toY(55.5)} ${toX(95)} ${toY(56)} ${toX(105)} ${toY(56)}
                 C ${toX(115)} ${toY(55.5)} ${toX(120)} ${toY(55)} ${toX(125)} ${toY(54.5)}
                 L ${toX(130)} ${toY(54)}
                 L ${toX(132)} ${toY(50)}
                 L ${toX(130)} ${toY(45)}
                 L ${toX(130)} ${toY(42)}
                 C ${toX(125)} ${toY(38)} ${toX(120)} ${toY(35)} ${toX(115)} ${toY(32)}
                 C ${toX(110)} ${toY(30)} ${toX(105)} ${toY(28)} ${toX(100)} ${toY(26)}
                 L ${toX(95)} ${toY(24)}
                 L ${toX(90)} ${toY(22)}
                 L ${toX(85)} ${toY(25)}
                 L ${toX(80)} ${toY(30)}
                 L ${toX(77)} ${toY(35)}
                 L ${toX(75)} ${toY(40)}
                 L ${toX(75)} ${toY(45)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 한반도 */}
            <path
              d={`M ${toX(124)} ${toY(43)}
                 C ${toX(126)} ${toY(42.5)} ${toX(128)} ${toY(42.5)} ${toX(130)} ${toY(43)}
                 L ${toX(130)} ${toY(40)}
                 L ${toX(130)} ${toY(37)}
                 L ${toX(130)} ${toY(33)}
                 C ${toX(128)} ${toY(32.5)} ${toX(126)} ${toY(32.5)} ${toX(124)} ${toY(33)}
                 L ${toX(124)} ${toY(36)}
                 L ${toX(124)} ${toY(40)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 일본 */}
            <path
              d={`M ${toX(130)} ${toY(45)}
                 C ${toX(133)} ${toY(44.5)} ${toX(137)} ${toY(44.5)} ${toX(140)} ${toY(45)}
                 L ${toX(143)} ${toY(45)}
                 L ${toX(145)} ${toY(45)}
                 L ${toX(145)} ${toY(42)}
                 L ${toX(145)} ${toY(38)}
                 L ${toX(145)} ${toY(35)}
                 L ${toX(145)} ${toY(30)}
                 C ${toX(140)} ${toY(31)} ${toX(137)} ${toY(31.5)} ${toX(133)} ${toY(31)}
                 L ${toX(130)} ${toY(30)}
                 L ${toX(130)} ${toY(35)}
                 L ${toX(130)} ${toY(40)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 동남아시아 (더 정밀) */}
            <path
              d={`M ${toX(95)} ${toY(25)}
                 C ${toX(100)} ${toY(24)} ${toX(105)} ${toY(23)} ${toX(108)} ${toY(22)}
                 L ${toX(110)} ${toY(20)}
                 L ${toX(110)} ${toY(15)}
                 L ${toX(110)} ${toY(10)}
                 L ${toX(110)} ${toY(5)}
                 L ${toX(110)} ${toY(0)}
                 C ${toX(108)} ${toY(-2)} ${toX(105)} ${toY(-3)} ${toX(102)} ${toY(-4)}
                 L ${toX(100)} ${toY(-5)}
                 L ${toX(98)} ${toY(-3)}
                 L ${toX(95)} ${toY(0)}
                 L ${toX(95)} ${toY(10)}
                 L ${toX(95)} ${toY(20)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 인도네시아/말레이시아 (더 정밀) */}
            <path
              d={`M ${toX(95)} ${toY(8)}
                 C ${toX(105)} ${toY(7)} ${toX(115)} ${toY(6.5)} ${toX(125)} ${toY(6)}
                 C ${toX(135)} ${toY(5.5)} ${toX(140)} ${toY(5)} ${toX(140)} ${toY(2)}
                 L ${toX(140)} ${toY(0)}
                 L ${toX(140)} ${toY(-2)}
                 L ${toX(140)} ${toY(-5)}
                 L ${toX(140)} ${toY(-8)}
                 C ${toX(130)} ${toY(-7.5)} ${toX(120)} ${toY(-7)} ${toX(110)} ${toY(-7.5)}
                 L ${toX(100)} ${toY(-8)}
                 L ${toX(95)} ${toY(-8)}
                 L ${toX(95)} ${toY(-5)}
                 L ${toX(95)} ${toY(-2)}
                 L ${toX(95)} ${toY(0)}
                 L ${toX(95)} ${toY(4)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 필리핀 */}
            <circle cx={toX(122)} cy={toY(12)} r="25" fill="#22c55e" opacity="0.85" />

            {/* 호주 (더 정밀) */}
            <path
              d={`M ${toX(115)} ${toY(-12)}
                 C ${toX(120)} ${toY(-12.5)} ${toX(125)} ${toY(-13)} ${toX(130)} ${toY(-13)}
                 C ${toX(135)} ${toY(-12.5)} ${toX(140)} ${toY(-12)} ${toX(145)} ${toY(-12)}
                 L ${toX(150)} ${toY(-11.5)}
                 L ${toX(155)} ${toY(-11)}
                 L ${toX(155)} ${toY(-15)}
                 L ${toX(155)} ${toY(-20)}
                 L ${toX(155)} ${toY(-25)}
                 L ${toX(155)} ${toY(-30)}
                 L ${toX(155)} ${toY(-35)}
                 C ${toX(150)} ${toY(-37)} ${toX(145)} ${toY(-38)} ${toX(140)} ${toY(-39)}
                 L ${toX(135)} ${toY(-40)}
                 L ${toX(130)} ${toY(-39.5)}
                 L ${toX(125)} ${toY(-39)}
                 L ${toX(120)} ${toY(-38)}
                 L ${toX(118)} ${toY(-35)}
                 L ${toX(116)} ${toY(-30)}
                 L ${toX(115)} ${toY(-25)}
                 L ${toX(115)} ${toY(-20)}
                 L ${toX(115)} ${toY(-15)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 뉴질랜드 */}
            <path
              d={`M ${toX(165)} ${toY(-35)}
                 C ${toX(168)} ${toY(-35.5)} ${toX(172)} ${toY(-36)} ${toX(175)} ${toY(-36)}
                 L ${toX(180)} ${toY(-35)}
                 L ${toX(180)} ${toY(-38)}
                 L ${toX(180)} ${toY(-42)}
                 L ${toX(180)} ${toY(-47)}
                 C ${toX(175)} ${toY(-48)} ${toX(172)} ${toY(-48)} ${toX(168)} ${toY(-47.5)}
                 L ${toX(165)} ${toY(-47)}
                 L ${toX(165)} ${toY(-42)}
                 L ${toX(165)} ${toY(-38)}
                 Z`}
              fill="#22c55e"
              opacity="0.85"
            />

            {/* 남극 */}
            <path
              d={`M 0 ${toY(-70)}
                 L 2000 ${toY(-70)}
                 L 2000 1000
                 L 0 1000
                 Z`}
              fill="#e0f2fe"
              opacity="0.7"
            />

            {/* 북극 */}
            <path
              d={`M 0 0
                 L 2000 0
                 L 2000 ${toY(80)}
                 L 0 ${toY(80)}
                 Z`}
              fill="#e0f2fe"
              opacity="0.7"
            />
          </g>
        )}


        {/* 방문한 국가 마커 */}
        {countries
          .filter((country) => visitedCountries.has(country.code))
          .map((country) => {
            const x = toX(country.lng);
            const y = toY(country.lat);
            const visits = visitedCountries.get(country.code) || 1;
            const flagSize = 32 + visits * 5; // 국기 크기 증가
            const markerSize = 6 + visits; // 노란색 마커 크기 감소

            return (
              <g key={country.code} transform={`translate(${x}, ${y})`}>
                {/* 글로우 효과 (작게) */}
                <circle
                  r={markerSize + 4}
                  fill="#fbbf24"
                  opacity="0.2"
                  filter="url(#glow)"
                />
                
                {/* 깃발 기둥 (작게) */}
                <rect
                  x="-1"
                  y="-18"
                  width="2"
                  height="18"
                  fill="#fbbf24"
                  rx="0.5"
                  opacity="0.8"
                />
                
                {/* 국기 깃발 (이모지) - 크게 */}
                <text
                  x="8"
                  y="-10"
                  textAnchor="middle"
                  fontSize={flagSize}
                  dominantBaseline="middle"
                  style={{ 
                    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
                    textShadow: '0 0 8px rgba(0,0,0,0.6)',
                  }}
                >
                  {country.flag}
                </text>
                
                {/* 마커 점 (작게) */}
                <circle r={markerSize} fill="#fbbf24" opacity="0.9" />
                <circle r={markerSize - 1} fill="#fcd34d" opacity="0.9" />
                
                {/* 방문 횟수 텍스트 */}
                <circle r="8" fill="#dc2626" cx="8" cy="8" />
                <text
                  x="8"
                  y="12"
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {visits}
                </text>
                
                {/* 국가 이름 */}
                <text
                  y="28"
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="bold"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  {country.name}
                </text>
              </g>
            );
          })}
      </svg>


      {/* 타이틀 */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg" style={{ backgroundColor: '#5AA8E5', border: '2px solid #1F6FB8' }}>
        <p className="text-sm md:text-lg font-bold" style={{ color: '#F8D348' }}>
          🗺️ 평평한 지구 모드
        </p>
      </div>
    </div>
  );
}
