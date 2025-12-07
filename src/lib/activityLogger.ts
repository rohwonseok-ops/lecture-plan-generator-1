import { useAuthStore } from '@/store/authStore';
import { addActivityLog } from './repositories/activityLogs';

export const recordActivity = (action: string, detail?: string) => {
  useAuthStore.getState().appendLog(action, detail);
  // 비동기 Supabase 로그 기록 (실패해도 UI에 영향 없음)
  addActivityLog({
    action,
    detail,
    actor_name: useAuthStore.getState().session?.name ?? '익명',
    actor_role: useAuthStore.getState().session?.role ?? 'user',
  });
};

