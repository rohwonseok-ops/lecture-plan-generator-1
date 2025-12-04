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
export type TemplateId = 'classic' | 'blue' | 'purple' | 'mentoring' | 'academic' | 'dark' | 'poster' | 'teal';

export interface ClassPlan {
  id: string;
  
  // Basic Info
  title: string;          // 강좌명 (과목)
  subject?: string;       // 과목 (별도 표기 시)
  targetStudent: string;  // 대상 (학년 등)
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
  
  // Weekly Plan (8주차)
  weeklyPlan: WeeklyItem[];
  
  // Fee Info
  feeInfo?: FeeInfo;
  
  // Settings
  templateId?: TemplateId;
  sizePreset?: SizePreset;
  
  // Meta
  lastSaved?: string;     // 마지막 저장 시간
}
