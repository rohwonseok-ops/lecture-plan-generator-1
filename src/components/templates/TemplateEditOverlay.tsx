'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTemplateEditStore } from '@/store/templateEditStore';
import { AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter, Equal, Maximize2, RotateCcw } from 'lucide-react';

interface DetectedSection {
  id: string;
  label: string;
  element: HTMLElement;
  rect: DOMRect;
  originalTransform: string;
  originalWidth: string;
  originalHeight: string;
}

interface DragState {
  sectionId: string;
  type: 'move' | 'resize';
  handle?: string;
  startX: number;
  startY: number;
  startTransform: { x: number; y: number };
  startSize: { width: number; height: number };
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
  const { isEditMode, pendingLayoutChanges, updateElementLayout, clearPendingChanges } = useTemplateEditStore();
  const [detectedSections, setDetectedSections] = useState<DetectedSection[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 템플릿 내 섹션 요소들 탐지
  const detectSections = useCallback(() => {
    if (!overlayRef.current) return;
    
    // 부모 컨테이너 (canvasRef) 찾기
    const container = overlayRef.current.parentElement;
    if (!container) return;
    
    containerRef.current = container as HTMLDivElement;
    const containerRect = container.getBoundingClientRect();
    
    // data-section-id 속성을 가진 요소들 탐지
    const sectionElements = container.querySelectorAll('[data-section-id]');
    const sections: DetectedSection[] = [];
    
    sectionElements.forEach((el) => {
      const element = el as HTMLElement;
      const id = element.getAttribute('data-section-id') || '';
      const rect = element.getBoundingClientRect();
      
      // 컨테이너 기준 상대 위치 계산
      const relativeRect = new DOMRect(
        rect.left - containerRect.left,
        rect.top - containerRect.top,
        rect.width,
        rect.height
      );
      
      sections.push({
        id,
        label: sectionLabels[id] || id,
        element,
        rect: relativeRect,
        originalTransform: element.style.transform || '',
        originalWidth: element.style.width || '',
        originalHeight: element.style.height || '',
      });
    });
    
    setDetectedSections(sections);
  }, []);

  // 편집 모드 변경 시 섹션 탐지
  useEffect(() => {
    if (isEditMode) {
      // 약간의 딜레이 후 탐지 (렌더링 완료 대기)
      const timer = setTimeout(detectSections, 100);
      return () => clearTimeout(timer);
    } else {
      setDetectedSections([]);
      setSelectedSections([]);
    }
  }, [isEditMode, detectSections]);

  // 창 크기 변경 시 재탐지
  useEffect(() => {
    if (!isEditMode) return;
    
    const handleResize = () => {
      detectSections();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isEditMode, detectSections]);

  // 현재 섹션의 변환 값 가져오기
  const getTransformValues = useCallback((sectionId: string) => {
    const pending = pendingLayoutChanges[sectionId];
    return {
      x: pending?.x ?? 0,
      y: pending?.y ?? 0,
      width: pending?.width ?? 0,
      height: pending?.height ?? 0,
    };
  }, [pendingLayoutChanges]);

  // 드래그 시작
  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    section: DetectedSection,
    type: 'move' | 'resize',
    handle?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const transform = getTransformValues(section.id);
    setDragState({
      sectionId: section.id,
      type,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startTransform: { x: transform.x, y: transform.y },
      startSize: { width: transform.width, height: transform.height },
    });

    // Ctrl/Cmd 클릭으로 다중 선택
    if (e.ctrlKey || e.metaKey) {
      setSelectedSections(prev => 
        prev.includes(section.id) 
          ? prev.filter(id => id !== section.id)
          : [...prev, section.id]
      );
    } else {
      setSelectedSections([section.id]);
    }
  }, [getTransformValues]);

