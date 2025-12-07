import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { adminCreateAuthUser, adminUpdateAuthUser } from '@/lib/repositories/profiles';
import { unauthorized, forbidden, badRequest, serverError } from '@/lib/apiHelpers';

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

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('profiles')
    .select('id, name, phone_last4, role, active, must_change_password, created_at, updated_at')
    .order('name', { ascending: true });

  if (error) return serverError(error.message);
  return NextResponse.json({ data });
};

export const POST = async (req: NextRequest) => {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const { name, phoneLast4, role, active } = body;
  if (!name) {
    return badRequest('name is required');
  }

  const result = await adminCreateAuthUser({
    name,
    phoneLast4,
    role,
    active,
    mustChangePassword: true,
  });

  if (result.error || !result.data) {
    return serverError(result.error?.message ?? 'failed to create user');
  }

  return NextResponse.json({ data: result.data });
};

export const PUT = async (req: NextRequest) => {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const { id, name, phoneLast4, password, role, active, mustChangePassword } = body;
  if (!id) return badRequest('id is required');

  const result = await adminUpdateAuthUser({
    id,
    name,
    phoneLast4,
    password,
    role,
    active,
    mustChangePassword,
  });

  if (result.error) {
    return serverError(result.error.message);
  }

  return NextResponse.json({ data: result.data });
};

