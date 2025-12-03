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
  description: '특강 계획서를 쉽고 빠르게 생성하고 관리하세요',
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
