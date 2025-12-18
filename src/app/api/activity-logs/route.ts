import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { unauthorized, forbidden, serverError } from '@/lib/apiHelpers';

const requireAdmin = async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : undefined;
  if (!token) return { ok: false as const, res: unauthorized() };

  const admin = supabaseAdmin();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return { ok: false as const, res: unauthorized() };

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, active')
    .eq('id', userData.user.id)
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

  const admin = supabaseAdmin();
  const { data, error } = await admin
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

