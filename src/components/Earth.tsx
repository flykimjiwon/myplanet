"use client";

import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Country, latLngToVector3 } from '@/lib/countries';

interface EarthProps {
  visitedCountries: Map<string, number>;
  countries: Country[];
}

// NASA Blue Marble 스타일 실제 지구본 텍스처 사용
function useEarthTexture() {
  return useMemo(() => {
    const loader = new THREE.TextureLoader();
    
    // 여러 NASA Blue Marble 텍스처 옵션 시도
    const textureUrls = [
      // Three.js 공식 예제 (가장 안정적)
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
      // 대체 옵션들
      'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
      // NASA Blue Marble 스타일 (공개 도메인)
      'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg',
    ];

    // 대체 텍스처 생성 함수
    const createFallbackTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 4096;
      canvas.height = 2048;
      const ctx = canvas.getContext('2d')!;
      
      // 연한 바다 배경
      const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      oceanGradient.addColorStop(0, '#93c5fd');  // 매우 연한 파랑
      oceanGradient.addColorStop(0.3, '#bfdbfe'); // 더 연한 파랑
      oceanGradient.addColorStop(0.5, '#93c5fd'); // 연한 파랑
      oceanGradient.addColorStop(0.7, '#60a5fa'); // 중간 파랑
      oceanGradient.addColorStop(1, '#3b82f6');   // 약간 진한 파랑
      ctx.fillStyle = oceanGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 진한 대륙 색상
      const landColors = {
        forest: '#15803d',      // 진한 숲색
        grass: '#22c55e',        // 진한 초원색
        desert: '#d97706',       // 진한 사막색
        mountain: '#64748b',    // 진한 산색
      };
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // 위도/경도를 캔버스 좌표로 변환
      const toX = (lng: number) => ((lng + 180) / 360) * canvas.width;
      const toY = (lat: number) => ((90 - lat) / 180) * canvas.height;
      
      // 실제 대륙 모양 (더 정밀하게)
      // 북미 - 알래스카
      ctx.fillStyle = landColors.mountain;
      ctx.beginPath();
      ctx.moveTo(toX(-170), toY(70));
      ctx.bezierCurveTo(toX(-160), toY(72), toX(-150), toY(70), toX(-140), toY(68));
      ctx.bezierCurveTo(toX(-135), toY(65), toX(-130), toY(60), toX(-135), toY(55));
      ctx.bezierCurveTo(toX(-150), toY(55), toX(-165), toY(55), toX(-170), toY(60));
      ctx.closePath();
      ctx.fill();
      
      // 북미 - 캐나다 + 미국
      ctx.fillStyle = landColors.forest;
      ctx.beginPath();
      ctx.moveTo(toX(-130), toY(70));
      ctx.bezierCurveTo(toX(-100), toY(72), toX(-70), toY(70), toX(-60), toY(68));
      ctx.bezierCurveTo(toX(-55), toY(50), toX(-60), toY(45), toX(-70), toY(42));
      ctx.bezierCurveTo(toX(-80), toY(40), toX(-90), toY(35), toX(-100), toY(30));
      ctx.bezierCurveTo(toX(-110), toY(32), toX(-120), toY(35), toX(-125), toY(50));
      ctx.closePath();
      ctx.fill();
      
      // 그린란드
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(toX(-45), toY(83));
      ctx.bezierCurveTo(toX(-35), toY(83), toX(-25), toY(83), toX(-20), toY(83));
      ctx.bezierCurveTo(toX(-20), toY(70), toX(-30), toY(60), toX(-45), toY(60));
      ctx.closePath();
      ctx.fill();
      
      // 멕시코 + 중앙아메리카
      ctx.fillStyle = landColors.grass;
      ctx.beginPath();
      ctx.moveTo(toX(-115), toY(30));
      ctx.bezierCurveTo(toX(-100), toY(28), toX(-85), toY(25), toX(-80), toY(20));
      ctx.bezierCurveTo(toX(-80), toY(15), toX(-85), toY(12), toX(-90), toY(10));
      ctx.bezierCurveTo(toX(-100), toY(15), toX(-110), toY(20), toX(-115), toY(25));
      ctx.closePath();
      ctx.fill();
      
      // 남미
      ctx.fillStyle = landColors.forest;
      ctx.beginPath();
      ctx.moveTo(toX(-80), toY(10));
      ctx.bezierCurveTo(toX(-70), toY(5), toX(-60), toY(0), toX(-50), toY(-5));
      ctx.bezierCurveTo(toX(-45), toY(-10), toX(-40), toY(-15), toX(-40), toY(-20));
      ctx.bezierCurveTo(toX(-45), toY(-30), toX(-50), toY(-35), toX(-55), toY(-40));
      ctx.bezierCurveTo(toX(-65), toY(-50), toX(-70), toY(-55), toX(-75), toY(-45));
      ctx.bezierCurveTo(toX(-80), toY(-20), toX(-80), toY(0), toX(-80), toY(5));
      ctx.closePath();
      ctx.fill();
      
      // 유럽
      ctx.fillStyle = landColors.grass;
      ctx.beginPath();
      ctx.moveTo(toX(-10), toY(70));
      ctx.bezierCurveTo(toX(5), toY(72), toX(20), toY(70), toX(30), toY(68));
      ctx.bezierCurveTo(toX(35), toY(60), toX(30), toY(50), toX(20), toY(45));
      ctx.bezierCurveTo(toX(10), toY(40), toX(0), toY(40), toX(-5), toY(40));
      ctx.bezierCurveTo(toX(-10), toY(50), toX(-10), toY(60), toX(-10), toY(65));
      ctx.closePath();
      ctx.fill();
      
      // 스칸디나비아
      ctx.fillStyle = landColors.mountain;
      ctx.beginPath();
      ctx.moveTo(toX(5), toY(70));
      ctx.bezierCurveTo(toX(15), toY(72), toX(25), toY(70), toX(30), toY(68));
      ctx.bezierCurveTo(toX(25), toY(55), toX(15), toY(55), toX(10), toY(55));
      ctx.closePath();
      ctx.fill();
      
      // 영국/아일랜드
      ctx.fillStyle = landColors.grass;
      ctx.beginPath();
      ctx.arc(toX(-5), toY(55), 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(toX(-8), toY(54), 15, 0, Math.PI * 2);
      ctx.fill();
      
      // 이베리아 반도
      ctx.fillStyle = landColors.desert;
      ctx.beginPath();
      ctx.moveTo(toX(-10), toY(40));
      ctx.bezierCurveTo(toX(-5), toY(38), toX(0), toY(40), toX(5), toY(42));
      ctx.bezierCurveTo(toX(5), toY(35), toX(0), toY(33), toX(-5), toY(33));
      ctx.closePath();
      ctx.fill();
      
      // 이탈리아
      ctx.fillStyle = landColors.grass;
      ctx.beginPath();
      ctx.moveTo(toX(12), toY(45));
      ctx.bezierCurveTo(toX(15), toY(44), toX(18), toY(45), toX(20), toY(50));
      ctx.bezierCurveTo(toX(19), toY(38), toX(15), toY(36), toX(12), toY(38));
      ctx.closePath();
      ctx.fill();
      
      // 아프리카
      ctx.fillStyle = landColors.desert;
      ctx.beginPath();
      ctx.moveTo(toX(-15), toY(35));
      ctx.bezierCurveTo(toX(5), toY(37), toX(25), toY(35), toX(40), toY(33));
      ctx.bezierCurveTo(toX(45), toY(20), toX(40), toY(5), toX(35), toY(-10));
      ctx.bezierCurveTo(toX(30), toY(-20), toX(20), toY(-30), toX(15), toY(-35));
      ctx.bezierCurveTo(toX(5), toY(-10), toX(-10), toY(5), toX(-15), toY(15));
      ctx.closePath();
      ctx.fill();
      
      // 마다가스카르
      ctx.fillStyle = landColors.grass;
      ctx.beginPath();
      ctx.moveTo(toX(43), toY(12));
      ctx.bezierCurveTo(toX(48), toY(12), toX(50), toY(12), toX(50), toY(5));
      ctx.bezierCurveTo(toX(50), toY(-5), toX(48), toY(-12), toX(43), toY(-12));
      ctx.bezierCurveTo(toX(43), toY(-5), toX(43), toY(5), toX(43), toY(8));
      ctx.closePath();
      ctx.fill();
      
      // 아시아 - 러시아
      ctx.fillStyle = landColors.forest;
      ctx.beginPath();
      ctx.moveTo(toX(30), toY(75));
      ctx.bezierCurveTo(toX(60), toY(77), toX(100), toY(75), toX(140), toY(73));
      ctx.bezierCurveTo(toX(180), toY(70), toX(180), toY(50), toX(150), toY(45));
      ctx.bezierCurveTo(toX(120), toY(48), toX(90), toY(50), toX(50), toY(52));
      ctx.bezierCurveTo(toX(40), toY(60), toX(35), toY(70), toX(30), toY(72));
      ctx.closePath();
      ctx.fill();
      
      // 중동
      ctx.fillStyle = landColors.desert;
      ctx.beginPath();
      ctx.moveTo(toX(25), toY(40));
      ctx.bezierCurveTo(toX(35), toY(42), toX(45), toY(40), toX(55), toY(38));
      ctx.bezierCurveTo(toX(60), toY(28), toX(55), toY(18), toX(45), toY(15));
      ctx.bezierCurveTo(toX(35), toY(12), toX(30), toY(25), toX(25), toY(30));
      ctx.closePath();
      ctx.fill();
      
      // 인도
      ctx.fillStyle = landColors.grass;
      ctx.beginPath();
      ctx.moveTo(toX(65), toY(35));
      ctx.bezierCurveTo(toX(75), toY(36), toX(85), toY(35), toX(90), toY(34));
      ctx.bezierCurveTo(toX(88), toY(25), toX(82), toY(15), toX(75), toY(10));
      ctx.bezierCurveTo(toX(68), toY(12), toX(65), toY(20), toX(65), toY(28));
      ctx.closePath();
      ctx.fill();
      
      // 동아시아 (중국)
      ctx.fillStyle = landColors.grass;
      ctx.beginPath();
      ctx.moveTo(toX(75), toY(55));
      ctx.bezierCurveTo(toX(100), toY(56), toX(120), toY(55), toX(135), toY(54));
      ctx.bezierCurveTo(toX(130), toY(42), toX(120), toY(30), toX(105), toY(25));
      ctx.bezierCurveTo(toX(90), toY(22), toX(80), toY(30), toX(75), toY(40));
      ctx.closePath();
      ctx.fill();
      
      // 한반도
      ctx.fillStyle = landColors.grass;
      ctx.beginPath();
      ctx.moveTo(toX(124), toY(43));
      ctx.bezierCurveTo(toX(127), toY(42), toX(130), toY(43), toX(130), toY(40));
      ctx.bezierCurveTo(toX(130), toY(33), toX(127), toY(32), toX(124), toY(33));
      ctx.closePath();
      ctx.fill();
      
      // 일본
      ctx.fillStyle = landColors.forest;
      ctx.beginPath();
      ctx.moveTo(toX(130), toY(45));
      ctx.bezierCurveTo(toX(137), toY(44), toX(145), toY(45), toX(145), toY(40));
      ctx.bezierCurveTo(toX(145), toY(30), toX(137), toY(31), toX(130), toY(30));
      ctx.closePath();
      ctx.fill();
      
      // 동남아시아
      ctx.fillStyle = landColors.forest;
      ctx.beginPath();
      ctx.moveTo(toX(95), toY(25));
      ctx.bezierCurveTo(toX(105), toY(23), toX(110), toY(20), toX(110), toY(15));
      ctx.bezierCurveTo(toX(110), toY(0), toX(105), toY(-3), toX(100), toY(-5));
      ctx.bezierCurveTo(toX(95), toY(10), toX(95), toY(20), toX(95), toY(22));
      ctx.closePath();
      ctx.fill();
      
      // 인도네시아/말레이시아
      ctx.fillStyle = landColors.forest;
      ctx.beginPath();
      ctx.moveTo(toX(95), toY(8));
      ctx.bezierCurveTo(toX(120), toY(6), toX(140), toY(5), toX(140), toY(0));
      ctx.bezierCurveTo(toX(140), toY(-8), toX(120), toY(-7), toX(95), toY(-8));
      ctx.closePath();
      ctx.fill();
      
      // 필리핀
      ctx.fillStyle = landColors.grass;
      ctx.beginPath();
      ctx.arc(toX(122), toY(12), 25, 0, Math.PI * 2);
      ctx.fill();
      
      // 호주
      ctx.fillStyle = landColors.desert;
      ctx.beginPath();
      ctx.moveTo(toX(115), toY(-12));
      ctx.bezierCurveTo(toX(130), toY(-13), toX(145), toY(-12), toX(155), toY(-11));
      ctx.bezierCurveTo(toX(155), toY(-25), toX(145), toY(-38), toX(135), toY(-40));
      ctx.bezierCurveTo(toX(125), toY(-38), toX(115), toY(-25), toX(115), toY(-18));
      ctx.closePath();
      ctx.fill();
      
      // 뉴질랜드
      ctx.fillStyle = landColors.grass;
      ctx.beginPath();
      ctx.moveTo(toX(165), toY(-35));
      ctx.bezierCurveTo(toX(172), toY(-36), toX(180), toY(-35), toX(180), toY(-40));
      ctx.bezierCurveTo(toX(180), toY(-47), toX(172), toY(-48), toX(165), toY(-47));
      ctx.closePath();
      ctx.fill();
      
      // 남극
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(0, toY(-70));
      ctx.lineTo(canvas.width, toY(-70));
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();
      
      // 북극
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width, 0);
      ctx.lineTo(canvas.width, toY(80));
      ctx.lineTo(0, toY(80));
      ctx.closePath();
      ctx.fill();
      
      const fallbackTexture = new THREE.CanvasTexture(canvas);
      fallbackTexture.needsUpdate = true;
      return fallbackTexture;
    };

    // 첫 번째 URL로 텍스처 로드 시도
    const texture = loader.load(
      textureUrls[0],
      // 로드 성공
      (loadedTexture) => {
        loadedTexture.needsUpdate = true;
      },
      // 진행 중 (선택적)
      undefined,
      // 에러 발생 시 대체 텍스처 사용 (에러 콜백은 비동기이므로 여기서는 로그만)
      () => {
        console.log('텍스처 로드 실패, 대체 텍스처 사용');
      }
    );

    // 텍스처가 제대로 로드되었는지 확인하고, 실패 시 대체 텍스처 반환
    // TextureLoader는 에러가 발생해도 texture 객체를 반환하므로,
    // 이미지가 로드되지 않은 경우를 대비해 대체 텍스처를 기본값으로 사용
    return texture || createFallbackTexture();
  }, []);
}

