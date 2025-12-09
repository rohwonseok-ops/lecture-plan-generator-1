'use client';

import dynamic from 'next/dynamic';

// 동적 임포트로 공유 페이지 재사용
const DesignAnalysisPage = dynamic(() => import('@/app/design/page'), { ssr: false });

export default function TemplateDesignAnalysisPage() {
  return <DesignAnalysisPage />;
}

