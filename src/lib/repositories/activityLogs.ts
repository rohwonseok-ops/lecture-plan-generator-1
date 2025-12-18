import { supabase } from '../supabaseClient';
import type { TablesInsert } from '../supabase.types';

export const addActivityLog = async (input: Omit<TablesInsert<'activity_logs'>, 'id' | 'created_at'>) => {
  return supabase.from('activity_logs').insert(input);
};

export const listActivityLogs = async (limit = 200, offset = 0) => {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) {
    return { data: null, error: { message: '로그인이 필요합니다.' } };
  }

  const res = await fetch(`/api/activity-logs?limit=${limit}&offset=${offset}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { data: null, error: { message: json.error || '활동 로그를 불러오지 못했습니다.' } };
  }

  const json = await res.json();
  return { data: json.data || [], error: null };
};

export const getActivityLogsCount = async () => {
  const { count } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact', head: true });
  return count || 0;
};

