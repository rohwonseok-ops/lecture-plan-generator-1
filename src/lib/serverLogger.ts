import { supabaseAdmin } from './supabaseServer';
import type { Database } from './supabase.types';

type UserRole = Database['public']['Enums']['user_role'];

type RecordServerActivityInput = {
  action: string;
  detail?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: UserRole;
};

/**
 * 서버 사이드에서 활동 로그를 남기는 헬퍼.
 * 실패해도 오류를 삼키고 콘솔에만 남겨서 주 흐름을 막지 않는다.
 */
export const recordServerActivity = async ({
  action,
  detail,
  actorId = null,
  actorName = 'system',
  actorRole = 'admin',
}: RecordServerActivityInput) => {
  try {
    const admin = supabaseAdmin();
    await admin.from('activity_logs').insert({
      action,
      detail: detail ?? null,
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
    });
  } catch (err) {
    console.error('[recordServerActivity] failed', { action, err });
  }
};


