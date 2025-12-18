'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { listActivityLogs } from '@/lib/repositories/activityLogs';
import type { Tables } from '@/lib/supabase.types';

type ActivityLogRow = Tables<'activity_logs'>;

export default function ActivityLogsPage() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [filter, setFilter] = useState('');

  const filteredLogs = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) => {
      const candidates = [
        log.action,
        log.detail ?? '',
        log.actor_name ?? '',
        log.actor_role ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return candidates.includes(term);
    });
  }, [filter, logs]);

  // zustand hydration
  useEffect(() => {
    const authPersist = useAuthStore.persist;
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
    fetchLogs();
  }, [hydrated, session, router]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await listActivityLogs(200);
      if (error) {
        const errorMsg = error.message || '활동 로그를 불러오지 못했습니다.';
        console.error('활동 로그 로드 실패:', error);
        setError(errorMsg);
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '활동 로그를 불러오는 중 오류가 발생했습니다.';
      console.error('활동 로그 로드 중 예외:', err);
      setError(errorMsg);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500">
        로그인 상태를 확인하는 중입니다...
      </div>
    );
  }

  if (session.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500">
        접근 권한이 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto py-10 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">활동 로그</h1>
            <p className="text-sm text-zinc-500">최근 200건의 활동 내역을 확인합니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="요청 ID/액션/상세 검색"
                className="w-52 text-sm px-3 py-1.5 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filter && (
                <button
                  onClick={() => setFilter('')}
                  className="text-xs text-zinc-500 hover:text-zinc-700"
                >
                  초기화
                </button>
              )}
            </div>
            <button
              onClick={fetchLogs}
              className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
            >
              새로고침
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition"
            >
              ← 메인으로
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-zinc-200 overflow-hidden">
          <div className="p-3 border-b border-zinc-200 flex items-center justify-between">
            <div className="text-sm text-zinc-600">
              {loading
                ? '불러오는 중...'
                : filter
                ? `총 ${filteredLogs.length}건 (전체 ${logs.length}건)`
                : `총 ${logs.length}건`}
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-700">
                <tr>
                  <th className="px-4 py-2 w-40">시간</th>
                  <th className="px-4 py-2 w-36">사용자</th>
                  <th className="px-4 py-2 w-24">역할</th>
                  <th className="px-4 py-2 w-32">액션</th>
                  <th className="px-4 py-2">상세</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                      표시할 로그가 없습니다.
                    </td>
                  </tr>
                )}
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-2 text-zinc-700">
                      {new Date(log.created_at).toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2 text-zinc-900 font-medium">
                      {log.actor_name || '알 수 없음'}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 rounded bg-zinc-100 text-zinc-700 text-xs font-semibold">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-800 font-semibold">{log.action}</td>
                    <td className="px-4 py-2 text-zinc-700 whitespace-pre-wrap leading-5">
                      {log.detail || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