// 개별 깃발 컴포넌트 (카메라 방향 확인)
function FlagMarker({ 
  country,
  visits,
  earthRadius
}: { 
  country: Country;
  visits: number;
  earthRadius: number;
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const pos = latLngToVector3(country.lat, country.lng);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
  // 지구 표면의 정확한 위치 (정규화된 방향 벡터)
  const direction = new THREE.Vector3(pos.x, pos.y, pos.z).normalize();
  // 살짝 띄워서 지구본 표면에서 클리핑되지 않게 함
  const surfacePosition = direction.multiplyScalar(earthRadius + 0.03);
  
  // 매 프레임마다 카메라 방향 확인
  useFrame(() => {
    if (!groupRef.current) return;
    
    // 깃발의 월드 위치 계산 (회전 적용)
    const flagWorldPosition = new THREE.Vector3();
    groupRef.current.getWorldPosition(flagWorldPosition);
    
    // 지구 중심 (0, 0, 0)에서 깃발로의 벡터 (정규화)
    const flagDirection = flagWorldPosition.clone().normalize();
    
    // 지구 중심에서 카메라로의 벡터 (정규화)
    const centerToCamera = camera.position.clone().normalize();
    
    // 깃발 방향과 카메라 방향의 내적 계산
    // 양수이면 깃발과 카메라가 같은 반구에 있음 (보임)
    // 음수이면 깃발이 카메라 반대편에 있음 (지구 뒤에 있음, 안 보임)
    const dotProduct = flagDirection.dot(centerToCamera);
    
    // 여유값을 늘려 가장자리에서도 보이도록 완화 (>-0.35)
    setIsVisible(dotProduct > -0.35 || Number.isNaN(dotProduct));
  });
  
  const hiddenStyle = isVisible ? undefined : { display: 'none' };
  
  return (
    <group ref={groupRef} position={[surfacePosition.x, surfacePosition.y, surfacePosition.z]} visible={isVisible}>
      {/* 국기 깃발 (이모지) - 지구본 위에 점 형식으로 직접 표시 */}
      <Html
        center
        distanceFactor={6}
        style={{ pointerEvents: 'auto', ...hiddenStyle }}
        transform
      >
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          style={{
            fontSize: `${24 + visits * 4}px`,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
            transform: 'translate(-50%, -50%)',
            userSelect: 'none',
            textShadow: '0 0 10px rgba(0,0,0,0.7)',
            lineHeight: '1',
            cursor: 'pointer',
          }}
        >
          {country.flag}
        </div>
      </Html>

      {/* 툴팁 */}
      {isHovered && isVisible && (
        <Html
          center
          distanceFactor={6}
          style={{ pointerEvents: 'none' }}
          transform
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-1.5 max-w-[10rem] border-2 border-blue-300"
            style={{
              transform: country.lat >= 0 
                ? 'translate(-50%, 20px)' // 북반구: 아래로
                : 'translate(-50%, -100%)', // 남반구: 위로
              marginTop: country.lat >= 0 ? '10px' : '-10px',
              pointerEvents: 'none',
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="text-sm">{country.flag}</span>
              <h3 className="font-bold text-xs text-gray-800">{country.name}</h3>
            </div>
            
            {country.attractions && country.attractions.length > 0 && (
              <div className="mb-1">
                <p className="text-[10px] font-semibold text-blue-600 mb-0.5">📍 주요 여행지</p>
                <ul className="text-[10px] text-gray-700 space-y-0.5">
                  {country.attractions.map((attraction, idx) => (
                    <li key={idx}>• {attraction}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {country.info && country.info.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-blue-600 mb-0.5">ℹ️ 국가 정보</p>
                <ul className="text-[10px] text-gray-700 space-y-0.5">
                  {country.info.map((info, idx) => (
                    <li key={idx}>• {info}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Html>
      )}

    </group>
  );
}

// 깃발 마커 컴포넌트 (점 형식으로 지구본 위에 직접 표시)
function FlagMarkers({ 
  countries, 
  visitedCountries 
}: { 
  countries: Country[]; 
  visitedCountries: Map<string, number> 
}) {
  const earthRadius = 2.5;
  
  return (
    <>
      {countries
        .filter((country) => visitedCountries.has(country.code))
        .map((country) => (
          <FlagMarker
            key={country.code}
            country={country}
            visits={visitedCountries.get(country.code) || 1}
            earthRadius={earthRadius}
          />
        ))}
    </>
  );
}

export default function Earth({ visitedCountries, countries }: EarthProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // 지구 전체 그룹 자동 회전 (깃발 포함)
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  const texture = useEarthTexture();

  return (
    <group>
      {/* 대기권 효과 (외부 글로우) - 회전하지 않음 */}
      <Sphere args={[2.65, 64, 64]}>
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* 회전하는 그룹 (지구본 + 깃발) */}
      <group ref={groupRef}>
        {/* 지구본 - 만화스러운 밝은 텍스처 */}
        <Sphere args={[2.5, 64, 64]}>
          <meshStandardMaterial
            map={texture}
            roughness={0.5}
            metalness={0.05}
            emissive="#1e3a8a"
            emissiveIntensity={0.1}
          />
        </Sphere>
        
        {/* 구름 레이어 (더 밝게) */}
        <Sphere args={[2.52, 64, 64]}>
          <meshStandardMaterial
            transparent
            opacity={0.15}
            color="#ffffff"
            roughness={1}
          />
        </Sphere>

        {/* 방문한 국가에 깃발 표시 */}
        <FlagMarkers 
          countries={countries}
          visitedCountries={visitedCountries}
        />
      </group>
    </group>
  );
}
