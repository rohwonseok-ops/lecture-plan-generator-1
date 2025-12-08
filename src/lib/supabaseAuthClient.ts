import { supabase } from './supabaseClient';
import type { AuthError } from '@supabase/supabase-js';

const toCandidateEmails = (name: string) => {
  const raw = name.trim();
  const safe = raw.toLowerCase().replace(/\s+/g, '-');
  const candidates = new Set<string>();
  if (raw.includes('@')) candidates.add(raw);
  candidates.add(`${encodeURIComponent(safe || 'user')}@local.login`);
  candidates.add(`${safe || 'user'}@local.login`);
  // 호환: 기존에 만든 admin@local.login 계정 대응
  if (raw === '관리자') candidates.add('admin@local.login');
  return Array.from(candidates);
};

const sanitizePin6 = (pin: string) => pin.replace(/\D/g, '').slice(0, 6);

export const signInWithPin = async (name: string, pin: string) => {
  const password = sanitizePin6(pin);
  if (password.length !== 6) {
    return { data: null, error: new Error('비밀번호는 숫자 6자리여야 합니다.') };
  }
  const candidates = toCandidateEmails(name);
  let lastError: AuthError | null = null;
  for (const email of candidates) {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error) return res;
    lastError = res.error;
  }
  return { data: null, error: lastError ?? new Error('login failed') };
};

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

export const getUser = () => supabase.auth.getUser();

export const getProfile = async () => {
  const { data: userRes, error: userError } = await supabase.auth.getUser();
  if (userError || !userRes.user) {
    return { profile: null, error: userError ?? new Error('로그인이 필요합니다.') };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userRes.user.id)
    .single();

  return { profile, error };
};

export const updatePasswordPin = async (newPin: string) => {
  const userRes = await supabase.auth.getUser();
  if (!userRes.data.user) {
    return { error: new Error('로그인이 필요합니다.') };
  }
  const password = sanitizePin6(newPin);
  if (password.length !== 6) {
    return { error: new Error('비밀번호는 숫자 6자리여야 합니다.') };
  }
  if (password === '000000') {
    return { error: new Error('초기 비밀번호와 다른 숫자 6자리로 설정하세요.') };
  }
  const { error: authError } = await supabase.auth.updateUser({ password });
  if (authError) return { error: authError };

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', userRes.data.user.id);

  return { error: profileError ?? null };
};

