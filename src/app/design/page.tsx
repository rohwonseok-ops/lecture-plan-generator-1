'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import { Upload, Sparkles, ArrowLeft } from 'lucide-react';

const DEFAULT_PROMPT =
  '이 디자인의 가독성, 정보 구조, 색상 대비, 레이아웃 개선점을 요약해줘. 꼭 필요한 수정 3~5개와 개선 방향을 제안해줘.';

export default function DesignAnalysisPage() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('prompt', prompt);

      const res = await fetch('/api/ai/design', { method: 'POST', body: form });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || '디자인 분석에 실패했습니다.');
      }
      const json = await res.json();
      setResult(json.result || '');
    } catch (err: any) {
      setError(err?.message || '디자인 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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
            <p className="text-xs text-zinc-500">이미지를 업로드해 개선 포인트를 LLM으로 분석합니다.</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            메인으로
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
            <label className="block text-xs font-medium text-zinc-800 mb-1">지시문</label>
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
              {loading ? '분석 중...' : 'LLM으로 분석하기'}
            </button>
            {error && <div className="text-[11px] text-red-600">{error}</div>}
            {result && (
              <div className="mt-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                {result}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

