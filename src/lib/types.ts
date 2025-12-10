export interface WeeklyItem {
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
export type ColorTheme = 'blue' | 'purple' | 'orange' | 'teal' | 'green' | 'dancheong';

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
    const validColors: ColorTheme[] = ['blue', 'purple', 'orange', 'teal', 'green', 'dancheong'];
    
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
}
