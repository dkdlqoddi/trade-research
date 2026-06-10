import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 네이티브 모듈은 서버 번들에서 제외 (specs/001 design.md 결정 10)
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
