import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';
import React from 'react';

// A4 비율 상수 (210mm x 297mm)
const A4_RATIO = 297 / 210; // ≈ 1.414

/**
 * 템플릿을 A4 비율로 리사이징
 * - 현재 콘텐츠 높이를 기준으로 A4 비율에 맞는 너비 계산
 * - CSS transform scale을 적용하여 A4 박스에 맞춤
 */
export const resizeToA4 = (element: HTMLElement): { scale: number; width: number; height: number } => {
  // 현재 실제 크기 측정
  const currentWidth = element.scrollWidth;
  const currentHeight = element.scrollHeight;
  
  // A4 기준 치수 (픽셀, 96dpi 기준 약 794 x 1123)
  const A4_WIDTH_PX = 794; // 210mm at 96dpi
  const A4_HEIGHT_PX = 1123; // 297mm at 96dpi
  
  // 현재 비율
  const currentRatio = currentHeight / currentWidth;
  
  let scale = 1;
  let targetWidth = A4_WIDTH_PX;
  let targetHeight = A4_HEIGHT_PX;
  
  if (currentRatio > A4_RATIO) {
    // 콘텐츠가 A4보다 세로로 길다 → 높이 기준으로 스케일 다운
    scale = A4_HEIGHT_PX / currentHeight;
    targetWidth = currentWidth * scale;
    // 너비가 A4보다 작아지면 A4 너비로 맞춤
    if (targetWidth < A4_WIDTH_PX) {
      targetWidth = A4_WIDTH_PX;
    }
    targetHeight = targetWidth * A4_RATIO;
    scale = targetHeight / currentHeight;
  } else {
    // 콘텐츠가 A4보다 가로로 넓거나 같다 → 너비 기준
    scale = A4_WIDTH_PX / currentWidth;
    targetHeight = currentHeight * scale;
    if (targetHeight < A4_HEIGHT_PX) {
      targetHeight = A4_HEIGHT_PX;
    }
    targetWidth = targetHeight / A4_RATIO;
    scale = targetWidth / currentWidth;
  }
  
  return { scale, width: targetWidth, height: targetHeight };
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
 * 고해상도 PNG 다운로드 함수 (인쇄 품질)
 * - pixelRatio 4로 고해상도 출력 (약 300dpi)
 * - A4 비율 유지
 * - 압축 없이 최대 품질
 * - 인쇄용으로 스크롤바 제거
 */
export const downloadAsPng = async (
  targetRef: React.RefObject<HTMLDivElement | null>,
  fileName: string
) => {
  if (!targetRef.current) return;

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
    
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: highResRatio,
      quality: 1.0, // 최대 품질
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

    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
    return;
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
    });

    // 스타일 복원
    restoreStyles(originalStyles);

    // PNG 최대 품질로 내보내기
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  } catch (err) {
    // 스타일 복원 (에러 발생 시에도)
    restoreStyles(originalStyles);
    console.error('Download failed:', err);
    alert('다운로드에 실패했습니다: ' + (err as Error).message);
  }
};