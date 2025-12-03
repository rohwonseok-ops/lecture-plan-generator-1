'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ClassPlan } from '@/lib/types';
import { ChevronDown, Check } from 'lucide-react';

interface Props {
  plans: ClassPlan[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

const ClassListDropdown: React.FC<Props> = ({ plans, selectedId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedPlan = plans.find(p => p.id === selectedId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition min-w-[200px]"
      >
        <span className="text-xs font-medium text-zinc-800 truncate flex-1 text-left">
          {selectedPlan?.title || '강의 선택'}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
          {plans.length === 0 ? (
            <div className="px-3 py-2 text-xs text-zinc-400">등록된 강의가 없습니다</div>
          ) : (
            plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => {
                  onSelect(plan.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-zinc-50 transition ${
                  selectedId === plan.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className={`text-xs font-medium truncate ${selectedId === plan.id ? 'text-blue-600' : 'text-zinc-800'}`}>
                    {plan.title || '(제목 없음)'}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {plan.teacherName || '강사 미정'} · {plan.classDay || '요일 미정'}
                  </div>
                </div>
                {selectedId === plan.id && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ClassListDropdown;

