export interface WeeklyItem {
  id?: string; // 드래그 앤 드롭 식별자
  weekLabel: string; // e.g., "1주차"
  topic: string;
  detail?: string;
  note?: string;
}

export interface FeeRow {
  month: string;        // 월 (1월, 2월 등)
  classType: string;    // 수업구분 (진도수업, 확인학습)
  day: string;          // 요일
  time: string;         // 시간
  unitFee: number;      // 수강료 (회당)
  sessions: number;     // 회차
  subtotal: number;     // 합계
}

export interface FeeInfo {
  title: string;        // 수강료 안내 제목
  rows: FeeRow[];       // 수강료 행 데이터
  monthlyTotals: { month: string; total: number }[]; // 월별 총 합계
}

export type SizePreset = 'A4' | '4x5' | '1x1';

// 폰트 패밀리 타입
export type FontFamily = 
  | 'jeju'           // 제주고딕
  | 'nanum-square'   // 나눔스퀘어
  | 'nanum-human'    // 나눔휴먼
  | 'nanum-barun'    // 나눔바른고딕
  | 'pretendard'     // Pretendard
  | 'noto-sans-kr'   // Noto Sans KR
  | 'korail';        // 코레일체

// 필드별 폰트 크기 설정 (옵셔널, 없으면 기본 titleSize/bodySize 사용)
export interface FieldFontSizes {
  // 기본 정보
  targetStudent?: number;      // 수강대상
  etc?: number;                // 홍보문구
  parentIntro?: number;        // 학부모 안내글
  title?: number;              // 반명/강좌명
  teacherName?: number;        // 강사명
  classDay?: number;           // 수업요일
  classTime?: number;          // 수업시간
  // 학습과정
  course1?: number;            // 학습과정1
  material1?: number;          // 교재1
  course2?: number;            // 학습과정2
  material2?: number;          // 교재2
  // 학습 내용
  learningGoal?: number;       // 학습목표
  management?: number;         // 학습관리
  // 주차별 계획
  weeklyPlanWeek?: number;     // 주차 라벨 (1주차, 2주차 등)
  weeklyPlanTopic?: number;    // 주차별 주제
  // 수강료
  feeTable?: number;           // 수강료 테이블
  // 월간계획
  monthlyCalendar?: number;    // 월간계획 캘린더
}

// 타이포그래피 설정
export interface TypographySettings {
  titleFont: FontFamily;
  titleSize: number;      // pt 단위
  titleWeight?: number;   // 제목 폰트 굵기 (400: 보통, 600: 세미볼드, 700: 볼드)
  bodyFont: FontFamily;
  bodySize: number;       // pt 단위
  bodyWeight?: number;    // 본문 폰트 굵기 (400: 보통, 600: 세미볼드, 700: 볼드)
  enableFontSizeChange?: boolean;  // 폰트 크기 변경 허용 여부
  fieldFontSizes?: FieldFontSizes; // 필드별 개별 폰트 크기
  // 레이아웃 메타(typography JSON에 함께 저장해 불러오기 위함)
  _layoutConfig?: TemplateLayoutConfig;
}

// 템플릿 카테고리 (레이아웃 스타일)
export type TemplateCategory = 'style1' | 'style2' | 'style3';

// 템플릿 요소 레이아웃 (드래그 편집용)
export interface ElementLayout {
  x?: number;           // X 위치 (% 또는 px)
  y?: number;           // Y 위치 (% 또는 px)
  width?: number;       // 너비 (% 또는 px)
  height?: number;      // 높이 (% 또는 px)
  visible?: boolean;    // 표시 여부
}

// 템플릿 레이아웃 커스터마이징 (스타일 카테고리별 적용)
export interface TemplateLayoutConfig {
  // 각 섹션별 레이아웃
  header?: ElementLayout;
  targetStudent?: ElementLayout;
  etc?: ElementLayout;
  parentIntro?: ElementLayout;
  teacherInfo?: ElementLayout;
  scheduleInfo?: ElementLayout;
  courseInfo?: ElementLayout;
  learningGoal?: ElementLayout;
  management?: ElementLayout;
  weeklyPlan?: ElementLayout;
  monthlyCalendar?: ElementLayout;
  feeTable?: ElementLayout;
  // 스타일 카테고리에 전체 적용 여부
  applyToCategory?: boolean;
}

