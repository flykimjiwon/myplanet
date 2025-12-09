import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 타입 오류가 있어도 빌드 진행
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
