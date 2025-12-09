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
    title: bodySize,
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
  };
}

