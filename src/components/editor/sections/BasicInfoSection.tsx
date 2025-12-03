'use client';

import React, { useState, useCallback } from 'react';
import { ClassPlan } from '@/lib/types';
import { Sparkles } from 'lucide-react';
import { generateTextForClassPlan, AiGenerateOptions } from '@/lib/ai';

interface Props {
  classPlan: ClassPlan;
  onChange: (patch: Partial<ClassPlan>) => void;
}

const BasicInfoSection: React.FC<Props> = ({ classPlan, onChange }) => {
  const [generatingField, setGeneratingField] = useState<string | null>(null);

  const handleAiGenerate = async (field: keyof ClassPlan, type: AiGenerateOptions['type']) => {
    setGeneratingField(field as string);
    try {
      const generatedText = await generateTextForClassPlan(classPlan, { type });
      onChange({ [field]: generatedText });
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setGeneratingField(null);
    }
  };

  const handleChange = useCallback((field: keyof ClassPlan) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ [field]: e.target.value });
  }, [onChange]);

  return (
    <div className="p-4 bg-zinc-100">
      <div className="grid grid-cols-12 gap-3">
        {/* Row 1: 기본 정보 */}
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">강좌명</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.title || ''}
            onChange={handleChange('title')}
            placeholder="예: 수학 몰입특강"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">강사명</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.teacherName || ''}
            onChange={handleChange('teacherName')}
            placeholder="홍길동"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">수강대상</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.targetStudent || ''}
            onChange={handleChange('targetStudent')}
            placeholder="초등 5-6"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">대상학생</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.targetStudentDetail || ''}
            onChange={handleChange('targetStudentDetail')}
            placeholder="김철수 외 3명"
          />
        </div>
        <div className="col-span-1">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">수업요일</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.classDay || ''}
            onChange={handleChange('classDay')}
            placeholder="월수금"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">수업시간</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.classTime || ''}
            onChange={handleChange('classTime')}
            placeholder="13:00-17:00"
          />
        </div>
        
        {/* Row 2: 학습과정 */}
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">학습과정1</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.course1 || ''}
            onChange={handleChange('course1')}
            placeholder="3-1 개념"
          />
        </div>
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">교재1</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.material1 || ''}
            onChange={handleChange('material1')}
            placeholder="개념플러스유형"
          />
        </div>
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">학습과정2</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.course2 || ''}
            onChange={handleChange('course2')}
            placeholder="3-1 응용"
          />
        </div>
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">교재2</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.material2 || ''}
            onChange={handleChange('material2')}
            placeholder="쎈"
          />
        </div>
        
        {/* Row 3: 학부모 안내글 */}
        <div className="col-span-12">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">학부모 안내글 (인트로)</label>
            <button
              onClick={() => handleAiGenerate('parentIntro', 'parentIntro')}
              disabled={generatingField === 'parentIntro'}
              className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                generatingField === 'parentIntro' 
                  ? 'bg-zinc-200 text-zinc-400 cursor-wait' 
                  : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              }`}
              title="AI 추천"
            >
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              {generatingField === 'parentIntro' ? '생성중' : 'AI'}
            </button>
          </div>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none h-16 text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.parentIntro || ''}
            onChange={handleChange('parentIntro')}
            placeholder="학부모님께 전하는 인사말 및 안내 문구"
          />
        </div>

        {/* Row 4: 홍보문구 및 특이사항 */}
        <div className="col-span-6">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">홍보문구 및 특이사항</label>
            <button
              onClick={() => handleAiGenerate('etc', 'promoCopy')}
              disabled={generatingField === 'etc'}
              className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                generatingField === 'etc' 
                  ? 'bg-zinc-200 text-zinc-400 cursor-wait' 
                  : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              }`}
              title="AI 추천"
            >
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              {generatingField === 'etc' ? '생성중' : 'AI'}
            </button>
          </div>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none h-14 text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.etc || ''}
            onChange={handleChange('etc')}
            placeholder="강좌 홍보 문구, 특이사항 (템플릿에는 타이틀 없이 표시)"
          />
        </div>

        {/* Row 5: 목표 및 관리 */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">학습목표</label>
            <button
              onClick={() => handleAiGenerate('learningGoal', 'learningGoal')}
              disabled={generatingField === 'learningGoal'}
              className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                generatingField === 'learningGoal' 
                  ? 'bg-zinc-200 text-zinc-400 cursor-wait' 
                  : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              }`}
              title="AI 추천"
            >
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              {generatingField === 'learningGoal' ? '생성중' : 'AI'}
            </button>
          </div>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none h-14 text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.learningGoal || ''}
            onChange={handleChange('learningGoal')}
            placeholder="학습 목표"
          />
        </div>
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">학습관리</label>
            <button
              onClick={() => handleAiGenerate('management', 'management')}
              disabled={generatingField === 'management'}
              className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                generatingField === 'management' 
                  ? 'bg-zinc-200 text-zinc-400 cursor-wait' 
                  : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              }`}
              title="AI 추천"
            >
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              {generatingField === 'management' ? '생성중' : 'AI'}
            </button>
          </div>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none h-14 text-zinc-800 placeholder:text-zinc-400"
            value={classPlan.management || ''}
            onChange={handleChange('management')}
            placeholder="테스트/클리닉/피드백"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;
