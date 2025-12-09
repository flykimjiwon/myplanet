"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Earth from './Earth';
import { Country } from '@/lib/countries';

interface SceneProps {
  visitedCountries: Map<string, number>;
  countries: Country[];
}

export default function Scene({ visitedCountries, countries }: SceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        {/* 조명 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

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
          enableZoom={true}
          enablePan={true}
          minDistance={5}
          maxDistance={15}
          zoomSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}

