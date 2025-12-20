import html2canvas from 'html2canvas';
import { toJpeg } from 'html-to-image';
import React from 'react';
import { toast } from 'sonner';
import { calculateA4Scale } from './a4Utils';

/**
 * 템플릿을 A4 비율로 리사이징 (a4Utils 활용)
 * - 현재 콘텐츠 높이를 기준으로 A4 비율에 맞는 너비 계산
 * - CSS transform scale을 적용하여 A4 박스에 맞춤
 */
export const resizeToA4 = (element: HTMLElement): { scale: number; width: number; height: number } => {
  const currentWidth = element.scrollWidth;
  const currentHeight = element.scrollHeight;
  return calculateA4Scale(currentWidth, currentHeight);
};

/**
 * 인쇄용 스타일 적용 (스크롤바 제거)
 * - overflow-auto를 overflow-visible로 변경
 * - 원본 스타일을 저장하여 복원 가능하게 함
 */
const applyPrintStyles = (element: HTMLElement): Map<HTMLElement, string> => {
  const originalStyles = new Map<HTMLElement, string>();
  
  // overflow-auto가 적용된 모든 요소 찾기
  const overflowElements = element.querySelectorAll('*');
  overflowElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      const computed = window.getComputedStyle(el);
      if (computed.overflow === 'auto' || computed.overflowX === 'auto' || computed.overflowY === 'auto') {
        originalStyles.set(el, el.style.overflow);
        el.style.overflow = 'visible';
      }
    }
  });
  
  return originalStyles;
};

/**
 * 원본 스타일 복원
 */
const restoreStyles = (originalStyles: Map<HTMLElement, string>) => {
  originalStyles.forEach((value, el) => {
    el.style.overflow = value || '';
  });
};

/**
 * 고해상도 JPG를 Blob으로 반환하는 함수 (인쇄 품질)
 * - pixelRatio 4로 고해상도 출력 (약 300dpi)
 * - A4 비율 유지
 * - 고품질 JPG (품질 0.95)
 * - 인쇄용으로 스크롤바 제거
 * - ZIP 압축 다운로드를 위한 내부 함수
 */
export const getJpgAsBlob = async (
  targetRef: React.RefObject<HTMLDivElement | null>
): Promise<Blob | null> => {
  if (!targetRef.current) return null;

  const element = targetRef.current;

  // 1) 폰트 로딩 대기 (가능한 경우)
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch {
    // 폰트 대기 실패 시 계속 진행
  }

  // 2) 인쇄용 스타일 적용 (스크롤바 제거)
  const originalStyles = applyPrintStyles(element);

  // 3) html-to-image 시도 (고해상도)
  try {
    // 스타일 변경 후 레이아웃 재계산 대기
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 스크롤 콘텐츠 전체 크기 사용
    const width = element.scrollWidth;
    const height = element.scrollHeight;
    
    // 고해상도 출력을 위한 pixelRatio (4 = 약 384dpi, 인쇄 품질)
    const highResRatio = 4;
    
    const dataUrl = await toJpeg(element, {
      cacheBust: true,
      pixelRatio: highResRatio,
      quality: 0.95, // JPG 고품질 (0.95)
      width: width,
      height: height,
      style: {
        transform: 'none',
        backgroundColor: '#ffffff',
      },
      filter: (node) => {
        // data-no-export="true"가 지정된 요소는 제외
        if (node instanceof HTMLElement && node.dataset?.noExport === 'true') return false;
        return true;
      },
    });

    // 스타일 복원
    restoreStyles(originalStyles);

    // Data URL을 Blob으로 변환
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return blob;
  } catch (err) {
    console.warn('html-to-image failed, fallback to html2canvas:', err);
  }

  // 4) 폴백: html2canvas (고해상도)
  try {
    const canvas = await html2canvas(element, {
      scale: 4, // 고해상도 (4배 = 약 384dpi)
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0, // 이미지 로딩 타임아웃 없음
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      ignoreElements: (el) => {
        // data-no-export="true"가 지정된 요소는 제외
        if (el instanceof HTMLElement && el.dataset?.noExport === 'true') return true;
        return false;
      },
    });

    // 스타일 복원
    restoreStyles(originalStyles);

    // Canvas를 JPG Blob으로 변환
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to Blob conversion failed'));
        }
      }, 'image/jpeg', 0.95); // JPG 고품질 (0.95)
    });
  } catch (err) {
    // 스타일 복원 (에러 발생 시에도)
    restoreStyles(originalStyles);
    console.error('JPG generation failed:', err);
    return null;
  }
};

/**
 * 고해상도 JPG 다운로드 함수 (인쇄 품질)
 * - pixelRatio 4로 고해상도 출력 (약 300dpi)
 * - A4 비율 유지
 * - 고품질 JPG (품질 0.95)
 * - 인쇄용으로 스크롤바 제거
 */
export const downloadAsJpg = async (
  targetRef: React.RefObject<HTMLDivElement | null>,
  fileName: string
) => {
  const blob = await getJpgAsBlob(targetRef);
  if (!blob) {
    toast.error('다운로드에 실패했습니다.');
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${fileName}.jpg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

// 하위 호환성을 위한 별칭 (기존 코드 호환)
export const downloadAsPng = downloadAsJpg;