// 색상 테마
export type ColorTheme = 'green' | 'blue' | 'purple' | 'orange' | 'teal' | 'dancheong';

// 템플릿 에디터용 타입 (커스텀 템플릿)
export type TemplateStatus = 'draft' | 'official';
export type TemplatePalette = {
  name?: string;
  primary: string;
  secondary?: string;
  accent?: string;
  neutral?: string;
  gradientFrom?: string;
  gradientTo?: string;
};

export type TemplateBlockType = 'text' | 'box' | 'image';

export interface TemplateBlock {
  id: string;
  type: TemplateBlockType;
  content?: {
    text?: string;
    imageUrl?: string;
  };
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  };
  style: {
    fill?: string;
    gradientFrom?: string;
    gradientTo?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: number;
    align?: 'left' | 'center' | 'right';
    borderColor?: string;
    borderWidth?: number;
    radius?: number;
    shadow?: boolean;
    opacity?: number;
  };
  locked?: boolean;
  hidden?: boolean;
}

export interface TemplateMeta {
  id: string;
  name: string;
  category: TemplateCategory | 'custom';
  status: TemplateStatus;
  palette: TemplatePalette;
  thumbnailUrl?: string;
  updatedAt: string;
  createdAt: string;
  blocks?: TemplateBlock[];
}

// TemplateId = 카테고리-색상 조합 + 레거시 호환 ID
export type TemplateId = 
  | `${TemplateCategory}-${ColorTheme}`
  // 레거시 템플릿 ID들 (구 버전 호환)
  | 'classic'
  | 'blue'
  | 'report'
  | 'modern'
  | 'purple'
  | 'mentoring'
  | 'academic'
  | 'dark';

// TemplateId에서 카테고리와 색상 추출 유틸리티 (안전한 파싱)
export const parseTemplateId = (templateId?: string | TemplateId): { category: TemplateCategory; color: ColorTheme } => {
  // 기본값
  const defaultCategory: TemplateCategory = 'style1';
  const defaultColor: ColorTheme = 'blue';
  
  if (!templateId || typeof templateId !== 'string') {
    return { category: defaultCategory, color: defaultColor };
  }
  
  // 기존 형식 호환성 (legacy templateId 처리)
  const legacyMap: Record<string, { category: TemplateCategory; color: ColorTheme }> = {
    // 색상명 기반 구식 ID
    'blue': { category: 'style1', color: 'blue' },
    'purple': { category: 'style1', color: 'purple' },
    'orange': { category: 'style3', color: 'orange' },
    'emerald': { category: 'style2', color: 'green' },
    'teal': { category: 'style1', color: 'teal' },
    'green': { category: 'style1', color: 'green' },
    'dark': { category: 'style1', color: 'blue' },
    // 템플릿명 기반 구식 ID
    'classic': { category: 'style1', color: 'blue' },
    'report': { category: 'style2', color: 'blue' },
    'modern': { category: 'style3', color: 'blue' },
    'mentoring': { category: 'style3', color: 'teal' },
    'academic': { category: 'style2', color: 'purple' },
    'dark-mode': { category: 'style1', color: 'blue' },
  };
  
  // 레거시 형식인 경우
  if (legacyMap[templateId]) {
    return legacyMap[templateId];
  }
  
  // 새 형식 (style1-blue)
  const parts = templateId.split('-');
  if (parts.length === 2) {
    const category = parts[0] as TemplateCategory;
    const color = parts[1] as ColorTheme;
    
    // 유효성 검사
    const validCategories: TemplateCategory[] = ['style1', 'style2', 'style3'];
    const validColors: ColorTheme[] = ['green', 'blue', 'purple', 'orange', 'teal', 'dancheong'];
    
    const categoryValid = validCategories.includes(category);
    const colorValid = validColors.includes(color);

    // 카테고리가 유효하면 그대로 유지, 색상만 기본값으로 보정
    if (categoryValid && colorValid) return { category, color };
    if (categoryValid && !colorValid) return { category, color: defaultColor };
  }
  
  // 기본값 반환
  return { category: defaultCategory, color: defaultColor };
};

export interface ClassPlan {
  id: string;
  
