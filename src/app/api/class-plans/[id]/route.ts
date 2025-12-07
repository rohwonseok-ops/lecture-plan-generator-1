import { NextRequest, NextResponse } from 'next/server';
import { createRequestSupabase } from '@/lib/supabaseRequestClient';

const unauthorized = () => NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const notFound = () => NextResponse.json({ error: 'not found' }, { status: 404 });

const getClient = async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : undefined;
  if (!token) return null;
  return createRequestSupabase(token);
};

export const GET = async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const client = await getClient(_req);
  if (!client) return unauthorized();

  const { data, error } = await client
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .eq('id', params.id)
    .single();

  if (error && error.code === 'PGRST116') return notFound();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
};

export const PUT = async (req: NextRequest, { params }: { params: { id: string } }) => {
  const client = await getClient(req);
  if (!client) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { patch = {}, weeklyItems, feeRows } = body;

  const { error } = await client.from('class_plans').update(patch).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (weeklyItems) {
    await client.from('weekly_plan_items').delete().eq('class_plan_id', params.id);
    if (weeklyItems.length) {
      await client.from('weekly_plan_items').insert(
        weeklyItems.map((w: any, idx: number) => ({
          ...w,
          class_plan_id: params.id,
          position: w.position ?? idx,
        }))
      );
    }
  }

  if (feeRows) {
    await client.from('fee_rows').delete().eq('class_plan_id', params.id);
    if (feeRows.length) {
      await client.from('fee_rows').insert(
        feeRows.map((f: any) => ({
          ...f,
          class_plan_id: params.id,
        }))
      );
    }
  }

  const { data: full, error: fullError } = await client
    .from('class_plans')
    .select('*, weekly_plan_items(*), fee_rows(*)')
    .eq('id', params.id)
    .single();

  if (fullError) return NextResponse.json({ error: fullError.message }, { status: 500 });
  return NextResponse.json({ data: full });
};

export const DELETE = async (req: NextRequest, { params }: { params: { id: string } }) => {
  const client = await getClient(req);
  if (!client) return unauthorized();

  const { error } = await client.from('class_plans').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
};

