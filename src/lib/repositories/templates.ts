import { supabase } from '../supabaseClient';
import { TemplateMeta, TemplateBlock, TemplatePalette, TemplateStatus } from '../types';

// Supabase용 테이블 이름/버킷 이름
const TABLE_TEMPLATES = 'templates';
const TABLE_BLOCKS = 'template_blocks';
const BUCKET_ASSETS = 'template-assets';

// 안전한 기본값
const fallbackPalette: TemplatePalette = {
  name: 'default',
  primary: '#2563eb',
  secondary: '#6366f1',
  accent: '#f59e0b',
  neutral: '#0f172a',
  gradientFrom: '#2563eb',
  gradientTo: '#6366f1',
};

export const emptyTemplate = (name = '새 템플릿'): TemplateMeta => ({
  id: crypto.randomUUID(),
  name,
  category: 'custom',
  status: 'draft',
  palette: fallbackPalette,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  blocks: [
    {
      id: crypto.randomUUID(),
      type: 'text',
      content: { text: '제목을 입력하세요' },
      layout: { x: 80, y: 80, width: 400, height: 80, zIndex: 1 },
      style: {
        textColor: '#0f172a',
        fontSize: 28,
        fontWeight: 700,
        align: 'left',
      },
    },
    {
      id: crypto.randomUUID(),
      type: 'text',
      content: { text: '내용을 입력하세요' },
      layout: { x: 80, y: 180, width: 520, height: 160, zIndex: 1 },
      style: {
        textColor: '#334155',
        fontSize: 16,
        fontWeight: 400,
        align: 'left',
      },
    },
  ],
});

export async function listTemplates(): Promise<TemplateMeta[]> {
  const { data, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLE_TEMPLATES as any)
    .select('*')
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category || 'custom',
    status: (row.status as TemplateStatus) || 'draft',
    palette: (row.palette as TemplatePalette) || fallbackPalette,
    thumbnailUrl: row.thumbnail_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function fetchTemplate(id: string): Promise<TemplateMeta | null> {
  const { data: tpl, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLE_TEMPLATES as any)
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('fetchTemplate error:', error);
    }
    return null;
  }
  if (!tpl) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = tpl as any;

  const { data: blocksData } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLE_BLOCKS as any)
    .select('*')
    .eq('template_id', id)
    .order('z_index', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blockRows = (blocksData ?? []) as any[];
  const blocks: TemplateBlock[] =
    blockRows.map((b) => ({
      id: b.id,
      type: b.type,
      content: b.content ?? {},
      layout: {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        zIndex: b.z_index ?? 1,
      },
      style: b.style ?? {},
      locked: b.locked ?? false,
      hidden: b.hidden ?? false,
    })) ?? [];

  return {
    id: row.id,
    name: row.name,
    category: row.category || 'custom',
    status: (row.status as TemplateStatus) || 'draft',
    palette: (row.palette as TemplatePalette) || fallbackPalette,
    thumbnailUrl: row.thumbnail_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    blocks,
  };
}

export async function saveTemplate(meta: TemplateMeta) {
  // upsert template
  const { error: tplError } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLE_TEMPLATES as any)
    .upsert({
      id: meta.id,
      name: meta.name,
      category: meta.category,
      status: meta.status,
      palette: meta.palette,
      thumbnail_url: meta.thumbnailUrl ?? null,
      updated_at: new Date().toISOString(),
    });

  if (tplError) {
    console.error('Template save error:', tplError);
    throw new Error(`템플릿 저장 실패: ${tplError.message}`);
  }

  if (meta.blocks) {
    // delete old blocks then insert
    const { error: delError } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(TABLE_BLOCKS as any)
      .delete()
      .eq('template_id', meta.id);

    if (delError) {
      console.error('Blocks delete error:', delError);
      throw new Error(`기존 블록 삭제 실패: ${delError.message}`);
    }

    const rows = meta.blocks.map((b) => ({
      id: b.id,
      template_id: meta.id,
      type: b.type,
      content: b.content ?? {},
      x: b.layout.x,
      y: b.layout.y,
      width: b.layout.width,
      height: b.layout.height,
      z_index: b.layout.zIndex ?? 1,
      style: b.style ?? {},
      locked: b.locked ?? false,
      hidden: b.hidden ?? false,
    }));

    if (rows.length) {
      const { error: insError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLE_BLOCKS as any)
        .insert(rows);

      if (insError) {
        console.error('Blocks insert error:', insError);
        throw new Error(`블록 저장 실패: ${insError.message}`);
      }
    }
  }
}

