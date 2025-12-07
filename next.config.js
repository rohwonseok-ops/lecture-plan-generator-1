/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 이미지 최적화 설정
  images: {
    domains: [],
    // Vercel 배포 시 이미지 최적화 활성화
    unoptimized: false,
  },
  
  // 성능 최적화
  poweredByHeader: false, // X-Powered-By 헤더 제거 (보안)
  
  // 빌드 최적화
  compiler: {
    // 프로덕션에서 console.log 제거 (선택적)
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // 웹폰트 최적화
  optimizeFonts: true,
}

module.exports = nextConfig

