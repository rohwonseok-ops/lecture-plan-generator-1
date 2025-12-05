'use client';

import React, { useCallback } from 'react';
import { ClassPlan, WeeklyItem } from '@/lib/types';

interface Props {
  classPlan: ClassPlan;
  onChange: (patch: Partial<ClassPlan>) => void;
}

const WeeklyPlanSection: React.FC<Props> = ({ classPlan, onChange }) => {
  const weeklyPlan = classPlan.weeklyPlan || Array.from({ length: 8 }, (_, i) => ({
    weekLabel: `${i + 1}주차`,
    topic: ''
  }));

  const handleWeekChange = useCallback((index: number, field: keyof WeeklyItem, value: string) => {
    const newPlan = [...weeklyPlan];
    newPlan[index] = { ...newPlan[index], [field]: value };
    onChange({ weeklyPlan: newPlan });
  }, [weeklyPlan, onChange]);

  // 8주차를 2열로 나눔 (왼쪽 1-4주, 오른쪽 5-8주)
  const leftWeeks = weeklyPlan.slice(0, 4);
  const rightWeeks = weeklyPlan.slice(4, 8);

  return (
    <div className="flex flex-col p-1.5 bg-white">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-blue-600">📅 주차별 수업 계획 (8주)</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-1">
        {/* 왼쪽: 1-4주차 */}
        <div className="flex flex-col border border-zinc-300 rounded-lg overflow-hidden bg-white divide-y divide-zinc-200">
          {leftWeeks.map((week, idx) => {
            const globalIndex = idx;
            const defaultLabel = `${globalIndex + 1}주`;
            const displayLabel = week.weekLabel || defaultLabel;
            
            return (
              <div key={globalIndex} className="flex items-start gap-2 px-2 py-1">
                <div className="flex-shrink-0 w-12 h-8 bg-white border border-zinc-300 rounded flex items-center justify-center transition">
                  <input
                    type="text"
                    className="w-full h-full text-zinc-700 font-medium text-[10px] bg-transparent border-none text-center focus:outline-none focus:ring-1 focus:ring-blue-500 rounded placeholder:text-zinc-400"
                    value={displayLabel}
                    onChange={(e) => handleWeekChange(globalIndex, 'weekLabel', e.target.value)}
                    placeholder={defaultLabel}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    className="w-full text-xs font-medium px-2 py-1 bg-white border border-zinc-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
                    value={week.topic}
                    onChange={(e) => handleWeekChange(globalIndex, 'topic', e.target.value)}
                    placeholder={`${globalIndex + 1}주차 수업 주제`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 오른쪽: 5-8주차 */}
        <div className="flex flex-col border border-zinc-300 rounded-lg overflow-hidden bg-white divide-y divide-zinc-200">
          {rightWeeks.map((week, idx) => {
            const globalIndex = idx + 4;
            const defaultLabel = `${globalIndex + 1}주`;
            const displayLabel = week.weekLabel || defaultLabel;
            
            return (
              <div key={globalIndex} className="flex items-start gap-2 px-2 py-1">
                <div className="flex-shrink-0 w-12 h-8 bg-white border border-zinc-300 rounded flex items-center justify-center transition">
                  <input
                    type="text"
                    className="w-full h-full text-zinc-700 font-medium text-[10px] bg-transparent border-none text-center focus:outline-none focus:ring-1 focus:ring-blue-500 rounded placeholder:text-zinc-400"
                    value={displayLabel}
                    onChange={(e) => handleWeekChange(globalIndex, 'weekLabel', e.target.value)}
                    placeholder={defaultLabel}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    className="w-full text-xs font-medium px-2 py-1 bg-white border border-zinc-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
                    value={week.topic}
                    onChange={(e) => handleWeekChange(globalIndex, 'topic', e.target.value)}
                    placeholder={`${globalIndex + 1}주차 수업 주제`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyPlanSection;
