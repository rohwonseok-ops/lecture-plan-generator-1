import { NextRequest, NextResponse } from 'next/server';
import { createRequestSupabase } from '@/lib/supabaseRequestClient';

const unauthorized = () => NextResponse.json({ error: 'unauthorized' }, { status: 401 });

const getClient = async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : undefined;
  if (!token) return null;
  return createRequestSupabase(token);
};

export const GET = async (req: NextRequest) => {
  const client = await getClient(req);
  if (!client) return unauthorized();

  const { data, error } = await client
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
};

export const POST = async (req: NextRequest) => {
  const client = await getClient(req);
  if (!client) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { plan, weeklyItems = [], feeRows = [] } = body;

  if (!plan?.title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData?.user) return unauthorized();

  const { data, error } = await client
    .from('class_plans')
    .insert({ ...plan, owner_id: userData.user.id })
    .select()
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'insert failed' }, { status: 500 });

  if (weeklyItems.length) {
    await client.from('weekly_plan_items').insert(
      weeklyItems.map((w: any, idx: number) => ({
        ...w,
        class_plan_id: data.id,
        position: w.position ?? idx,
      }))
    );
  }
  if (feeRows.length) {
    await client.from('fee_rows').insert(
      feeRows.map((f: any) => ({
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

  if (fullError) return NextResponse.json({ error: fullError.message }, { status: 500 });
  return NextResponse.json({ data: full });
};

