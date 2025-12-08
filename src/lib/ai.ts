'use client';

import { ClassPlan } from './types';

export interface AiGenerateOptions {
  type: 'parentIntro' | 'learningGoal' | 'promoCopy' | 'keywords' | 'management';
  tone?: 'formal' | 'friendly' | 'passionate';
}

export const generateTextForClassPlan = async (plan: ClassPlan, options: AiGenerateOptions): Promise<string> => {
  const res = await fetch('/api/ai/copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, options }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'AI 문구 생성에 실패했습니다.');
  }

  const json = await res.json();
  return json.result || '';
};

