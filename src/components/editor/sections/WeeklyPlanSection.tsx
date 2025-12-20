'use client';

import React, { useCallback, useMemo } from 'react';
import { ClassPlan, WeeklyItem, FieldFontSizes } from '@/lib/types';
import { getFieldFontSize, getDefaultTypography } from '@/lib/utils';
import FontSizeControl from '../FontSizeControl';
import { useSortableList } from '@/hooks/useSortableList';
import { GripVertical } from 'lucide-react';

interface Props {
  classPlan: ClassPlan;
  onChange: (patch: Partial<ClassPlan>) => void;
}

interface WeekRowProps {
  week: WeeklyItem;
  index: number;
  weekCount: number;
  onWeekChange: (index: number, field: keyof WeeklyItem, value: string) => void;
  onRemoveWeek: (index: number) => void;
  dragHandleProps: ReturnType<ReturnType<typeof useSortableList>['dragHandleProps']>;
  itemProps: ReturnType<ReturnType<typeof useSortableList>['itemProps']>;
  isDragging: boolean;
  isDragOver: boolean;
}

const WeekRow: React.FC<WeekRowProps> = ({
  week,
  index,
  weekCount,
  onWeekChange,
  onRemoveWeek,
  dragHandleProps,
  itemProps,
  isDragging,
  isDragOver,
}) => {
  return (
    <div
      ref={itemProps.ref}
      style={itemProps.style}
      className={`flex items-center gap-2 px-1.5 py-0.5 bg-white transition-all ${
        isDragging
          ? 'opacity-50 border-2 border-dashed border-blue-300 rounded bg-blue-50'
          : ''
      } ${
        isDragOver && !isDragging
          ? 'bg-blue-50 border-t-2 border-blue-400'
          : ''
      }`}
      data-dragging={itemProps['data-dragging']}
      data-drag-over={itemProps['data-drag-over']}
    >
      <div
        {...dragHandleProps}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label={`${index + 1}주차 항목 이동. 화살표 키로 순서 변경`}
      >
        <GripVertical size={14} />
      </div>
      <div className="flex-shrink-0 w-12 h-8 bg-white border border-zinc-300 rounded flex items-center justify-center transition">
        <input
          type="text"
          className="w-full h-full text-zinc-700 font-medium text-[10px] bg-transparent border-none text-center focus:outline-none focus:ring-1 focus:ring-blue-500 rounded placeholder:text-zinc-500"
          value={week.weekLabel || ''}
          onChange={(e) => onWeekChange(index, 'weekLabel', e.target.value)}
          aria-label={`${index + 1}주차 라벨`}
        />
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-1">
        <input
          type="text"
          className="w-full text-xs font-medium px-2 py-1 min-h-[32px] bg-white border border-zinc-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500"
          value={week.topic}
          onChange={(e) => onWeekChange(index, 'topic', e.target.value)}
          placeholder=""
          aria-label={`${index + 1}주차 수업 주제`}
        />
        <button
          type="button"
          onClick={() => onRemoveWeek(index)}
          className="w-8 h-8 flex items-center justify-center text-sm text-red-500 px-1 py-0.5 disabled:opacity-40"
          aria-label={`${index + 1}주차 삭제`}
          disabled={weekCount <= 1}
        >
          🗑
        </button>
      </div>
    </div>
  );
};

