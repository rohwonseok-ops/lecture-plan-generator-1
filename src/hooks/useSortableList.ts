import { useState, useRef, useCallback, useEffect, CSSProperties, RefCallback } from 'react';

interface UseSortableListOptions<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  getId: (item: T) => string;
  activationDistance?: number;
}

interface DragHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  tabIndex: number;
  role: string;
  'aria-grabbed': boolean;
  'aria-describedby': string;
}

interface ItemProps {
  ref: RefCallback<HTMLElement>;
  style: CSSProperties;
  'data-dragging': boolean;
  'data-drag-over': boolean;
}

interface UseSortableListReturn {
  dragHandleProps: (id: string) => DragHandleProps;
  itemProps: (id: string) => ItemProps;
  isDragging: boolean;
  draggedId: string | null;
  draggedIndex: number;
  overIndex: number;
}

/**
 * Custom hook for sortable list functionality
 * Replaces @dnd-kit with native drag and drop + mouse/touch events
 */
export function useSortableList<T>({
  items,
  onReorder,
  getId,
  activationDistance = 5,
}: UseSortableListOptions<T>): UseSortableListReturn {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number>(-1);

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragActivated = useRef(false);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pendingDragId = useRef<string | null>(null);

  const draggedIndex = draggedId
    ? items.findIndex(item => getId(item) === draggedId)
    : -1;

  // Helper to reorder array
  const arrayMove = useCallback((arr: T[], fromIndex: number, toIndex: number): T[] => {
    const result = [...arr];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  }, []);

  // Calculate which item we're over based on mouse position
  const getOverIndex = useCallback((clientY: number): number => {
    let closestIndex = -1;
    let closestDistance = Infinity;

    itemRefs.current.forEach((element, id) => {
      const rect = element.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(clientY - centerY);

      if (distance < closestDistance) {
        closestDistance = distance;
        const index = items.findIndex(item => getId(item) === id);
        if (index !== -1) {
          closestIndex = index;
        }
      }
    });

    return closestIndex;
  }, [items, getId]);

  // Handle drag activation and movement
  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!pendingDragId.current && !draggedId) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Check activation distance
    if (!isDragActivated.current && dragStartPos.current) {
      const distance = Math.sqrt(
        Math.pow(clientX - dragStartPos.current.x, 2) +
        Math.pow(clientY - dragStartPos.current.y, 2)
      );

      if (distance >= activationDistance) {
        isDragActivated.current = true;
        setDraggedId(pendingDragId.current);
      }
    }

    // Update over index during drag
    if (isDragActivated.current && draggedId) {
      e.preventDefault();
      const newOverIndex = getOverIndex(clientY);
      if (newOverIndex !== overIndex) {
        setOverIndex(newOverIndex);
      }
    }
  }, [draggedId, overIndex, activationDistance, getOverIndex]);

  // Handle drag end
  const handlePointerUp = useCallback(() => {
    if (isDragActivated.current && draggedId && overIndex !== -1 && draggedIndex !== overIndex) {
      onReorder(arrayMove(items, draggedIndex, overIndex));
    }

    // Reset state
    setDraggedId(null);
    setOverIndex(-1);
    dragStartPos.current = null;
    isDragActivated.current = false;
    pendingDragId.current = null;
  }, [draggedId, draggedIndex, overIndex, items, onReorder, arrayMove]);

  // Setup global event listeners
  useEffect(() => {
    // Always add listeners, check conditions inside handlers
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('touchend', handlePointerUp);

    return () => {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Keyboard navigation for accessibility
  const handleKeyDown = useCallback((id: string, e: React.KeyboardEvent) => {
    const currentIndex = items.findIndex(item => getId(item) === id);
    if (currentIndex === -1) return;

    let newIndex = -1;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(items.length - 1, currentIndex + 1);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== -1 && newIndex !== currentIndex) {
      onReorder(arrayMove(items, currentIndex, newIndex));
      // Focus the new position after reorder
      setTimeout(() => {
        const newId = getId(items[currentIndex]);
        const element = itemRefs.current.get(newId);
        if (element) {
          const handle = element.querySelector('[role="button"]') as HTMLElement;
          handle?.focus();
        }
      }, 0);
    }
  }, [items, getId, onReorder, arrayMove]);

  // Create drag handle props for each item
  const dragHandleProps = useCallback((id: string): DragHandleProps => ({
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      pendingDragId.current = id;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
    },
    onTouchStart: (e: React.TouchEvent) => {
      pendingDragId.current = id;
      dragStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    },
    onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(id, e),
    tabIndex: 0,
    role: 'button',
    'aria-grabbed': draggedId === id,
    'aria-describedby': 'sortable-instructions',
  }), [draggedId, handleKeyDown]);

  // Create item props for each item
  const itemProps = useCallback((id: string): ItemProps => ({
    ref: (element: HTMLElement | null) => {
      if (element) {
        itemRefs.current.set(id, element);
      } else {
        itemRefs.current.delete(id);
      }
    },
    style: {
      opacity: draggedId === id ? 0.5 : 1,
      transition: draggedId ? 'transform 150ms ease' : undefined,
    },
    'data-dragging': draggedId === id,
    'data-drag-over': overIndex !== -1 && getId(items[overIndex]) === id,
  }), [draggedId, overIndex, items, getId]);

  return {
    dragHandleProps,
    itemProps,
    isDragging: draggedId !== null,
    draggedId,
    draggedIndex,
    overIndex,
  };
}

// Utility function for array reordering (exported for convenience)
export function arrayMove<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
