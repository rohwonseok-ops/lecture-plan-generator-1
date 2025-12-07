import { supabase } from '../supabaseClient';
import type { TablesInsert } from '../supabase.types';

export const addActivityLog = async (input: Omit<TablesInsert<'activity_logs'>, 'id' | 'created_at'>) => {
  return supabase.from('activity_logs').insert(input);
};

export const listActivityLogs = async (limit = 200) => {
  return supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
};

