/**
 * 템플릿 색상 테마 시스템
 * 
 * 각 템플릿 카테고리에서 사용할 수 있는 5가지 색상 베리에이션
 * - blue: 로고 기반 스틸 블루
 * - purple: 바이올렛 퍼플
 * - orange: 비비드 오렌지
 * - teal: 청록색 틸
 * - green: 에메랄드 그린
 * - dancheong: 단청 감성의 네온 멀티컬러
 * - navyGold: 네이비 + 골드 클래식 콘서트
 * - blackOrange: 블랙/오렌지 하이컨트라스트 포스터
 */

export type ColorTheme = 'blue' | 'purple' | 'orange' | 'teal' | 'green' | 'dancheong' | 'navyGold' | 'blackOrange';

export interface ColorPalette {
  primary: string;      // 메인 강조색 (헤더, 버튼 등)
  dark: string;         // 진한 강조 (텍스트, 진한 배경)
  light: string;        // 연한 배경 (정보 바, 테이블 헤더)
  lighter: string;      // 더 연한 배경 (테이블 행)
  border: string;       // 테두리색
  gradient?: string;    // 그라데이션 (옵션)
}

export const colorThemes: Record<ColorTheme, ColorPalette> = {
  blue: {
    primary: '#6A9FB8',
    dark: '#4A7F98',
    light: '#E8F1F5',
    lighter: '#D1E3EB',
    border: '#A8C9D8',
    gradient: 'linear-gradient(135deg, #6A9FB8 0%, #4A7F98 100%)'
  },
  purple: {
    primary: '#7C3AED',
    dark: '#5B21B6',
    light: '#F5F3FF',
    lighter: '#EDE9FE',
    border: '#C4B5FD',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)'
  },
  orange: {
    primary: '#F97316',
    dark: '#EA580C',
    light: '#FFF7ED',
    lighter: '#FFEDD5',
    border: '#FDBA74',
    gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
  },
  teal: {
    primary: '#14B8A6',
    dark: '#0D9488',
    light: '#F0FDFA',
    lighter: '#CCFBF1',
    border: '#5EEAD4',
    gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)'
  },
  green: {
    primary: '#0E6A5B',
    dark: '#0A4E43',
    light: '#ECFDF5',
    lighter: '#D1FAE5',
    border: '#A7D3C7',
    gradient: 'linear-gradient(135deg, #0E6A5B 0%, #0A4E43 100%)'
  },
  dancheong: {
    primary: '#FF4FD2',
    dark: '#0F1A5B',
    light: '#F6F7FB',
    lighter: '#EBEDF5',
    border: '#B2B6E8',
    gradient: 'linear-gradient(135deg, #FF4FD2 0%, #11C3FF 35%, #FF9A3D 70%, #6BE87D 100%)'
  },
  navyGold: {
    primary: '#E7D08A',
    dark: '#0C1429',
    light: '#F9F4E4',
    lighter: '#EEE5CF',
    border: '#D9C38F',
    gradient: 'linear-gradient(135deg, #0C1429 0%, #132040 55%, #E7D08A 130%)'
  },
  blackOrange: {
    primary: '#FF4F1F',
    dark: '#0D0D0D',
    light: '#1A1A1A',
    lighter: '#222222',
    border: '#2E2E2E',
    gradient: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 45%, #FF4F1F 115%)'
  }
};

// 색상 테마 한글 이름
export const colorThemeNames: Record<ColorTheme, string> = {
  blue: '블루',
  purple: '퍼플',
  orange: '오렌지',
  teal: '틸',
  green: '에메랄드',
  dancheong: '단청 멀티',
  navyGold: '네이비 골드',
  blackOrange: '블랙 오렌지'
};

// 템플릿 카테고리 정의
export type TemplateCategory = 'style1' | 'style2' | 'style3';

// 템플릿 카테고리 한글 이름
export const templateCategoryNames: Record<TemplateCategory, string> = {
  style1: '스타일1',
  style2: '스타일2', 
  style3: '스타일3'
};

// 유틸리티: 색상 테마 가져오기
export const getColorPalette = (theme: ColorTheme): ColorPalette => {
  return colorThemes[theme];
};

