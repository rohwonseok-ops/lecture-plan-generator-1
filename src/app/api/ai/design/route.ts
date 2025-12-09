import { NextResponse } from 'next/server';
import { recordServerActivity } from '@/lib/serverLogger';

export const runtime = 'nodejs';

interface DesignEnv {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  provider: 'openai' | 'gemini';
}

type DesignSuggestion = {
  palette?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    neutral?: string;
    gradientFrom?: string;
    gradientTo?: string;
  };
  typography?: {
    titleFont?: string;
    titleSize?: number;
    titleWeight?: number;
    bodyFont?: string;
    bodySize?: number;
    bodyWeight?: number;
  };
  sections?: {
    header?: string;
    learningGoal?: string;
    management?: string;
    schedule?: string;
    course?: string;
    weekly?: string;
    fee?: string;
    misc?: string;
  };
  checklist?: string[];
  summary?: string;
  raw?: string;
};

const parseSuggestion = (raw: string): { resultText: string; suggestion?: DesignSuggestion } => {
  const cleaned = raw.trim().replace(/```json/gi, '```').replace(/```/g, '');
  try {
    const parsed = JSON.parse(cleaned);
    return { resultText: raw.trim(), suggestion: { ...(parsed || {}), raw } };
  } catch {
    return { resultText: raw.trim(), suggestion: undefined };
  }
};

const toBase64DataUrl = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || 'image/png';
  return `data:${mime};base64,${buffer.toString('base64')}`;
};

const toBase64 = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString('base64');
};

