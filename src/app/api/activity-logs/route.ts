import { NextRequest, NextResponse } from 'next/server';
import { unauthorized, forbidden, serverError, getClientAndUser } from '@/lib/apiHelpers';

const requireAdmin = async (req: NextRequest) => {
  const pair = await getClientAndUser(req);
  if (!pair) return { ok: false as const, res: unauthorized() };

  const { client, userId } = pair;
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, role, active')
    .eq('id', userId)
    .single();

  if (profileError || !profile) return { ok: false as const, res: forbidden() };
  if (profile.role !== 'admin' || !profile.active) return { ok: false as const, res: forbidden() };

  return { ok: true as const, userId: profile.id };
};

export const GET = async (req: NextRequest) => {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '200', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const pair = await getClientAndUser(req);
  if (!pair) return unauthorized();
  const { client } = pair;

  const { data, error } = await client
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('활동 로그 조회 실패:', error);
    return serverError(error.message);
  }
  return NextResponse.json({ data: data || [] });
};

