'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ElementLayout } from '@/lib/types';

interface DraggableElementProps {
  id: string;
  children: React.ReactNode;
  layout?: ElementLayout;
  isEditMode: boolean;
  onLayoutChange: (id: string, layout: Partial<ElementLayout>) => void;
  className?: string;
  minWidth?: number;
  minHeight?: number;
}

const DraggableElement: React.FC<DraggableElementProps> = ({
  id,
  children,
  layout,
  isEditMode,
  onLayoutChange,
  className = '',
  minWidth = 50,
  minHeight = 20,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startLayout, setStartLayout] = useState<ElementLayout | null>(null);

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartLayout({
      x: layout?.x ?? 0,
      y: layout?.y ?? 0,
      width: layout?.width ?? elementRef.current?.offsetWidth ?? 100,
      height: layout?.height ?? elementRef.current?.offsetHeight ?? 50,
    });
  }, [isEditMode, layout]);

  // 리사이즈 핸들 시작
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeHandle(handle);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartLayout({
      x: layout?.x ?? 0,
      y: layout?.y ?? 0,
      width: layout?.width ?? elementRef.current?.offsetWidth ?? 100,
      height: layout?.height ?? elementRef.current?.offsetHeight ?? 50,
    });
  }, [isEditMode, layout]);

  // 마우스 이동 처리
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!startLayout) return;

      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      if (isDragging) {
        onLayoutChange(id, {
          x: startLayout.x! + deltaX,
          y: startLayout.y! + deltaY,
        });
      } else if (isResizing && resizeHandle) {
        let newWidth = startLayout.width!;
        let newHeight = startLayout.height!;
        let newX = startLayout.x!;
        let newY = startLayout.y!;

        if (resizeHandle.includes('e')) {
          newWidth = Math.max(minWidth, startLayout.width! + deltaX);
        }
        if (resizeHandle.includes('w')) {
          const proposedWidth = startLayout.width! - deltaX;
          if (proposedWidth >= minWidth) {
            newWidth = proposedWidth;
            newX = startLayout.x! + deltaX;
          }
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.max(minHeight, startLayout.height! + deltaY);
        }
        if (resizeHandle.includes('n')) {
          const proposedHeight = startLayout.height! - deltaY;
          if (proposedHeight >= minHeight) {
            newHeight = proposedHeight;
            newY = startLayout.y! + deltaY;
          }
        }

        onLayoutChange(id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, startPos, startLayout, resizeHandle, id, onLayoutChange, minWidth, minHeight]);

  // 편집 모드가 아니면 children만 렌더링
  if (!isEditMode) {
    return (
      <div 
        className={className}
        style={layout ? {
          position: 'relative',
          width: layout.width !== undefined ? `${layout.width}px` : undefined,
          height: layout.height !== undefined ? `${layout.height}px` : undefined,
        } : undefined}
      >
        {children}
      </div>
    );
  }

  const resizeHandles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  const handlePositions: Record<string, React.CSSProperties> = {
    n: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    ne: { top: -4, right: -4, cursor: 'nesw-resize' },
    e: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    se: { bottom: -4, right: -4, cursor: 'nwse-resize' },
    s: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    sw: { bottom: -4, left: -4, cursor: 'nesw-resize' },
    w: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    nw: { top: -4, left: -4, cursor: 'nwse-resize' },
  };

  return (
    <div
      ref={elementRef}
      className={`relative ${className} ${isDragging || isResizing ? 'z-50' : ''}`}
      style={{
        position: 'relative',
        width: layout?.width !== undefined ? `${layout.width}px` : undefined,
        height: layout?.height !== undefined ? `${layout.height}px` : undefined,
        outline: '2px dashed #3b82f6',
        outlineOffset: '2px',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      data-no-export="true"
    >
      {children}
      
      {/* 리사이즈 핸들들 */}
      {resizeHandles.map((handle) => (
        <div
          key={handle}
          data-no-export="true"
          className="absolute w-2 h-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
          style={{
            ...handlePositions[handle],
            zIndex: 100,
          }}
          onMouseDown={(e) => handleResizeMouseDown(e, handle)}
        />
      ))}
      
      {/* 요소 ID 라벨 */}
      <div 
        data-no-export="true"
        className="absolute -top-5 left-0 text-[9px] bg-blue-500 text-white px-1 rounded"
      >
        {id}
      </div>
    </div>
  );
};

export default DraggableElement;

