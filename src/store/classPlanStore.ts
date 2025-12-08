import { create } from 'zustand';
import { ClassPlan, FeeRow, WeeklyItem, SizePreset, TypographySettings } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import type { Tables, TablesInsert } from '@/lib/supabase.types';

interface ClassPlanState {
  classPlans: ClassPlan[];
  selectedId?: string;
  loading: boolean;
  error?: string | null;
  localOnlyIds: string[];

  loadFromRemote: () => Promise<void>;
  addClassPlan: (plan: ClassPlan) => Promise<void>;
  updateClassPlan: (id: string, patch: Partial<ClassPlan>) => void; // local patch
  savePlan: (id: string) => Promise<void>;
  removeClassPlan: (id: string) => Promise<void>;
  setSelectedId: (id?: string) => void;
  getClassPlan: (id: string) => ClassPlan | undefined;
}

const defaultWeeklyPlan = Array.from({ length: 8 }, () => ({
  weekLabel: '',
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
  const title = plan.title || '강좌명';
  const showTitle = plan.showTitle !== false;
  const targetStudent = plan.targetStudent || '';
  const teacherName = plan.teacherName || '';
  const classDay = plan.classDay || '';
  const classTime = plan.classTime || '';
  const templateId = plan.templateId || 'style1-blue';
  const sizePreset = plan.sizePreset || 'A4';

  return {
    ...plan,
    title,
    showTitle,
    targetStudent,
    teacherName,
    classDay,
    classTime,
    templateId,
    sizePreset,
    weeklyPlan,
    feeInfo,
  };
};

type ClassPlanRow = Tables<'class_plans'> & {
  weekly_plan_items?: Tables<'weekly_plan_items'>[];
  fee_rows?: Tables<'fee_rows'>[];
};

const toDbWeekly = (items: WeeklyItem[]): Partial<TablesInsert<'weekly_plan_items'>>[] =>
  items.map((w, idx) => ({
    week_label: w.weekLabel,
    topic: w.topic,
    detail: w.detail,
    note: w.note,
    position: idx,
  }));

const toDbFeeRows = (rows?: FeeRow[]): Partial<TablesInsert<'fee_rows'>>[] =>
  rows?.map((r) => ({
    month: r.month,
    class_type: r.classType,
    day: r.day,
    time: r.time,
    unit_fee: r.unitFee,
    sessions: r.sessions,
    subtotal: r.subtotal,
  })) || [];

const dbToClassPlan = (row: ClassPlanRow): ClassPlan => {
  const weeklyPlan: WeeklyItem[] =
    row.weekly_plan_items?.map((w: Tables<'weekly_plan_items'>) => ({
      weekLabel: w.week_label,
      topic: w.topic ?? '',
      detail: w.detail ?? undefined,
      note: w.note ?? undefined,
    })) ?? defaultWeeklyPlan;

  const feeRows: FeeRow[] =
    row.fee_rows?.map((f: Tables<'fee_rows'>) => ({
      month: f.month,
      classType: f.class_type,
      day: f.day ?? '',
      time: f.time ?? '',
      unitFee: Number(f.unit_fee ?? 0),
      sessions: Number(f.sessions ?? 0),
      subtotal: Number(f.subtotal ?? 0),
    })) ?? [];

  const feeInfo = feeRows.length
    ? {
        title: row.fee_info_title || '수강료 안내',
        rows: feeRows,
        monthlyTotals: [],
      }
    : undefined;

  const titleType = row.title_type === 'name' || row.title_type === 'class' ? row.title_type : undefined;

  const etcPosition =
    row.etc_position === 'top' || row.etc_position === 'bottom' ? row.etc_position : undefined;

  const templateId = typeof row.template_id === 'string' ? (row.template_id as ClassPlan['templateId']) : 'style1-blue';
  const sizePreset: SizePreset =
    row.size_preset === '4x5' || row.size_preset === '1x1' ? row.size_preset : 'A4';
  const typography =
    row.typography && typeof row.typography === 'object' && !Array.isArray(row.typography)
      ? (row.typography as unknown as TypographySettings)
      : undefined;

  return normalizePlan({
    id: row.id,
    title: row.title,
    titleType,
    subject: row.subject ?? '',
    targetStudent: row.target_student ?? '',
    targetStudentDetail: row.target_student_detail ?? '',
    teacherName: row.teacher_name ?? '',
    classDay: row.class_day ?? '',
    classTime: row.class_time ?? '',
    schedule: row.schedule ?? '',
    course1: row.course1 ?? '',
    material1: row.material1 ?? '',
    course2: row.course2 ?? '',
    material2: row.material2 ?? '',
    learningGoal: row.learning_goal ?? '',
    management: row.management ?? '',
    parentIntro: row.parent_intro ?? '',
    keywords: row.keywords ?? '',
    etc: row.etc ?? '',
    showEtc: row.show_etc ?? false,
    etcPosition,
    templateId,
    sizePreset,
    typography,
    weeklyPlan,
    feeInfo,
    lastSaved: row.last_saved ?? undefined,
  });
};

const toDbPlan = (plan: ClassPlan) => ({
  title: plan.title,
  title_type: plan.titleType,
  subject: plan.subject,
  target_student: plan.targetStudent,
  target_student_detail: plan.targetStudentDetail,
  teacher_name: plan.teacherName,
  class_day: plan.classDay,
  class_time: plan.classTime,
  schedule: plan.schedule,
  course1: plan.course1,
  material1: plan.material1,
  course2: plan.course2,
  material2: plan.material2,
  learning_goal: plan.learningGoal,
  management: plan.management,
  parent_intro: plan.parentIntro,
  keywords: plan.keywords,
  etc: plan.etc,
  show_etc: plan.showEtc,
  etc_position: plan.etcPosition,
  template_id: plan.templateId,
  size_preset: plan.sizePreset,
  typography: plan.typography,
  fee_info_title: plan.feeInfo?.title ?? '수강료 안내',
  last_saved: new Date().toISOString(),
});

export const useClassPlanStore = create<ClassPlanState>()((set, get) => ({
  classPlans: [],
  selectedId: undefined,
  loading: false,
  error: null,
  localOnlyIds: [],

  loadFromRemote: async () => {
    set({ loading: true, error: null });
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) {
      set({ loading: false, error: '로그인이 필요합니다.' });
      return;
    }
    const res = await fetch('/api/class-plans', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      set({ loading: false, error: json.error || '강의 목록을 불러오지 못했습니다.' });
      return;
    }
    const json = await res.json();
    const plans: ClassPlan[] = (json.data || []).map(dbToClassPlan);
    set({
      classPlans: plans,
      selectedId: plans[0]?.id,
      loading: false,
      error: null,
      localOnlyIds: [],
    });
  },

  addClassPlan: async (plan) => {
    const localPlan = normalizePlan(plan);
    set((state) => ({
      classPlans: [...state.classPlans, localPlan],
      selectedId: localPlan.id,
      localOnlyIds: [...new Set([...state.localOnlyIds, localPlan.id])],
    }));
  },

  updateClassPlan: (id, patch) =>
    set((state) => ({
      classPlans: state.classPlans.map((p) => (p.id === id ? normalizePlan({ ...p, ...patch }) : p)),
    })),

  savePlan: async (id) => {
    const plan = get().classPlans.find((p) => p.id === id);
    if (!plan) return;
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) {
      set({ error: '로그인이 필요합니다.' });
      return;
    }
    const isLocalOnly = get().localOnlyIds.includes(id);

    const endpoint = isLocalOnly ? '/api/class-plans' : `/api/class-plans/${id}`;
    const method = isLocalOnly ? 'POST' : 'PUT';

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        plan: toDbPlan(plan),
        patch: toDbPlan(plan),
        weeklyItems: toDbWeekly(plan.weeklyPlan),
        feeRows: toDbFeeRows(plan.feeInfo?.rows),
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      set({ error: json.error || '저장 실패' });
      return;
    }
    const json = await res.json();
    const saved = dbToClassPlan(json.data);
    set((state) => ({
      classPlans: state.classPlans.map((p) => (p.id === id ? saved : p)),
      error: null,
      localOnlyIds: state.localOnlyIds.filter((localId) => localId !== id),
    }));
  },

  removeClassPlan: async (id) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    const isLocalOnly = get().localOnlyIds.includes(id);
    if (!token) {
      set((state) => ({
        classPlans: state.classPlans.filter((p) => p.id !== id),
        selectedId: state.selectedId === id ? undefined : state.selectedId,
        localOnlyIds: state.localOnlyIds.filter((localId) => localId !== id),
      }));
      return;
    }
    if (isLocalOnly) {
      set((state) => ({
        classPlans: state.classPlans.filter((p) => p.id !== id),
        selectedId: state.selectedId === id ? undefined : state.selectedId,
        localOnlyIds: state.localOnlyIds.filter((localId) => localId !== id),
      }));
      return;
    }
    await fetch(`/api/class-plans/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    set((state) => ({
      classPlans: state.classPlans.filter((p) => p.id !== id),
      selectedId: state.selectedId === id ? undefined : state.selectedId,
      localOnlyIds: state.localOnlyIds.filter((localId) => localId !== id),
    }));
  },

  setSelectedId: (id) => set({ selectedId: id }),

  getClassPlan: (id) => get().classPlans.find((p) => p.id === id),
}));