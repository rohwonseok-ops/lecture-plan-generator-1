import { supabase } from '../supabaseClient';
import { supabaseAdmin } from '../supabaseServer';
import type { Tables, TablesInsert, TablesUpdate } from '../supabase.types';

type ProfileRow = Tables<'profiles'>;

const toLoginEmail = (name: string) => {
  const safe = name.trim().toLowerCase().replace(/\s+/g, '-');
  return `${encodeURIComponent(safe || 'user')}@local.login`;
};

export const getMyProfile = async () => {
  return supabase.from('profiles').select('*').single();
};

export const listProfilesAdmin = async () => {
  return supabaseAdmin().from('profiles').select('*').order('name');
};

export const adminUpsertProfile = async (
  input: Omit<TablesInsert<'profiles'>, 'created_at' | 'updated_at'>
) => {
  return supabaseAdmin().from('profiles').upsert(input).select().single();
};

export const adminUpdateProfile = async (id: string, patch: TablesUpdate<'profiles'>) => {
  return supabaseAdmin().from('profiles').update(patch).eq('id', id).select().single();
};

export const adminCreateAuthUser = async (opts: {
  name: string;
  phoneLast4?: string;
  password?: string;
  role?: ProfileRow['role'];
  active?: boolean;
  mustChangePassword?: boolean;
}) => {
  const email = toLoginEmail(opts.name);
  const password = '000000'; // 초기 비밀번호 통일
  const phoneLast4 = (opts.phoneLast4 || '').replace(/\D/g, '').slice(-4) || '0000';
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: opts.name,
      phoneLast4,
      role: opts.role ?? 'user',
      active: opts.active ?? true,
    },
  });
  if (error || !data?.user) return { data: null as ProfileRow | null, error };

  const profile = await adminUpsertProfile({
    id: data.user.id,
    name: opts.name,
    phone_last4: phoneLast4,
    role: opts.role ?? 'user',
    active: opts.active ?? true,
    must_change_password: opts.mustChangePassword ?? true,
  });
  return profile;
};

export const adminUpdateAuthUser = async (opts: {
  id: string;
  name?: string;
  phoneLast4?: string;
  password?: string;
  role?: ProfileRow['role'];
  active?: boolean;
  mustChangePassword?: boolean;
}) => {
  const admin = supabaseAdmin();

  if (opts.password) {
    const password = opts.password.replace(/\D/g, '').slice(0, 6);
    await admin.auth.admin.updateUserById(opts.id, {
      password,
    });
  }

  const patch: TablesUpdate<'profiles'> = {};
  if (opts.name !== undefined) patch.name = opts.name;
  if (opts.phoneLast4 !== undefined) patch.phone_last4 = opts.phoneLast4;
  if (opts.role !== undefined) patch.role = opts.role;
  if (opts.active !== undefined) patch.active = opts.active;
  if (opts.mustChangePassword !== undefined) patch.must_change_password = opts.mustChangePassword;

  const updated = Object.keys(patch).length
    ? await adminUpdateProfile(opts.id, patch)
    : { data: null, error: null };

  return updated;
};

