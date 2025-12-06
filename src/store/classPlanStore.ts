import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ClassPlan } from '@/lib/types';

interface ClassPlanState {
  classPlans: ClassPlan[];
  selectedId?: string;
  
  setClassPlans: (plans: ClassPlan[]) => void;
  addClassPlan: (plan: ClassPlan) => void;
  updateClassPlan: (id: string, patch: Partial<ClassPlan>) => void;
  removeClassPlan: (id: string) => void;
  setSelectedId: (id?: string) => void;
  getClassPlan: (id: string) => ClassPlan | undefined;
  saveToStorage: () => void;
}

const defaultWeeklyPlan = Array.from({ length: 8 }, (_, i) => ({
  weekLabel: `${i + 1}주차`,
  topic: ''
}));

const defaultFeeInfo = {
  title: '수강료 안내',
  rows: [
    { month: '1월', classType: '진도수업', day: '월수금', time: '각4시간', unitFee: 52500, sessions: 10, subtotal: 525000 },
    { month: '1월', classType: '확인학습', day: '', time: '매회', unitFee: 8000, sessions: 8, subtotal: 64000 },
    { month: '2월', classType: '진도수업', day: '월수금', time: '각4시간', unitFee: 52500, sessions: 12, subtotal: 630000 },
    { month: '2월', classType: '확인학습', day: '', time: '', unitFee: 8000, sessions: 12, subtotal: 96000 },
  ],
  monthlyTotals: [
    { month: '1월', total: 589000 },
    { month: '2월', total: 726000 }
  ]
};

// 로드/저장 시 필수 필드 강제 세팅
const normalizePlan = (plan: ClassPlan): ClassPlan => {
  const weeklyPlan = plan.weeklyPlan?.length ? plan.weeklyPlan : defaultWeeklyPlan;
  const normalizedFeeTitle =
    !plan.feeInfo?.title || plan.feeInfo.title === '[수1/수2] 몰입특강 수강료'
      ? '수강료 안내'
      : plan.feeInfo.title;
  const feeInfo = plan.feeInfo
    ? { ...plan.feeInfo, title: normalizedFeeTitle }
    : { ...defaultFeeInfo, title: '수강료 안내' };

  return {
    title: plan.title || '강좌명',
    showTitle: plan.showTitle !== false,
    targetStudent: plan.targetStudent || '',
    teacherName: plan.teacherName || '',
    classDay: plan.classDay || '',
    classTime: plan.classTime || '',
    templateId: plan.templateId || 'style1-blue',
    sizePreset: plan.sizePreset || 'A4',
    ...plan,
    weeklyPlan,
    feeInfo,
  };
};

export const useClassPlanStore = create<ClassPlanState>()(
  persist(
    (set, get) => ({
      classPlans: [
        normalizePlan({
          id: 'demo-1',
          title: '수학',
          subject: '수학',
          targetStudent: '초등 5-6',
          targetStudentDetail: '김미리 외 3명',
          teacherName: '김미리',
          classDay: '월수금',
          classTime: '13:00-17:00',
          schedule: '월수금 13:00-17:00',
          course1: '3-1 개념',
          material1: '개념플러스유형(라이트)',
          course2: '3-1 응용',
          material2: '쎈',
          learningGoal: '3-1 개념 완성 및 응용력 배양',
          management: '매주 데일리 테스트 진행\n오답 노트 확인',
          parentIntro: '학부모님, 아이들이 수학에 흥미를 잃지 않고 기초를 탄탄히 다질 수 있도록 지도하겠습니다.',
          keywords: '#초등수학 #개념완성 #응용력',
          etc: '특이사항 없음',
          weeklyPlan: [
            { weekLabel: '1주차', topic: '자연수의 혼합 계산' },
            { weekLabel: '2주차', topic: '약수와 배수' },
            { weekLabel: '3주차', topic: '규칙과 대응' },
            { weekLabel: '4주차', topic: '약분과 통분' },
            { weekLabel: '5주차', topic: '분수의 덧셈과 뺄셈' },
            { weekLabel: '6주차', topic: '다각형의 둘레와 넓이' },
            { weekLabel: '7주차', topic: '수의 범위와 어림하기' },
            { weekLabel: '8주차', topic: '총정리 및 평가' },
          ],
          feeInfo: defaultFeeInfo,
          templateId: 'style1-blue',
          sizePreset: 'A4'
        })
      ],
      selectedId: 'demo-1',

      setClassPlans: (plans) => set({ classPlans: plans.map(normalizePlan) }),
      
      addClassPlan: (plan) => set((state) => ({ 
        classPlans: [...state.classPlans, normalizePlan(plan)],
        selectedId: plan.id 
      })),
      
      updateClassPlan: (id, patch) => set((state) => ({
        classPlans: state.classPlans.map((p) => (p.id === id ? normalizePlan({ ...p, ...patch }) : p))
      })),
      
      removeClassPlan: (id) => set((state) => ({
        classPlans: state.classPlans.filter((p) => p.id !== id),
        selectedId: state.selectedId === id ? undefined : state.selectedId
      })),
      
      setSelectedId: (id) => set({ selectedId: id }),

      getClassPlan: (id) => get().classPlans.find(p => p.id === id),
      
      saveToStorage: () => {
        const state = get();
        if (state.selectedId) {
          const now = new Date().toISOString();
          set((s) => ({
            classPlans: s.classPlans.map((p) => 
              p.id === s.selectedId ? { ...p, lastSaved: now } : p
            )
          }));
        }
      }
    }),
    {
      name: 'lecture-plan-storage',
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        const normalized = state.classPlans?.map(normalizePlan) || [];
        set({ classPlans: normalized, selectedId: state.selectedId });
      },
    }
  )
);
