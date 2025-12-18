import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

export const supabaseAdmin = () =>
  createClient<Database>(
    (() => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase 서버용 키가 설정되지 않았습니다. 환경변수를 확인하세요.');
      }
      return supabaseUrl;
    })(),
    (() => {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        throw new Error('Supabase 서버용 키가 설정되지 않았습니다. 환경변수를 확인하세요.');
      }
      return serviceRoleKey;
    })(),
    {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

