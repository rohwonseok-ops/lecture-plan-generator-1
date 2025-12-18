import { create } from 'zustand';
import { ClassPlan, FeeRow, WeeklyItem, SizePreset, TemplateLayoutConfig, TypographySettings } from '@/lib/types';
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

const defaultWeeklyPlan: WeeklyItem[] = Array.from({ length: 8 }, () => ({
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

// typography JSON 컬럼에 함께 저장된 레이아웃 정보를 추출/삽입
const extractLayoutFromTypography = (
  typography?: TypographySettings | null
): { typography?: TypographySettings; layoutConfig?: TemplateLayoutConfig } => {
  if (!typography || typeof typography !== 'object') {
    return { typography: typography || undefined };
  }
  const { layoutConfig: legacyLayoutConfig, _layoutConfig, ...rest } = typography as TypographySettings & Record<string, unknown>;
  return {
    typography: rest,
    layoutConfig: (legacyLayoutConfig as TemplateLayoutConfig | undefined) || (_layoutConfig as TemplateLayoutConfig | undefined),
  };
};

const attachLayoutToTypography = (
  typography?: TypographySettings,
  layoutConfig?: TemplateLayoutConfig
): TypographySettings | undefined => {
  if (!layoutConfig) return typography;
  return {
    ...(typography || {}),
    _layoutConfig: layoutConfig,
  } as TypographySettings & { _layoutConfig: TemplateLayoutConfig };
};

// 로드/저장 시 필수 필드 강제 세팅
const normalizePlan = (plan: ClassPlan): ClassPlan => {
  const weeklyPlan = (plan.weeklyPlan?.length ? plan.weeklyPlan : defaultWeeklyPlan).map((item) => ({
    ...item,
    id: item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)),
  }));
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
  // teacherName은 undefined나 null일 때만 빈 문자열로 변환, 줄바꿈 포함 문자열은 유지
  const teacherName = plan.teacherName ?? '';
  const classDay = plan.classDay || '';
  const classTime = plan.classTime || '';
  const templateId = plan.templateId || 'style1-blue';
  const sizePreset = plan.sizePreset || 'A4';
  const status = plan.status || 'draft';

  // 디버깅: teacherName 정규화 전후 값 비교
  if (plan.teacherName !== teacherName) {
    console.log('[normalizePlan] teacherName 정규화:', {
      before: plan.teacherName,
      after: teacherName,
      hasNewline: teacherName.includes('\n'),
    });
  }

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
    status,
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
  const typographyRaw =
    row.typography && typeof row.typography === 'object' && !Array.isArray(row.typography)
      ? (row.typography as unknown as TypographySettings)
      : undefined;
  const { typography, layoutConfig: layoutFromTypography } = extractLayoutFromTypography(typographyRaw);
  const layoutFromColumn = (row as { layout_config?: TemplateLayoutConfig }).layout_config;
  const layoutConfig = layoutFromColumn || layoutFromTypography;

  const status = (row as { status?: string }).status;
  const validStatus = status === 'draft' || status === 'teacher-reviewed' || status === 'admin-reviewed' 
    ? status as ClassPlan['status'] 
    : undefined;

  // 디버깅: 데이터베이스에서 읽어온 teacher_name 값 확인
  const rawTeacherName = row.teacher_name ?? '';
  console.log('[dbToClassPlan] teacher_name 로드 후:', {
    value: rawTeacherName,
    type: typeof rawTeacherName,
    hasNewline: rawTeacherName.includes('\n'),
    length: rawTeacherName.length,
    rawValue: JSON.stringify(rawTeacherName),
  });

  return normalizePlan({
    id: row.id,
    title: row.title,
    titleType,
    subject: row.subject ?? '',
    targetStudent: row.target_student ?? '',
    targetStudentDetail: row.target_student_detail ?? '',
    teacherName: rawTeacherName,
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
    layoutConfig,
    weeklyPlan,
    feeInfo,
    lastSaved: row.last_saved ?? undefined,
    status: validStatus,
  });
};

const toDbPlan = (plan: ClassPlan) => {
  const typographyPayload = attachLayoutToTypography(plan.typography, plan.layoutConfig);
  
  // 디버깅: teacherName 값 확인
  console.log('[toDbPlan] teacherName 저장 전:', {
    value: plan.teacherName,
    type: typeof plan.teacherName,
    hasNewline: plan.teacherName?.includes('\n'),
    length: plan.teacherName?.length,
  });
  
  return {
  title: plan.title,
  title_type: plan.titleType,
  subject: plan.subject,
  target_student: plan.targetStudent,
  target_student_detail: plan.targetStudentDetail,
  teacher_name: plan.teacherName ?? '',
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
    typography: typographyPayload,
  fee_info_title: plan.feeInfo?.title ?? '수강료 안내',
  status: plan.status ?? 'draft',
  last_saved: new Date().toISOString(),
  };
};

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
    try {
      const res = await fetch('/api/class-plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const errorMsg = json.error || `강의 목록을 불러오지 못했습니다. (${res.status})`;
        console.error('강의 목록 로드 실패:', errorMsg, json);
        set({ loading: false, error: errorMsg });
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
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '강의 목록을 불러오는 중 오류가 발생했습니다.';
      console.error('강의 목록 로드 중 예외:', err);
      set({ loading: false, error: errorMsg });
    }
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
    console.log('[savePlan] 저장 시작:', { id });
    
    const plan = get().classPlans.find((p) => p.id === id);
    if (!plan) {
      const error = new Error('저장할 강의를 찾을 수 없습니다.');
      console.error('[savePlan] 강의를 찾을 수 없음:', id);
      set({ error: error.message });
      throw error;
    }
    
    console.log('[savePlan] 강의 정보:', { 
      id: plan.id, 
      title: plan.title,
      status: plan.status 
    });
    
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[savePlan] 세션 조회 실패:', sessionError);
      const error = new Error('인증 세션을 확인할 수 없습니다.');
      set({ error: error.message });
      throw error;
    }
    
    const token = session.session?.access_token;
    if (!token) {
      console.warn('[savePlan] 액세스 토큰이 없습니다.');
      const error = new Error('로그인이 필요합니다.');
      set({ error: error.message });
      throw error;
    }
    
    console.log('[savePlan] 인증 토큰 확인 완료:', { 
      tokenLength: token.length,
      userId: session.session?.user?.id 
    });
    
    const isLocalOnly = get().localOnlyIds.includes(id);
    const endpoint = isLocalOnly ? '/api/class-plans' : `/api/class-plans/${id}`;
    const method = isLocalOnly ? 'POST' : 'PUT';
    
    console.log('[savePlan] 요청 정보:', { 
      endpoint, 
      method, 
      isLocalOnly 
    });
    
    const dbPlan = toDbPlan(plan);

    // POST는 plan만, PUT은 patch만 전송
    const requestBody = isLocalOnly
      ? {
          plan: dbPlan,
          weeklyItems: toDbWeekly(plan.weeklyPlan),
          feeRows: toDbFeeRows(plan.feeInfo?.rows),
        }
      : {
          patch: dbPlan,
          weeklyItems: toDbWeekly(plan.weeklyPlan),
          feeRows: toDbFeeRows(plan.feeInfo?.rows),
        };

    try {
      console.log('[savePlan] API 요청 전송:', { 
        endpoint, 
        method,
        bodySize: JSON.stringify(requestBody).length 
      });
      
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('[savePlan] API 응답:', { 
        status: res.status, 
        statusText: res.statusText,
        ok: res.ok 
      });
      
      if (!res.ok) {
        // HTTP 상태 코드에 따른 에러 구분
        let errorMsg = `저장 실패 (${res.status})`;
        let errorType = 'unknown';
        
        if (res.status === 401) {
          errorType = 'authentication';
          errorMsg = '인증에 실패했습니다. 다시 로그인해주세요.';
        } else if (res.status === 403) {
          errorType = 'authorization';
          errorMsg = '저장 권한이 없습니다.';
        } else if (res.status === 404) {
          errorType = 'not_found';
          errorMsg = '저장할 강의를 찾을 수 없습니다.';
        } else if (res.status >= 500) {
          errorType = 'server_error';
          errorMsg = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        
        let json: { error?: string } = {};
        try {
          json = await res.json();
          if (json.error) {
            errorMsg = json.error;
          }
        } catch (parseError) {
          console.warn('[savePlan] 응답 JSON 파싱 실패:', parseError);
        }
        
        console.error('[savePlan] 저장 실패:', {
          status: res.status,
          errorType,
          errorMsg,
          response: json,
        });
        
        set({ error: errorMsg });
        throw new Error(errorMsg);
      }
      
      const json = await res.json();
      
      if (!json.data) {
        const errorMsg = '저장 응답에 데이터가 없습니다.';
        console.error('[savePlan] 저장 응답 오류:', { 
          response: json,
          hasData: !!json.data 
        });
        set({ error: errorMsg });
        throw new Error(errorMsg);
      }
      
      console.log('[savePlan] 저장 성공:', { 
        id: json.data.id,
        title: json.data.title 
      });
      
      const saved = dbToClassPlan(json.data);
      set((state) => ({
        classPlans: state.classPlans.map((p) => (p.id === id ? saved : p)),
        error: null,
        localOnlyIds: state.localOnlyIds.filter((localId) => localId !== id),
      }));
      
      console.log('[savePlan] 저장 완료');
    } catch (err) {
      // 이미 처리된 에러는 재던지기
      if (err instanceof Error && err.message.includes('저장')) {
        throw err;
      }
      
      // 네트워크 에러 구분
      let errorMsg = '저장 중 오류가 발생했습니다.';
      let errorType = 'unknown';
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorType = 'network';
        errorMsg = '네트워크 연결을 확인할 수 없습니다. 인터넷 연결을 확인해주세요.';
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      
      console.error('[savePlan] 저장 중 예외:', {
        errorType,
        error: err,
        message: errorMsg,
        stack: err instanceof Error ? err.stack : undefined,
      });
      
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }
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