  // Basic Info
  title: string;          // 반명 또는 강좌명
  titleType?: 'class' | 'name';  // 'class': 반명, 'name': 강좌명
  showTitle?: boolean;    // 반명/강좌명 표시 여부 (체크박스)
  subject?: string;       // 과목 (별도 표기 시)
  targetStudent: string;  // 대상 (학년 등)
  showTargetStudent?: boolean;  // 수강대상 표시 여부 (체크박스)
  targetStudentDetail?: string; // 대상 학생 (이름 등)
  teacherName: string;    // 강사명
  
  // Schedule - 분리
  classDay: string;       // 수업요일
  classTime: string;      // 수업시간
  schedule?: string;      // 레거시 호환용
  
  // Course Specifics
  course1?: string;       // 학습과정1
  material1?: string;     // 학습과정1 교재
  course2?: string;       // 학습과정2
  material2?: string;     // 학습과정2 교재
  
  // Content
  learningGoal?: string;  // 학습목표
  management?: string;    // 학습관리 (테스트/클리닉/피드백 계획)
  parentIntro?: string;   // 학부모 안내 문구
  keywords?: string;      // 키워드
  etc?: string;           // 기타 내용 (홍보문구/특이사항)
  showEtc?: boolean;      // 홍보문구 표시 여부 (체크박스)
  etcPosition?: 'top' | 'bottom'; // 홍보문구 위치 (맨위: 학부모 안내사항 위, 맨아래: 수강료 아래)
  
  // Weekly Plan
  weeklyPlan: WeeklyItem[];
  
  // Fee Info
  feeInfo?: FeeInfo;
  
  // Settings
  templateId?: TemplateId;
  sizePreset?: SizePreset;
  typography?: TypographySettings;
  layoutConfig?: TemplateLayoutConfig;  // 템플릿 레이아웃 커스터마이징
  
  // Meta
  lastSaved?: string;     // 마지막 저장 시간
  status?: ClassPlanStatus; // 강좌 단계 상태
}

// 강좌 단계 상태 타입
export type ClassPlanStatus = 'draft' | 'teacher-reviewed' | 'admin-reviewed';

// 강좌 단계 한글 이름
export const classPlanStatusNames: Record<ClassPlanStatus, string> = {
  'draft': '담임 작성중',
  'teacher-reviewed': '담임 검수완료',
  'admin-reviewed': '운영진 검토완료',
};

// =====================================
// Zod 스키마 (타입 안전성 강화)
// =====================================
import { z } from 'zod';

// 레이아웃 위치/크기 제한 상수
export const LAYOUT_LIMITS = {
  POSITION_MIN: -100,
  POSITION_MAX: 100,
  SIZE_MIN: -50,
  SIZE_MAX: 50,
} as const;

// ElementLayout 스키마
export const elementLayoutSchema = z.object({
  x: z.number()
    .min(LAYOUT_LIMITS.POSITION_MIN)
    .max(LAYOUT_LIMITS.POSITION_MAX)
    .optional(),
  y: z.number()
    .min(LAYOUT_LIMITS.POSITION_MIN)
    .max(LAYOUT_LIMITS.POSITION_MAX)
    .optional(),
  width: z.number()
    .min(LAYOUT_LIMITS.SIZE_MIN)
    .max(LAYOUT_LIMITS.SIZE_MAX)
    .optional(),
  height: z.number()
    .min(LAYOUT_LIMITS.SIZE_MIN)
    .max(LAYOUT_LIMITS.SIZE_MAX)
    .optional(),
  visible: z.boolean().optional(),
});

// TemplateLayoutConfig 스키마
export const templateLayoutConfigSchema = z.object({
  header: elementLayoutSchema.optional(),
  targetStudent: elementLayoutSchema.optional(),
  etc: elementLayoutSchema.optional(),
  parentIntro: elementLayoutSchema.optional(),
  teacherInfo: elementLayoutSchema.optional(),
  scheduleInfo: elementLayoutSchema.optional(),
  courseInfo: elementLayoutSchema.optional(),
  learningGoal: elementLayoutSchema.optional(),
  management: elementLayoutSchema.optional(),
  weeklyPlan: elementLayoutSchema.optional(),
  monthlyCalendar: elementLayoutSchema.optional(),
  feeTable: elementLayoutSchema.optional(),
  applyToCategory: z.boolean().optional(),
});

