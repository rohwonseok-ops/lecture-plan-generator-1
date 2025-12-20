'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { listDeletedClassPlans, restoreClassPlan, permanentlyDeleteClassPlan, emptyTrash } from '@/lib/repositories/classPlans';
import { recordActivity } from '@/lib/activityLogger';
import type { Tables } from '@/lib/supabase.types';
import { Trash2, RotateCcw, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type ClassPlanRow = Tables<'class_plans'>;

export default function TrashPage() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletedPlans, setDeletedPlans] = useState<ClassPlanRow[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    fetchDeletedPlans();
  }, [hydrated, session, router]);

  const fetchDeletedPlans = async () => {
    setLoading(true);
    const { data, error } = await listDeletedClassPlans();
    if (error) {
      console.error('휴지통 조회 실패:', error);
    }
    setDeletedPlans(data || []);
    setLoading(false);
  };

  const handleRestore = async (plan: ClassPlanRow) => {
    setActionLoading(plan.id);
    const { error } = await restoreClassPlan(plan.id);
    if (error) {
      toast.error('복원 실패', { description: error.message });
    } else {
      toast.success('복원 완료', { description: `"${plan.title || '무제 강의'}"이(가) 복원되었습니다.` });
      recordActivity('class.restore', `강의 복원: ${plan.title || '무제 강의'}`);
      await fetchDeletedPlans();
    }
    setActionLoading(null);
  };

  const handlePermanentDelete = async (plan: ClassPlanRow) => {
    if (!window.confirm(`"${plan.title || '무제 강의'}"을(를) 영구 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    setActionLoading(plan.id);
    const { error } = await permanentlyDeleteClassPlan(plan.id);
    if (error) {
      toast.error('영구 삭제 실패', { description: error.message });
    } else {
      toast.success('영구 삭제 완료');
      recordActivity('class.permanent_delete', `강의 영구 삭제: ${plan.title || '무제 강의'}`);
      await fetchDeletedPlans();
    }
    setActionLoading(null);
  };

  const handleEmptyTrash = async () => {
    if (!session) return;
    if (!window.confirm(`휴지통의 모든 강의계획서(${deletedPlans.length}개)를 영구 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    setActionLoading('empty');
    const { count, error } = await emptyTrash(session.userId);
    if (error) {
      toast.error('휴지통 비우기 실패', { description: error.message });
    } else {
      toast.success('휴지통 비우기 완료', { description: `${count}개 항목이 영구 삭제되었습니다.` });
      recordActivity('class.empty_trash', `휴지통 비우기: ${count}개 영구 삭제`);
      await fetchDeletedPlans();
    }
    setActionLoading(null);
  };

  if (!hydrated || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500">
        로그인 상태를 확인하는 중입니다...
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto py-10 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-zinc-200 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <Trash2 className="w-6 h-6" />
                휴지통
              </h1>
              <p className="text-sm text-zinc-500">삭제된 강의계획서를 복원하거나 영구 삭제할 수 있습니다.</p>
            </div>
          </div>
          {deletedPlans.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              disabled={actionLoading === 'empty'}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              {actionLoading === 'empty' ? '삭제 중...' : '휴지통 비우기'}
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow border border-zinc-200 overflow-hidden">
          <div className="p-3 border-b border-zinc-200 bg-zinc-50">
            <span className="text-sm text-zinc-600">
              {loading ? '불러오는 중...' : `총 ${deletedPlans.length}개의 삭제된 강의계획서`}
            </span>
          </div>

          {deletedPlans.length === 0 && !loading ? (
            <div className="p-12 text-center text-zinc-500">
              <Trash2 className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
              <p>휴지통이 비어 있습니다.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-700">
                  <tr>
                    <th className="px-4 py-3 w-48">강좌명</th>
                    <th className="px-4 py-3 w-24">강사</th>
                    <th className="px-4 py-3 w-24">대상</th>
                    <th className="px-4 py-3 w-40">삭제일시</th>
                    <th className="px-4 py-3 w-32 text-center">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedPlans.map((plan) => (
                    <tr key={plan.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-zinc-900">
                          {plan.title || '무제 강의'}
                        </span>
                        {plan.subject && (
                          <span className="ml-2 text-xs text-zinc-500">({plan.subject})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{plan.teacher_name || '-'}</td>
                      <td className="px-4 py-3 text-zinc-700">{plan.target_student || '-'}</td>
                      <td className="px-4 py-3 text-zinc-600 text-xs">
                        {formatDate(plan.deleted_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleRestore(plan)}
                            disabled={actionLoading === plan.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-xs font-medium disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            복원
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(plan)}
                            disabled={actionLoading === plan.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition text-xs font-medium disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            영구삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
