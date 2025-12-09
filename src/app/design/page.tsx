'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import { Upload, Sparkles, ArrowLeft, CheckCircle2, Save, Info } from 'lucide-react';
import { emptyTemplate, createDefaultLayout, saveTemplate } from '@/lib/repositories/templates';
import type { TemplateMeta, TemplatePalette, TemplateBlock } from '@/lib/types';

const DEFAULT_PROMPT =
  [
    '업로드한 이미지를 분석해 강의계획서 템플릿 제안을 JSON으로만 응답해줘.',
    '필수 키:',
    '- palette: primary, secondary, accent, neutral, gradientFrom, gradientTo (HEX)',
    '- typography: titleFont, titleSize, titleWeight, bodyFont, bodySize, bodyWeight',
    '- sections: header, learningGoal, management, schedule, course, weekly, fee, misc (텍스트)',
    '- checklist: 문자열 배열',
    '- summary: 한 줄 요약',
    '마크다운/설명 없이 JSON 한 개만 보내.',
  ].join('\n');

type DesignSuggestion = {
  palette?: Partial<TemplatePalette>;
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

export default function DesignAnalysisPage() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [result, setResult] = useState<string>('');
  const [suggestion, setSuggestion] = useState<DesignSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  useEffect(() => {
    const authPersist = useAuthStore.persist;
    const unsub = authPersist?.onFinishHydration?.(() => setHydrated(true));
    setHydrated(authPersist?.hasHydrated?.() ?? false);
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace('/login');
    }
  }, [hydrated, session, router]);

  const handleFile = (files: FileList | null) => {
    const picked = files?.[0];
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('이미지를 업로드해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult('');
    setSuggestion(null);
    setApplyMessage(null);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('prompt', prompt);

      const res = await fetch('/api/ai/design', { method: 'POST', body: form });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const baseMessage = json.error || json.detail || '디자인 분석에 실패했습니다.';
        const detail = json.detail && json.error ? ` (${String(json.detail).slice(0, 200)})` : '';
        throw new Error(`${baseMessage}${detail}`);
      }
      const json = await res.json();
      setResult(json.result || '');
      setSuggestion(json.suggestion || null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '디자인 분석 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const palettePreview = useMemo(() => {
    const pal = suggestion?.palette;
    if (!pal) return [];
    return [
      { label: 'Primary', value: pal.primary },
      { label: 'Secondary', value: pal.secondary },
      { label: 'Accent', value: pal.accent },
      { label: 'Neutral', value: pal.neutral },
      { label: 'Gradient From', value: pal.gradientFrom },
      { label: 'Gradient To', value: pal.gradientTo },
    ].filter((p) => p.value);
  }, [suggestion]);

  const applySuggestionToTemplate = async () => {
    if (!suggestion) {
      setError('구조화된 제안이 없습니다. 다시 분석해주세요.');
      return;
    }
    if (!session) {
      setError('세션이 만료되었습니다. 다시 로그인해주세요.');
      return;
    }
    setApplying(true);
    setApplyMessage(null);
    setError(null);

    try {
      const nowLabel = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const tpl: TemplateMeta = emptyTemplate(`AI 제안 템플릿 (${nowLabel})`);

      // 팔레트 적용
      if (suggestion.palette) {
        tpl.palette = { ...tpl.palette, ...suggestion.palette };
      }

      // 기본 레이아웃 생성
      tpl.blocks = createDefaultLayout(tpl.palette);

      const setBlockText = (matcher: (b: TemplateBlock) => boolean, text?: string) => {
        if (!text) return;
        const block = tpl.blocks?.find(matcher);
        if (block) {
          block.content = { ...block.content, text };
        }
      };

      // 섹션 텍스트 매핑 (가능한 경우)
      setBlockText((b) => !!b.content?.text?.includes('학습 목표 내용을'), suggestion.sections?.learningGoal);
      setBlockText((b) => !!b.content?.text?.includes('학습 관리 계획을'), suggestion.sections?.management);
      setBlockText((b) => !!b.content?.text?.includes('과정 1 / 교재 1'), suggestion.sections?.course);
      setBlockText((b) => !!b.content?.text?.includes('1주차 -'), suggestion.sections?.weekly);
      setBlockText((b) => !!b.content?.text?.includes('월 / 구분 /'), suggestion.sections?.fee);

      // 요약/체크리스트 블록 추가
      const summaryText = [suggestion.summary, ...(suggestion.checklist || [])]
        .filter(Boolean)
        .map((t) => `- ${t}`)
        .join('\n');
      if (summaryText) {
        tpl.blocks?.push({
          id: crypto.randomUUID(),
          type: 'text',
          content: { text: summaryText },
          layout: { x: 50, y: 1070, width: 690, height: 140, zIndex: (tpl.blocks?.length || 0) + 1 },
          style: { textColor: '#0f172a', fontSize: 14, fontWeight: 500, align: 'left', radius: 8, borderWidth: 1, borderColor: '#e5e7eb', fill: '#f8fafc' },
        });
      }

      await saveTemplate(tpl);
      setApplyMessage('템플릿 초안을 생성하고 저장했습니다. 편집 화면으로 이동합니다.');
      router.push(`/admin/templates/${tpl.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '템플릿 생성에 실패했습니다.';
      setError(message);
    } finally {
      setApplying(false);
    }
  };

  if (!hydrated || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-zinc-500">
        접근 권한을 확인하는 중입니다...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">디자인 분석</h1>
            <p className="text-xs text-zinc-500">이미지를 강의계획서 템플릿으로 전환하기 위한 디자인 분석 도구입니다.</p>
          </div>
          <button
            onClick={() => router.push('/admin/templates')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            템플릿 관리로
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-900">이미지 업로드</h2>
            <label className="block w-full border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files)}
              />
              <div className="flex flex-col items-center gap-2 text-zinc-500 text-xs">
                <Upload className="w-5 h-5" />
                <span>{file ? '이미지 변경하기' : '이미지 선택 또는 드래그'}</span>
              </div>
            </label>
            {preview && (
              <div className="relative w-full aspect-[4/5] bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200">
                <Image src={preview} alt="미리보기" fill className="object-contain" />
              </div>
            )}
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-900">분석 요청</h2>
            <label className="block text-xs font-medium text-zinc-800 mb-1">지시문 (템플릿 제안에 필요한 정보를 자동 포함)</label>
            <textarea
              className="w-full text-xs rounded-lg border border-zinc-300 px-3 py-2 min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? '분석 중...' : 'LLM으로 템플릿 제안받기'}
            </button>
            {suggestion && (
              <div className="text-[11px] text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                JSON 제안이 준비되었습니다. 아래에서 적용할 수 있습니다.
              </div>
            )}
            {error && <div className="text-[11px] text-red-600">{error}</div>}
            {result && (
              <div className="mt-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                {result}
              </div>
            )}
            {suggestion && (
              <div className="mt-2 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-700">
                  <Info className="w-4 h-4" />
                  <span>팔레트 미리보기</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {palettePreview.map((p) => (
                    <div key={p.label} className="flex items-center gap-2 border border-zinc-200 rounded px-2 py-1">
                      <div className="w-5 h-5 rounded border border-zinc-300" style={{ background: p.value as string }} />
                      <div>
                        <div className="text-[11px] text-zinc-500">{p.label}</div>
                        <div className="text-[11px] font-mono text-zinc-800">{p.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={applySuggestionToTemplate}
                    disabled={applying}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {applying ? '적용 중...' : 'AI 제안으로 템플릿 생성'}
                  </button>
                  <button
                    onClick={() => setSuggestion(null)}
                    className="px-3 py-2 text-xs text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-100"
                  >
                    제안 비우기
                  </button>
                </div>
                {applyMessage && <div className="text-[11px] text-green-700">{applyMessage}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

