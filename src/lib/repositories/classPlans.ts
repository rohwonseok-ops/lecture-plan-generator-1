import { supabase } from '../supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '../supabase.types';

type ClassPlanRow = Tables<'class_plans'>;
type WeeklyRow = Tables<'weekly_plan_items'>;
type FeeRow = Tables<'fee_rows'>;

export const listClassPlans = async () => {
  return supabase
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .order('created_at', { ascending: false });
};

export const getClassPlan = async (id: string) => {
  return supabase
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .eq('id', id)
    .single();
};

export const createClassPlan = async (
  plan: Omit<TablesInsert<'class_plans'>, 'id' | 'created_at' | 'updated_at'>,
  weeklyItems: Omit<TablesInsert<'weekly_plan_items'>, 'id' | 'created_at' | 'updated_at'>[] = [],
  feeRows: Omit<TablesInsert<'fee_rows'>, 'id' | 'created_at' | 'updated_at'>[] = []
) => {
  const { data, error } = await supabase
    .from('class_plans')
    .insert(plan)
    .select()
    .single();
  if (error || !data) return { data: null as ClassPlanRow | null, error };

  if (weeklyItems.length) {
    await supabase.from('weekly_plan_items').insert(
      weeklyItems.map((w, idx) => ({
        ...w,
        class_plan_id: data.id,
        position: w.position ?? idx,
      }))
    );
  }
  if (feeRows.length) {
    await supabase.from('fee_rows').insert(
      feeRows.map((f) => ({
        ...f,
        class_plan_id: data.id,
      }))
    );
  }

  return getClassPlan(data.id);
};

export const updateClassPlan = async (
  id: string,
  patch: TablesUpdate<'class_plans'>,
  weeklyItems?: Omit<TablesInsert<'weekly_plan_items'>, 'id' | 'created_at' | 'updated_at'>[],
  feeRows?: Omit<TablesInsert<'fee_rows'>, 'id' | 'created_at' | 'updated_at'>[]
) => {
  const { error } = await supabase.from('class_plans').update(patch).eq('id', id);
  if (error) return { data: null as ClassPlanRow | null, error };

  if (weeklyItems) {
    await supabase.from('weekly_plan_items').delete().eq('class_plan_id', id);
    if (weeklyItems.length) {
      await supabase.from('weekly_plan_items').insert(
        weeklyItems.map((w, idx) => ({
          ...w,
          class_plan_id: id,
          position: w.position ?? idx,
        }))
      );
    }
  }

  if (feeRows) {
    await supabase.from('fee_rows').delete().eq('class_plan_id', id);
    if (feeRows.length) {
      await supabase.from('fee_rows').insert(
        feeRows.map((f) => ({
          ...f,
          class_plan_id: id,
        }))
      );
    }
  }

  return getClassPlan(id);
};

export const deleteClassPlan = async (id: string) => {
  return supabase.from('class_plans').delete().eq('id', id);
};

export const listWeeklyItems = async (classPlanId: string) => {
  return supabase
    .from('weekly_plan_items')
    .select('*')
    .eq('class_plan_id', classPlanId)
    .order('position', { ascending: true });
};

export const listFeeRows = async (classPlanId: string) => {
  return supabase.from('fee_rows').select('*').eq('class_plan_id', classPlanId);
};