const WeeklyPlanSection: React.FC<Props> = ({ classPlan, onChange }) => {
  // weeklyPlan에 ID가 없는 항목이 있으면 ID를 부여
  const weeklyPlan = useMemo(() => {
    const plan = classPlan.weeklyPlan || Array.from({ length: 8 }, (_, i) => ({
      id: `new-${i}`,
      weekLabel: '',
      topic: ''
    }));

    // 모든 항목에 ID가 있는지 확인하고, 없으면 생성
    return plan.map((item) => ({
      ...item,
      id: item.id || crypto.randomUUID(),
    }));
  }, [classPlan.weeklyPlan]);

  // Custom sortable list hook
  const {
    dragHandleProps,
    itemProps,
    draggedId,
    overIndex,
  } = useSortableList({
    items: weeklyPlan,
    onReorder: (newItems) => onChange({ weeklyPlan: newItems }),
    getId: (item) => item.id!,
    activationDistance: 5,
  });

  // 타이포그래피 설정
  const typography = classPlan.typography || getDefaultTypography();
  const fieldFontSizes = typography.fieldFontSizes;

  // 필드별 폰트 크기 업데이트
  const handleFieldFontSizeChange = useCallback((field: keyof FieldFontSizes, size: number) => {
    const currentTypography = classPlan.typography || getDefaultTypography();
    const currentFieldSizes = currentTypography.fieldFontSizes || {};
    onChange({
      typography: {
        ...currentTypography,
        fieldFontSizes: {
          ...currentFieldSizes,
          [field]: size,
        },
      },
    });
  }, [classPlan.typography, onChange]);

  // 필드 폰트 크기 가져오기 (기본값: bodySize)
  const getFontSize = useCallback((field: keyof FieldFontSizes): number => {
    return getFieldFontSize(fieldFontSizes, field, typography.bodySize);
  }, [fieldFontSizes, typography.bodySize]);

  const handleWeekChange = useCallback((index: number, field: keyof WeeklyItem, value: string) => {
    const newPlan = [...weeklyPlan];
    newPlan[index] = { ...newPlan[index], [field]: value };
    onChange({ weeklyPlan: newPlan });
  }, [weeklyPlan, onChange]);

  const handleAddWeek = useCallback(() => {
    const nextIndex = weeklyPlan.length;
    const newWeek: WeeklyItem = {
      id: crypto.randomUUID(),
      weekLabel: `${nextIndex + 1}주차`,
      topic: ''
    };
    onChange({ weeklyPlan: [...weeklyPlan, newWeek] });
  }, [weeklyPlan, onChange]);

  const handleRemoveWeek = useCallback((index?: number) => {
    if (weeklyPlan.length <= 1) return;
    const targetIndex = typeof index === 'number' ? index : weeklyPlan.length - 1;
    const newPlan = weeklyPlan.filter((_, i) => i !== targetIndex);
    onChange({ weeklyPlan: newPlan });
  }, [weeklyPlan, onChange]);

  const handleWeekCountChange = useCallback((nextCount: number) => {
    if (!Number.isFinite(nextCount)) return;
    const clamped = Math.min(20, Math.max(1, Math.floor(nextCount)));
    if (clamped === weeklyPlan.length) return;

    if (clamped > weeklyPlan.length) {
      const extra = Array.from({ length: clamped - weeklyPlan.length }, (_, i) => ({
        id: crypto.randomUUID(),
        weekLabel: `${weeklyPlan.length + i + 1}주차`,
        topic: ''
      }));
      onChange({ weeklyPlan: [...weeklyPlan, ...extra] });
      return;
    }

    onChange({ weeklyPlan: weeklyPlan.slice(0, clamped) });
  }, [weeklyPlan, onChange]);

  const weekCount = weeklyPlan.length;
  const midPoint = Math.ceil(weekCount / 2);
  const leftWeeks = weeklyPlan.slice(0, midPoint);
  const rightWeeks = weeklyPlan.slice(midPoint);

  return (
    <div className="flex flex-col p-1.5 bg-white">
      {/* Screen reader instructions for keyboard navigation */}
      <div id="sortable-instructions" className="sr-only">
        화살표 위/아래 키로 항목 순서를 변경할 수 있습니다.
        Home 키는 맨 위로, End 키는 맨 아래로 이동합니다.
      </div>

      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[14px] font-bold text-blue-600">📅 주차별 학습계획 ({weekCount}주)</h3>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-zinc-500">주차</span>
            <FontSizeControl
              value={getFontSize('weeklyPlanWeek')}
              onChange={(size) => handleFieldFontSizeChange('weeklyPlanWeek', size)}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-zinc-500">주제</span>
            <FontSizeControl
              value={getFontSize('weeklyPlanTopic')}
              onChange={(size) => handleFieldFontSizeChange('weeklyPlanTopic', size)}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-zinc-500">월간계획</span>
            <FontSizeControl
              value={getFontSize('monthlyCalendar')}
              onChange={(size) => handleFieldFontSizeChange('monthlyCalendar', size)}
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-600">총 주차</span>
          <input
            type="number"
            min={1}
            max={20}
            value={weekCount}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (Number.isNaN(value)) return;
              handleWeekCountChange(value);
            }}
            className="w-14 text-[10px] px-1 py-0.5 border border-zinc-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            aria-label="총 주차 입력"
          />
          <button
            type="button"
            onClick={handleAddWeek}
            className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition"
            aria-label="주차 추가"
          >
            + 추가
          </button>
          <button
            type="button"
            onClick={() => handleRemoveWeek()}
            className="text-[10px] px-2 py-0.5 bg-zinc-50 text-zinc-700 border border-zinc-200 rounded hover:bg-zinc-100 transition disabled:opacity-40"
            aria-label="마지막 주차 삭제"
            disabled={weekCount <= 1}
          >
            - 삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {/* 왼쪽: 앞 절반 */}
        <div className="flex flex-col border border-zinc-300 rounded-lg bg-white divide-y divide-zinc-200">
          {leftWeeks.map((week, idx) => (
            <WeekRow
              key={week.id}
              week={week}
              index={idx}
              weekCount={weekCount}
              onWeekChange={handleWeekChange}
              onRemoveWeek={handleRemoveWeek}
              dragHandleProps={dragHandleProps(week.id!)}
              itemProps={itemProps(week.id!)}
              isDragging={draggedId === week.id}
              isDragOver={overIndex === idx}
            />
          ))}
        </div>

        {/* 오른쪽: 뒤 절반 */}
        <div className="flex flex-col border border-zinc-300 rounded-lg bg-white divide-y divide-zinc-200">
          {rightWeeks.map((week, idx) => (
            <WeekRow
              key={week.id}
              week={week}
              index={midPoint + idx}
              weekCount={weekCount}
              onWeekChange={handleWeekChange}
              onRemoveWeek={handleRemoveWeek}
              dragHandleProps={dragHandleProps(week.id!)}
              itemProps={itemProps(week.id!)}
              isDragging={draggedId === week.id}
              isDragOver={overIndex === (midPoint + idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyPlanSection;