export async function deleteTemplate(id: string) {
  await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLE_BLOCKS as any)
    .delete()
    .eq('template_id', id);
  await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLE_TEMPLATES as any)
    .delete()
    .eq('id', id);
}

export async function uploadTemplateAsset(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET_ASSETS).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return null;
  const { data } = supabase.storage.from(BUCKET_ASSETS).getPublicUrl(path);
  return data.publicUrl;
}

// 프리셋 레이아웃 생성기 (A4 기준 기본 섹션 배치)
export function createDefaultLayout(palette: TemplatePalette): TemplateBlock[] {
  const blocks: TemplateBlock[] = [];
  const add = (b: TemplateBlock) => blocks.push(b);
  const id = () => crypto.randomUUID();
  // 헤더
  add({
    id: id(),
    type: 'box',
    layout: { x: 50, y: 40, width: 690, height: 140, zIndex: 1 },
    style: {
      gradientFrom: palette.gradientFrom || palette.primary,
      gradientTo: palette.gradientTo || palette.secondary || palette.primary,
      radius: 20,
      shadow: true,
    },
  });
  add({
    id: id(),
    type: 'text',
    content: { text: '강의계획서 안내문' },
    layout: { x: 70, y: 70, width: 500, height: 60, zIndex: 2 },
    style: { textColor: '#ffffff', fontSize: 28, fontWeight: 800, align: 'left' },
  });
  add({
    id: id(),
    type: 'text',
    content: { text: '2026 WINTER · 학원명/로고 위치' },
    layout: { x: 70, y: 120, width: 500, height: 40, zIndex: 2 },
    style: { textColor: '#e2e8f0', fontSize: 16, fontWeight: 500, align: 'left' },
  });
  // 학습목표
  add({
    id: id(),
    type: 'text',
    content: { text: '학습목표' },
    layout: { x: 50, y: 210, width: 160, height: 36, zIndex: 2 },
    style: { textColor: palette.primary, fontSize: 18, fontWeight: 700 },
  });
  add({
    id: id(),
    type: 'box',
    layout: { x: 50, y: 250, width: 330, height: 110, zIndex: 1 },
    style: { fill: `${palette.primary}10`, radius: 12, borderColor: palette.primary, borderWidth: 1 },
  });
  add({
    id: id(),
    type: 'text',
    content: { text: '학습 목표 내용을 입력하세요.' },
    layout: { x: 70, y: 260, width: 290, height: 90, zIndex: 2 },
    style: { textColor: '#1f2937', fontSize: 14, fontWeight: 500, align: 'left' },
  });
  // 학습관리
  add({
    id: id(),
    type: 'text',
    content: { text: '학습관리' },
    layout: { x: 410, y: 210, width: 160, height: 36, zIndex: 2 },
    style: { textColor: palette.primary, fontSize: 18, fontWeight: 700 },
  });
  add({
    id: id(),
    type: 'box',
    layout: { x: 410, y: 250, width: 330, height: 110, zIndex: 1 },
    style: { fill: `${palette.secondary || palette.primary}10`, radius: 12, borderColor: palette.secondary || palette.primary, borderWidth: 1 },
  });
  add({
    id: id(),
    type: 'text',
    content: { text: '학습 관리 계획을 입력하세요.' },
    layout: { x: 430, y: 260, width: 290, height: 90, zIndex: 2 },
    style: { textColor: '#1f2937', fontSize: 14, fontWeight: 500, align: 'left' },
  });
  // 담임강사
  add({
    id: id(),
    type: 'text',
    content: { text: '담임강사' },
    layout: { x: 50, y: 380, width: 140, height: 30, zIndex: 2 },
    style: { textColor: palette.primary, fontSize: 16, fontWeight: 700 },
  });
  add({
    id: id(),
    type: 'box',
    layout: { x: 50, y: 410, width: 330, height: 70, zIndex: 1 },
    style: { fill: '#ffffff', borderColor: palette.primary, borderWidth: 1, radius: 10 },
  });
  add({
    id: id(),
    type: 'text',
    content: { text: '강사명 / 연락처 / 안내문구' },
    layout: { x: 70, y: 420, width: 290, height: 50, zIndex: 2 },
    style: { textColor: '#111827', fontSize: 14, fontWeight: 500 },
  });
  // 수업일정
  add({
    id: id(),
    type: 'text',
    content: { text: '수업일정' },
    layout: { x: 410, y: 380, width: 140, height: 30, zIndex: 2 },
    style: { textColor: palette.primary, fontSize: 16, fontWeight: 700 },
  });
  add({
    id: id(),
    type: 'box',
    layout: { x: 410, y: 410, width: 330, height: 70, zIndex: 1 },
    style: { fill: '#ffffff', borderColor: palette.primary, borderWidth: 1, radius: 10 },
  });
  add({
    id: id(),
    type: 'text',
    content: { text: '요일 / 시간 / 장소' },
    layout: { x: 430, y: 420, width: 290, height: 50, zIndex: 2 },
    style: { textColor: '#111827', fontSize: 14, fontWeight: 500 },
  });
  // 과정 및 교재
  add({
    id: id(),
    type: 'text',
    content: { text: '학습과정 및 교재' },
    layout: { x: 50, y: 500, width: 200, height: 30, zIndex: 2 },
    style: { textColor: palette.primary, fontSize: 16, fontWeight: 700 },
  });
  add({
    id: id(),
    type: 'box',
    layout: { x: 50, y: 530, width: 690, height: 110, zIndex: 1 },
    style: { fill: '#ffffff', borderColor: palette.primary, borderWidth: 1, radius: 10 },
  });
  add({
    id: id(),
    type: 'text',
    content: { text: '과정 1 / 교재 1 \n과정 2 / 교재 2' },
    layout: { x: 70, y: 540, width: 650, height: 90, zIndex: 2 },
    style: { textColor: '#1f2937', fontSize: 14, fontWeight: 500, align: 'left' },
  });
  // 주차별 계획
  add({
    id: id(),
    type: 'text',
    content: { text: '주차별 학습계획' },
    layout: { x: 50, y: 660, width: 200, height: 30, zIndex: 2 },
    style: { textColor: palette.primary, fontSize: 16, fontWeight: 700 },
  });
  add({
    id: id(),
    type: 'box',
    layout: { x: 50, y: 690, width: 690, height: 160, zIndex: 1 },
    style: { fill: '#f8fafc', borderColor: '#e5e7eb', borderWidth: 1, radius: 10 },
  });
  add({
    id: id(),
    type: 'text',
    content: { text: '1주차 - 주제/내용\n2주차 - 주제/내용\n3주차 - 주제/내용\n4주차 - 주제/내용' },
    layout: { x: 70, y: 700, width: 650, height: 140, zIndex: 2 },
    style: { textColor: '#1f2937', fontSize: 13, fontWeight: 500, align: 'left' },
  });
  // 수강료 안내
  add({
    id: id(),
    type: 'text',
    content: { text: '수강료 안내' },
    layout: { x: 50, y: 860, width: 200, height: 30, zIndex: 2 },
    style: { textColor: palette.primary, fontSize: 16, fontWeight: 700 },
  });
  add({
    id: id(),
    type: 'box',
    layout: { x: 50, y: 890, width: 690, height: 150, zIndex: 1 },
    style: { fill: '#ffffff', borderColor: palette.primary, borderWidth: 1, radius: 10 },
  });
  add({
    id: id(),
    type: 'text',
    content: { text: '월 / 구분 / 요일 / 시간 / 수강료 / 회차 / 합계' },
    layout: { x: 70, y: 900, width: 650, height: 130, zIndex: 2 },
    style: { textColor: '#1f2937', fontSize: 13, fontWeight: 600, align: 'left' },
  });
  return blocks;
}

