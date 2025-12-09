"use client";

import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Earth from './Earth';
import { Country } from '@/lib/countries';

interface SceneProps {
  visitedCountries: Map<string, number>;
  countries: Country[];
  onSelectCountry?: (country: Country) => void;
}

export default function Scene({ visitedCountries, countries, onSelectCountry }: SceneProps) {
  const controlsRef = useRef<any>(null);
  const [cameraDistance, setCameraDistance] = useState(8);

  const handleZoomIn = () => {
    if (controlsRef.current && cameraDistance > 5) {
      const newDistance = Math.max(5, cameraDistance * 0.9);
      setCameraDistance(newDistance);
      if (controlsRef.current.object) {
        const direction = controlsRef.current.object.position.clone().normalize();
        controlsRef.current.object.position.copy(direction.multiplyScalar(newDistance));
      }
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current && cameraDistance < 15) {
      const newDistance = Math.min(15, cameraDistance * 1.1);
      setCameraDistance(newDistance);
      if (controlsRef.current.object) {
        const direction = controlsRef.current.object.position.clone().normalize();
        controlsRef.current.object.position.copy(direction.multiplyScalar(newDistance));
      }
    }
  };

  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, cameraDistance], fov: 45 }}>
        {/* 조명 - 더 밝게 */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -5]} intensity={0.8} />

        {/* 별 배경 */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        {/* 지구본 */}
        <Earth visitedCountries={visitedCountries} countries={countries} />

        {/* 컨트롤 */}
        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          enablePan={true}
          minDistance={5}
          maxDistance={15}
          zoomSpeed={0.5}
        />
      </Canvas>
      {/* 확대/축소 버튼 */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
          style={{
            backgroundColor: '#5AA8E5',
            border: '2px solid #1F6FB8',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1F6FB8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#5AA8E5';
          }}
        >
          <span className="text-xl font-bold" style={{ color: '#F8D348' }}>+</span>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95"
          style={{
            backgroundColor: '#5AA8E5',
            border: '2px solid #1F6FB8',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1F6FB8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#5AA8E5';
          }}
        >
          <span className="text-xl font-bold" style={{ color: '#F8D348' }}>−</span>
        </button>
      </div>
    </div>
  );
}

