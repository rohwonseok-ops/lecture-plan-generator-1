'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Rnd, DraggableData, ResizableDelta, Position } from 'react-rnd';
import { useTemplateEditStore, clampPosition, clampSize } from '@/store/templateEditStore';
import { useClassPlanStore } from '@/store/classPlanStore';
import { AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter, Maximize2, RotateCcw, AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween, Ruler, ArrowDownUp, ArrowLeftRight } from 'lucide-react';

interface DetectedSection {
  id: string;
  label: string;
  element: HTMLElement;
  rect: DOMRect;
  originalTransform: string;
  originalWidth: string;
  originalHeight: string;
}

interface ActiveDragInfo {
  sectionId: string;
  type: 'move' | 'resize';
}

// 섹션 ID와 한글 라벨 매핑
const sectionLabels: Record<string, string> = {
  'header': '헤더',
  'parent-intro': '학부모 안내',
  'teacher-info': '담임강사',
  'schedule-info': '수업일정',
  'course-info': '학습과정',
  'learning-goal': '학습목표',
  'management': '학습관리',
  'weekly-plan': '주차별 계획',
  'monthly-calendar': '월간계획',
  'fee-table': '수강료',
};

const TemplateEditOverlay: React.FC = () => {
  const { 
    isEditMode, 
    pendingLayoutChanges, 
    updateElementLayout, 
    clearPendingChanges,
    setBaseLayoutConfig,
    getBaseLayoutForSection,
    saveOriginalDOMStyle,
    getOriginalDOMStyle,
    clearOriginalDOMStyles,
    isSaving,
    setIsSaving,
    setApplyToCategory,
  } = useTemplateEditStore();
  const { classPlans, selectedId } = useClassPlanStore();
  const selectedPlan = classPlans.find((plan) => plan.id === selectedId);
  const memoizedLayoutConfig = useMemo(
    () => (selectedPlan?.layoutConfig ? { ...selectedPlan.layoutConfig } : null),
    [selectedPlan?.layoutConfig]
  );
  const prevEditModeRef = useRef(isEditMode);
  const [detectedSections, setDetectedSections] = useState<DetectedSection[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [activeDrag, setActiveDrag] = useState<ActiveDragInfo | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ type: 'vertical' | 'horizontal'; position: number; label?: string }[]>([]);
  const [containerScale, setContainerScale] = useState(1);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // 스냅 계산을 위한 RAF ID
  const snapRafRef = useRef<number | null>(null);
  // 섹션 레퍼런스 보관 (취소 시 복구용)
  const sectionElementsRef = useRef<Map<string, HTMLElement>>(new Map());

  // scale 계산 헬퍼 함수
  const calculateScale = useCallback((container: HTMLElement): number => {
    let scale = 1;
    let scaleElement = container.parentElement;
    while (scaleElement) {
      const transform = window.getComputedStyle(scaleElement).transform;
      if (transform && transform !== 'none') {
        const matrix = new DOMMatrix(transform);
        if (matrix.a !== 1 || matrix.d !== 1) {
          scale = matrix.a || matrix.d || 1;
          break;
        }
      }
      scaleElement = scaleElement.parentElement;
    }
    return scale;
  }, []);

  // 템플릿 내 섹션 요소들 탐지
  const detectSections = useCallback((isInitialDetection = false) => {
    if (!overlayRef.current) return;

    // 부모 컨테이너 (canvasRef) 찾기
    const container = overlayRef.current.parentElement;
    if (!container) return;

    containerRef.current = container as HTMLDivElement;
    const containerRect = container.getBoundingClientRect();

    // scale 계산 및 상태 업데이트
    const scale = calculateScale(container);
    setContainerScale(scale);
    
    // data-section-id 속성을 가진 요소들 탐지
    const sectionElements = container.querySelectorAll('[data-section-id]');
    const sections: DetectedSection[] = [];
    
    sectionElements.forEach((el) => {
      const element = el as HTMLElement;
      const id = element.getAttribute('data-section-id') || '';
      
      // 섹션 요소 레퍼런스 저장
      sectionElementsRef.current.set(id, element);
      
      // 실제 요소의 원본 위치 계산 (transform 제거)
      // 요소의 원본 위치를 얻기 위해 transform을 임시로 제거하고 측정
      const originalTransform = element.style.transform;
      const originalWidth = element.style.width;
      const originalHeight = element.style.height;
      
      // 초기 감지 시 원본 스타일 저장 (취소 시 복구용)
      if (isInitialDetection) {
        saveOriginalDOMStyle(id, {
          transform: originalTransform || '',
          width: originalWidth || '',
          height: originalHeight || '',
        });
      }
      
      // transform을 임시로 제거하여 원본 위치 측정
      element.style.transform = '';
      element.style.width = '';
      element.style.height = '';
      const baseRect = element.getBoundingClientRect();
      element.style.transform = originalTransform;
      element.style.width = originalWidth;
      element.style.height = originalHeight;
      
      // 컨테이너 기준 상대 위치 계산 (scale 고려, transform 제외)
      const baseRelativeRect = new DOMRect(
        (baseRect.left - containerRect.left) / scale,
        (baseRect.top - containerRect.top) / scale,
        baseRect.width / scale,
        baseRect.height / scale
      );
      
      sections.push({
        id,
        label: sectionLabels[id] || id,
        element,
        rect: baseRelativeRect,
        originalTransform: originalTransform || '',
        originalWidth: originalWidth || '',
        originalHeight: originalHeight || '',
      });
    });
    
    setDetectedSections(sections);
  }, [saveOriginalDOMStyle, calculateScale]);

  // 편집 모드 변경 시 섹션 탐지
  useEffect(() => {
    if (isEditMode) {
      // 현재 선택된 강좌 레이아웃을 기준값으로 등록
      setBaseLayoutConfig(memoizedLayoutConfig);
      // 전체 적용 옵션은 기본적으로 해제하여 오동작 방지
      setApplyToCategory(false);
      // 새 편집 세션마다 변경분 초기화
      clearPendingChanges();
      // 약간의 딜레이 후 탐지 (렌더링 완료 대기)
      const timer = setTimeout(() => detectSections(true), 120);
      return () => clearTimeout(timer);
    } else {
      setDetectedSections([]);
      setSelectedSections([]);
      setBaseLayoutConfig(null);
      setApplyToCategory(false);
    }
  }, [isEditMode, detectSections, memoizedLayoutConfig, setBaseLayoutConfig, setApplyToCategory, clearPendingChanges]);

  // 창 크기 변경 시 재탐지
  useEffect(() => {
    if (!isEditMode) return;
    
    const handleResize = () => {
      detectSections(false);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isEditMode, detectSections]);

  // 현재 섹션의 변환 값 가져오기
  const getTransformValues = useCallback((sectionId: string) => {
    const pending = pendingLayoutChanges[sectionId];
    return {
      x: pending?.x ?? getBaseLayoutForSection(sectionId)?.x ?? 0,
      y: pending?.y ?? getBaseLayoutForSection(sectionId)?.y ?? 0,
      width: pending?.width ?? getBaseLayoutForSection(sectionId)?.width ?? 0,
      height: pending?.height ?? getBaseLayoutForSection(sectionId)?.height ?? 0,
    };
  }, [pendingLayoutChanges, getBaseLayoutForSection]);

  // 섹션 클릭 핸들러 (선택 처리)
  const handleSectionClick = useCallback((
    e: MouseEvent,
    sectionId: string
  ) => {
    // Ctrl/Cmd 클릭으로 다중 선택
    if (e.ctrlKey || e.metaKey) {
      setSelectedSections(prev =>
        prev.includes(sectionId)
          ? prev.filter(id => id !== sectionId)
          : [...prev, sectionId]
      );
    } else {
      setSelectedSections([sectionId]);
    }
  }, []);

  // Rnd 드래그/리사이즈 시작 핸들러
  const handleDragStart = useCallback((sectionId: string) => {
    setActiveDrag({ sectionId, type: 'move' });
  }, []);

  const handleResizeStart = useCallback((sectionId: string) => {
    setActiveDrag({ sectionId, type: 'resize' });
  }, []);

  // 스냅 거리 임계값 (픽셀) - 더 촘촘하게 조정
  const SNAP_THRESHOLD = 6;
  const SPACING_SNAP_THRESHOLD = 8;
  
  // 스냅 위치 계산 (개선된 버전)
  const calculateSnapPosition = useCallback((
    currentX: number,
    currentY: number,
    currentWidth: number,
    currentHeight: number,
    sectionId: string
  ) => {
    let snappedX = currentX;
    let snappedY = currentY;
    const guides: { type: 'vertical' | 'horizontal'; position: number; label?: string }[] = [];
    
    const currentRight = currentX + currentWidth;
    const currentBottom = currentY + currentHeight;
    const currentCenterX = currentX + currentWidth / 2;
    const currentCenterY = currentY + currentHeight / 2;
    
    // 다른 모든 섹션과의 정렬 체크
    detectedSections.forEach((otherSection) => {
      if (otherSection.id === sectionId) return;
      
      const otherTransform = getTransformValues(otherSection.id);
      const otherX = otherSection.rect.left + otherTransform.x;
      const otherY = otherSection.rect.top + otherTransform.y;
      const otherWidth = otherSection.rect.width + otherTransform.width;
      const otherHeight = otherSection.rect.height + otherTransform.height;
      const otherRight = otherX + otherWidth;
      const otherBottom = otherY + otherHeight;
      const otherCenterX = otherX + otherWidth / 2;
      const otherCenterY = otherY + otherHeight / 2;
      
      // === 왼쪽 가장자리 정렬 ===
      // 현재 왼쪽 ↔ 다른 왼쪽
      if (Math.abs(currentX - otherX) < SNAP_THRESHOLD) {
        snappedX = otherX;
        guides.push({ type: 'vertical', position: otherX, label: '좌측 정렬' });
      }
      // 현재 왼쪽 ↔ 다른 오른쪽
      if (Math.abs(currentX - otherRight) < SNAP_THRESHOLD) {
        snappedX = otherRight;
        guides.push({ type: 'vertical', position: otherRight, label: '좌-우 정렬' });
      }
      
      // === 오른쪽 가장자리 정렬 ===
      // 현재 오른쪽 ↔ 다른 오른쪽
      if (Math.abs(currentRight - otherRight) < SNAP_THRESHOLD) {
        snappedX = otherRight - currentWidth;
        guides.push({ type: 'vertical', position: otherRight, label: '우측 정렬' });
      }
      // 현재 오른쪽 ↔ 다른 왼쪽
      if (Math.abs(currentRight - otherX) < SNAP_THRESHOLD) {
        snappedX = otherX - currentWidth;
        guides.push({ type: 'vertical', position: otherX, label: '우-좌 정렬' });
      }
      
      // === 가운데 정렬 (수평) ===
      if (Math.abs(currentCenterX - otherCenterX) < SNAP_THRESHOLD) {
        snappedX = otherCenterX - currentWidth / 2;
        guides.push({ type: 'vertical', position: otherCenterX, label: '중앙 정렬' });
      }
      
      // === 위쪽 가장자리 정렬 ===
      // 현재 위 ↔ 다른 위
      if (Math.abs(currentY - otherY) < SNAP_THRESHOLD) {
        snappedY = otherY;
        guides.push({ type: 'horizontal', position: otherY, label: '상단 정렬' });
      }
      // 현재 위 ↔ 다른 아래
      if (Math.abs(currentY - otherBottom) < SNAP_THRESHOLD) {
        snappedY = otherBottom;
        guides.push({ type: 'horizontal', position: otherBottom, label: '상-하 정렬' });
      }
      
      // === 아래쪽 가장자리 정렬 ===
      // 현재 아래 ↔ 다른 아래
      if (Math.abs(currentBottom - otherBottom) < SNAP_THRESHOLD) {
        snappedY = otherBottom - currentHeight;
        guides.push({ type: 'horizontal', position: otherBottom, label: '하단 정렬' });
      }
      // 현재 아래 ↔ 다른 위
      if (Math.abs(currentBottom - otherY) < SNAP_THRESHOLD) {
        snappedY = otherY - currentHeight;
        guides.push({ type: 'horizontal', position: otherY, label: '하-상 정렬' });
      }
      
      // === 가운데 정렬 (수직) ===
      if (Math.abs(currentCenterY - otherCenterY) < SNAP_THRESHOLD) {
        snappedY = otherCenterY - currentHeight / 2;
        guides.push({ type: 'horizontal', position: otherCenterY, label: '중앙 정렬' });
      }
      
      // === 간격 스냅 (동일 간격 유지) ===
      // 다른 섹션들과의 간격을 측정하고 동일한 간격으로 스냅
      detectedSections.forEach((thirdSection) => {
        if (thirdSection.id === sectionId || thirdSection.id === otherSection.id) return;
        
        const thirdTransform = getTransformValues(thirdSection.id);
        const thirdX = thirdSection.rect.left + thirdTransform.x;
        const thirdY = thirdSection.rect.top + thirdTransform.y;
        const thirdRight = thirdX + thirdSection.rect.width + thirdTransform.width;
        const thirdBottom = thirdY + thirdSection.rect.height + thirdTransform.height;
        
        // 수평 간격 스냅 (A-B 간격과 B-현재 간격 동일하게)
        const horizontalGap = otherX - thirdRight;
        if (horizontalGap > 0) {
          const targetX = otherRight + horizontalGap;
          if (Math.abs(currentX - targetX) < SPACING_SNAP_THRESHOLD) {
            snappedX = targetX;
            guides.push({ type: 'vertical', position: targetX, label: `간격 ${Math.round(horizontalGap)}px` });
          }
        }
        
        // 수직 간격 스냅
        const verticalGap = otherY - thirdBottom;
        if (verticalGap > 0) {
          const targetY = otherBottom + verticalGap;
          if (Math.abs(currentY - targetY) < SPACING_SNAP_THRESHOLD) {
            snappedY = targetY;
            guides.push({ type: 'horizontal', position: targetY, label: `간격 ${Math.round(verticalGap)}px` });
          }
        }
      });
    });
    
    // 컨테이너 기준 스냅 (좌/우/상/하 & 중앙)
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      const containerCenterX = containerWidth / 2;
      
      if (Math.abs(currentCenterX - containerCenterX) < SNAP_THRESHOLD) {
        snappedX = containerCenterX - currentWidth / 2;
        guides.push({ type: 'vertical', position: containerCenterX, label: '페이지 중앙' });
      }
      if (Math.abs(currentX) < SNAP_THRESHOLD) {
        snappedX = 0;
        guides.push({ type: 'vertical', position: 0, label: '좌측 여백' });
      }
      if (Math.abs(currentRight - containerWidth) < SNAP_THRESHOLD) {
        snappedX = containerWidth - currentWidth;
        guides.push({ type: 'vertical', position: containerWidth, label: '우측 여백' });
      }
      if (Math.abs(currentY) < SNAP_THRESHOLD) {
        snappedY = 0;
        guides.push({ type: 'horizontal', position: 0, label: '상단 여백' });
      }
      if (Math.abs(currentBottom - containerHeight) < SNAP_THRESHOLD) {
        snappedY = containerHeight - currentHeight;
        guides.push({ type: 'horizontal', position: containerHeight, label: '하단 여백' });
      }
    }
    
    // 가이드 중복 제거 (같은 축/위치)
    const uniqueGuides = guides.filter((guide, idx, arr) => (
      arr.findIndex((g) => g.type === guide.type && Math.abs(g.position - guide.position) < 0.5) === idx
    ));
    
    setSnapGuides(uniqueGuides);
    return { x: snappedX, y: snappedY };
  }, [detectedSections, getTransformValues]);

  // Rnd 드래그 중 (스냅 가이드 표시)
  const handleDrag = useCallback((
    sectionId: string,
    d: DraggableData
  ) => {
    const section = detectedSections.find(s => s.id === sectionId);
    if (!section) return;

    // RAF로 스냅 계산 최적화
    if (snapRafRef.current !== null) {
      cancelAnimationFrame(snapRafRef.current);
    }
    snapRafRef.current = requestAnimationFrame(() => {
      const currentWidth = section.rect.width + (getTransformValues(sectionId).width || 0);
      const currentHeight = section.rect.height + (getTransformValues(sectionId).height || 0);
      calculateSnapPosition(d.x, d.y, currentWidth, currentHeight, sectionId);
    });
  }, [detectedSections, getTransformValues, calculateSnapPosition]);

  // Rnd 드래그 종료
  const handleDragStop = useCallback((
    sectionId: string,
    d: DraggableData
  ) => {
    const section = detectedSections.find(s => s.id === sectionId);
    if (!section) return;

    const currentWidth = section.rect.width + (getTransformValues(sectionId).width || 0);
    const currentHeight = section.rect.height + (getTransformValues(sectionId).height || 0);

    // 최종 스냅 위치 계산 (d.x, d.y는 오버레이 내 절대 위치)
    const snapped = calculateSnapPosition(d.x, d.y, currentWidth, currentHeight, sectionId);

    // 오프셋 계산: 최종 절대 위치 - 원본 기준 위치
    // section.rect.left/top은 transform이 없는 상태의 원본 위치
    const offsetX = snapped.x - section.rect.left;
    const offsetY = snapped.y - section.rect.top;

    const clampedX = clampPosition(offsetX);
    const clampedY = clampPosition(offsetY);

    updateElementLayout(sectionId, { x: clampedX, y: clampedY });

    // DOM에도 반영 (오프셋으로)
    section.element.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

    setActiveDrag(null);
    setSnapGuides([]);
    setTimeout(() => detectSections(false), 50);
  }, [detectedSections, getTransformValues, calculateSnapPosition, updateElementLayout, detectSections]);

  // Rnd 리사이즈 종료
  const handleResizeStop = useCallback((
    sectionId: string,
    ref: HTMLElement,
    position: Position,
    delta: ResizableDelta
  ) => {
    const section = detectedSections.find(s => s.id === sectionId);
    if (!section) return;

    const transform = getTransformValues(sectionId);

    // 새 크기 계산 (delta 기반)
    const newWidthDelta = transform.width + delta.width;
    const newHeightDelta = transform.height + delta.height;

    // 오프셋 계산: 리사이즈 후 절대 위치 - 원본 기준 위치
    const offsetX = position.x - section.rect.left;
    const offsetY = position.y - section.rect.top;

    // 클램핑
    const clampedX = clampPosition(offsetX);
    const clampedY = clampPosition(offsetY);
    const clampedWidth = clampSize(newWidthDelta);
    const clampedHeight = clampSize(newHeightDelta);

    updateElementLayout(sectionId, {
      x: clampedX,
      y: clampedY,
      width: clampedWidth,
      height: clampedHeight,
    });

    // DOM에도 반영 (오프셋으로)
    section.element.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
    if (clampedWidth !== 0) {
      section.element.style.width = `calc(100% + ${clampedWidth}px)`;
    }
    if (clampedHeight !== 0) {
      section.element.style.height = `calc(100% + ${clampedHeight}px)`;
    }

    setActiveDrag(null);
    setSnapGuides([]);
    setTimeout(() => detectSections(false), 50);
  }, [detectedSections, getTransformValues, updateElementLayout, detectSections]);

  // 정렬 기능
  const alignSections = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedSections.length < 2) return;

    const selectedData = selectedSections.map(id => {
      const section = detectedSections.find(s => s.id === id);
      const transform = getTransformValues(id);
      return section ? { 
        id, 
        rect: section.rect,
        transform,
      } : null;
    }).filter(Boolean) as { id: string; rect: DOMRect; transform: { x: number; y: number } }[];

    if (selectedData.length < 2) return;

    switch (alignment) {
      case 'left': {
        const minLeft = Math.min(...selectedData.map(d => d.rect.left + d.transform.x));
        selectedData.forEach(({ id, rect, transform }) => {
          const newX = clampPosition(minLeft - rect.left);
          const newY = clampPosition(transform.y);
          updateElementLayout(id, { x: newX, y: newY });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${newX}px, ${newY}px)`;
        });
        break;
      }
      case 'center': {
        const centerX = selectedData.reduce((sum, d) => sum + d.rect.left + d.transform.x + d.rect.width / 2, 0) / selectedData.length;
        selectedData.forEach(({ id, rect, transform }) => {
          const newX = clampPosition(centerX - rect.left - rect.width / 2);
          const newY = clampPosition(transform.y);
          updateElementLayout(id, { x: newX, y: newY });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${newX}px, ${newY}px)`;
        });
        break;
      }
      case 'right': {
        const maxRight = Math.max(...selectedData.map(d => d.rect.left + d.transform.x + d.rect.width));
        selectedData.forEach(({ id, rect, transform }) => {
          const newX = clampPosition(maxRight - rect.left - rect.width);
          const newY = clampPosition(transform.y);
          updateElementLayout(id, { x: newX, y: newY });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${newX}px, ${newY}px)`;
        });
        break;
      }
      case 'top': {
        const minTop = Math.min(...selectedData.map(d => d.rect.top + d.transform.y));
        selectedData.forEach(({ id, rect, transform }) => {
          const newX = clampPosition(transform.x);
          const newY = clampPosition(minTop - rect.top);
          updateElementLayout(id, { x: newX, y: newY });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${newX}px, ${newY}px)`;
        });
        break;
      }
      case 'middle': {
        const centerY = selectedData.reduce((sum, d) => sum + d.rect.top + d.transform.y + d.rect.height / 2, 0) / selectedData.length;
        selectedData.forEach(({ id, rect, transform }) => {
          const newX = clampPosition(transform.x);
          const newY = clampPosition(centerY - rect.top - rect.height / 2);
          updateElementLayout(id, { x: newX, y: newY });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${newX}px, ${newY}px)`;
        });
        break;
      }
      case 'bottom': {
        const maxBottom = Math.max(...selectedData.map(d => d.rect.top + d.transform.y + d.rect.height));
        selectedData.forEach(({ id, rect, transform }) => {
          const newX = clampPosition(transform.x);
          const newY = clampPosition(maxBottom - rect.top - rect.height);
          updateElementLayout(id, { x: newX, y: newY });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${newX}px, ${newY}px)`;
        });
        break;
      }
    }
    
    setTimeout(() => detectSections(false), 50);
  }, [selectedSections, detectedSections, getTransformValues, updateElementLayout, detectSections]);

  // 크기 맞춤
  const matchSize = useCallback((dimension: 'width' | 'height' | 'both') => {
    if (selectedSections.length < 2) return;

    const selectedData = selectedSections.map(id => {
      const section = detectedSections.find(s => s.id === id);
      const transform = getTransformValues(id);
      return section ? { id, section, transform } : null;
    }).filter(Boolean) as { id: string; section: DetectedSection; transform: { x: number; y: number; width: number; height: number } }[];

    if (selectedData.length < 2) return;

    // 첫 번째 선택된 요소를 기준으로 크기 맞춤
    const firstItem = selectedData[0];
    const targetWidth = firstItem.section.rect.width + firstItem.transform.width;
    const targetHeight = firstItem.section.rect.height + firstItem.transform.height;

    selectedData.forEach(({ id, section, transform }) => {
      const update: { width?: number; height?: number } = {};
      if (dimension === 'width' || dimension === 'both') {
        update.width = clampSize(targetWidth - section.rect.width);
        const finalWidth = section.rect.width + update.width;
        section.element.style.width = `${finalWidth}px`;
      }
      if (dimension === 'height' || dimension === 'both') {
        update.height = clampSize(targetHeight - section.rect.height);
        const finalHeight = section.rect.height + update.height;
        section.element.style.height = `${finalHeight}px`;
      }
      updateElementLayout(id, { ...transform, ...update });
    });

    setTimeout(() => detectSections(false), 50);
  }, [selectedSections, detectedSections, getTransformValues, updateElementLayout, detectSections]);

  // 간격 균등 분배 (수평)
  const distributeHorizontally = useCallback(() => {
    if (selectedSections.length < 3) return;

    const selectedData = selectedSections.map(id => {
      const section = detectedSections.find(s => s.id === id);
      const transform = getTransformValues(id);
      return section ? { id, section, transform } : null;
    }).filter(Boolean) as { id: string; section: DetectedSection; transform: { x: number; y: number; width: number; height: number } }[];

    if (selectedData.length < 3) return;

    // X 좌표 기준으로 정렬
    selectedData.sort((a, b) => {
      const aX = a.section.rect.left + a.transform.x;
      const bX = b.section.rect.left + b.transform.x;
      return aX - bX;
    });

    const first = selectedData[0];
    const last = selectedData[selectedData.length - 1];
    const firstLeft = first.section.rect.left + first.transform.x;
    const lastRight = last.section.rect.left + last.transform.x + last.section.rect.width + last.transform.width;
    
    // 모든 요소의 총 너비
    const totalWidth = selectedData.reduce((sum, d) => sum + d.section.rect.width + d.transform.width, 0);
    
    // 간격 계산
    const totalSpace = lastRight - firstLeft - totalWidth;
    const gap = totalSpace / (selectedData.length - 1);
    
    let currentX = firstLeft;
    selectedData.forEach(({ id, section, transform }, idx) => {
      if (idx === 0) {
        currentX += section.rect.width + transform.width + gap;
        return;
      }
      
      const newX = clampPosition(currentX - section.rect.left);
      const newY = clampPosition(transform.y);
      updateElementLayout(id, { ...transform, x: newX, y: newY });
      section.element.style.transform = `translate(${newX}px, ${newY}px)`;
      currentX += section.rect.width + transform.width + gap;
    });

    setTimeout(() => detectSections(false), 50);
  }, [selectedSections, detectedSections, getTransformValues, updateElementLayout, detectSections]);

  // 간격 균등 분배 (수직)
  const distributeVertically = useCallback(() => {
    if (selectedSections.length < 3) return;

    const selectedData = selectedSections.map(id => {
      const section = detectedSections.find(s => s.id === id);
      const transform = getTransformValues(id);
      return section ? { id, section, transform } : null;
    }).filter(Boolean) as { id: string; section: DetectedSection; transform: { x: number; y: number; width: number; height: number } }[];

    if (selectedData.length < 3) return;

    // Y 좌표 기준으로 정렬
    selectedData.sort((a, b) => {
      const aY = a.section.rect.top + a.transform.y;
      const bY = b.section.rect.top + b.transform.y;
      return aY - bY;
    });

    const first = selectedData[0];
    const last = selectedData[selectedData.length - 1];
    const firstTop = first.section.rect.top + first.transform.y;
    const lastBottom = last.section.rect.top + last.transform.y + last.section.rect.height + last.transform.height;
    
    // 모든 요소의 총 높이
    const totalHeight = selectedData.reduce((sum, d) => sum + d.section.rect.height + d.transform.height, 0);
    
    // 간격 계산
    const totalSpace = lastBottom - firstTop - totalHeight;
    const gap = totalSpace / (selectedData.length - 1);
    
    let currentY = firstTop;
    selectedData.forEach(({ id, section, transform }, idx) => {
      if (idx === 0) {
        currentY += section.rect.height + transform.height + gap;
        return;
      }
      
      const newX = clampPosition(transform.x);
      const newY = clampPosition(currentY - section.rect.top);
      updateElementLayout(id, { ...transform, x: newX, y: newY });
      section.element.style.transform = `translate(${newX}px, ${newY}px)`;
      currentY += section.rect.height + transform.height + gap;
    });

    setTimeout(() => detectSections(false), 50);
  }, [selectedSections, detectedSections, getTransformValues, updateElementLayout, detectSections]);

  // 키보드 단축키 처리
  useEffect(() => {
    if (!isEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: 선택 해제
      if (e.key === 'Escape') {
        setSelectedSections([]);
        return;
      }

      // 방향키로 미세 이동 (선택된 요소가 있을 때)
      if (selectedSections.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1; // Shift 누르면 10px씩 이동
        let deltaX = 0;
        let deltaY = 0;

        switch (e.key) {
          case 'ArrowUp': deltaY = -step; break;
          case 'ArrowDown': deltaY = step; break;
          case 'ArrowLeft': deltaX = -step; break;
          case 'ArrowRight': deltaX = step; break;
        }

        selectedSections.forEach(sectionId => {
          const section = detectedSections.find(s => s.id === sectionId);
          if (!section) return;

          const transform = getTransformValues(sectionId);
          const newX = clampPosition(transform.x + deltaX);
          const newY = clampPosition(transform.y + deltaY);

          updateElementLayout(sectionId, { x: newX, y: newY });
          section.element.style.transform = `translate(${newX}px, ${newY}px)`;
        });

        setTimeout(() => detectSections(false), 50);
      }

      // Delete/Backspace: 선택된 요소의 변경사항 초기화
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSections.length > 0) {
        e.preventDefault();
        selectedSections.forEach(sectionId => {
          const originalStyle = getOriginalDOMStyle(sectionId);
          const section = sectionElementsRef.current.get(sectionId);
          if (originalStyle && section) {
            section.style.transform = originalStyle.transform;
            section.style.width = originalStyle.width;
            section.style.height = originalStyle.height;
          }
          updateElementLayout(sectionId, { x: 0, y: 0, width: 0, height: 0 });
        });
        setTimeout(() => detectSections(false), 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, selectedSections, detectedSections, getTransformValues, updateElementLayout, detectSections, getOriginalDOMStyle]);

  // 원본 스타일로 DOM 복구
  const restoreOriginalDOMStyles = useCallback(() => {
    sectionElementsRef.current.forEach((element, id) => {
      const originalStyle = getOriginalDOMStyle(id);
      if (originalStyle) {
        element.style.transform = originalStyle.transform;
        element.style.width = originalStyle.width;
        element.style.height = originalStyle.height;
      }
    });
  }, [getOriginalDOMStyle]);

  // 초기화 (현재 편집 내용 리셋)
  const handleReset = useCallback(() => {
    // 모든 섹션의 DOM 스타일을 원본으로 복구
    restoreOriginalDOMStyles();
    clearPendingChanges();
    setSelectedSections([]);
    setTimeout(() => detectSections(false), 50);
  }, [restoreOriginalDOMStyles, clearPendingChanges, detectSections]);

  // 편집 모드 종료 시 처리
  useEffect(() => {
    // 편집 모드가 종료될 때
    if (!isEditMode && prevEditModeRef.current) {
      // 저장이 아니면 (취소 시) 원래 상태로 복원
      if (!isSaving) {
        restoreOriginalDOMStyles();
      }
      // 저장 플래그 및 원본 스타일 정리
      setIsSaving(false);
      clearOriginalDOMStyles();
      sectionElementsRef.current.clear();
    }
    prevEditModeRef.current = isEditMode;
  }, [isEditMode, isSaving, setIsSaving, restoreOriginalDOMStyles, clearOriginalDOMStyles]);

  if (!isEditMode) return null;

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 z-50 pointer-events-none"
      data-no-export="true"
    >
      {/* 편집 도구 모음 */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-zinc-300 rounded-xl shadow-xl px-3 py-1.5 z-[100] pointer-events-auto">
        {selectedSections.length >= 2 ? (
          <>
            {/* 정렬 도구 */}
            <div className="flex items-center gap-0.5 bg-zinc-50 rounded-lg px-1.5 py-0.5">
              <span className="text-[8px] text-zinc-400 mr-1 font-medium">정렬</span>
              <button
                onClick={() => alignSections('left')}
                className="p-1 hover:bg-white rounded transition-colors"
                title="왼쪽 정렬"
              >
                <AlignLeft className="w-3.5 h-3.5 text-zinc-600" />
              </button>
              <button
                onClick={() => alignSections('center')}
                className="p-1 hover:bg-white rounded transition-colors"
                title="가운데 정렬"
              >
                <AlignCenter className="w-3.5 h-3.5 text-zinc-600" />
              </button>
              <button
                onClick={() => alignSections('right')}
                className="p-1 hover:bg-white rounded transition-colors"
                title="오른쪽 정렬"
              >
                <AlignRight className="w-3.5 h-3.5 text-zinc-600" />
              </button>
              <div className="w-px h-3 bg-zinc-200 mx-0.5" />
              <button
                onClick={() => alignSections('top')}
                className="p-1 hover:bg-white rounded transition-colors"
                title="위쪽 정렬"
              >
                <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-zinc-600 rotate-90" />
              </button>
              <button
                onClick={() => alignSections('middle')}
                className="p-1 hover:bg-white rounded transition-colors"
                title="세로 가운데 정렬"
              >
                <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-zinc-600" />
              </button>
              <button
                onClick={() => alignSections('bottom')}
                className="p-1 hover:bg-white rounded transition-colors"
                title="아래쪽 정렬"
              >
                <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-zinc-600 rotate-180" />
              </button>
            </div>

            {/* 크기 맞춤 도구 */}
            <div className="flex items-center gap-0.5 bg-zinc-50 rounded-lg px-1.5 py-0.5">
              <span className="text-[8px] text-zinc-400 mr-1 font-medium">크기</span>
              <button
                onClick={() => matchSize('width')}
                className="p-1 hover:bg-white rounded transition-colors"
                title="너비 맞춤 (첫 번째 요소 기준)"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-600" />
              </button>
              <button
                onClick={() => matchSize('height')}
                className="p-1 hover:bg-white rounded transition-colors"
                title="높이 맞춤 (첫 번째 요소 기준)"
              >
                <ArrowDownUp className="w-3.5 h-3.5 text-zinc-600" />
              </button>
              <button
                onClick={() => matchSize('both')}
                className="p-1 hover:bg-white rounded transition-colors"
                title="크기 맞춤 (첫 번째 요소 기준)"
              >
                <Maximize2 className="w-3.5 h-3.5 text-zinc-600" />
              </button>
            </div>

            {/* 간격 균등 분배 (3개 이상 선택 시) */}
            {selectedSections.length >= 3 && (
              <div className="flex items-center gap-0.5 bg-blue-50 rounded-lg px-1.5 py-0.5">
                <span className="text-[8px] text-blue-400 mr-1 font-medium">분배</span>
                <button
                  onClick={distributeHorizontally}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="가로 간격 균등 분배"
                >
                  <AlignHorizontalSpaceBetween className="w-3.5 h-3.5 text-blue-600" />
                </button>
                <button
                  onClick={distributeVertically}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="세로 간격 균등 분배"
                >
                  <AlignVerticalSpaceBetween className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </div>
            )}
          </>
        ) : selectedSections.length === 1 ? (
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-500">선택됨: <b className="text-zinc-700">{detectedSections.find(s => s.id === selectedSections[0])?.label}</b></span>
            <span className="text-[8px] text-zinc-400">Ctrl+클릭으로 다중 선택</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Ruler className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[9px] text-zinc-500">요소를 클릭하여 선택 | <span className="text-zinc-400">Ctrl+클릭: 다중 선택</span></span>
          </div>
        )}
        <div className="w-px h-4 bg-zinc-200 mx-1" />
        <button
          onClick={handleReset}
          className="p-1 hover:bg-red-50 rounded transition-colors group"
          title="모든 변경사항 초기화"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-500" />
        </button>
      </div>

      {/* 감지된 섹션들에 대한 편집 핸들 (react-rnd 사용) */}
      {detectedSections.map((section) => {
        const transform = getTransformValues(section.id);
        const isSelected = selectedSections.includes(section.id);
        const isDragging = activeDrag?.sectionId === section.id;
        const isResizing = isDragging && activeDrag?.type === 'resize';
        const isMoving = isDragging && activeDrag?.type === 'move';

        return (
          <Rnd
            key={section.id}
            position={{
              x: section.rect.left + transform.x,
              y: section.rect.top + transform.y,
            }}
            size={{
              width: section.rect.width + transform.width,
              height: section.rect.height + transform.height,
            }}
            scale={containerScale}
            dragGrid={[1, 1]}
            bounds="parent"
            enableResizing={isSelected}
            resizeHandleStyles={{
              top: { cursor: 'ns-resize' },
              right: { cursor: 'ew-resize' },
              bottom: { cursor: 'ns-resize' },
              left: { cursor: 'ew-resize' },
              topRight: { cursor: 'nesw-resize' },
              bottomRight: { cursor: 'nwse-resize' },
              bottomLeft: { cursor: 'nesw-resize' },
              topLeft: { cursor: 'nwse-resize' },
            }}
            resizeHandleClasses={{
              top: 'absolute w-full h-2 -top-1 left-0',
              right: 'absolute w-2 h-full top-0 -right-1',
              bottom: 'absolute w-full h-2 -bottom-1 left-0',
              left: 'absolute w-2 h-full top-0 -left-1',
              topRight: 'absolute w-3 h-3 -top-1.5 -right-1.5 bg-blue-500 rounded-full border border-white shadow-sm hover:bg-blue-600 hover:scale-125 transition-transform z-10',
              bottomRight: 'absolute w-3 h-3 -bottom-1.5 -right-1.5 bg-blue-500 rounded-full border border-white shadow-sm hover:bg-blue-600 hover:scale-125 transition-transform z-10',
              bottomLeft: 'absolute w-3 h-3 -bottom-1.5 -left-1.5 bg-blue-500 rounded-full border border-white shadow-sm hover:bg-blue-600 hover:scale-125 transition-transform z-10',
              topLeft: 'absolute w-3 h-3 -top-1.5 -left-1.5 bg-blue-500 rounded-full border border-white shadow-sm hover:bg-blue-600 hover:scale-125 transition-transform z-10',
            }}
            onDragStart={() => handleDragStart(section.id)}
            onDrag={(e, d) => handleDrag(section.id, d)}
            onDragStop={(e, d) => handleDragStop(section.id, d)}
            onResizeStart={() => handleResizeStart(section.id)}
            onResizeStop={(e, direction, ref, delta, position) =>
              handleResizeStop(section.id, ref, position, delta)
            }
            onMouseDown={(e) => handleSectionClick(e, section.id)}
            className={`pointer-events-auto border-2 ${
              isSelected
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-dashed border-zinc-400/50 hover:border-blue-400 hover:bg-blue-400/5'
            } ${isDragging ? 'z-[60]' : ''} ${isMoving ? 'ring-2 ring-blue-300 ring-opacity-50' : ''} ${isResizing ? 'ring-2 ring-green-300 ring-opacity-50' : ''}`}
            style={{
              cursor: isMoving ? 'grabbing' : 'grab',
              transition: isDragging ? 'none' : 'border-color 0.15s, background-color 0.15s',
            }}
          >
            {/* 섹션 라벨 */}
            <div
              className={`absolute -top-5 left-1 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm transition-colors ${
                isSelected ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-white'
              }`}
            >
              {section.label}
            </div>

            {/* 선택된 요소 번호 표시 (다중 선택 시) */}
            {selectedSections.length > 1 && isSelected && (
              <div className="absolute -top-5 right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[8px] flex items-center justify-center font-bold shadow-sm">
                {selectedSections.indexOf(section.id) + 1}
              </div>
            )}

            {/* 드래그 중 크기/위치 표시 */}
            {isDragging && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[8px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap font-mono">
                {isMoving && `X: ${Math.round(section.rect.left + transform.x)} Y: ${Math.round(section.rect.top + transform.y)}`}
                {isResizing && `W: ${Math.round(section.rect.width + transform.width)} H: ${Math.round(section.rect.height + transform.height)}`}
              </div>
            )}
          </Rnd>
        );
      })}

      {/* 스냅 가이드라인 (개선된 스타일) */}
      {snapGuides.map((guide, idx) => (
        guide.type === 'vertical' ? (
          <div
            key={`v-${idx}`}
            className="absolute top-0 bottom-0 pointer-events-none z-[70]"
            style={{ left: `${guide.position}px` }}
          >
            {/* 가이드라인 */}
            <div className="absolute inset-0 w-px bg-pink-500" style={{ boxShadow: '0 0 4px rgba(236, 72, 153, 0.5)' }} />
            {/* 점선 패턴 */}
            <div 
              className="absolute inset-0 w-px" 
              style={{ 
                backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 4px, rgba(236, 72, 153, 0.8) 4px, rgba(236, 72, 153, 0.8) 8px)',
              }} 
            />
            {/* 라벨 */}
            {guide.label && (
              <div className="absolute top-2 left-1 bg-pink-500 text-white text-[8px] px-1 py-0.5 rounded whitespace-nowrap">
                {guide.label}
              </div>
            )}
          </div>
        ) : (
          <div
            key={`h-${idx}`}
            className="absolute left-0 right-0 pointer-events-none z-[70]"
            style={{ top: `${guide.position}px` }}
          >
            {/* 가이드라인 */}
            <div className="absolute inset-0 h-px bg-pink-500" style={{ boxShadow: '0 0 4px rgba(236, 72, 153, 0.5)' }} />
            {/* 점선 패턴 */}
            <div 
              className="absolute inset-0 h-px" 
              style={{ 
                backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 4px, rgba(236, 72, 153, 0.8) 4px, rgba(236, 72, 153, 0.8) 8px)',
              }} 
            />
            {/* 라벨 */}
            {guide.label && (
              <div className="absolute left-2 -top-3 bg-pink-500 text-white text-[8px] px-1 py-0.5 rounded whitespace-nowrap">
                {guide.label}
              </div>
            )}
          </div>
        )
      ))}

      {/* 상태바 - 키보드 단축키 안내 포함 */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-4 pointer-events-none">
        {/* 왼쪽: 안내 메시지 + 키보드 단축키 */}
        <div className="text-[9px] text-zinc-500 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-zinc-100">
          {detectedSections.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-zinc-700">{detectedSections.length}개 섹션</span>
              <span className="text-zinc-300">│</span>
              <span className="text-blue-600 font-medium">단축키:</span>
              <span><kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[8px] font-mono">↑↓←→</kbd> 1px 이동</span>
              <span><kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[8px] font-mono">Shift</kbd>+<kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[8px] font-mono">↑↓←→</kbd> 10px</span>
              <span><kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[8px] font-mono">Ctrl</kbd>+클릭 다중선택</span>
              <span><kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[8px] font-mono">Del</kbd> 초기화</span>
              <span><kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[8px] font-mono">Esc</kbd> 선택해제</span>
            </div>
          ) : (
            '템플릿에 data-section-id 속성을 가진 요소가 필요합니다'
          )}
        </div>

        {/* 오른쪽: 선택된 요소 정보 */}
        {selectedSections.length === 1 && (() => {
          const section = detectedSections.find(s => s.id === selectedSections[0]);
          if (!section) return null;
          const transform = getTransformValues(section.id);
          const x = Math.round(section.rect.left + transform.x);
          const y = Math.round(section.rect.top + transform.y);
          const width = Math.round(section.rect.width + transform.width);
          const height = Math.round(section.rect.height + transform.height);
          return (
            <div className="text-[9px] bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg shadow-lg">
              <span className="font-mono">
                X: {x}px | Y: {y}px | W: {width}px | H: {height}px
              </span>
            </div>
          );
        })()}
        
        {selectedSections.length > 1 && (
          <div className="text-[9px] bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-lg font-medium">
            {selectedSections.length}개 요소 선택됨
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEditOverlay;
