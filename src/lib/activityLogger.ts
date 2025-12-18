import { useAuthStore } from '@/store/authStore';
import { addActivityLog } from './repositories/activityLogs';

export const recordActivity = (action: string, detail?: string) => {
  useAuthStore.getState().appendLog(action, detail);
  // 일반유저는 "강의계획서 관리 외 권한 없음" 요구사항에 맞춰
  // activity_logs 테이블에 직접 기록하지 않습니다(관리자만 기록).
  const session = useAuthStore.getState().session;
  if (session?.role !== 'admin') return;

  // 비동기 Supabase 로그 기록 (실패해도 UI에 영향 없음)
  addActivityLog({
    action,
    detail,
    actor_name: session.name ?? '익명',
    actor_role: session.role ?? 'admin',
  });
};

