'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { listTemplates, emptyTemplate, deleteTemplate } from '@/lib/repositories/templates';
import type { TemplateMeta } from '@/lib/types';

export default function TemplateListPage() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    fetchList();
  }, [hydrated, session, router]);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    const data = await listTemplates();
    setTemplates(data);
    setLoading(false);
  };

  const handleNew = () => {
    const tpl = emptyTemplate('새 템플릿');
    router.push(`/admin/templates/${tpl.id}?preset=default`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('템플릿을 삭제할까요?')) return;
    await deleteTemplate(id);
    fetchList();
  };

  if (!hydrated || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-zinc-500">
        로그인 상태를 확인하는 중입니다...
      </div>
    );
  }

  if (session.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-zinc-500">
        접근 권한이 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto py-6 px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">템플릿 관리</h1>
            <p className="text-xs text-zinc-500">커스텀 템플릿을 생성·편집·공식 등록합니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition"
            >
              강의계획서 관리로 이동
            </Link>
            <button
              onClick={fetchList}
              className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition"
            >
              새로고침
            </button>
            <button
              onClick={handleNew}
              className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              새 템플릿
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-zinc-200 p-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-zinc-500">불러오는 중...</div>
          ) : templates.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              템플릿이 없습니다. &quot;새 템플릿&quot;을 눌러 만들어보세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="border border-zinc-200 rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">{tpl.name}</h3>
                      <div className="text-[10px] text-zinc-500">
                        {tpl.category} · {tpl.status} · {new Date(tpl.updatedAt).toLocaleString('ko-KR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => router.push(`/admin/templates/${tpl.id}`)}
                        className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        편집
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        className="px-2 py-0.5 text-[10px] bg-white border border-zinc-200 rounded hover:bg-zinc-100 text-zinc-700"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="h-32 bg-zinc-100 rounded flex items-center justify-center text-zinc-400 text-xs">
                    {tpl.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tpl.thumbnailUrl}
                        alt={tpl.name}
                        className="h-full w-full object-cover rounded"
                      />
                    ) : (
                      '썸네일 없음'
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}