// WeeklyItem 스키마
export const weeklyItemSchema = z.object({
  id: z.string().optional(),
  weekLabel: z.string(),
  topic: z.string(),
  detail: z.string().optional(),
  note: z.string().optional(),
});

// FeeRow 스키마
export const feeRowSchema = z.object({
  month: z.string(),
  classType: z.string(),
  day: z.string(),
  time: z.string(),
  unitFee: z.number().nonnegative(),
  sessions: z.number().int().nonnegative(),
  subtotal: z.number().nonnegative(),
});

// FeeInfo 스키마
export const feeInfoSchema = z.object({
  title: z.string(),
  rows: z.array(feeRowSchema),
  monthlyTotals: z.array(z.object({
    month: z.string(),
    total: z.number().nonnegative(),
  })),
});

// ColorTheme 스키마
export const colorThemeSchema = z.enum(['green', 'blue', 'purple', 'orange', 'teal', 'dancheong']);

// TemplateCategory 스키마
export const templateCategorySchema = z.enum(['style1', 'style2', 'style3']);

// FontFamily 스키마
export const fontFamilySchema = z.enum([
  'jeju', 'nanum-square', 'nanum-human', 'nanum-barun', 'pretendard', 'noto-sans-kr', 'korail'
]);

// TypographySettings 스키마
export const typographySettingsSchema = z.object({
  titleFont: fontFamilySchema,
  titleSize: z.number().min(8).max(32),
  titleWeight: z.number().min(100).max(900).optional(),
  bodyFont: fontFamilySchema,
  bodySize: z.number().min(6).max(24),
  bodyWeight: z.number().min(100).max(900).optional(),
  enableFontSizeChange: z.boolean().optional(),
  fieldFontSizes: z.record(z.string(), z.number().min(6).max(24)).optional(),
  _layoutConfig: templateLayoutConfigSchema.optional(),
});

// ClassPlanStatus 스키마
export const classPlanStatusSchema = z.enum(['draft', 'teacher-reviewed', 'admin-reviewed']);

// ClassPlan 스키마 (부분 검증용)
export const classPlanPartialSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  titleType: z.enum(['class', 'name']).optional(),
  showTitle: z.boolean().optional(),
  subject: z.string().optional(),
  targetStudent: z.string().optional(),
  showTargetStudent: z.boolean().optional(),
  targetStudentDetail: z.string().optional(),
  teacherName: z.string().optional(),
  classDay: z.string().optional(),
  classTime: z.string().optional(),
  schedule: z.string().optional(),
  course1: z.string().optional(),
  material1: z.string().optional(),
  course2: z.string().optional(),
  material2: z.string().optional(),
  learningGoal: z.string().optional(),
  management: z.string().optional(),
  parentIntro: z.string().optional(),
  keywords: z.string().optional(),
  etc: z.string().optional(),
  showEtc: z.boolean().optional(),
  etcPosition: z.enum(['top', 'bottom']).optional(),
  weeklyPlan: z.array(weeklyItemSchema).optional(),
  feeInfo: feeInfoSchema.optional(),
  templateId: z.string().optional(),
  sizePreset: z.enum(['A4', '4x5', '1x1']).optional(),
  typography: typographySettingsSchema.optional(),
  layoutConfig: templateLayoutConfigSchema.optional(),
  lastSaved: z.string().optional(),
  status: classPlanStatusSchema.optional(),
}).partial();

// 레이아웃 값 검증 헬퍼 함수
export const validateElementLayout = (layout: unknown): ElementLayout | null => {
  const result = elementLayoutSchema.safeParse(layout);
  return result.success ? result.data : null;
};

// 템플릿 레이아웃 설정 검증 헬퍼 함수
export const validateTemplateLayoutConfig = (config: unknown): TemplateLayoutConfig | null => {
  const result = templateLayoutConfigSchema.safeParse(config);
  return result.success ? result.data : null;
};

// ClassPlan 부분 업데이트 검증 헬퍼 함수
export const validateClassPlanPatch = (patch: unknown): Partial<ClassPlan> | null => {
  const result = classPlanPartialSchema.safeParse(patch);
  // Type assertion needed because Zod infers string for templateId, but we know it's TemplateId
  return result.success ? (result.data as Partial<ClassPlan>) : null;
};
