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
  const twoLineDividerStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(to right, #e5e7eb, #e5e7eb)',
    backgroundSize: '100% 1px',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

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
    <div className="p-3 bg-zinc-100">
      <div className="grid grid-cols-12 gap-2.5">
        {/* Row 1: 수강대상 20%, 홍보문구 및 특이사항 80% */}
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={classPlan.showTargetStudent || false}
                onChange={(e) => onChange({ showTargetStudent: e.target.checked })}
                className="sr-only peer"
                aria-label="수강대상 표시"
              />
              <div className="w-5 h-5 bg-white border-2 border-zinc-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-1 transition-all flex items-center justify-center" aria-hidden="true">
                {classPlan.showTargetStudent && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </label>
            <label className="block text-xs font-bold text-blue-600 uppercase cursor-pointer" onClick={() => onChange({ showTargetStudent: !classPlan.showTargetStudent })}>수강대상</label>
          </div>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed"
            value={classPlan.targetStudent || ''}
            onChange={handleChange('targetStudent')}
            placeholder="초등 5-6"
            disabled={!classPlan.showTargetStudent}
            aria-label="수강대상"
          />
        </div>
        <div className="col-span-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={classPlan.showEtc || false}
                  onChange={(e) => onChange({ showEtc: e.target.checked })}
                  className="sr-only peer"
                  aria-label="홍보문구 및 특이사항 표시"
                />
                <div className="w-5 h-5 bg-white border-2 border-zinc-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-1 transition-all flex items-center justify-center" aria-hidden="true">
                  {classPlan.showEtc && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </label>
              <label className="text-xs font-bold text-blue-600 uppercase cursor-pointer" onClick={() => onChange({ showEtc: !classPlan.showEtc })}>홍보문구 및 특이사항 (필요한 경우에만 입력)</label>
              {classPlan.showEtc && (
                <select
                  value={classPlan.etcPosition || 'bottom'}
                  onChange={(e) => onChange({ etcPosition: e.target.value as 'top' | 'bottom' })}
                  className="ml-2 text-[9px] px-2 py-0.5 border border-zinc-300 rounded bg-white text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  aria-label="홍보문구 위치"
                >
                  <option value="top">맨위</option>
                  <option value="bottom">맨아래</option>
                </select>
              )}
            </div>
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
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none h-16 text-zinc-800 placeholder:text-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed"
            value={classPlan.etc || ''}
            onChange={handleChange('etc')}
            placeholder="강좌 홍보 문구, 특이사항 (템플릿에는 타이틀 없이 표시)"
            disabled={!classPlan.showEtc}
            aria-label="홍보문구 및 특이사항"
          />
        </div>

        {/* Row 2: 학부모 안내글 (인트로) */}
        <div className="col-span-12">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-zinc-600 uppercase">학부모 안내글 (인트로)</label>
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
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none h-16 text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.parentIntro || ''}
            onChange={handleChange('parentIntro')}
            placeholder="학부모님께 전하는 인사말 및 안내 문구"
            aria-label="학부모 안내글"
          />
        </div>

        {/* Row 3: 반명/강좌명, 강사명, 수업요일, 수업시간 */}
        <div className="col-span-3">
          <div className="mb-1">
            <div className="flex bg-zinc-100 rounded-md p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => onChange({ titleType: 'class' })}
                className={`flex-1 px-2 py-1 text-[10px] rounded font-medium transition-all ${
                  classPlan.titleType === 'class' || !classPlan.titleType
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-zinc-700 hover:text-zinc-900'
                }`}
              >
                반명
              </button>
              <button
                type="button"
                onClick={() => onChange({ titleType: 'name' })}
                className={`flex-1 px-2 py-1 text-[10px] rounded font-medium transition-all ${
                  classPlan.titleType === 'name'
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-zinc-700 hover:text-zinc-900'
                }`}
              >
                강좌명
              </button>
            </div>
          </div>
          <input
            type="text"
            className="w-full h-9 text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.title || ''}
            onChange={handleChange('title')}
            placeholder={classPlan.titleType === 'name' ? "예: 수학 몰입특강" : "예: A반"}
            aria-label={classPlan.titleType === 'name' ? "강좌명" : "반명"}
          />
        </div>
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">강사명</label>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none min-h-[44px] text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.teacherName || ''}
            onChange={handleChange('teacherName')}
            onKeyDown={(e) => {
              // Shift+Enter: 줄바꿈 허용
              if (e.key === 'Enter' && e.shiftKey) {
                return; // 기본 동작(줄바꿈) 허용
              }
              // Enter만: 기본 동작 막기 (폼 제출 방지)
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
            placeholder="홍길동 (필요 시 두 줄 입력, Shift+Enter 줄바꿈)"
            rows={2}
            style={twoLineDividerStyle}
            aria-label="강사명"
          />
        </div>
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">수업요일</label>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none min-h-[36px] text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.classDay || ''}
            onChange={handleChange('classDay')}
            onKeyDown={(e) => {
              // Shift+Enter: 줄바꿈 허용
              if (e.key === 'Enter' && e.shiftKey) {
                return; // 기본 동작(줄바꿈) 허용
              }
              // Enter만: 기본 동작 막기 (폼 제출 방지)
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
            placeholder="월수금 (Shift+Enter로 줄바꿈)"
            rows={2}
            style={twoLineDividerStyle}
            aria-label="수업요일"
          />
        </div>
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">수업시간</label>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none min-h-[36px] text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.classTime || ''}
            onChange={handleChange('classTime')}
            onKeyDown={(e) => {
              // Shift+Enter: 줄바꿈 허용
              if (e.key === 'Enter' && e.shiftKey) {
                return; // 기본 동작(줄바꿈) 허용
              }
              // Enter만: 기본 동작 막기 (폼 제출 방지)
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
            placeholder="13:00-17:00 (Shift+Enter로 줄바꿈)"
            rows={2}
            style={twoLineDividerStyle}
            aria-label="수업시간"
          />
        </div>
        
        {/* Row 4: 학습과정1, 교재1, 학습과정2, 교재2 (각각 25%) */}
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">학습과정1</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.course1 || ''}
            onChange={handleChange('course1')}
            placeholder="3-1 개념"
            aria-label="학습과정1"
          />
        </div>
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">교재1</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.material1 || ''}
            onChange={handleChange('material1')}
            placeholder="개념플러스유형"
            aria-label="교재1"
          />
        </div>
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">학습과정2</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.course2 || ''}
            onChange={handleChange('course2')}
            placeholder="3-1 응용"
            aria-label="학습과정2"
          />
        </div>
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">교재2</label>
          <input
            type="text"
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.material2 || ''}
            onChange={handleChange('material2')}
            placeholder="쎈"
            aria-label="교재2"
          />
        </div>
        
        {/* Row 5: 학습목표와 학습관리 (각각 50%), 폰트 파란색 */}
        <div className="col-span-6">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-blue-600 uppercase">학습목표</label>
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
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none h-14 text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.learningGoal || ''}
            onChange={handleChange('learningGoal')}
            placeholder="학습 목표"
            aria-label="학습목표"
          />
        </div>
        <div className="col-span-6">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-blue-600 uppercase">학습관리</label>
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
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none h-14 text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.management || ''}
            onChange={handleChange('management')}
            placeholder="테스트/클리닉/피드백"
            aria-label="학습관리"
          />
        </div>

      </div>
    </div>
  );
};

export default BasicInfoSection;