const truncateText = (value: string | null | undefined, max = 400) => {
  if (!value) return '';
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 3)}...` : cleaned;
};

const safeHost = (value: string | undefined) => {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.host || value;
  } catch {
    return value;
  }
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
    baseUrl: (DESIGN_LLM_BASE_URL || OPENAI_BASE_URL || '').trim(),
    model: (DESIGN_LLM_MODEL || OPENAI_MODEL || '').trim(),
    provider: detectProvider({
      baseUrl: (DESIGN_LLM_BASE_URL || OPENAI_BASE_URL || '').trim(),
      model: (DESIGN_LLM_MODEL || OPENAI_MODEL || '').trim(),
      provider: process.env.DESIGN_LLM_PROVIDER as 'openai' | 'gemini' | undefined,
    }),
  };
};

const detectProvider = (env: { baseUrl: string; model: string; provider?: string }): 'openai' | 'gemini' => {
  if (env.provider === 'gemini') return 'gemini';
  if (env.provider === 'openai') return 'openai';
  if (env.baseUrl.includes('generativelanguage.googleapis.com')) return 'gemini';
  if (env.model.toLowerCase().includes('gemini')) return 'gemini';
  return 'openai';
};

export async function POST(req: Request) {
  const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const prompt =
      (form.get('prompt') as string) ||
      [
        '업로드된 이미지를 분석해 강의계획서 템플릿으로 전환할 지침을 제안해줘.',
        '- 색상 팔레트(주요/보조/배경/강조 HEX 4~6개)',
        '- 제목/본문 폰트 톤과 굵기 계층',
        '- 헤더, 학습목표, 학습관리, 주차별 학습계획, 월간계획 섹션 배치/여백',
        '- 배지·아이콘·테이블 스타일 요약',
        '마지막에 적용 체크리스트 4~6개로 정리.',
      ].join('\n');

    const env = getDesignEnv();
    const { apiKey, baseUrl, model, provider } = env;

    const logActivity = async (status: number, detail: string) => {
      const prefix = [
        `status=${status}`,
        `requestId=${requestId}`,
        provider ? `provider=${provider}` : null,
        model ? `model=${model}` : null,
        baseUrl ? `baseUrl=${safeHost(baseUrl)}` : null,
        file ? `file=${file.type || 'unknown'}(${file.size || 0})` : null,
        prompt ? `prompt=${truncateText(prompt, 200)}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      await recordServerActivity({
        action: 'ai.design',
        detail: `${prefix} | ${detail}`.slice(0, 1000),
      });
    };

    console.info('[api/ai/design] start', { requestId, provider, baseUrl, model, fileType: file?.type, fileSize: file ? file.size : 0 });

    if (!apiKey) {
      console.error('[api/ai/design] missing apiKey', { requestId });
      await logActivity(500, 'missing apiKey');
      return NextResponse.json({ error: '서버에 디자인 분석용 LLM API 키가 설정되어 있지 않습니다.', requestId }, { status: 500 });
    }
    if (!baseUrl || !model) {
      console.error('[api/ai/design] missing baseUrl/model', { requestId });
      await logActivity(500, 'missing baseUrl/model');
      return NextResponse.json({ error: '디자인 분석용 LLM 엔드포인트/모델이 설정되어 있지 않습니다.', requestId }, { status: 500 });
    }
    if (!file) {
      console.error('[api/ai/design] missing file', { requestId });
      await logActivity(400, 'missing file');
      return NextResponse.json({ error: '이미지 파일이 필요합니다.', requestId }, { status: 400 });
    }

    if (provider === 'gemini') {
      const imageBase64 = await toBase64(file);
      const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: [
                    '업로드된 이미지를 분석해 강의계획서 템플릿 제안을 JSON 한 개로 반환해줘.',
                    '키: palette.primary/secondary/accent/neutral/gradientFrom/gradientTo,',
                    'typography.titleFont/titleSize/titleWeight/bodyFont/bodySize/bodyWeight,',
                    'sections.header/learningGoal/management/schedule/course/weekly/fee/misc,',
                    'checklist(문자열 배열), summary(짧은 요약).',
                    '마크다운/설명 없이 JSON만.',
                    '',
                    `사용자 프롬프트: ${prompt}`,
                  ].join('\n'),
                },
                { inline_data: { mime_type: file.type || 'image/png', data: imageBase64 } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 700,
          },
        }),
      });

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        console.error('[api/ai/design] gemini error', { requestId, status: geminiRes.status, errorText });
        await logActivity(
          geminiRes.status,
          `gemini error: ${truncateText(errorText, 400)}`
        );
        return NextResponse.json(
          { error: `LLM 호출 실패 (${geminiRes.status})`, detail: errorText, requestId },
          { status: geminiRes.status }
        );
      }

      const data = await geminiRes.json();
      const rawText =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p?.text || '')
          .join(' ')
          .trim() || '';
      const { resultText, suggestion } = parseSuggestion(rawText);
      console.info('[api/ai/design] gemini success', { requestId, hasSuggestion: !!suggestion });
      await logActivity(200, `gemini success (suggestion=${suggestion ? 'yes' : 'no'})`);
      return NextResponse.json({ result: resultText, suggestion, requestId });
    } else {
      const imageDataUrl = await toBase64DataUrl(file);

      const openaiRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_completion_tokens: 700,
          temperature: 0.4,
          messages: [
            {
              role: 'system',
              content:
                '너는 강의계획서 템플릿을 설계하는 UX/UI 컨설턴트다. 색상/폰트/레이아웃/섹션 구성을 JSON 한 개로만 응답한다.',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: [
                    '업로드된 이미지를 분석해 강의계획서 템플릿 제안을 JSON 한 개로 반환해줘.',
                    '키: palette.primary/secondary/accent/neutral/gradientFrom/gradientTo,',
                    'typography.titleFont/titleSize/titleWeight/bodyFont/bodySize/bodyWeight,',
                    'sections.header/learningGoal/management/schedule/course/weekly/fee/misc,',
                    'checklist(문자열 배열), summary(짧은 요약).',
                    '마크다운/설명 없이 JSON만.',
                    '',
                    `사용자 프롬프트: ${prompt}`,
                  ].join('\n'),
                },
                { type: 'image_url', image_url: { url: imageDataUrl } },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!openaiRes.ok) {
        const errorText = await openaiRes.text();
        console.error('[api/ai/design] openai error', { requestId, status: openaiRes.status, errorText });
        await logActivity(
          openaiRes.status,
          `openai error: ${truncateText(errorText, 400)}`
        );
        return NextResponse.json(
          { error: `LLM 호출 실패 (${openaiRes.status})`, detail: errorText, requestId },
          { status: openaiRes.status }
        );
      }

      const data = await openaiRes.json();
      const rawText = data?.choices?.[0]?.message?.content?.trim() || '';
      const { resultText, suggestion } = parseSuggestion(rawText);
      console.info('[api/ai/design] openai success', { requestId, hasSuggestion: !!suggestion });
      await logActivity(200, `openai success (suggestion=${suggestion ? 'yes' : 'no'})`);
      return NextResponse.json({ result: resultText, suggestion, requestId });
    }
  } catch (err: unknown) {
    console.error('[api/ai/design]', { requestId, err });
    const message = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    await recordServerActivity({
      action: 'ai.design',
      detail: `status=500 | requestId=${requestId} | error=${truncateText(message, 300)}`,
    });
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}

