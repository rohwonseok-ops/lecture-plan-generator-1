import { NextResponse } from 'next/server';

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

    const prompts: Record<CopyPromptType, string> = {
      parentIntro: '학부모에게 보내는 짧은 인사와 안내 문구를 2~3문장으로 작성하세요.',
      learningGoal: '학습 목표를 번호 목록 3개로 작성하세요. 핵심 개념, 취약 유형 보완, 태도/습관을 포함하세요.',
      management: '테스트/클리닉/피드백 계획을 불릿 3~5개로 짧게 작성하세요.',
      promoCopy: '홍보용 카피를 2~3문장으로 짧게 작성하세요. 과장되지 않게, 명확한 가치 제안을 담으세요.',
      keywords: '해시태그 형태로 5~7개 작성하세요. 예: #수학 #성적향상',
    };

    const message = type ? prompts[type] : '짧은 안내 문구를 작성하세요.';

    const openaiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: 500,
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

