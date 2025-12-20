import { describe, it, expect } from 'vitest';
import {
  A4_RATIO,
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  calculateA4Width,
  calculateA4Scale,
} from '../a4Utils';

describe('a4Utils', () => {
  describe('A4 상수', () => {
    it('A4_RATIO는 약 1.414 이어야 함', () => {
      expect(A4_RATIO).toBeCloseTo(1.414, 2);
    });

    it('A4_WIDTH_PX는 794px 이어야 함', () => {
      expect(A4_WIDTH_PX).toBe(794);
    });

    it('A4_HEIGHT_PX는 1123px 이어야 함', () => {
      expect(A4_HEIGHT_PX).toBe(1123);
    });

    it('A4 비율이 올바른 가로세로 비율이어야 함', () => {
      expect(A4_HEIGHT_PX / A4_WIDTH_PX).toBeCloseTo(A4_RATIO, 2);
    });
  });

  describe('calculateA4Width', () => {
    it('콘텐츠 높이가 A4 높이와 같을 때 A4 너비 반환', () => {
      const result = calculateA4Width(A4_HEIGHT_PX);
      expect(result).toBeCloseTo(A4_WIDTH_PX, 0);
    });

    it('콘텐츠 높이가 작을 때 최소 A4 너비 보장', () => {
      const smallHeight = 500;
      const result = calculateA4Width(smallHeight);
      expect(result).toBe(A4_WIDTH_PX);
    });

    it('콘텐츠 높이가 클 때 비율에 맞는 너비 계산', () => {
      const largeHeight = 2000;
      const expectedWidth = largeHeight / A4_RATIO;
      const result = calculateA4Width(largeHeight);
      expect(result).toBeCloseTo(expectedWidth, 0);
    });

    it('maxWidthMultiplier 옵션이 적용되어야 함', () => {
      const veryLargeHeight = 5000;
      const result = calculateA4Width(veryLargeHeight, { maxWidthMultiplier: 1.5 });
      expect(result).toBeLessThanOrEqual(A4_WIDTH_PX * 1.5);
    });
  });

  describe('calculateA4Scale', () => {
    it('A4 정확한 비율일 때 스케일 1 반환', () => {
      const result = calculateA4Scale(A4_WIDTH_PX, A4_HEIGHT_PX);
      expect(result.scale).toBeCloseTo(1, 2);
      expect(result.width).toBeCloseTo(A4_WIDTH_PX, 0);
      expect(result.height).toBeCloseTo(A4_HEIGHT_PX, 0);
    });

    it('콘텐츠가 A4보다 세로로 긴 경우 축소', () => {
      const tallContent = { width: 794, height: 2000 };
      const result = calculateA4Scale(tallContent.width, tallContent.height);
      expect(result.scale).toBeLessThan(1);
      // 부동소수점 연산으로 인한 오차 허용 (1px 이내)
      expect(result.height).toBeCloseTo(A4_HEIGHT_PX, 0);
    });

    it('콘텐츠가 A4보다 가로로 넓은 경우 축소', () => {
      const wideContent = { width: 1200, height: 1123 };
      const result = calculateA4Scale(wideContent.width, wideContent.height);
      expect(result.scale).toBeLessThan(1);
      // 부동소수점 연산으로 인한 오차 허용 (1px 이내)
      expect(result.width).toBeCloseTo(A4_WIDTH_PX, 0);
    });

    it('작은 콘텐츠는 최소 A4 크기 보장', () => {
      const smallContent = { width: 400, height: 600 };
      const result = calculateA4Scale(smallContent.width, smallContent.height);
      // 부동소수점 연산으로 인한 오차 허용 (1px 이내)
      expect(result.width).toBeCloseTo(A4_WIDTH_PX, 0);
      expect(result.height).toBeCloseTo(A4_HEIGHT_PX, 0);
    });

    it('결과 비율이 A4 비율과 일치해야 함', () => {
      const testCases = [
        { width: 800, height: 1200 },
        { width: 1000, height: 1500 },
        { width: 600, height: 800 },
      ];

      testCases.forEach(({ width, height }) => {
        const result = calculateA4Scale(width, height);
        const resultRatio = result.height / result.width;
        expect(resultRatio).toBeCloseTo(A4_RATIO, 2);
      });
    });
  });
});
