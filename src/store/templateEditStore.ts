import { create } from 'zustand';
import { ElementLayout, TemplateLayoutConfig, TemplateCategory } from '@/lib/types';

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
        (config as Record<string, ElementLayout | undefined>)[configKey] = layout as ElementLayout;
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