  // 드래그 중
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      if (dragState.type === 'move') {
        // 이동
        updateElementLayout(dragState.sectionId, {
          x: dragState.startTransform.x + deltaX,
          y: dragState.startTransform.y + deltaY,
        });
        
        // 실제 DOM 요소에 transform 적용
        const section = detectedSections.find(s => s.id === dragState.sectionId);
        if (section) {
          const newX = dragState.startTransform.x + deltaX;
          const newY = dragState.startTransform.y + deltaY;
          section.element.style.transform = `translate(${newX}px, ${newY}px)`;
        }
      } else if (dragState.type === 'resize' && dragState.handle) {
        // 크기 조절
        const section = detectedSections.find(s => s.id === dragState.sectionId);
        if (!section) return;

        let widthDelta = dragState.startSize.width;
        let heightDelta = dragState.startSize.height;
        let xDelta = dragState.startTransform.x;
        let yDelta = dragState.startTransform.y;

        if (dragState.handle.includes('e')) {
          widthDelta = dragState.startSize.width + deltaX;
        }
        if (dragState.handle.includes('w')) {
          widthDelta = dragState.startSize.width - deltaX;
          xDelta = dragState.startTransform.x + deltaX;
        }
        if (dragState.handle.includes('s')) {
          heightDelta = dragState.startSize.height + deltaY;
        }
        if (dragState.handle.includes('n')) {
          heightDelta = dragState.startSize.height - deltaY;
          yDelta = dragState.startTransform.y + deltaY;
        }

        updateElementLayout(dragState.sectionId, {
          x: xDelta,
          y: yDelta,
          width: widthDelta,
          height: heightDelta,
        });

        // 실제 DOM 요소에 적용
        section.element.style.transform = `translate(${xDelta}px, ${yDelta}px)`;
        if (widthDelta !== 0) {
          section.element.style.width = `calc(100% + ${widthDelta}px)`;
        }
        if (heightDelta !== 0) {
          section.element.style.height = `calc(100% + ${heightDelta}px)`;
        }
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
      // 섹션 위치 재탐지
      setTimeout(detectSections, 50);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, detectedSections, updateElementLayout, detectSections]);

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
          const newX = minLeft - rect.left;
          updateElementLayout(id, { x: newX, y: transform.y });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${newX}px, ${transform.y}px)`;
        });
        break;
      }
      case 'center': {
        const centerX = selectedData.reduce((sum, d) => sum + d.rect.left + d.transform.x + d.rect.width / 2, 0) / selectedData.length;
        selectedData.forEach(({ id, rect, transform }) => {
          const newX = centerX - rect.left - rect.width / 2;
          updateElementLayout(id, { x: newX, y: transform.y });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${newX}px, ${transform.y}px)`;
        });
        break;
      }
      case 'right': {
        const maxRight = Math.max(...selectedData.map(d => d.rect.left + d.transform.x + d.rect.width));
        selectedData.forEach(({ id, rect, transform }) => {
          const newX = maxRight - rect.left - rect.width;
          updateElementLayout(id, { x: newX, y: transform.y });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${newX}px, ${transform.y}px)`;
        });
        break;
      }
      case 'top': {
        const minTop = Math.min(...selectedData.map(d => d.rect.top + d.transform.y));
        selectedData.forEach(({ id, rect, transform }) => {
          const newY = minTop - rect.top;
          updateElementLayout(id, { x: transform.x, y: newY });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${transform.x}px, ${newY}px)`;
        });
        break;
      }
      case 'middle': {
        const centerY = selectedData.reduce((sum, d) => sum + d.rect.top + d.transform.y + d.rect.height / 2, 0) / selectedData.length;
        selectedData.forEach(({ id, rect, transform }) => {
          const newY = centerY - rect.top - rect.height / 2;
          updateElementLayout(id, { x: transform.x, y: newY });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${transform.x}px, ${newY}px)`;
        });
        break;
      }
      case 'bottom': {
        const maxBottom = Math.max(...selectedData.map(d => d.rect.top + d.transform.y + d.rect.height));
        selectedData.forEach(({ id, rect, transform }) => {
          const newY = maxBottom - rect.top - rect.height;
          updateElementLayout(id, { x: transform.x, y: newY });
          const section = detectedSections.find(s => s.id === id);
          if (section) section.element.style.transform = `translate(${transform.x}px, ${newY}px)`;
        });
        break;
      }
    }
    
    setTimeout(detectSections, 50);
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

    const avgWidth = selectedData.reduce((sum, d) => sum + d.section.rect.width + d.transform.width, 0) / selectedData.length;
    const avgHeight = selectedData.reduce((sum, d) => sum + d.section.rect.height + d.transform.height, 0) / selectedData.length;

    selectedData.forEach(({ id, section, transform }) => {
      const update: { width?: number; height?: number } = {};
      if (dimension === 'width' || dimension === 'both') {
        update.width = avgWidth - section.rect.width;
        section.element.style.width = `${avgWidth}px`;
      }
      if (dimension === 'height' || dimension === 'both') {
        update.height = avgHeight - section.rect.height;
        section.element.style.height = `${avgHeight}px`;
      }
      updateElementLayout(id, { ...transform, ...update });
    });

    setTimeout(detectSections, 50);
  }, [selectedSections, detectedSections, getTransformValues, updateElementLayout, detectSections]);

  // 초기화
  const handleReset = useCallback(() => {
    // 모든 섹션의 transform 초기화
    detectedSections.forEach(section => {
      section.element.style.transform = section.originalTransform;
      section.element.style.width = section.originalWidth;
      section.element.style.height = section.originalHeight;
    });
    clearPendingChanges();
    setSelectedSections([]);
    setTimeout(detectSections, 50);
  }, [detectedSections, clearPendingChanges, detectSections]);

  if (!isEditMode) return null;

  const resizeHandles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  const handleCursors: Record<string, string> = {
    n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize', se: 'nwse-resize',
    s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize', nw: 'nwse-resize',
  };
  const handlePositions: Record<string, React.CSSProperties> = {
    n: { top: -4, left: '50%', transform: 'translateX(-50%)' },
    ne: { top: -4, right: -4 },
    e: { top: '50%', right: -4, transform: 'translateY(-50%)' },
    se: { bottom: -4, right: -4 },
    s: { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
    sw: { bottom: -4, left: -4 },
    w: { top: '50%', left: -4, transform: 'translateY(-50%)' },
    nw: { top: -4, left: -4 },
  };

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 z-50 pointer-events-none"
      data-no-export="true"
    >
      {/* 편집 도구 모음 */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-white border border-zinc-300 rounded-lg shadow-lg px-2 py-1 z-[100] pointer-events-auto">
        {selectedSections.length >= 2 ? (
          <>
            <span className="text-[9px] text-zinc-500 mr-1">정렬:</span>
            <button
              onClick={() => alignSections('left')}
              className="p-1 hover:bg-zinc-100 rounded"
              title="왼쪽 정렬"
            >
              <AlignLeft className="w-3.5 h-3.5 text-zinc-600" />
            </button>
            <button
              onClick={() => alignSections('center')}
              className="p-1 hover:bg-zinc-100 rounded"
              title="가운데 정렬"
            >
              <AlignCenter className="w-3.5 h-3.5 text-zinc-600" />
            </button>
            <button
              onClick={() => alignSections('right')}
              className="p-1 hover:bg-zinc-100 rounded"
              title="오른쪽 정렬"
            >
              <AlignRight className="w-3.5 h-3.5 text-zinc-600" />
            </button>
            <div className="w-px h-4 bg-zinc-200 mx-1" />
            <button
              onClick={() => alignSections('top')}
              className="p-1 hover:bg-zinc-100 rounded"
              title="위쪽 정렬"
            >
              <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-zinc-600 rotate-90" />
            </button>
            <button
              onClick={() => alignSections('middle')}
              className="p-1 hover:bg-zinc-100 rounded"
              title="세로 가운데 정렬"
            >
              <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-zinc-600" />
            </button>
            <div className="w-px h-4 bg-zinc-200 mx-1" />
            <span className="text-[9px] text-zinc-500 mr-1">크기:</span>
            <button
              onClick={() => matchSize('width')}
              className="p-1 hover:bg-zinc-100 rounded"
              title="너비 맞춤"
            >
              <Equal className="w-3.5 h-3.5 text-zinc-600" />
            </button>
            <button
              onClick={() => matchSize('both')}
              className="p-1 hover:bg-zinc-100 rounded"
              title="크기 맞춤"
            >
              <Maximize2 className="w-3.5 h-3.5 text-zinc-600" />
            </button>
          </>
        ) : (
          <span className="text-[9px] text-zinc-500">요소를 클릭하여 선택 (Ctrl+클릭: 다중 선택)</span>
        )}
        <div className="w-px h-4 bg-zinc-200 mx-1" />
        <button
          onClick={handleReset}
          className="p-1 hover:bg-zinc-100 rounded"
          title="초기화"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-600" />
        </button>
      </div>

      {/* 감지된 섹션들에 대한 편집 핸들 */}
      {detectedSections.map((section) => {
        const transform = getTransformValues(section.id);
        const isSelected = selectedSections.includes(section.id);
        const isDragging = dragState?.sectionId === section.id;

        return (
          <div
            key={section.id}
            className={`absolute border-2 transition-colors pointer-events-auto ${
              isSelected 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-dashed border-zinc-400/50 hover:border-blue-400 hover:bg-blue-400/5'
            } ${isDragging ? 'z-[60]' : ''}`}
            style={{
              top: section.rect.top + transform.y,
              left: section.rect.left + transform.x,
              width: section.rect.width + transform.width,
              height: section.rect.height + transform.height,
              cursor: isDragging && dragState?.type === 'move' ? 'grabbing' : 'grab',
            }}
            onMouseDown={(e) => handleMouseDown(e, section, 'move')}
          >
            {/* 섹션 라벨 */}
            <div className="absolute -top-5 left-1 text-[9px] bg-zinc-700 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
              {section.label}
            </div>

            {/* 리사이즈 핸들 */}
            {isSelected && resizeHandles.map((handle) => (
              <div
                key={handle}
                className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full border border-white shadow-sm hover:bg-blue-600"
                style={{
                  ...handlePositions[handle],
                  cursor: handleCursors[handle],
                }}
                onMouseDown={(e) => handleMouseDown(e, section, 'resize', handle)}
              />
            ))}
          </div>
        );
      })}

      {/* 선택 안내 */}
      <div className="absolute bottom-2 left-2 text-[9px] text-zinc-500 bg-white/90 px-2 py-1 rounded pointer-events-none">
        {detectedSections.length > 0 
          ? `${detectedSections.length}개 섹션 감지됨 | 드래그하여 이동 | 모서리 드래그로 크기 조절`
          : '템플릿에 data-section-id 속성을 가진 요소가 필요합니다'
        }
      </div>
    </div>
  );
};

export default TemplateEditOverlay;
