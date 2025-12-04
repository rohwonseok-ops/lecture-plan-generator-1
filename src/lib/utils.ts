import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { FontFamily, TypographySettings } from './types'

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

