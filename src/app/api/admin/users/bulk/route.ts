import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { adminCreateAuthUser } from '@/lib/repositories/profiles';
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

interface IncomingUser {
  name?: string;
  role?: 'admin' | 'user';
  active?: boolean;
}

export const POST = async (req: NextRequest) => {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const incoming: IncomingUser[] = Array.isArray(body.users) ? body.users : [];
  if (!incoming.length) return badRequest('users is required');
  const results = [];

  for (const user of incoming) {
    if (!user.name) {
      results.push({ ok: false, name: user.name ?? '', error: 'name is required' });
      continue;
    }
    const result = await adminCreateAuthUser({
      name: user.name,
      role: user.role ?? 'user',
      active: user.active ?? true,
      mustChangePassword: true,
    });
    if (result.error || !result.data) {
      results.push({ ok: false, name: user.name, error: result.error?.message ?? 'create failed' });
    } else {
      results.push({ ok: true, name: user.name, id: result.data.id });
    }
  }

  const failures = results.filter((r) => !r.ok);
  if (failures.length === results.length) {
    return serverError('all user creations failed');
  }

  return NextResponse.json({ results });
};

