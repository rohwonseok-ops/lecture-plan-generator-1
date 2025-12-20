/**
 * A4 비율 관련 유틸리티
 * 미리보기와 다운로드에서 일관된 A4 비율 계산을 위해 사용
 */

// A4 비율 상수
export const A4_RATIO = 297 / 210; // 1.414 (세로/가로)
export const A4_WIDTH_PX = 794;    // 210mm at 96dpi
export const A4_HEIGHT_PX = 1123;  // 297mm at 96dpi

export interface A4Dimensions {
  width: number;
  height: number;
  scale: number;
}

/**
 * 콘텐츠 높이를 기준으로 A4 비율에 맞는 너비 계산
 * @param contentHeight 콘텐츠 높이 (px)
 * @param options.maxWidthMultiplier 최대 너비 배수 (기본값: 2)
 * @returns 계산된 너비 (px)
 */
export function calculateA4Width(
  contentHeight: number,
  options?: { maxWidthMultiplier?: number }
): number {
  const maxMultiplier = options?.maxWidthMultiplier ?? 2;
  const targetWidth = contentHeight / A4_RATIO;
  return Math.max(A4_WIDTH_PX, Math.min(targetWidth, A4_WIDTH_PX * maxMultiplier));
}

/**
 * 요소의 실제 콘텐츠 크기 측정 (minHeight 영향 제외)
 * @param element 측정할 HTML 요소
 * @returns 콘텐츠 크기 { width, height }
 */
export function measureContentSize(element: HTMLElement): { width: number; height: number } {
  const prevMinHeight = element.style.minHeight;
  const prevHeight = element.style.height;

  element.style.minHeight = 'auto';
  element.style.height = 'auto';

  const size = {
    width: element.scrollWidth,
    height: Math.max(element.scrollHeight, A4_HEIGHT_PX),
  };

  element.style.minHeight = prevMinHeight;
  element.style.height = prevHeight;

  return size;
}

/**
 * 요소를 A4 비율로 스케일링 (다운로드용)
 * @param contentWidth 콘텐츠 너비 (px)
 * @param contentHeight 콘텐츠 높이 (px)
 * @returns A4 치수 및 스케일 { width, height, scale }
 */
export function calculateA4Scale(
  contentWidth: number,
  contentHeight: number
): A4Dimensions {
  const currentRatio = contentHeight / contentWidth;
  let scale = 1;
  let targetWidth = A4_WIDTH_PX;
  let targetHeight = A4_HEIGHT_PX;

  if (currentRatio > A4_RATIO) {
    // 콘텐츠가 A4보다 세로로 길다
    scale = A4_HEIGHT_PX / contentHeight;
    targetWidth = contentWidth * scale;
    if (targetWidth < A4_WIDTH_PX) {
      targetWidth = A4_WIDTH_PX;
    }
    targetHeight = targetWidth * A4_RATIO;
    scale = targetHeight / contentHeight;
  } else {
    // 콘텐츠가 A4보다 가로로 넓거나 같다
    scale = A4_WIDTH_PX / contentWidth;
    targetHeight = contentHeight * scale;
    if (targetHeight < A4_HEIGHT_PX) {
      targetHeight = A4_HEIGHT_PX;
    }
    targetWidth = targetHeight / A4_RATIO;
    scale = targetWidth / contentWidth;
  }

  return { scale, width: targetWidth, height: targetHeight };
}
