'use client';

import React from 'react';
import { ClassPlan } from '@/lib/types';
import { ChevronRight, FileText } from 'lucide-react';

interface Props {
  plans: ClassPlan[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

const ClassTable: React.FC<Props> = ({ plans, selectedId, onSelect }) => {
  if (plans.length === 0) {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center h-64 text-zinc-400">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-sm font-medium text-zinc-500">등록된 강의가 없습니다.</p>
        <p className="text-xs mt-1 text-zinc-400">새 강의를 추가하거나 CSV를 가져오세요.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-100 px-3 py-2 space-y-1">
      {plans.map((plan) => (
        <div
          key={plan.id}
          onClick={() => onSelect(plan.id)}
          className={`group relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${
            selectedId === plan.id 
              ? 'bg-blue-50 border-blue-200 shadow-sm' 
              : 'bg-white border-transparent hover:bg-zinc-100'
          }`}
        >
          <div className="min-w-0 pr-4">
            <h4 className={`text-sm font-bold truncate mb-1 ${selectedId === plan.id ? 'text-blue-700' : 'text-zinc-800'}`}>
              {plan.title || '(제목 없음)'}
            </h4>
            <div className="flex items-center text-xs text-zinc-500 space-x-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${selectedId === plan.id ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>
                {plan.teacherName || '강사 미정'}
              </span>
              <span className="text-zinc-300">|</span>
              <span className="truncate max-w-[120px]">{plan.schedule || '일정 미정'}</span>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 transition-transform ${selectedId === plan.id ? 'text-blue-600 translate-x-0.5' : 'text-zinc-300 group-hover:text-zinc-400'}`} />
        </div>
      ))}
    </div>
  );
};

export default ClassTable;

