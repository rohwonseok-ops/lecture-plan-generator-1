import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface DesignEnv {
  apiKey?: string;
  baseUrl: string;
  model: string;
}

const toBase64DataUrl = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || 'image/png';
  return `data:${mime};base64,${buffer.toString('base64')}`;
};

const getDesignEnv = (): DesignEnv => {
  const {
    DESIGN_LLM_API_KEY,
    DESIGN_LLM_BASE_URL,
    DESIGN_LLM_MODEL,
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    OPENAI_MODEL,
  } = process.env;

  return {
    apiKey: DESIGN_LLM_API_KEY || OPENAI_API_KEY,
    baseUrl: (DESIGN_LLM_BASE_URL || OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    model: DESIGN_LLM_MODEL || OPENAI_MODEL || 'gpt-4o-mini',
  };
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const prompt = (form.get('prompt') as string) || '이 디자인의 개선점과 추천 색상/폰트/레이아웃을 알려줘.';

    const { apiKey, baseUrl, model } = getDesignEnv();

    if (!apiKey) {
      return NextResponse.json({ error: '서버에 디자인 분석용 LLM API 키가 설정되어 있지 않습니다.' }, { status: 500 });
    }
    if (!file) {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
    }

    const imageDataUrl = await toBase64DataUrl(file);

    const openaiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              '너는 교육/강의용 디자인을 평가하는 UX/UI 컨설턴트다. 가독성, 정보 구조, 색상 대비, 시각적 계층, 인쇄 적합성을 간단히 진단하고 개선안을 제안해라.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      return NextResponse.json(
        { error: `LLM 호출 실패 (${openaiRes.status})`, detail: errorText },
        { status: 500 }
      );
    }

    const data = await openaiRes.json();
    const result = data?.choices?.[0]?.message?.content?.trim() || '';
    return NextResponse.json({ result });
  } catch (err: any) {
    console.error('[api/ai/design]', err);
    return NextResponse.json({ error: err?.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

