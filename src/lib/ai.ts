'use client';

import { supabase } from './supabaseClient';
import { ClassPlan } from './types';

export interface AiGenerateOptions {
  type: 'parentIntro' | 'learningGoal' | 'promoCopy' | 'keywords' | 'management';
  tone?: 'formal' | 'friendly' | 'passionate';
  contexts?: string[];
  seedText?: string;
  mode?: 'generate' | 'rewrite';
}

export const generateTextForClassPlan = async (plan: ClassPlan, options: AiGenerateOptions): Promise<string> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch('/api/ai/copy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan, options }),
  });

  if (!res.ok) {
    // JSON을 우선 시도하고 실패하면 텍스트로 보조
    let errorMessage = 'AI 문구 생성에 실패했습니다.';
    let detailMessage = '';
    try {
      const json = await res.json();
      errorMessage = json.error || errorMessage;
      if (json.detail) detailMessage = String(json.detail);
    } catch {
      const text = await res.text().catch(() => '');
      if (text) detailMessage = text;
    }
    const statusPart = ` (HTTP ${res.status})`;
    const detailPart = detailMessage ? `: ${detailMessage.slice(0, 500)}` : '';
    throw new Error(`${errorMessage}${statusPart}${detailPart}`);
  }

  const json = await res.json();
  return json.result || '';
};

