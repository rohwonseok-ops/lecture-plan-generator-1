import { supabase } from '../supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '../supabase.types';

type ClassPlanRow = Tables<'class_plans'>;

export const listClassPlans = async () => {
  return supabase
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
};

export const listDeletedClassPlans = async () => {
  return supabase
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });
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

// Soft delete - 휴지통으로 이동
export const deleteClassPlan = async (id: string) => {
  return supabase
    .from('class_plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
};

// 휴지통에서 복원
export const restoreClassPlan = async (id: string) => {
  return supabase
    .from('class_plans')
    .update({ deleted_at: null })
    .eq('id', id);
};

// 영구 삭제
export const permanentlyDeleteClassPlan = async (id: string) => {
  // 연관 데이터 먼저 삭제
  await supabase.from('weekly_plan_items').delete().eq('class_plan_id', id);
  await supabase.from('fee_rows').delete().eq('class_plan_id', id);
  return supabase.from('class_plans').delete().eq('id', id);
};

// 휴지통 비우기 (삭제된 모든 계획서 영구 삭제)
export const emptyTrash = async (ownerId: string) => {
  // 삭제된 계획서 ID 목록 조회
  const { data: deletedPlans } = await supabase
    .from('class_plans')
    .select('id')
    .eq('owner_id', ownerId)
    .not('deleted_at', 'is', null);

  if (!deletedPlans || deletedPlans.length === 0) {
    return { count: 0, error: null };
  }

  const ids = deletedPlans.map((p) => p.id);

  // 연관 데이터 삭제
  await supabase.from('weekly_plan_items').delete().in('class_plan_id', ids);
  await supabase.from('fee_rows').delete().in('class_plan_id', ids);

  // 계획서 영구 삭제
  const { error } = await supabase
    .from('class_plans')
    .delete()
    .in('id', ids);

  return { count: ids.length, error };
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

