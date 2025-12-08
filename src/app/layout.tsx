import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// 제주고딕체 로컬 폰트
const jejuGothic = localFont({
  src: [
    {
      path: '../fonts/JejuGothicOTF.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-jeju-gothic',
  display: 'swap',
  fallback: ['sans-serif'],
});

export const metadata: Metadata = {
  title: '강의계획서 매니저 | Lecture Plan Generator',
  description: '특강 계획서를 쉽고 빠르게 생성하고 관리하세요. 다양한 템플릿과 색상 테마로 전문적인 강의계획서를 제작할 수 있습니다.',
  keywords: ['강의계획서', '특강', '학원', '교육', '계획서 생성기'],
  authors: [{ name: '원리와 해석 수학학원' }],
  robots: 'noindex, nofollow', // 내부 도구이므로 검색엔진 크롤링 방지
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={jejuGothic.variable}>
      <body className="bg-zinc-100 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
