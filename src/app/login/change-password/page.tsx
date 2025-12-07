'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { session, changePassword } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authPersist = (useAuthStore as any).persist;
    const unsub = authPersist?.onFinishHydration?.(() => setHydrated(true));
    setHydrated(authPersist?.hasHydrated?.() ?? false);
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!session.mustChangePassword) {
      router.replace('/');
    }
  }, [hydrated, session, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const sanitized = password.replace(/\D/g, '').slice(0, 6);
    const sanitizedConfirm = confirm.replace(/\D/g, '').slice(0, 6);
    if (sanitized.length !== 6 || sanitizedConfirm.length !== 6) {
      setError('숫자 6자리를 입력해주세요.');
      return;
    }
    if (sanitized !== sanitizedConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    const result = await changePassword(session.userId, sanitized);
    if (!result.ok) {
      setError(result.message ?? '비밀번호 변경에 실패했습니다.');
      return;
    }
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-8 backdrop-blur">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">비밀번호 변경</h1>
        <p className="text-sm text-zinc-600 mb-6">
          초기 비밀번호는 000000입니다. 보안을 위해 새로운 숫자 6자리로 변경해주세요.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-zinc-800 mb-1">새 비밀번호 (숫자 6자리)</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="숫자 6자리"
                style={{
                  WebkitTextSecurity: showPassword ? 'none' : 'disc',
                  fontFamily: showPassword ? undefined : 'system-ui, -apple-system, "Segoe UI", sans-serif',
                } as CSSProperties & { WebkitTextSecurity?: string }}
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
            <p className="text-xs text-zinc-500 mt-1">초기 비밀번호(000000)와 다른 숫자 6자리로 변경하세요.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-800 mb-1">비밀번호 확인 (숫자 6자리)</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="다시 입력 (숫자 6자리)"
                style={{
                  WebkitTextSecurity: showConfirm ? 'none' : 'disc',
                  fontFamily: showConfirm ? undefined : 'system-ui, -apple-system, "Segoe UI", sans-serif',
                } as CSSProperties & { WebkitTextSecurity?: string }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 p-1"
                aria-label={showConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showConfirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
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
            변경하기
          </button>
        </form>
      </div>
    </div>
  );
}

