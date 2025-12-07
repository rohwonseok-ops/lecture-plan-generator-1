'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { session, login } = useAuthStore();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const authPersist = (useAuthStore as any).persist;
    const unsub = authPersist?.onFinishHydration?.(() => setHydrated(true));
    setHydrated(authPersist?.hasHydrated?.() ?? false);
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) return;
    if (session.mustChangePassword) {
      router.replace('/login/change-password');
    } else {
      router.replace('/');
    }
  }, [hydrated, session, router]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const sanitized = password.replace(/\D/g, '').slice(-4);
    if (sanitized.length !== 4) {
      setError('숫자 4자리를 입력해주세요.');
      return;
    }
    const result = login(name, sanitized);
    if (result.ok) {
      if (result.requiresPasswordChange) {
        router.replace('/login/change-password');
      } else {
        router.replace('/');
      }
      return;
    }
    setError(result.message ?? '로그인에 실패했습니다.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-8 backdrop-blur">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">강의계획서 매니저</h1>
        <p className="text-sm text-zinc-600 mb-6">
          사전에 등록된 이름(ID)과 비밀번호(숫자 4자리)로 로그인하세요. 초기 비밀번호는 휴대폰 번호 뒷자리와 동일합니다.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-zinc-800 mb-1">이름 (ID)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예) 홍길동"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-800 mb-1">비밀번호 (숫자 4자리)</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]{4}"
                autoComplete="one-time-code"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="초기값: 휴대폰 뒷자리"
                style={{
                  WebkitTextSecurity: showPassword ? 'none' : 'disc',
                  fontFamily: showPassword ? undefined : 'system-ui, -apple-system, "Segoe UI", sans-serif',
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 p-1"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
          >
            로그인
          </button>
        </form>
        <div className="mt-4 text-xs text-zinc-500">
          관리자 계정이 필요하면 담당자에게 문의하세요. 회원가입 절차는 없습니다.
        </div>
      </div>
    </div>
  );
}

