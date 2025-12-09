"use client";

import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Country, latLngToVector3 } from '@/lib/countries';

// 애니메이션 스타일 지구 텍스처 생성 함수
function useEarthTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;
    
    // 바다 배경 - 그라디언트로 생동감 추가
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGradient.addColorStop(0, '#2563eb');  // 밝은 파랑
    oceanGradient.addColorStop(0.5, '#1e40af'); // 중간 파랑
    oceanGradient.addColorStop(1, '#1e3a8a');  // 어두운 파랑
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 물결 패턴 추가 (애니메이션 느낌)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 20) {
        const y = Math.sin(x * 0.01 + i) * 10 + i * 70;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    
    // 대륙 색상 - 밝고 생동감있게
    const landColor = '#10b981'; // 에메랄드 그린
    
    // 대륙에 그림자 효과 추가
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    // 아시아 (더 디테일하게)
    ctx.fillStyle = landColor;
    ctx.beginPath();
    ctx.ellipse(2800, 800, 450, 280, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3000, 650, 200, 150, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 인도
    ctx.beginPath();
    ctx.ellipse(2600, 950, 100, 120, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 유럽
    ctx.beginPath();
    ctx.ellipse(2200, 650, 200, 140, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 아프리카
    ctx.beginPath();
    ctx.ellipse(2200, 1000, 180, 280, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 북미
    ctx.beginPath();
    ctx.ellipse(800, 600, 300, 250, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(600, 850, 150, 200, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // 남미
    ctx.beginPath();
    ctx.ellipse(1000, 1300, 150, 250, 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // 호주
    ctx.beginPath();
    ctx.ellipse(3200, 1400, 180, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 남극 (하단)
    ctx.fillStyle = '#f0f9ff'; // 얼음색
    ctx.beginPath();
    ctx.ellipse(2048, 1950, 2048, 150, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 북극 (상단)
    ctx.beginPath();
    ctx.ellipse(2048, 100, 2048, 150, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 대륙에 하이라이트 추가 (애니메이션 느낌 강화)
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    
    // 각 대륙에 작은 하이라이트
    const highlights = [
      [2800, 750, 400, 250],
      [2200, 600, 180, 120],
      [2150, 950, 160, 250],
      [800, 550, 280, 220],
      [1000, 1250, 130, 220],
      [3200, 1360, 160, 100],
    ];
    
    highlights.forEach(([x, y, w, h]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, -0.2, 0, Math.PI * 2);
      ctx.fill();
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

interface EarthProps {
  visitedCountries: Map<string, number>;
  countries: Country[];
}

export default function Earth({ visitedCountries, countries }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  
  // 지구 자동 회전
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  const texture = useEarthTexture();

  return (
    <group>
      {/* 대기권 효과 (외부 글로우) */}
      <Sphere args={[2.65, 64, 64]}>
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* 지구본 */}
      <Sphere ref={earthRef} args={[2.5, 64, 64]}>
        <meshStandardMaterial
          map={texture}
          roughness={0.8}
          metalness={0.1}
        />
      </Sphere>
      
      {/* 구름 레이어 */}
      <Sphere args={[2.52, 64, 64]}>
        <meshStandardMaterial
          transparent
          opacity={0.3}
          color="#ffffff"
          roughness={1}
        />
      </Sphere>

      {/* 방문한 국가에 깃발 표시 */}
      {countries
        .filter((country) => visitedCountries.has(country.code))
        .map((country) => {
          const pos = latLngToVector3(country.lat, country.lng);
          const visits = visitedCountries.get(country.code) || 1;
          const scale = 1 + (visits - 1) * 0.2; // 방문 횟수에 따라 크기 증가
          
          return (
            <group key={country.code} position={[pos.x, pos.y, pos.z]} scale={scale}>
              {/* 깃발 기둥 */}
              <mesh>
                <cylinderGeometry args={[0.01, 0.01, 0.3, 8]} />
                <meshStandardMaterial color="#fbbf24" />
              </mesh>
              
              {/* 깃발 (스프라이트) */}
              <mesh position={[0, 0.2, 0]}>
                <planeGeometry args={[0.15, 0.1]} />
                <meshBasicMaterial
                  color="#ef4444"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.9}
                />
              </mesh>

              {/* 빛나는 점 */}
              <mesh>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshBasicMaterial color="#fbbf24" />
              </mesh>

              {/* 방문 횟수 표시 (2회 이상일 때) */}
              {visits > 1 && (
                <mesh position={[0.15, 0.2, 0]}>
                  <sphereGeometry args={[0.08, 16, 16]} />
                  <meshBasicMaterial color="#dc2626" />
                </mesh>
              )}

              {/* 광채 효과 */}
              <pointLight color="#fbbf24" intensity={1} distance={0.5} />
            </group>
          );
        })}
    </group>
  );
}

