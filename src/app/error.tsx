'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (선택적으로 에러 추적 서비스에 전송)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-2xl p-8 backdrop-blur text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-xl font-bold text-zinc-900 mb-2">
          오류가 발생했습니다
        </h1>
        
        <p className="text-sm text-zinc-600 mb-6">
          페이지를 불러오는 중 문제가 발생했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>
        
        {error.digest && (
          <p className="text-xs text-zinc-400 mb-4 font-mono">
            오류 코드: {error.digest}
          </p>
        )}
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-semibold rounded-lg transition"
          >
            <Home className="w-4 h-4" />
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}

