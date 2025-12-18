import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  const errorMsg = `Supabase 환경변수가 설정되지 않았습니다: ${missingVars.join(', ')}`;
  console.error('[supabaseRequestClient]', errorMsg);
  throw new Error(errorMsg);
}

// URL 형식 검증
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  console.error('[supabaseRequestClient] 잘못된 Supabase URL 형식:', supabaseUrl);
  throw new Error('NEXT_PUBLIC_SUPABASE_URL이 올바른 URL 형식이 아닙니다.');
}

export const createRequestSupabase = (accessToken: string) => {
  // 토큰 유효성 검사
  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    console.error('[createRequestSupabase] 유효하지 않은 액세스 토큰');
    throw new Error('액세스 토큰이 필요합니다.');
  }
  
  try {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  } catch (error) {
    console.error('[createRequestSupabase] 클라이언트 생성 실패:', error);
    throw error;
  }
};

