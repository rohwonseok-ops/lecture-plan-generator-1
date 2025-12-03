'use client';

import React, { useRef, useState } from 'react';
import { X, Download, UploadCloud } from 'lucide-react';
import { parseCsv } from '@/lib/csv';
import { useClassPlanStore } from '@/store/classPlanStore';
import { ClassPlan } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CsvUploadModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addClassPlan } = useClassPlanStore();
  const [isUploading, setIsUploading] = useState(false);

  const downloadSampleCsv = () => {
    const headers = [
      'title',
      'teacherName',
      'targetStudent',
      'targetStudentDetail',
      'classDay',
      'classTime',
      'course1',
      'material1',
      'course2',
      'material2',
      'learningGoal',
      'management',
      'etc',
      'weeklyPlanRaw'
    ];
    
    const sampleData = [
      [
        '수학 몰입특강',
        '홍길동',
        '초등 5-6',
        '김철수 외 3명',
        '월수금',
        '13:00-17:00',
        '3-1 개념',
        '개념플러스유형',
        '3-1 응용',
        '쎈',
        '기초 개념 완벽 이해',
        '주간 테스트 및 피드백',
        '특별 할인 이벤트 진행 중',
        '1주차: 자연수의 혼합 계산\n2주차: 약수와 배수\n3주차: 규칙과 대응'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '강의계획서_샘플.csv';
    link.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { rows, headers } = await parseCsv(file);
      
      // 간단한 매핑 (실제로는 HeaderMappingTable을 사용해야 함)
      const mapping: Record<string, string> = {};
      headers.forEach(h => {
        const normalized = h.toLowerCase().trim();
        mapping[normalized] = h;
      });

      // CSV 데이터를 ClassPlan으로 변환
      rows.forEach(row => {
        const weeklyPlanRaw = row[mapping['weeklyplanraw']] || row[mapping['weekly_plan_raw']] || '';
        const weeklyPlan: WeeklyItem[] = weeklyPlanRaw
          ? weeklyPlanRaw.split('\n').map((line: string, idx: number) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              const parts = trimmed.split(/[-:]/);
              return {
                weekLabel: parts[0]?.trim() || `${idx + 1}주`,
                topic: parts.slice(1).join(' ').trim() || trimmed
              };
            }).filter((item): item is WeeklyItem => item !== null)
          : Array.from({ length: 8 }, (_, i) => ({
              weekLabel: `${i + 1}주`,
              topic: ''
            }));

        const newPlan: ClassPlan = {
          id: crypto.randomUUID(),
          title: row[mapping['title']] || '제목 없음',
          teacherName: row[mapping['teachername']] || '',
          targetStudent: row[mapping['targetstudent']] || '',
          targetStudentDetail: row[mapping['targetstudentdetail']] || '',
          classDay: row[mapping['classday']] || '',
          classTime: row[mapping['classtime']] || '',
          course1: row[mapping['course1']] || '',
          material1: row[mapping['material1']] || '',
          course2: row[mapping['course2']] || '',
          material2: row[mapping['material2']] || '',
          learningGoal: row[mapping['learninggoal']] || '',
          management: row[mapping['management']] || '',
          etc: row[mapping['etc']] || '',
          weeklyPlan: weeklyPlan,
          templateId: 'classic',
          sizePreset: 'A4'
        };

        addClassPlan(newPlan);
      });

      onClose();
    } catch (error) {
      console.error('CSV 업로드 실패:', error);
      alert('CSV 파일 업로드에 실패했습니다. 파일 형식을 확인해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-zinc-800 mb-6">CSV 일괄 등록</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h3 className="font-bold text-sm text-blue-900 mb-1">샘플 CSV 다운로드</h3>
              <p className="text-xs text-blue-700">업로드 형식을 확인하세요</p>
            </div>
            <button
              onClick={downloadSampleCsv}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">샘플 다운로드</span>
            </button>
          </div>

          <div
            className="border-2 border-dashed border-zinc-300 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 mb-2">CSV 파일 업로드</h3>
            <p className="text-sm text-zinc-500">
              {isUploading ? '업로드 중...' : '이곳을 클릭하거나 파일을 드래그하여 업로드하세요'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CsvUploadModal;

