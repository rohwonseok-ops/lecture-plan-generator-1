'use client';

import React, { useCallback } from 'react';
import { ClassPlan, WeeklyItem, FieldFontSizes } from '@/lib/types';
import { getFieldFontSize, getDefaultTypography } from '@/lib/utils';
import FontSizeControl from '../FontSizeControl';

interface Props {
  classPlan: ClassPlan;
  onChange: (patch: Partial<ClassPlan>) => void;
}

const WeeklyPlanSection: React.FC<Props> = ({ classPlan, onChange }) => {
  const weeklyPlan = classPlan.weeklyPlan || Array.from({ length: 8 }, () => ({
    weekLabel: '',
    topic: ''
  }));

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

  const renderWeekRow = (week: WeeklyItem, globalIndex: number) => {
    const displayLabel = week.weekLabel || '';
    
    return (
      <div key={globalIndex} className="flex items-center gap-2 px-1.5 py-0.5">
        <div className="flex-shrink-0 w-12 h-8 bg-white border border-zinc-300 rounded flex items-center justify-center transition">
          <input
            type="text"
            className="w-full h-full text-zinc-700 font-medium text-[10px] bg-transparent border-none text-center focus:outline-none focus:ring-1 focus:ring-blue-500 rounded placeholder:text-zinc-500"
            value={displayLabel}
            onChange={(e) => handleWeekChange(globalIndex, 'weekLabel', e.target.value)}
            aria-label={`${globalIndex + 1}주차 라벨`}
          />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-1">
          <input
            type="text"
            className="w-full text-xs font-medium px-2 py-1 min-h-[32px] bg-white border border-zinc-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500"
            value={week.topic}
            onChange={(e) => handleWeekChange(globalIndex, 'topic', e.target.value)}
            placeholder=""
            aria-label={`${globalIndex + 1}주차 수업 주제`}
          />
          <button
            type="button"
            onClick={() => handleRemoveWeek(globalIndex)}
            className="w-8 h-8 flex items-center justify-center text-sm text-red-500 px-1 py-0.5 disabled:opacity-40"
            aria-label={`${globalIndex + 1}주차 삭제`}
            disabled={weekCount <= 1}
          >
            🗑
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col p-1.5 bg-white">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
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
      
      <div className="grid grid-cols-2 gap-1">
        {/* 왼쪽: 앞 절반 */}
        <div className="flex flex-col border border-zinc-300 rounded-lg overflow-hidden bg-white divide-y divide-zinc-200">
          {leftWeeks.map((week, idx) => renderWeekRow(week, idx))}
        </div>
        
        {/* 오른쪽: 뒤 절반 */}
        <div className="flex flex-col border border-zinc-300 rounded-lg overflow-hidden bg-white divide-y divide-zinc-200">
          {rightWeeks.map((week, idx) => renderWeekRow(week, midPoint + idx))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyPlanSection;
