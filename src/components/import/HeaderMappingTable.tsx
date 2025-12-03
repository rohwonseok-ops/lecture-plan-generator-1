'use client';

import React from 'react';

interface Props {
  csvHeaders: string[];
  systemFields: string[];
  mapping: Record<string, string>;
  onChangeMapping: (newMapping: Record<string, string>) => void;
}

const FIELD_LABELS: Record<string, string> = {
  title: '과목 (강좌명)',
  targetStudent: '대상 (학년/반)',
  targetStudentDetail: '대상 학생 명단',
  teacherName: '강사명',
  day: '수업 요일',
  time: '수업 시간',
  course1: '학습과정 1',
  material1: '학습과정 1 교재',
  course2: '학습과정 2',
  material2: '학습과정 2 교재',
  learningGoal: '학습 목표',
  weeklyPlanRaw: '수업 계획 (진도)',
  management: '학습 관리',
  etc: '기타 (홍보/특이사항)'
};

const HeaderMappingTable: React.FC<Props> = ({ csvHeaders, systemFields, mapping, onChangeMapping }) => {
  const handleChange = (systemField: string, csvHeader: string) => {
    onChangeMapping({ ...mapping, [systemField]: csvHeader });
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
        <h3 className="font-bold text-zinc-700">CSV 데이터 연결</h3>
        <p className="text-xs text-zinc-500 mt-1">업로드한 파일의 각 열이 어떤 정보인지 선택해주세요.</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {systemFields.map((field) => (
            <div key={field} className="flex flex-col">
              <label className="text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center">
                {FIELD_LABELS[field] || field}
                {mapping[field] && <span className="ml-2 w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
              </label>
              <select
                className={`block w-full rounded-lg text-sm p-3 border transition-colors ${
                  mapping[field] 
                    ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/20 text-blue-900 font-medium' 
                    : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                }`}
                value={mapping[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
              >
                <option value="">(연결 안함)</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeaderMappingTable;

