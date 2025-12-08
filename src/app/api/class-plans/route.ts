import { NextRequest, NextResponse } from 'next/server';
import { getClientAndUser, unauthorized, badRequest, serverError } from '@/lib/apiHelpers';
import type { TablesInsert } from '@/lib/supabase.types';

export const GET = async (req: NextRequest) => {
  const pair = await getClientAndUser(req);
  if (!pair) return unauthorized();
  const { client, userId } = pair;

  const { data, error } = await client
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) return serverError(error.message);
  return NextResponse.json({ data });
};

export const POST = async (req: NextRequest) => {
  const pair = await getClientAndUser(req);
  if (!pair) return unauthorized();
  const { client, userId } = pair;

  const body = await req.json().catch(() => ({}));
  const {
    plan,
    weeklyItems = [],
    feeRows = [],
  }: {
    plan?: TablesInsert<'class_plans'>;
    weeklyItems?: TablesInsert<'weekly_plan_items'>[];
    feeRows?: TablesInsert<'fee_rows'>[];
  } = body;

  if (!plan?.title) {
    return badRequest('title is required');
  }

  const { data, error } = await client
    .from('class_plans')
    .insert({ ...(plan || {}), owner_id: userId })
    .select()
    .single();
  if (error || !data) return serverError(error?.message ?? 'insert failed');

  if (weeklyItems.length) {
    await client.from('weekly_plan_items').insert(
      weeklyItems.map((w, idx) => ({
        ...w,
        class_plan_id: data.id,
        position: w.position ?? idx,
      }))
    );
  }
  if (feeRows.length) {
    await client.from('fee_rows').insert(
      feeRows.map((f) => ({
        ...f,
        class_plan_id: data.id,
      }))
    );
  }

  const { data: full, error: fullError } = await client
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .eq('id', data.id)
    .single();

  if (fullError) return serverError(fullError.message);
  return NextResponse.json({ data: full });
};

