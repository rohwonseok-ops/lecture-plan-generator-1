import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';
import React from 'react';

/**
 * 새롭게 구현한 템플릿 PNG 다운로드 함수
 * - 기본적으로 html-to-image(toPng) 사용
 * - 실패 시 html2canvas로 폴백
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

  // 2) html-to-image 시도
  try {
    const rect = element.getBoundingClientRect();
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      style: {
        transform: 'none',
        backgroundColor: '#ffffff',
      },
      canvasWidth: rect.width,
      canvasHeight: rect.height,
      filter: (node) => {
        // data-no-export="true"가 지정된 요소는 제외
        if (node instanceof HTMLElement && node.dataset?.noExport === 'true') return false;
        return true;
      },
    });

    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
    return;
  } catch (err) {
    console.warn('html-to-image failed, fallback to html2canvas:', err);
  }

  // 3) 폴백: html2canvas
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('Download failed:', err);
    alert('다운로드에 실패했습니다: ' + (err as Error).message);
  }
};