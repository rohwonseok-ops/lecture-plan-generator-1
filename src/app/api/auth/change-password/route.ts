import { NextRequest, NextResponse } from 'next/server';
import { createRequestSupabase } from '@/lib/supabaseRequestClient';
import { supabaseAdmin } from '@/lib/supabaseServer';

const unauthorized = () => NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });

const sanitizePin6 = (pin: string) => pin.replace(/\D/g, '').slice(0, 6);

const getClient = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : undefined;
  if (!token) return null;
  return { client: createRequestSupabase(token), token };
};

export const POST = async (req: NextRequest) => {
  const pair = getClient(req);
  if (!pair) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const pinRaw = body.pin as string;
  const pin6 = sanitizePin6(pinRaw || '');
  if (pin6.length !== 6) return badRequest('숫자 6자리 비밀번호가 필요합니다.');
  if (pin6 === '000000') return badRequest('초기 비밀번호와 다른 번호로 설정하세요.');

  const { data: userData, error: userErr } = await pair.client.auth.getUser();
  if (userErr || !userData?.user) return unauthorized();
  const userId = userData.user.id;

  const password = pin6;
  const admin = supabaseAdmin();

  const { error: updateErr } = await admin.auth.admin.updateUserById(userId, { password });
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  await admin.from('profiles').update({ must_change_password: false }).eq('id', userId);

  return NextResponse.json({ ok: true });
};

