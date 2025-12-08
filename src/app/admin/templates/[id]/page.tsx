'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toPng } from 'html-to-image';
import { useAuthStore } from '@/store/authStore';
import {
  fetchTemplate,
  saveTemplate,
  uploadTemplateAsset,
  emptyTemplate,
  createDefaultLayout,
} from '@/lib/repositories/templates';
import type { TemplateBlock, TemplateMeta, TemplatePalette, TemplateStatus } from '@/lib/types';

type DragState =
  | { mode: 'idle' }
  | { mode: 'move'; id: string; startX: number; startY: number; origX: number; origY: number; moved: boolean }
  | {
      mode: 'resize';
      id: string;
      edge: 'right' | 'bottom' | 'corner';
      startX: number;
      startY: number;
      origW: number;
      origH: number;
      moved: boolean;
    };

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const CANVAS_SCALE = 0.85; // 캔버스 표시 스케일 (85%)

export default function TemplateEditorPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const { session } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  const [template, setTemplate] = useState<TemplateMeta | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<TemplateStatus>('draft');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>({ mode: 'idle' });
  const [showBlockList, setShowBlockList] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const clipboardRef = useRef<TemplateBlock | null>(null);
  const historyRef = useRef<{ past: TemplateMeta[]; future: TemplateMeta[] }>({ past: [], future: [] });
  const dragSnapshotRef = useRef<TemplateMeta | null>(null);

  // hydration
  useEffect(() => {
    const authPersist = useAuthStore.persist;
    const unsub = authPersist?.onFinishHydration?.(() => setHydrated(true));
    setHydrated(authPersist?.hasHydrated?.() ?? false);
    return () => unsub?.();
  }, []);

  // load template
  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (session.role !== 'admin') {
      router.replace('/');
      return;
    }
    const id = params.id as string;
    const preset = search.get('preset');
    (async () => {
      const tpl = await fetchTemplate(id);
      if (!tpl) {
        const draft = emptyTemplate('새 템플릿');
        draft.id = id;
        if (preset === 'default') {
          draft.blocks = createDefaultLayout(draft.palette);
        }
        setTemplate(draft);
        setSelectedId(draft.blocks?.[0]?.id || null);
      } else {
        setTemplate(tpl);
        setSelectedId(tpl.blocks?.[0]?.id || null);
        setStatus(tpl.status);
      }
    })();
  }, [hydrated, session, router, params.id, search]);

  const blocks = useMemo(() => template?.blocks || [], [template]);
  const selected = useMemo(() => blocks.find((b) => b.id === selectedId), [blocks, selectedId]);

  const pushHistory = useCallback((next: TemplateMeta) => {
    historyRef.current.past.push(JSON.parse(JSON.stringify(next)));
    historyRef.current.future = [];
  }, []);

  const applyTemplate = (next: TemplateMeta) => {
    setTemplate(next);
  };

  const updateBlock = useCallback(
    (id: string, patch: Partial<TemplateBlock>, record = false) => {
      setTemplate((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          blocks: prev.blocks?.map((b) =>
            b.id === id ? { ...b, ...patch, style: { ...b.style, ...(patch.style || {}) } } : b
          ),
        };
        if (record) pushHistory(next);
        return next;
      });
    },
    [pushHistory]
  );

  const addBlock = useCallback(
    (type: TemplateBlock['type']) => {
      const id = crypto.randomUUID();
      setTemplate((prev) => {
        if (!prev) return prev;
        const zIndex = (prev.blocks?.length || 0) + 1;
        const base: TemplateBlock = {
          id,
          type,
          content: type === 'text' ? { text: '텍스트' } : {},
          layout: { x: 120, y: 120, width: 200, height: 80, zIndex },
          style: {
            fill: type === 'box' ? prev.palette.primary : undefined,
            textColor: '#0f172a',
            fontSize: 20,
            fontWeight: 500,
            radius: 12,
            borderWidth: 0,
            shadow: false,
          },
        };
        const next = { ...prev, blocks: [...(prev.blocks || []), base] };
        pushHistory(next);
        return next;
      });
      setSelectedId(id);
    },
    [pushHistory]
  );

  const removeBlock = useCallback(
    (id: string) => {
      setTemplate((prev) => {
        if (!prev) return prev;
        const next = { ...prev, blocks: (prev.blocks || []).filter((b) => b.id !== id) };
        pushHistory(next);
        return next;
      });
      setSelectedId((current) => (current === id ? null : current));
    },
    [pushHistory]
  );

  type TemplatePreset = Omit<TemplateBlock, 'id'>;

  // 섹션 프리셋들
  const presets: Record<
    'header' | 'teacher' | 'schedule' | 'learning' | 'management' | 'course' | 'weekly' | 'fee',
    () => TemplatePreset[]
  > = {
    header: () =>
      [
        {
          type: 'box',
          layout: { x: 50, y: 40, width: 690, height: 140, zIndex: 1 },
          style: {
            gradientFrom: template?.palette.gradientFrom || template?.palette.primary,
            gradientTo: template?.palette.gradientTo || template?.palette.secondary || template?.palette.primary,
            radius: 20,
            shadow: true,
          },
        },
        {
          type: 'text',
          content: { text: '강의계획서 안내문' },
          layout: { x: 70, y: 70, width: 500, height: 60, zIndex: 2 },
          style: { textColor: '#ffffff', fontSize: 36, fontWeight: 800, align: 'left' },
        },
        {
          type: 'text',
          content: { text: '계절/학기 · 학원명/로고 위치' },
          layout: { x: 70, y: 120, width: 500, height: 40, zIndex: 2 },
          style: { textColor: '#e2e8f0', fontSize: 20, fontWeight: 500, align: 'left' },
        },
      ],
    teacher: () =>
      [
        {
          type: 'text',
          content: { text: '담임강사' },
          layout: { x: 50, y: 200, width: 140, height: 30, zIndex: 2 },
          style: { textColor: template?.palette.primary, fontSize: 22, fontWeight: 700 },
        },
        {
          type: 'box',
          layout: { x: 50, y: 230, width: 330, height: 70, zIndex: 1 },
          style: { fill: '#ffffff', borderColor: template?.palette.primary, borderWidth: 1, radius: 10 },
        },
        {
          type: 'text',
          content: { text: '강사명 / 연락처 / 안내문구' },
          layout: { x: 70, y: 240, width: 290, height: 50, zIndex: 2 },
          style: { textColor: '#111827', fontSize: 18, fontWeight: 500 },
        },
      ],
    schedule: () =>
      [
        {
          type: 'text',
          content: { text: '수업일정' },
          layout: { x: 410, y: 200, width: 140, height: 30, zIndex: 2 },
          style: { textColor: template?.palette.primary, fontSize: 22, fontWeight: 700 },
        },
        {
          type: 'box',
          layout: { x: 410, y: 230, width: 330, height: 70, zIndex: 1 },
          style: { fill: '#ffffff', borderColor: template?.palette.primary, borderWidth: 1, radius: 10 },
        },
        {
          type: 'text',
          content: { text: '요일 / 시간 / 장소' },
          layout: { x: 430, y: 240, width: 290, height: 50, zIndex: 2 },
          style: { textColor: '#111827', fontSize: 18, fontWeight: 500 },
        },
      ],
    learning: () =>
      [
        {
          type: 'text',
          content: { text: '학습목표' },
          layout: { x: 50, y: 320, width: 160, height: 36, zIndex: 2 },
          style: { textColor: template?.palette.primary, fontSize: 24, fontWeight: 700 },
        },
        {
          type: 'box',
          layout: { x: 50, y: 360, width: 330, height: 110, zIndex: 1 },
          style: { fill: `${template?.palette.primary}10`, radius: 12, borderColor: template?.palette.primary, borderWidth: 1 },
        },
        {
          type: 'text',
          content: { text: '학습 목표 내용을 입력하세요.' },
          layout: { x: 70, y: 370, width: 290, height: 90, zIndex: 2 },
          style: { textColor: '#1f2937', fontSize: 18, fontWeight: 500, align: 'left' },
        },
      ],
    management: () =>
      [
        {
          type: 'text',
          content: { text: '학습관리' },
          layout: { x: 410, y: 320, width: 160, height: 36, zIndex: 2 },
          style: { textColor: template?.palette.primary, fontSize: 24, fontWeight: 700 },
        },
        {
          type: 'box',
          layout: { x: 410, y: 360, width: 330, height: 110, zIndex: 1 },
          style: { fill: `${template?.palette.secondary || template?.palette.primary}10`, radius: 12, borderColor: template?.palette.secondary || template?.palette.primary, borderWidth: 1 },
        },
        {
          type: 'text',
          content: { text: '학습 관리 계획을 입력하세요.' },
          layout: { x: 430, y: 370, width: 290, height: 90, zIndex: 2 },
          style: { textColor: '#1f2937', fontSize: 18, fontWeight: 500, align: 'left' },
        },
      ],
    course: () =>
      [
        {
          type: 'text',
          content: { text: '학습과정 및 교재' },
          layout: { x: 50, y: 490, width: 200, height: 30, zIndex: 2 },
          style: { textColor: template?.palette.primary, fontSize: 22, fontWeight: 700 },
        },
        {
          type: 'box',
          layout: { x: 50, y: 520, width: 690, height: 110, zIndex: 1 },
          style: { fill: '#ffffff', borderColor: template?.palette.primary, borderWidth: 1, radius: 10 },
        },
        {
          type: 'text',
          content: { text: '과정 1 / 교재 1 \n과정 2 / 교재 2' },
          layout: { x: 70, y: 530, width: 650, height: 90, zIndex: 2 },
          style: { textColor: '#1f2937', fontSize: 18, fontWeight: 500, align: 'left' },
        },
      ],
    weekly: () =>
      [
        {
          type: 'text',
          content: { text: '주차별 학습계획' },
          layout: { x: 50, y: 650, width: 200, height: 30, zIndex: 2 },
          style: { textColor: template?.palette.primary, fontSize: 22, fontWeight: 700 },
        },
        {
          type: 'box',
          layout: { x: 50, y: 680, width: 690, height: 160, zIndex: 1 },
          style: { fill: '#f8fafc', borderColor: '#e5e7eb', borderWidth: 1, radius: 10 },
        },
        {
          type: 'text',
          content: { text: '1주차 - 주제/내용\n2주차 - 주제/내용\n3주차 - 주제/내용\n4주차 - 주제/내용' },
          layout: { x: 70, y: 690, width: 650, height: 140, zIndex: 2 },
          style: { textColor: '#1f2937', fontSize: 17, fontWeight: 500, align: 'left' },
        },
      ],
    fee: () =>
      [
        {
          type: 'text',
          content: { text: '수강료 안내' },
          layout: { x: 50, y: 850, width: 200, height: 30, zIndex: 2 },
          style: { textColor: template?.palette.primary, fontSize: 22, fontWeight: 700 },
        },
        {
          type: 'box',
          layout: { x: 50, y: 880, width: 690, height: 150, zIndex: 1 },
          style: { fill: '#ffffff', borderColor: template?.palette.primary, borderWidth: 1, radius: 10 },
        },
        {
          type: 'text',
          content: { text: '월 / 구분 / 요일 / 시간 / 수강료 / 회차 / 합계' },
          layout: { x: 70, y: 890, width: 650, height: 130, zIndex: 2 },
          style: { textColor: '#1f2937', fontSize: 17, fontWeight: 600, align: 'left' },
        },
      ],
  };

  const addPreset = (name: keyof typeof presets) => {
    if (!template) return;
    const nextBlocks = [...(template.blocks || [])];
    presets[name]().forEach((p) => {
      nextBlocks.push({
        id: crypto.randomUUID(),
        ...p,
      });
    });
    setTemplate({ ...template, blocks: nextBlocks });
    setSelectedId(nextBlocks[nextBlocks.length - 1]?.id || null);
  };

  // 단축키: Ctrl+Z/Y, Ctrl+C/V, Delete
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!template) return;
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const past = historyRef.current.past;
        if (past.length) {
          const current = JSON.parse(JSON.stringify(template));
          const prev = past.pop()!;
          historyRef.current.future.unshift(current);
          applyTemplate(prev);
          setSelectedId(null);
        }
      }
      if (isCtrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        const future = historyRef.current.future;
        if (future.length) {
          const current = JSON.parse(JSON.stringify(template));
          const next = future.shift()!;
          historyRef.current.past.push(current);
          applyTemplate(next);
          setSelectedId(null);
        }
      }
      if (isCtrl && e.key.toLowerCase() === 'c') {
        if (selected) {
          clipboardRef.current = JSON.parse(JSON.stringify(selected));
        }
      }
      if (isCtrl && e.key.toLowerCase() === 'v') {
        if (clipboardRef.current) {
          const clone = JSON.parse(JSON.stringify(clipboardRef.current)) as TemplateBlock;
          clone.id = crypto.randomUUID();
          clone.layout.x = Math.min(A4_WIDTH - clone.layout.width, clone.layout.x + 20);
          clone.layout.y = Math.min(A4_HEIGHT - clone.layout.height, clone.layout.y + 20);
          setTemplate((prev) => {
            if (!prev) return prev;
            const next = { ...prev, blocks: [...(prev.blocks || []), clone] };
            pushHistory(next);
            return next;
          });
          setSelectedId(clone.id);
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          removeBlock(selectedId);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [template, selected, selectedId, removeBlock, pushHistory]);

  const applyDefaultLayout = () => {
    if (!template) return;
    setTemplate({ ...template, blocks: createDefaultLayout(template.palette) });
    setSelectedId(null);
    setMessage('기본 레이아웃을 배치했습니다.');
  };

  const handleDragStart = (e: React.MouseEvent, block: TemplateBlock) => {
    e.stopPropagation();
    setSelectedId(block.id);
    dragSnapshotRef.current = template ? JSON.parse(JSON.stringify(template)) : null;
    setDrag({
      mode: 'move',
      id: block.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: block.layout.x,
      origY: block.layout.y,
      moved: false,
    });
  };

  const handleResizeStart = (e: React.MouseEvent, block: TemplateBlock, edge: 'right' | 'bottom' | 'corner') => {
    e.stopPropagation();
    setSelectedId(block.id);
    dragSnapshotRef.current = template ? JSON.parse(JSON.stringify(template)) : null;
    setDrag({
      mode: 'resize',
      id: block.id,
      edge,
      startX: e.clientX,
      startY: e.clientY,
      origW: block.layout.width,
      origH: block.layout.height,
      moved: false,
    });
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (drag.mode === 'idle') return;
      const target = blocks.find((b) => b.id === drag.id);
      if (drag.mode === 'move' && target) {
        // 스케일 보정: 화면상 이동 거리를 실제 좌표로 변환
        const dx = (e.clientX - drag.startX) / CANVAS_SCALE;
        const dy = (e.clientY - drag.startY) / CANVAS_SCALE;
        updateBlock(
          drag.id,
          {
            layout: {
              ...target.layout,
              x: Math.max(0, Math.min(A4_WIDTH - 20, drag.origX + dx)),
              y: Math.max(0, Math.min(A4_HEIGHT - 20, drag.origY + dy)),
            },
          },
          false
        );
        setDrag({ ...drag, moved: true });
      }
      if (drag.mode === 'resize' && target) {
        // 스케일 보정: 화면상 이동 거리를 실제 좌표로 변환
        const dx = (e.clientX - drag.startX) / CANVAS_SCALE;
        const dy = (e.clientY - drag.startY) / CANVAS_SCALE;
        const w = Math.max(60, drag.origW + dx);
        const h = Math.max(40, drag.origH + dy);
        updateBlock(
          drag.id,
          {
            layout: {
              ...target.layout,
              width: w,
              height: h,
            },
          },
          false
        );
        setDrag({ ...drag, moved: true });
      }
    };
    const onUp = () => {
      if (drag.mode !== 'idle' && drag.moved && dragSnapshotRef.current) {
        pushHistory(dragSnapshotRef.current);
      }
      setDrag({ mode: 'idle' });
      dragSnapshotRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, blocks, updateBlock, pushHistory]);

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    await saveTemplate({ ...template, status });
    setMessage('저장 완료');
    setSaving(false);
  };

  const handleUploadImage = async (file: File, blockId?: string) => {
    setError(null);
    const url = await uploadTemplateAsset(file);
    if (!url) {
      setError('이미지 업로드에 실패했습니다. (버킷 준비 필요)');
      return;
    }
    if (blockId) {
      updateBlock(blockId, {
        type: 'image',
        content: { imageUrl: url },
      });
    } else {
      addBlock('image');
      setTemplate((prev) => {
        if (!prev) return prev;
        const lastId = prev.blocks?.[prev.blocks.length - 1]?.id;
        return {
          ...prev,
          blocks: prev.blocks?.map((b) =>
            b.id === lastId ? { ...b, content: { imageUrl: url }, style: { ...b.style, fill: undefined } } : b,
          ),
        };
      });
    }
  };

  const updatePalette = (patch: Partial<TemplatePalette>) => {
    setTemplate((prev) => (prev ? { ...prev, palette: { ...prev.palette, ...patch } } : prev));
  };

  const handleSaveThumbnail = async () => {
    if (!canvasRef.current || !template) return;
    try {
      const dataUrl = await toPng(canvasRef.current, { cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'thumbnail.png', { type: 'image/png' });
      const url = await uploadTemplateAsset(file);
      if (!url) {
        setError('썸네일 업로드에 실패했습니다.');
        return;
      }
      const next = { ...template, thumbnailUrl: url };
      await saveTemplate(next);
      setTemplate(next);
      setMessage('썸네일을 저장했습니다.');
    } catch {
      setError('썸네일 생성에 실패했습니다.');
    }
  };

  if (!hydrated || !session) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-zinc-500">로그인 확인 중...</div>;
  }
  if (session.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center text-xs text-zinc-500">관리자만 접근 가능합니다.</div>;
  }
  if (!template) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-zinc-500">불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto py-6 px-5 flex flex-col gap-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/admin/templates')}
              className="px-2 py-1 text-xs bg-white border border-zinc-200 rounded hover:bg-zinc-100"
            >
              ← 목록
            </button>
            <input
              className="text-base font-bold text-zinc-900 bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TemplateStatus)}
              className="text-xs border border-zinc-200 rounded px-2 py-1 bg-white"
            >
              <option value="draft">초안</option>
              <option value="official">공식</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {message && <span className="text-xs text-green-600">{message}</span>}
            {error && <span className="text-xs text-red-600">{error}</span>}
            <button
              onClick={handleSaveThumbnail}
              className="px-2.5 py-1 text-xs bg-white border border-zinc-200 rounded hover:bg-zinc-100"
            >
              썸네일 저장
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[360px_1fr] gap-4 min-h-[80vh]">
          {/* 좌측 패널 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-2.5 shadow-sm space-y-2.5">
            <h3 className="text-sm font-semibold text-zinc-800">프리셋 섹션</h3>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => addPreset('header')} className="px-1.5 py-0.5 text-xs bg-zinc-100 rounded hover:bg-zinc-200">헤더</button>
              <button onClick={() => addPreset('teacher')} className="px-1.5 py-0.5 text-xs bg-zinc-100 rounded hover:bg-zinc-200">담임강사</button>
              <button onClick={() => addPreset('schedule')} className="px-1.5 py-0.5 text-xs bg-zinc-100 rounded hover:bg-zinc-200">수업일정</button>
              <button onClick={() => addPreset('learning')} className="px-1.5 py-0.5 text-xs bg-zinc-100 rounded hover:bg-zinc-200">학습목표</button>
              <button onClick={() => addPreset('management')} className="px-1.5 py-0.5 text-xs bg-zinc-100 rounded hover:bg-zinc-200">학습관리</button>
              <button onClick={() => addPreset('course')} className="px-1.5 py-0.5 text-xs bg-zinc-100 rounded hover:bg-zinc-200">과정/교재</button>
              <button onClick={() => addPreset('weekly')} className="px-1.5 py-0.5 text-xs bg-zinc-100 rounded hover:bg-zinc-200">주차별</button>
              <button onClick={() => addPreset('fee')} className="px-1.5 py-0.5 text-xs bg-zinc-100 rounded hover:bg-zinc-200">수강료</button>
            </div>

            <button
              onClick={applyDefaultLayout}
              className="w-full px-2 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
            >
              기본 레이아웃 한 번에 배치
            </button>

            <h3 className="text-sm font-semibold text-zinc-800">개별 블록 추가</h3>
            <div className="flex gap-1.5">
              <button onClick={() => addBlock('text')} className="px-1.5 py-0.5 text-xs bg-zinc-100 rounded hover:bg-zinc-200 flex items-center gap-1">
                🅣 텍스트
              </button>
              <button onClick={() => addBlock('box')} className="px-1.5 py-0.5 text-xs bg-zinc-100 rounded hover:bg-zinc-200 flex items-center gap-1">
                ▭ 박스
              </button>
              <label className="px-1.5 py-0.5 text-xs bg-zinc-100 rounded hover:bg-zinc-200 cursor-pointer flex items-center gap-1">
                🖼️ 이미지
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(file);
                  }}
                />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-700">블록 목록</h4>
              <button
                onClick={() => setShowBlockList((v) => !v)}
                className="text-xs text-blue-600 hover:underline"
              >
                {showBlockList ? '숨기기' : '펼치기'}
              </button>
            </div>
            {showBlockList && (
              <div className="space-y-1 max-h-[30vh] overflow-auto pr-1">
                {blocks.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    className={`px-1.5 py-0.5 text-xs rounded border ${
                      selectedId === b.id ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 bg-white'
                    } flex items-center justify-between`}
                  >
                    <span>{b.type} · z{b.layout.zIndex}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBlock(b.id);
                      }}
                      className="text-[10px] text-red-500"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}

            <PaletteEditor palette={template.palette} onChange={updatePalette} />
            <ImageStyleCopy onApplyPalette={(p) => updatePalette(p)} />
            <StylePanel block={selected} onChange={(patch) => selected && updateBlock(selected.id, patch)} onUpload={handleUploadImage} />
          </div>

          {/* 캔버스 */}
          <div className="bg-zinc-100 border border-zinc-200 rounded-xl shadow-inner flex items-center justify-center relative overflow-auto p-4">
            <div
              style={{
                width: A4_WIDTH * CANVAS_SCALE,
                height: A4_HEIGHT * CANVAS_SCALE,
                flexShrink: 0,
              }}
            >
              <div
                ref={canvasRef}
                className="relative bg-white border border-zinc-200 shadow-lg origin-top-left"
                style={{
                  width: A4_WIDTH,
                  height: A4_HEIGHT,
                  transform: `scale(${CANVAS_SCALE})`,
                }}
                onMouseDown={() => setSelectedId(null)}
              >
                {blocks.map((b) => (
                  <div
                    key={b.id}
                    className={`absolute ${b.locked ? 'pointer-events-none' : 'cursor-move'}`}
                    style={{
                      left: b.layout.x,
                      top: b.layout.y,
                      width: b.layout.width,
                      height: b.layout.height,
                      zIndex: b.layout.zIndex ?? 1,
                    }}
                    onMouseDown={(e) => handleDragStart(e, b)}
                  >
                    <BlockView block={b} palette={template.palette} />
                    {/* 리사이즈 핸들 */}
                    <div
                      className="absolute right-0 bottom-0 w-2 h-2 bg-blue-500 rounded-sm cursor-se-resize"
                      onMouseDown={(e) => handleResizeStart(e, b, 'corner')}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function BlockView({ block, palette }: { block: TemplateBlock; palette: TemplatePalette }) {
  const style = block.style;
  const bg = style.gradientFrom && style.gradientTo
    ? `linear-gradient(135deg, ${style.gradientFrom}, ${style.gradientTo})`
    : style.fill;
  const border = style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor || palette.primary}` : undefined;
  const boxShadow = style.shadow ? '0 10px 24px rgba(15,23,42,0.18)' : undefined;

  if (block.type === 'image' && block.content?.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={block.content.imageUrl}
        alt=""
        className="w-full h-full object-cover rounded"
        style={{ borderRadius: style.radius, border, boxShadow, opacity: style.opacity ?? 1 }}
      />
    );
  }

  if (block.type === 'box') {
    return (
      <div
        className="w-full h-full"
        style={{
          background: bg || palette.primary,
          borderRadius: style.radius ?? 12,
          border,
          boxShadow,
          opacity: style.opacity ?? 1,
        }}
      ></div>
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-start px-3"
      style={{
        color: style.textColor || palette.neutral || '#0f172a',
        fontSize: style.fontSize || 20,
        fontWeight: style.fontWeight || 500,
        textAlign: style.align || 'left',
        background: bg,
        borderRadius: style.radius ?? 0,
        border,
        boxShadow,
        opacity: style.opacity ?? 1,
        lineHeight: 1.35,
        whiteSpace: 'pre-wrap',
      }}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        block.content = { ...block.content, text: e.currentTarget.innerText };
      }}
    >
      {block.content?.text || '텍스트'}
    </div>
  );
}

function PaletteEditor({
  palette,
  onChange,
}: {
  palette: TemplatePalette;
  onChange: (patch: Partial<TemplatePalette>) => void;
}) {
  const ColorInput = ({ label, keyName }: { label: string; keyName: keyof TemplatePalette }) => (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-zinc-600">{label}</span>
      <input
        type="color"
        value={(palette[keyName] as string) || '#ffffff'}
        onChange={(e) => onChange({ [keyName]: e.target.value } as Partial<TemplatePalette>)}
        className="w-8 h-5 p-0 border border-zinc-200 rounded"
      />
    </div>
  );
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-zinc-800">테마 색상</h3>
      <ColorInput label="Primary" keyName="primary" />
      <ColorInput label="Secondary" keyName="secondary" />
      <ColorInput label="Accent" keyName="accent" />
      <ColorInput label="Gradient From" keyName="gradientFrom" />
      <ColorInput label="Gradient To" keyName="gradientTo" />
    </div>
  );
}

function ImageStyleCopy({ onApplyPalette }: { onApplyPalette: (palette: Partial<TemplatePalette>) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Vision API와 연동하여 팔레트/레이아웃 추출
      // 현재는 간단히 임시 팔레트만 추출해 적용 (추후 vision 호출로 교체)
      const fakePalette: Partial<TemplatePalette> = {
        primary: '#2563eb',
        secondary: '#6366f1',
        accent: '#f59e0b',
        gradientFrom: '#2563eb',
        gradientTo: '#6366f1',
      };
      onApplyPalette(fakePalette);
    } catch {
      setError('스타일 추출에 실패했습니다. API 키 연동 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5 border-t border-zinc-200 pt-2">
      <div className="text-sm font-semibold text-zinc-800">이미지로 스타일 적용</div>
      <label className="text-xs text-blue-600 cursor-pointer inline-flex items-center gap-2">
        {loading ? '추출 중...' : '이미지 업로드'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload();
          }}
        />
      </label>
      {error && <div className="text-xs text-red-600">{error}</div>}
      <div className="text-xs text-zinc-500">Vision API 키 연동 시 팔레트/레이아웃을 자동 제안합니다.</div>
    </div>
  );
}

function StylePanel({
  block,
  onChange,
  onUpload,
}: {
  block: TemplateBlock | undefined;
  onChange: (patch: Partial<TemplateBlock>) => void;
  onUpload: (file: File, blockId?: string) => void;
}) {
  if (!block) {
    return <div className="text-xs text-zinc-500">블록을 선택하세요.</div>;
  }

  const setStyle = (patch: Partial<TemplateBlock['style']>) => onChange({ style: { ...block.style, ...patch } });

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-zinc-800 text-sm">선택: {block.type}</div>
        <span className="text-xs text-zinc-500">z{block.layout.zIndex}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-zinc-500">너비</span>
          <input
            type="number"
            value={block.layout.width}
            onChange={(e) => onChange({ layout: { ...block.layout, width: Number(e.target.value) } })}
            className="border border-zinc-200 rounded px-1.5 py-0.5 text-xs"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-zinc-500">높이</span>
          <input
            type="number"
            value={block.layout.height}
            onChange={(e) => onChange({ layout: { ...block.layout, height: Number(e.target.value) } })}
            className="border border-zinc-200 rounded px-1.5 py-0.5 text-xs"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-zinc-500">X</span>
          <input
            type="number"
            value={block.layout.x}
            onChange={(e) => onChange({ layout: { ...block.layout, x: Number(e.target.value) } })}
            className="border border-zinc-200 rounded px-1.5 py-0.5 text-xs"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-zinc-500">Y</span>
          <input
            type="number"
            value={block.layout.y}
            onChange={(e) => onChange({ layout: { ...block.layout, y: Number(e.target.value) } })}
            className="border border-zinc-200 rounded px-1.5 py-0.5 text-xs"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-zinc-500">Radius</span>
          <input
            type="number"
            value={block.style.radius ?? 0}
            onChange={(e) => setStyle({ radius: Number(e.target.value) })}
            className="border border-zinc-200 rounded px-1.5 py-0.5 text-xs"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-zinc-500">Opacity</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={block.style.opacity ?? 1}
            onChange={(e) => setStyle({ opacity: Number(e.target.value) })}
            className="w-full"
          />
        </label>
      </div>

      <div className="border-t border-zinc-200 pt-1.5 space-y-1.5">
        <div className="text-xs font-semibold text-zinc-700">색 / 그라데이션</div>
        <div className="flex items-center justify-between text-xs">
          <span>Fill</span>
          <input
            type="color"
            value={block.style.fill || '#ffffff'}
            onChange={(e) => setStyle({ fill: e.target.value })}
            className="w-8 h-5 p-0 border border-zinc-200 rounded"
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span>Gradient From</span>
          <input
            type="color"
            value={block.style.gradientFrom || '#ffffff'}
            onChange={(e) => setStyle({ gradientFrom: e.target.value })}
            className="w-8 h-5 p-0 border border-zinc-200 rounded"
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span>Gradient To</span>
          <input
            type="color"
            value={block.style.gradientTo || '#ffffff'}
            onChange={(e) => setStyle({ gradientTo: e.target.value })}
            className="w-8 h-5 p-0 border border-zinc-200 rounded"
          />
        </div>
      </div>

      {block.type !== 'image' && (
        <div className="border-t border-zinc-200 pt-1.5 space-y-1.5">
        <div className="text-xs font-semibold text-zinc-700">텍스트</div>
        <label className="flex items-center justify-between text-xs">
            <span>색</span>
            <input
              type="color"
              value={block.style.textColor || '#0f172a'}
              onChange={(e) => setStyle({ textColor: e.target.value })}
              className="w-8 h-5 p-0 border border-zinc-200 rounded"
            />
          </label>
        <label className="flex items-center justify-between text-xs">
            <span>크기</span>
            <input
              type="number"
              value={block.style.fontSize || 16}
              onChange={(e) => setStyle({ fontSize: Number(e.target.value) })}
            className="w-14 text-xs border border-zinc-200 rounded px-1.5 py-0.5"
            />
          </label>
        <label className="flex items-center justify-between text-xs">
            <span>굵기</span>
            <input
              type="number"
              value={block.style.fontWeight || 500}
              onChange={(e) => setStyle({ fontWeight: Number(e.target.value) })}
            className="w-14 text-xs border border-zinc-200 rounded px-1.5 py-0.5"
            />
          </label>
        <label className="flex items-center justify-between text-xs">
            <span>정렬</span>
            <select
              value={block.style.align || 'left'}
              onChange={(e) => setStyle({ align: e.target.value as TemplateBlock['style']['align'] })}
            className="border border-zinc-200 rounded px-1.5 py-0.5 text-xs"
            >
              <option value="left">왼쪽</option>
              <option value="center">가운데</option>
              <option value="right">오른쪽</option>
            </select>
          </label>
        </div>
      )}

      <div className="border-t border-zinc-200 pt-1.5 space-y-1.5">
        <div className="text-xs font-semibold text-zinc-700">보더/섀도우</div>
        <label className="flex items-center justify-between text-xs">
          <span>Border</span>
          <input
            type="number"
            value={block.style.borderWidth || 0}
            onChange={(e) => setStyle({ borderWidth: Number(e.target.value) })}
            className="w-14 text-xs border border-zinc-200 rounded px-1.5 py-0.5"
          />
        </label>
        <label className="flex items-center justify-between text-xs">
          <span>Border Color</span>
          <input
            type="color"
            value={block.style.borderColor || '#e5e7eb'}
            onChange={(e) => setStyle({ borderColor: e.target.value })}
            className="w-8 h-5 p-0 border border-zinc-200 rounded"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={block.style.shadow || false}
            onChange={(e) => setStyle({ shadow: e.target.checked })}
            className="w-3 h-3"
          />
          <span>Shadow</span>
        </label>
      </div>

      {block.type === 'image' && (
        <div className="border-t border-zinc-200 pt-1.5 space-y-1.5">
        <div className="text-xs font-semibold text-zinc-700">이미지</div>
        <label className="text-xs text-blue-600 cursor-pointer">
            이미지 교체
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file, block.id);
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}


