import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 타입 오류가 있어도 빌드 진행
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint 오류가 있어도 빌드 진행
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
