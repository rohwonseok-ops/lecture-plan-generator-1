import { create } from 'zustand';
import { ElementLayout, TemplateLayoutConfig, TemplateCategory } from '@/lib/types';

interface TemplateEditState {
  // 편집 모드 상태
  isEditMode: boolean;
  setEditMode: (mode: boolean) => void;
  toggleEditMode: () => void;

  // 현재 편집 중인 레이아웃 설정
  pendingLayoutChanges: Record<string, Partial<ElementLayout>>;
  
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
}

// 요소 ID를 TemplateLayoutConfig 키로 매핑
const elementIdToConfigKey: Record<string, keyof TemplateLayoutConfig> = {
  'header': 'header',
  'targetStudent': 'targetStudent',
  'etc': 'etc',
  'parentIntro': 'parentIntro',
  'teacherInfo': 'teacherInfo',
  'scheduleInfo': 'scheduleInfo',
  'courseInfo': 'courseInfo',
  'learningGoal': 'learningGoal',
  'management': 'management',
  'weeklyPlan': 'weeklyPlan',
  'monthlyCalendar': 'monthlyCalendar',
  'feeTable': 'feeTable',
};

export const useTemplateEditStore = create<TemplateEditState>()((set, get) => ({
  isEditMode: false,
  setEditMode: (mode) => set({ isEditMode: mode }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

  pendingLayoutChanges: {},
  
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
    const { pendingLayoutChanges, applyToCategory } = get();
    const config: TemplateLayoutConfig = {
      applyToCategory,
    };
    
    Object.entries(pendingLayoutChanges).forEach(([elementId, layout]) => {
      const configKey = elementIdToConfigKey[elementId];
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
}));

