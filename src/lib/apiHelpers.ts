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
  
  // Authorization 헤더 확인
  if (!authHeader) {
    console.warn('[getClientAndUser] Authorization 헤더가 없습니다.');
    return null;
  }
  
  // Bearer 토큰 파싱
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : undefined;
  
  if (!token) {
    console.warn('[getClientAndUser] Bearer 토큰을 찾을 수 없습니다. 헤더 형식:', authHeader.substring(0, 20) + '...');
    return null;
  }
  
  // 토큰 유효성 기본 검사 (빈 문자열, 너무 짧은 토큰 등)
  if (token.length < 10) {
    console.warn('[getClientAndUser] 토큰이 너무 짧습니다. 길이:', token.length);
    return null;
  }
  
  try {
    const client = createRequestSupabase(token);
    const { data: userData, error: userError } = await client.auth.getUser();
    
    if (userError) {
      console.error('[getClientAndUser] 사용자 인증 실패:', {
        error: userError.message,
        code: userError.status,
      });
      return null;
    }
    
    if (!userData?.user) {
      console.warn('[getClientAndUser] 사용자 데이터가 없습니다.');
      return null;
    }
    
    console.log('[getClientAndUser] 인증 성공:', {
      userId: userData.user.id,
      email: userData.user.email,
    });
    
    return { client, userId: userData.user.id };
  } catch (error) {
    console.error('[getClientAndUser] 예외 발생:', error instanceof Error ? error.message : String(error));
    return null;
  }
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

