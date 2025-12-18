import { NextResponse } from 'next/server';
import { createRequestSupabase } from '@/lib/supabaseRequestClient';
import { unauthorized } from '@/lib/apiHelpers';

export const runtime = 'nodejs';

interface CopyPlan {
  subject?: string;
  title?: string;
  targetStudent?: string;
  teacherName?: string;
  course1?: string;
  course2?: string;
  material1?: string;
  material2?: string;
}

type CopyPromptType = 'parentIntro' | 'learningGoal' | 'management' | 'promoCopy' | 'keywords';

interface CopyOptions {
  type?: CopyPromptType;
  contexts?: string[];
  seedText?: string;
  mode?: 'generate' | 'rewrite';
}

interface CopyRequestBody {
  plan?: CopyPlan;
  options?: CopyOptions;
}

const getCopyEnv = () => {
  const {
    COPY_LLM_API_KEY,
    COPY_LLM_BASE_URL,
    COPY_LLM_MODEL,
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    OPENAI_MODEL,
  } = process.env;

  const apiKey = COPY_LLM_API_KEY || OPENAI_API_KEY;
  const baseUrl = (COPY_LLM_BASE_URL || OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = COPY_LLM_MODEL || OPENAI_MODEL || 'gpt-4o-mini';

  return { apiKey, baseUrl, model };
};

export async function POST(req: Request) {
  try {
    // 일반유저 권한 범위를 "강의계획서 관리"로 한정하기 위해, AI 문구 생성도 로그인 사용자만 허용합니다.
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : undefined;
    if (!token) return unauthorized();

    const client = createRequestSupabase(token);
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData?.user) return unauthorized();

    const { plan, options } = (await req.json()) as CopyRequestBody;
    const { apiKey, baseUrl, model } = getCopyEnv();

    if (!apiKey) {
      return NextResponse.json({ error: '서버에 LLM API 키가 설정되어 있지 않습니다.' }, { status: 500 });
    }

    const subject = plan?.subject || plan?.title || '수업';
    const target = plan?.targetStudent || '학생';
    const teacher = plan?.teacherName || '선생님';

    const instructions = `
당신은 학원/학교 강의 계획서를 돕는 문구 작가입니다.
한국어로 간결하게 작성하세요.
- 대상: ${target}
- 과목/강좌명: ${subject}
- 강사: ${teacher}
- 학습과정1: ${plan?.course1 || '미입력'}
- 학습과정2: ${plan?.course2 || '미입력'}
- 교재1: ${plan?.material1 || '미입력'}
- 교재2: ${plan?.material2 || '미입력'}
`;

    const type = options?.type;
    const contexts = options?.contexts || [];
    const seedText = options?.seedText;
    const mode = options?.mode || 'generate';

    const prompts: Record<CopyPromptType, string> = {
      parentIntro: '학부모에게 보내는 짧은 인사와 안내 문구를 2~3문장으로 작성하세요.',
      learningGoal: `학습 목표를 번호 목록 3개로 작성하세요. 다음 요소를 균형있게 반영하되, 교육과정 및 대상 학년에 맞는 전문적이면서도 자연스러운 표현을 사용하세요:

1. 핵심 개념 및 원리 이해: 해당 단원/과정의 중요 개념을 정리하고, 실전 유형 연습 및 고난도 문제 풀이를 통해 적용력을 강화합니다.
2. 취약 유형 진단 및 보완: 개별 학습자의 오답 패턴을 분석하여 맞춤형 클리닉 및 반복 학습으로 약점을 집중 개선합니다.
3. 자기주도 학습 태도 및 습관 형성: 체계적인 복습과 오답 노트 작성 등을 통해 스스로 학습을 관리하는 능력을 기릅니다.

위 구조를 참고하되, 과목/학년/과정에 따라 자연스럽고 구체적인 표현으로 재구성하세요. 형식적이거나 천편일률적인 문구는 지양하고, 실제 학습 현장에서 사용할 수 있는 전문성과 유연성을 동시에 갖춘 문구를 생성하세요.

중요: 볼드(**), 이탤릭(*), 헤더(#) 등 마크다운 포맷팅을 사용하지 마세요. 번호(1. 2.)나 불릿(-)은 사용 가능합니다.`,
      management: `학습 관리 계획을 3~4개 항목으로 작성하세요. 각 항목은 한 문장으로 간결하게.

예시 구조:
1. 정기 테스트: 주기, 범위, 목적을 구체적으로
2. 오답 클리닉: 진행 방식과 보완 전략
3. 피드백: 학부모/학생 소통 방법
4. 과제 관리: 과제 점검 및 피드백 방식 (선택)

과목/학년에 맞게 실제 운영 가능한 내용으로 작성하세요. 뻔하거나 추상적인 표현은 피하고, 구체적인 실행 내용을 담으세요.

중요: 볼드(**), 이탤릭(*), 헤더(#) 등 마크다운 포맷팅을 사용하지 마세요. 번호(1. 2.)나 불릿(-)은 사용 가능합니다.`,
      promoCopy: '홍보용 카피를 2~3문장으로 짧게 작성하세요. 과장되지 않게, 명확한 가치 제안을 담으세요.',
      keywords: '해시태그 형태로 5~7개 작성하세요. 예: #수학 #성적향상',
    };

    const contextText = contexts.length > 0 ? `\n선택된 맥락: ${contexts.join(', ')}` : '';
    const seedTextPrompt = seedText
      ? `\n다음 기존 문구를 보완/정리해 톤만 다듬어라. 핵심 내용은 유지하되, 과장 없이 간결하게:\n"""${seedText}"""`
      : '';
    const modeHint = mode === 'rewrite' ? '\n새로 창작하지 말고 기존 내용을 개선하는 데 집중하세요.' : '';

    const message = type
      ? `${prompts[type]}${contextText}${seedTextPrompt}${modeHint}`
      : `짧은 안내 문구를 작성하세요.${contextText}${seedTextPrompt}${modeHint}`;

    const openaiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_completion_tokens: 500,
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      let detail: string | undefined = errorText;
      try {
        const parsed = JSON.parse(errorText);
        // OpenAI 스타일 오류 객체 추출
        detail = parsed?.error?.message || parsed?.message || errorText;
      } catch {
        // noop
      }

      return NextResponse.json(
        {
          error: `LLM 호출 실패 (${openaiRes.status})`,
          detail: detail ? detail.slice(0, 1000) : undefined,
        },
        { status: openaiRes.status }
      );
    }

    const data = await openaiRes.json();
    const result = data?.choices?.[0]?.message?.content?.trim() || '';
    return NextResponse.json({ result });
  } catch (err: unknown) {
    console.error('[api/ai/copy]', err);
    const message = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

