import { supabase } from '../supabaseClient';
import type { TablesInsert } from '../supabase.types';

export const addActivityLog = async (input: Omit<TablesInsert<'activity_logs'>, 'id' | 'created_at'>) => {
  return supabase.from('activity_logs').insert(input);
};

export const listActivityLogs = async (limit = 200, offset = 0) => {
  return supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
};

export const getActivityLogsCount = async () => {
  const { count } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact', head: true });
  return count || 0;
};

