'use client';

import React from 'react';
import { ClassPlan } from '@/lib/types';
import BasicInfoSection from './sections/BasicInfoSection';
import WeeklyPlanSection from './sections/WeeklyPlanSection';
import FeeTableSection from './sections/FeeTableSection';

interface Props {
  classPlan: ClassPlan;
  onChange: (patch: Partial<ClassPlan>) => void;
}

const EditorPanel: React.FC<Props> = ({ classPlan, onChange }) => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {/* 상단: 기본정보 */}
      <div className="border-b border-zinc-200">
        <BasicInfoSection classPlan={classPlan} onChange={onChange} />
      </div>

      {/* 주차별 계획 */}
      <div className="border-b border-zinc-200">
        <WeeklyPlanSection classPlan={classPlan} onChange={onChange} />
      </div>

      {/* 수강료 테이블 */}
      <div className="border-b border-zinc-200">
        <FeeTableSection classPlan={classPlan} onChange={onChange} />
      </div>
    </div>
  );
};

export default EditorPanel;

