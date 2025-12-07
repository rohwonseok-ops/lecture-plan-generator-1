import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-2xl p-8 backdrop-blur text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <FileQuestion className="w-8 h-8 text-amber-600" />
        </div>
        
        <h1 className="text-4xl font-bold text-zinc-900 mb-2">404</h1>
        <h2 className="text-lg font-semibold text-zinc-700 mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        
        <p className="text-sm text-zinc-600 mb-6">
          요청하신 페이지가 존재하지 않거나
          <br />
          이동되었을 수 있습니다.
        </p>
        
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            <Home className="w-4 h-4" />
            홈으로
          </Link>
          
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-semibold rounded-lg transition"
          >
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}

