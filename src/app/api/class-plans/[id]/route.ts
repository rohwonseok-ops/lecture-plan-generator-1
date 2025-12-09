import { NextRequest, NextResponse } from 'next/server';
import { getClientAndUser, unauthorized, notFound, serverError } from '@/lib/apiHelpers';
import type { TablesInsert } from '@/lib/supabase.types';

export const GET = async (_req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const pair = await getClientAndUser(_req);
  if (!pair) return unauthorized();
  const { client, userId } = pair;

  const { data, error } = await client
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .eq('id', id)
    .eq('owner_id', userId)
    .single();

  if (error && error.code === 'PGRST116') return notFound();
  if (error) return serverError(error.message);
  return NextResponse.json({ data });
};

export const PUT = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const pair = await getClientAndUser(req);
  if (!pair) return unauthorized();
  const { client, userId } = pair;

  const body = await req.json().catch(() => ({}));
  const {
    patch = {},
    weeklyItems,
    feeRows,
  }: {
    patch?: Partial<TablesInsert<'class_plans'>>;
    weeklyItems?: TablesInsert<'weekly_plan_items'>[];
    feeRows?: TablesInsert<'fee_rows'>[];
  } = body;

  const { error } = await client
    .from('class_plans')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', userId);
  if (error) return serverError(error.message);

  if (weeklyItems) {
    await client.from('weekly_plan_items').delete().eq('class_plan_id', id);
    if (weeklyItems.length) {
      await client.from('weekly_plan_items').insert(
        weeklyItems.map((w, idx) => ({
          ...w,
          class_plan_id: id,
          position: w.position ?? idx,
        }))
      );
    }
  }

  if (feeRows) {
    await client.from('fee_rows').delete().eq('class_plan_id', id);
    if (feeRows.length) {
      await client.from('fee_rows').insert(
        feeRows.map((f) => ({
          ...f,
          class_plan_id: id,
        }))
      );
    }
  }

  const { data: full, error: fullError } = await client
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .eq('id', id)
    .eq('owner_id', userId)
    .single();

  if (fullError) return serverError(fullError.message);
  return NextResponse.json({ data: full });
};

export const DELETE = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const pair = await getClientAndUser(req);
  if (!pair) return unauthorized();
  const { client, userId } = pair;

  const { error } = await client
    .from('class_plans')
    .delete()
    .eq('id', id)
    .eq('owner_id', userId);
  if (error) return serverError(error.message);
  return NextResponse.json({ ok: true });
};

