'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '@/store/authStore';
import { supabase } from '@/lib/supabaseClient';
import type { Tables } from '@/lib/supabase.types';

type ProfileRow = Tables<'profiles'>;

const emptyForm = {
  id: '',
  name: '',
  role: 'user' as UserRole,
  active: true,
};

export default function AccountManagementPage() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
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
    if (session.role !== 'admin') {
      router.replace('/');
      return;
    }
    fetchProfiles();
  }, [hydrated, session, router]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch('/api/admin/users', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      setError('프로필 목록을 불러오지 못했습니다.');
      setLoading(false);
      return;
    }
    const json = await res.json();
    setProfiles(json.data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/users', {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        id: form.id || undefined,
        name: form.name,
        role: form.role,
        active: form.active,
        mustChangePassword: true,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || '저장에 실패했습니다.');
      return;
    }

    setMessage(form.id ? '사용자 정보를 수정했습니다.' : '새 사용자를 추가했습니다.');
    resetForm();
    fetchProfiles();
  };

  const onEdit = (user: ProfileRow) => {
    setForm({
      id: user.id,
      name: user.name,
      role: user.role as UserRole,
      active: user.active,
    });
    setMessage(null);
  };

  const toggleActive = async (user: ProfileRow) => {
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        id: user.id,
        active: !user.active,
      }),
    });
    if (!res.ok) {
      setError('상태 변경에 실패했습니다.');
      return;
    }
    fetchProfiles();
  };

  const sortedUsers = useMemo(
    () => [...profiles].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [profiles]
  );

  if (!hydrated || !session || session.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500">
        접근 권한을 확인하는 중입니다...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto py-10 px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">계정 관리</h1>
            <p className="text-sm text-zinc-500">이름을 ID로 사용하며, 모든 신규 계정의 초기 비밀번호는 000000입니다.</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← 메인으로
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow border border-zinc-200 p-5">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              {form.id ? '사용자 수정' : '새 사용자 추가'}
            </h2>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">이름 (ID)</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예) 홍길동"
                  required
                />
              </div>
              {/* 휴대폰 뒷자리 필드를 제거하고 초기 비밀번호 정책만 안내 */}
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">초기 비밀번호</label>
                <div className="text-sm text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-2">
                  모든 신규 계정은 <span className="font-semibold text-blue-700">000000</span> 으로 생성되며, 첫 로그인 시 숫자 6자리로 변경합니다.
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">권한</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">일반유저</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              {form.id && (
                <div className="flex items-center space-x-2">
                  <input
                    id="active"
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="text-sm text-zinc-700">활성화</label>
                </div>
              )}
              {message && (
                <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  {message}
                </div>
              )}
              {error && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                  disabled={loading}
                >
                  {form.id ? '정보 수정' : '계정 생성'}
                </button>
                {form.id && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-2 text-sm text-zinc-600 hover:text-zinc-800"
                  >
                    새로 만들기
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow border border-zinc-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">등록된 사용자</h2>
              <span className="text-xs text-zinc-500">총 {profiles.length}명</span>
            </div>
            {loading ? (
              <div className="text-sm text-zinc-500">불러오는 중...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500">
                      <th className="px-2 py-2">이름(ID)</th>
                      <th className="px-2 py-2">권한</th>
                      <th className="px-2 py-2">상태</th>
                      <th className="px-2 py-2">수정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user) => (
                      <tr key={user.id} className="border-t border-zinc-100">
                        <td className="px-2 py-2">{user.name}</td>
                        <td className="px-2 py-2">
                          <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                            user.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {user.role === 'admin' ? '관리자' : '일반'}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => toggleActive(user)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                              user.active
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                            }`}
                          >
                            {user.active ? '활성' : '비활성'}
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => onEdit(user)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                          >
                            편집
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sortedUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-zinc-400 py-6">
                          등록된 사용자가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

