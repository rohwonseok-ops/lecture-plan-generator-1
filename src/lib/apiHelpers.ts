import { NextRequest, NextResponse } from 'next/server';
import { createRequestSupabase } from '@/lib/supabaseRequestClient';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

export const unauthorized = () => 
  NextResponse.json({ error: 'unauthorized' }, { status: 401 });

export const forbidden = () => 
  NextResponse.json({ error: 'forbidden' }, { status: 403 });

export const notFound = () => 
  NextResponse.json({ error: 'not found' }, { status: 404 });

export const badRequest = (msg: string) => 
  NextResponse.json({ error: msg }, { status: 400 });

export const serverError = (msg: string) => 
  NextResponse.json({ error: msg }, { status: 500 });

interface AuthResult {
  client: SupabaseClient<Database>;
  userId: string;
}

/**
 * 요청에서 인증 토큰을 추출하고 유효한 클라이언트를 반환합니다.
 * @returns 인증된 클라이언트와 userId 또는 null
 */
export const getClientAndUser = async (req: NextRequest): Promise<AuthResult | null> => {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : undefined;
  
  if (!token) return null;
  
  const client = createRequestSupabase(token);
  const { data: userData, error: userError } = await client.auth.getUser();
  
  if (userError || !userData?.user) return null;
  
  return { client, userId: userData.user.id };
};

/**
 * 인증을 요구하는 API 핸들러를 래핑합니다.
 */
export const withAuth = <T>(
  handler: (req: NextRequest, auth: AuthResult, context?: T) => Promise<NextResponse>
) => {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
    const auth = await getClientAndUser(req);
    if (!auth) return unauthorized();
    return handler(req, auth, context);
  };
};

