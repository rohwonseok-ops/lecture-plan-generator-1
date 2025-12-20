import { CSSProperties } from 'react';
import { ClassPlan, ColorTheme, FieldFontSizes, TypographySettings } from '@/lib/types';
import { ColorPalette, colorThemes } from '@/lib/colorThemes';
import { getFontClassName, getDefaultTypography, getFieldFontSize } from '@/lib/utils';

/**
 * 섹션 컴포넌트에서 공유하는 스타일 헬퍼
 */
export interface SectionStyleHelpers {
  getLayoutStyle: (sectionId: string) => CSSProperties;
  getHeaderStyle: (index: number) => CSSProperties;
  getHeaderTextClass: () => string;
  getSize: (field: keyof FieldFontSizes) => number;
}

/**
 * 공통 섹션 Props
 */
export interface BaseSectionProps {
  classPlan: ClassPlan;
  colors: ColorPalette;
  typography: TypographySettings;
  titleFontClass: string;
  bodyFontClass: string;
  titleWeight: number;
  bodyWeight: number;
  helpers: SectionStyleHelpers;
}

/**
 * 테마별 헤더 그라데이션 (단청 테마용)
 */
export const dancheongHeaderGradients = [
  'linear-gradient(135deg, #FF4FD2 0%, #D63BAA 100%)',
  'linear-gradient(135deg, #11C3FF 0%, #0E9CD4 100%)',
  'linear-gradient(135deg, #FF9A3D 0%, #E67F1F 100%)',
  'linear-gradient(135deg, #6BE87D 0%, #3FB35B 100%)',
  'linear-gradient(135deg, #FFC857 0%, #E6A93C 100%)',
  'linear-gradient(135deg, #7C5CFF 0%, #5B3FD6 100%)',
];

/**
 * 기본 텍스트 색상
 */
export const textColors = {
  primary: '#3f3f46',
  strong: '#27272a',
};

/**
 * 정보 카드 공통 스타일 생성
 */
export const createInfoCardStyle = (colors: ColorPalette): CSSProperties => ({
  borderColor: colors.border,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,246,248,0.92))',
  boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
});

/**
 * 정보 카드 헤더 스타일 생성
 */
export const createInfoHeaderStyle = (baseStyle: CSSProperties): CSSProperties => ({
  ...baseStyle,
  padding: '0.7rem 0.95rem',
  minHeight: '2.35rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
});

/**
 * 주차 배지 스타일 생성
 */
export const createWeekBadgeStyle = (
  colors: ColorPalette,
  useGradientHeaders: boolean,
  isDancheong: boolean
): CSSProperties => {
  if (useGradientHeaders || isDancheong) {
    return {
      backgroundColor: colors.light,
      border: `1px solid ${colors.border}`,
      color: colors.dark,
    };
  }
  return {
    backgroundColor: colors.primary,
    color: '#FFFFFF',
  };
};

/**
 * 스타일 헬퍼 생성 함수
 */
