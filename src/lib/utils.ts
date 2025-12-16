import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { FontFamily, TypographySettings, FieldFontSizes } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFontClassName(font: FontFamily): string {
  const fontMap: Record<FontFamily, string> = {
    'jeju': 'font-jeju',
    'nanum-square': 'font-nanum-square',
    'nanum-human': 'font-nanum-human',
    'nanum-barun': 'font-nanum-barun',
    'pretendard': 'font-pretendard',
    'noto-sans-kr': 'font-noto-sans-kr',
    'korail': 'font-korail',
  };
  return fontMap[font] || 'font-jeju';
}

export function getDefaultTypography(): TypographySettings {
  return {
    titleFont: 'jeju',
    titleSize: 16,
    titleWeight: 400,  // 기본값: 보통
    bodyFont: 'jeju',
    bodySize: 13,
    bodyWeight: 400,   // 기본값: 보통
    enableFontSizeChange: false,  // 기본값: 폰트 크기 변경 비활성화
  };
}

// 필드별 폰트 크기 가져오기 (개별 설정이 없으면 기본 bodySize 사용)
export function getFieldFontSize(
  fieldFontSizes: FieldFontSizes | undefined,
  field: keyof FieldFontSizes,
  defaultSize: number
): number {
  if (!fieldFontSizes || fieldFontSizes[field] === undefined) {
    return defaultSize;
  }
  return fieldFontSizes[field] as number;
}

// 기본 필드 폰트 크기 목록
export function getDefaultFieldFontSizes(bodySize: number): FieldFontSizes {
  return {
    targetStudent: bodySize,
    etc: bodySize,
    parentIntro: bodySize,
    title: 28,
    teacherName: bodySize,
    classDay: bodySize,
    classTime: bodySize,
    course1: bodySize,
    material1: bodySize,
    course2: bodySize,
    material2: bodySize,
    learningGoal: bodySize,
    management: bodySize,
    weeklyPlanWeek: bodySize,
    weeklyPlanTopic: bodySize,
    feeTable: bodySize,
    monthlyCalendar: bodySize,
  };
}

// 수업요일 파싱 (기간|요일 형식 지원)
// 입력: "12월|월수금\n1월|화목토" 또는 "월수금\n화목토" 또는 "월수금"
// 출력: { period: "12월", value: "월수금" }[] 형태로 파싱
export interface ParsedScheduleItem {
  period: string;  // 기간 (없으면 빈 문자열)
  value: string;   // 요일 또는 시간
}

export function parseScheduleWithPeriod(input: string | undefined): ParsedScheduleItem[] {
  if (!input) return [];
  
  return input.split('\n').filter(Boolean).map(line => {
    if (line.includes('|')) {
      const [period, value] = line.split('|');
      return { period: period.trim(), value: value.trim() };
    }
    return { period: '', value: line.trim() };
  });
}

// 수업일정 포맷팅 (수업요일 + 수업시간)
// 기간이 있으면 "12월 월수금 13:00-17:00 / 1월 화목토 14:00-18:00"
// 기간이 없으면 "월수금 13:00-17:00"
export function formatSchedule(classDay: string | undefined, classTime: string | undefined): string {
  const days = parseScheduleWithPeriod(classDay);
  const times = parseScheduleWithPeriod(classTime);
  
  if (days.length === 0) return '';
  
  // 기간이 하나라도 있는지 확인
  const hasPeriod = days.some(d => d.period);
  
  if (hasPeriod) {
    // 기간별로 포맷팅 (각 줄에 해당하는 시간만 사용, 없으면 비움)
    return days.map((day, i) => {
      const time = times[i]?.value || '';
      const schedule = time ? `${day.value} ${time}` : day.value;
      // 기간과 요일/시간을 명확히 구분해 표기
      return day.period ? `${day.period} / ${schedule}` : schedule;
    }).join(' / ');
  } else {
    // 기간 없이 단순 포맷팅
    if (days.length === 1 && times.length <= 1) {
      const time = times[0]?.value || '';
      return time ? `${days[0].value} ${time}` : days[0].value;
    }
    // 여러 줄인 경우 (각 줄에 해당하는 시간만 사용)
    return days.map((day, i) => {
      const time = times[i]?.value || '';
      return time ? `${day.value} ${time}` : day.value;
    }).join(' / ');
  }
}

// 수업일정을 React 요소로 렌더링 (줄바꿈 지원)
export function formatScheduleLines(classDay: string | undefined, classTime: string | undefined): string[] {
  const days = parseScheduleWithPeriod(classDay);
  const times = parseScheduleWithPeriod(classTime);
  
  if (days.length === 0) return [];
  
  // 기간이 하나라도 있는지 확인
  const hasPeriod = days.some(d => d.period);
  
  return days.map((day, i) => {
    // 각 줄에 해당하는 시간만 사용, 없으면 비움
    const time = times[i]?.value || '';
    const schedule = time ? `${day.value} ${time}` : day.value;
    // 기간 있으면 "12월 / 월수금" 형태로 구분
    return hasPeriod && day.period ? `${day.period} / ${schedule}` : schedule;
  });
}

// 수업일정 테이블용 행 생성 (기간, 요일, 시간 분리)
export interface ScheduleRow {
  period: string;
  day: string;
  time: string;
}

export function buildScheduleRows(classDay: string | undefined, classTime: string | undefined): ScheduleRow[] {
  const days = parseScheduleWithPeriod(classDay);
  const times = parseScheduleWithPeriod(classTime);

  if (days.length === 0) return [];

  return days.map((day, i) => {
    const time = times[i]?.value || '';
    return {
      period: day.period || '',
      day: day.value || '',
      time,
    };
  });
}

// 인라인 표시용: 기간/요일/시간을 한 줄 블럭 단위로 반환
export interface InlineScheduleSegment {
  period: string;
  day: string;
  time: string;
}

export function buildInlineScheduleSegments(classDay: string | undefined, classTime: string | undefined): InlineScheduleSegment[] {
  const rows = buildScheduleRows(classDay, classTime);
  if (rows.length === 0) return [];

  return rows.map(row => ({
    period: row.period,
    day: row.day,
    time: row.time,
  }));
}

