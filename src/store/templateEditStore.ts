import { create } from 'zustand';
import { ElementLayout, TemplateLayoutConfig, TemplateCategory } from '@/lib/types';

// ========================================
// 레이아웃 값 범위 제한 상수
// ========================================

/** 위치 이동(x, y)의 최대 절대값 (px) */
export const LAYOUT_POSITION_LIMIT = 50;

/** 크기 조정(width, height)의 최대 절대값 (px) */
export const LAYOUT_SIZE_LIMIT = 30;

// ========================================
// 값 범위 제한 함수
// ========================================

/**
 * 위치 값을 허용 범위 내로 클램핑
 * @param value 원본 값
 * @returns 제한된 값 (-50 ~ 50)
 */
export const clampPosition = (value: number): number => {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  return Math.max(-LAYOUT_POSITION_LIMIT, Math.min(LAYOUT_POSITION_LIMIT, value));
};

/**
 * 크기 값을 허용 범위 내로 클램핑
 * @param value 원본 값
 * @returns 제한된 값 (-30 ~ 30)
 */
export const clampSize = (value: number): number => {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  return Math.max(-LAYOUT_SIZE_LIMIT, Math.min(LAYOUT_SIZE_LIMIT, value));
};

/**
 * ElementLayout 객체의 모든 값을 정규화
 * @param layout 원본 레이아웃
 * @returns 정규화된 레이아웃
 */
export const normalizeElementLayout = (layout: Partial<ElementLayout>): Partial<ElementLayout> => {
  const normalized: Partial<ElementLayout> = {};
  
  if (layout.x !== undefined) normalized.x = clampPosition(layout.x);
  if (layout.y !== undefined) normalized.y = clampPosition(layout.y);
  if (layout.width !== undefined) normalized.width = clampSize(layout.width);
  if (layout.height !== undefined) normalized.height = clampSize(layout.height);
  
  return normalized;
};

/**
 * 위치 값이 유효한 범위 내인지 확인
 */
export const isValidPosition = (val: unknown): val is number =>
  typeof val === 'number' && !isNaN(val) && Math.abs(val) <= LAYOUT_POSITION_LIMIT;

/**
 * 크기 값이 유효한 범위 내인지 확인
 */
export const isValidSize = (val: unknown): val is number =>
  typeof val === 'number' && !isNaN(val) && Math.abs(val) <= LAYOUT_SIZE_LIMIT;

// ========================================

// 원본 DOM 스타일 저장용 인터페이스
interface OriginalDOMStyle {
  transform: string;
  width: string;
  height: string;
}

interface TemplateEditState {
  // 편집 모드 상태
  isEditMode: boolean;
  setEditMode: (mode: boolean) => void;
  toggleEditMode: () => void;

  // 현재 편집 중인 레이아웃 설정
  pendingLayoutChanges: Record<string, Partial<ElementLayout>>;
  baseLayoutConfig: TemplateLayoutConfig | null;
  setBaseLayoutConfig: (config: TemplateLayoutConfig | null) => void;
  getBaseLayoutForSection: (elementId: string) => ElementLayout | undefined;
  
  // 레이아웃 변경 처리
  updateElementLayout: (elementId: string, layout: Partial<ElementLayout>) => void;
  
  // 변경사항 저장/취소
  getPendingChanges: () => TemplateLayoutConfig;
  clearPendingChanges: () => void;
  
  // 스타일 카테고리 전체 적용 옵션
  applyToCategory: boolean;
  setApplyToCategory: (apply: boolean) => void;
  
  // 선택된 스타일 카테고리
  selectedCategory: TemplateCategory | null;
  setSelectedCategory: (category: TemplateCategory | null) => void;
  
  // 원본 DOM 스타일 저장 (취소 시 복구용)
  originalDOMStyles: Record<string, OriginalDOMStyle>;
  saveOriginalDOMStyle: (elementId: string, style: OriginalDOMStyle) => void;
  getOriginalDOMStyle: (elementId: string) => OriginalDOMStyle | undefined;
  clearOriginalDOMStyles: () => void;
  
  // 저장 플래그 (저장 vs 취소 구분)
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}

// 요소 ID를 TemplateLayoutConfig 키로 매핑 (DOM data-section-id → config key)
export const sectionIdToConfigKey: Record<string, keyof TemplateLayoutConfig> = {
  'header': 'header',
  'target-student': 'targetStudent',
  'etc': 'etc',
  'parent-intro': 'parentIntro',
  'teacher-info': 'teacherInfo',
  'schedule-info': 'scheduleInfo',
  'course-info': 'courseInfo',
  'learning-goal': 'learningGoal',
  'management': 'management',
  'weekly-plan': 'weeklyPlan',
  'monthly-calendar': 'monthlyCalendar',
  'fee-table': 'feeTable',
};

export const useTemplateEditStore = create<TemplateEditState>()((set, get) => ({
  isEditMode: false,
  setEditMode: (mode) => set({ isEditMode: mode }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

  pendingLayoutChanges: {},
  baseLayoutConfig: null,
  setBaseLayoutConfig: (config) => set({ baseLayoutConfig: config ? { ...config } : null }),
  getBaseLayoutForSection: (elementId) => {
    const key = sectionIdToConfigKey[elementId];
    const base = get().baseLayoutConfig;
    if (!key || !base) return undefined;
    return base[key];
  },
  
  updateElementLayout: (elementId, layout) => {
    set((state) => ({
      pendingLayoutChanges: {
        ...state.pendingLayoutChanges,
        [elementId]: {
          ...state.pendingLayoutChanges[elementId],
          ...layout,
        },
      },
    }));
  },
  
  getPendingChanges: () => {
    const { pendingLayoutChanges, applyToCategory, baseLayoutConfig } = get();
    // 기존 레이아웃(저장된 값)을 기본값으로 두고, 변경분을 덮어씀
    const config: TemplateLayoutConfig = {
      ...(baseLayoutConfig || {}),
      applyToCategory,
    };
    
    Object.entries(pendingLayoutChanges).forEach(([elementId, layout]) => {
      const configKey = sectionIdToConfigKey[elementId];
      if (configKey && configKey !== 'applyToCategory') {
        // 저장 시 값 정규화 - 범위를 벗어난 값 클램핑
        const normalizedLayout = normalizeElementLayout(layout);
        (config as Record<string, ElementLayout | undefined>)[configKey] = normalizedLayout as ElementLayout;
      }
    });
    
    return config;
  },
  
  clearPendingChanges: () => set({ pendingLayoutChanges: {} }),
  
  applyToCategory: false,
  setApplyToCategory: (apply) => set({ applyToCategory: apply }),
  
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  // 원본 DOM 스타일 관리
  originalDOMStyles: {},
  saveOriginalDOMStyle: (elementId, style) => {
    set((state) => ({
      originalDOMStyles: {
        ...state.originalDOMStyles,
        [elementId]: style,
      },
    }));
  },
  getOriginalDOMStyle: (elementId) => {
    return get().originalDOMStyles[elementId];
  },
  clearOriginalDOMStyles: () => set({ originalDOMStyles: {} }),
  
  // 저장 플래그
  isSaving: false,
  setIsSaving: (saving) => set({ isSaving: saving }),
}));