export function createStyleHelpers(
  classPlan: ClassPlan,
  colorTheme: ColorTheme,
  colors: ColorPalette
): SectionStyleHelpers & {
  typography: TypographySettings;
  titleFontClass: string;
  bodyFontClass: string;
  titleWeight: number;
  bodyWeight: number;
  isDancheong: boolean;
  useGradientHeaders: boolean;
  isSoftGradientTheme: boolean;
} {
  const typography = classPlan.typography || getDefaultTypography();
  const titleFontClass = getFontClassName(typography.titleFont);
  const bodyFontClass = getFontClassName(typography.bodyFont);
  const titleWeight = typography.titleWeight || 400;
  const bodyWeight = typography.bodyWeight || 400;
  const fieldFontSizes = typography.fieldFontSizes;
  const layoutConfig = classPlan.layoutConfig;

  const isDancheong = colorTheme === 'dancheong';
  const useGradientHeaders = ['purple', 'orange', 'teal', 'green', 'blue'].includes(colorTheme);
  const isSoftGradientTheme = ['purple', 'orange', 'teal'].includes(colorTheme);

  const headerBackground = `linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 45%), ${colors.gradient || colors.primary}`;

  const cardHeaderStyle: CSSProperties = { backgroundColor: colors.primary };

  const gradientHeaderStyle: CSSProperties | undefined = useGradientHeaders
    ? {
        background: isSoftGradientTheme
          ? `linear-gradient(135deg, ${colors.primary}b3 0%, ${colors.dark || colors.primary}e6 100%)`
          : headerBackground,
        color: isSoftGradientTheme ? '#FFFFFF' : undefined,
        borderBottom: isSoftGradientTheme ? `1px solid ${colors.primary}f2` : '1px solid rgba(255,255,255,0.25)',
        boxShadow: isSoftGradientTheme ? 'inset 0 -1px 0 rgba(0,0,0,0.25)' : undefined,
      }
    : undefined;

  // sectionIdToConfigKey import 없이 직접 처리
  const sectionIdMap: Record<string, string> = {
    'header': 'header',
    'parent-intro': 'parentIntro',
    'teacher-info': 'teacherInfo',
    'schedule-info': 'scheduleInfo',
    'course-info': 'courseInfo',
    'learning-goal': 'learningGoal',
    'management': 'management',
    'weekly-plan': 'weeklyPlan',
    'monthly-calendar': 'monthlyCalendar',
    'fee-table': 'feeTable',
  };

  const getLayoutStyle = (sectionId: string): CSSProperties => {
    if (!layoutConfig) return {};
    const configKey = (sectionIdMap[sectionId] || sectionId) as keyof typeof layoutConfig;
    const layout = layoutConfig[configKey];
    if (!layout || typeof layout === 'boolean') return {};

    const style: CSSProperties = {};
    const x = typeof layout.x === 'number' && isFinite(layout.x) && Math.abs(layout.x) <= 500 ? layout.x : 0;
    const y = typeof layout.y === 'number' && isFinite(layout.y) && Math.abs(layout.y) <= 500 ? layout.y : 0;

    if (x !== 0 || y !== 0) {
      style.transform = `translate(${x}px, ${y}px)`;
    }
    if (typeof layout.width === 'number' && isFinite(layout.width) && Math.abs(layout.width) <= 500 && layout.width !== 0) {
      style.width = `calc(100% + ${layout.width}px)`;
    }
    if (typeof layout.height === 'number' && isFinite(layout.height) && Math.abs(layout.height) <= 500 && layout.height !== 0) {
      style.height = `calc(100% + ${layout.height}px)`;
    }
    return style;
  };

  const getHeaderStyle = (index: number): CSSProperties => {
    if (isDancheong) {
      const bg = dancheongHeaderGradients[index % dancheongHeaderGradients.length];
      return {
        background: bg,
        borderBottom: '1px solid rgba(255,255,255,0.18)',
      };
    }
    if (useGradientHeaders && gradientHeaderStyle) {
      return gradientHeaderStyle;
    }
    return cardHeaderStyle;
  };

  const getHeaderTextClass = (): string => {
    if (isDancheong) return 'text-white';
    if (isSoftGradientTheme) return '';
    if (useGradientHeaders) return 'text-white';
    return 'text-white';
  };

  const getSize = (field: keyof FieldFontSizes): number => {
    return getFieldFontSize(fieldFontSizes, field, typography.bodySize);
  };

  return {
    typography,
    titleFontClass,
    bodyFontClass,
    titleWeight,
    bodyWeight,
    isDancheong,
    useGradientHeaders,
    isSoftGradientTheme,
    getLayoutStyle,
    getHeaderStyle,
    getHeaderTextClass,
    getSize,
  };
}

/**
 * 색상 팔레트 가져오기 (안전)
 */
export function getColorPalette(colorTheme: ColorTheme): ColorPalette {
  return colorThemes[colorTheme] || colorThemes.blue;
}

/**
 * Style2용 단청 멀티 포인트 컬러
 */
export const dancheongAccents = ['#FF4FD2', '#11C3FF', '#FF9A3D', '#6BE87D', '#FFC857', '#7C5CFF'];

/**
 * Style2용 액센트 컬러 헬퍼 생성
 */
export function createAccentHelpers(colors: ColorPalette, isDancheong: boolean) {
  const lightBg = `${colors.border}30`;
  const lighterBg = `${colors.border}20`;
  const mediumLight = `${colors.border}66`;

  const getAccent = (index: number) =>
    isDancheong ? dancheongAccents[index % dancheongAccents.length] : colors.primary;

  const getAccentLight = (index: number) =>
    isDancheong ? `${getAccent(index)}1A` : lightBg;

  const getAccentLighter = (index: number) =>
    isDancheong ? `${getAccent(index)}0D` : lighterBg;

  const getAccentMedium = (index: number) =>
    isDancheong ? `${getAccent(index)}33` : mediumLight;

  return { getAccent, getAccentLight, getAccentLighter, getAccentMedium, lightBg, lighterBg, mediumLight };
}
