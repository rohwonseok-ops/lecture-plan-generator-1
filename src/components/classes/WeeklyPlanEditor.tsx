'use client';

import React from 'react';
import { WeeklyItem } from '@/lib/types';

interface Props {
  items: WeeklyItem[];
  onChange: (items: WeeklyItem[]) => void;
}

const WeeklyPlanEditor: React.FC<Props> = ({ items, onChange }) => {
  // Ensure we always have exactly 8 items
  const ensureEightItems = (currentItems: WeeklyItem[]): WeeklyItem[] => {
    const eightItems = Array(8).fill(null).map((_, i) => 
      currentItems[i] || { weekLabel: `${i + 1}주`, topic: '' }
    );
    return eightItems;
  };

  const weeklyItems = ensureEightItems(items);

  const handleChange = (index: number, field: keyof WeeklyItem, value: string) => {
    const newItems = [...weeklyItems];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center mb-2">
        <h4 className="text-sm font-bold text-zinc-800">
          주차별 강의 계획
          <span className="ml-2 px-2 py-0.5 bg-zinc-100 rounded-full text-[10px] text-zinc-500 font-medium">
            총 8칸
          </span>
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {weeklyItems.map((item, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 p-3 rounded-lg shadow-sm hover:border-blue-300 transition-all">
            {/* Week Label */}
            <div className="mb-2">
              <label className="text-[10px] text-zinc-400 font-bold mb-1 block uppercase">주차</label>
              <input
                type="text"
                value={item.weekLabel}
                onChange={(e) => handleChange(idx, 'weekLabel', e.target.value)}
                className="w-full text-xs font-semibold text-zinc-700 border-zinc-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-2 bg-zinc-50 transition-all placeholder-zinc-300"
                placeholder={`${idx + 1}주`}
              />
            </div>

            {/* Topic */}
            <div>
              <label className="text-[10px] text-zinc-400 font-bold mb-1 block uppercase">주제</label>
              <input
                type="text"
                value={item.topic}
                onChange={(e) => handleChange(idx, 'topic', e.target.value)}
                className="w-full text-sm font-medium text-zinc-900 border-zinc-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-2 bg-white transition-all placeholder-zinc-300"
                placeholder="강의 주제 입력"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyPlanEditor;

