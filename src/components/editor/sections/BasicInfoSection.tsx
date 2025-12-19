'use client';

import React, { useState, useCallback } from 'react';
import { ClassPlan, FieldFontSizes } from '@/lib/types';
import { Sparkles } from 'lucide-react';
import { generateTextForClassPlan, AiGenerateOptions } from '@/lib/ai';
import { getFieldFontSize, getDefaultTypography } from '@/lib/utils';
import FontSizeControl from '../FontSizeControl';

interface Props {
  classPlan: ClassPlan;
  onChange: (patch: Partial<ClassPlan>) => void;
}

const BasicInfoSection: React.FC<Props> = ({ classPlan, onChange }) => {
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    field: keyof ClassPlan | null;
    text: string;
    type?: AiGenerateOptions['type'];
  } | null>(null);
  const [useExisting, setUseExisting] = useState<Record<string, boolean>>({
    parentIntro: true,
    learningGoal: true,
    management: true,
    etc: true,
    promoCopy: true,
    keywords: true,
  });
  const [contexts, setContexts] = useState<Record<string, string[]>>({});

  const contextOptions: Record<AiGenerateOptions['type'], string[]> = {
    parentIntro: ['입시 관점', '방학 전략', '수능 연결', '몰입 강조', '심화 강조', '진도 강조'],
    learningGoal: ['개념', '내신', '모의·수능', '진도', '심화', '간략 정리'],
    management: ['테스트', '클리닉/보충', '피드백', '출결·습관', '개념 강조', '오답 관리'],
    promoCopy: ['가치 제안', '신뢰 강조', '혜택/이벤트', '기간 한정'],
    keywords: ['수학', '성적향상', '자기주도', '시험대비'],
  };

  const handleAiGenerate = async (field: keyof ClassPlan, type: AiGenerateOptions['type']) => {
    setGeneratingField(field as string);
    try {
      const generatedText = await generateTextForClassPlan(classPlan, {
        type,
        mode: useExisting[field as string] ? 'rewrite' : 'generate',
        seedText: useExisting[field as string] ? String(classPlan[field] || '') : undefined,
        contexts: contexts[field as string] || [],
      });
      setPreview({ field, text: generatedText, type });
      setErrorMsg(null);
    } catch (error) {
      console.error("AI Generation failed", error);
      setErrorMsg(error instanceof Error ? error.message : 'AI 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingField(null);
    }
  };

  const handleApplyPreview = () => {
    if (preview?.field) {
      onChange({ [preview.field]: preview.text });
      setPreview(null);
    }
  };

  const renderPreview = (field: keyof ClassPlan, type?: AiGenerateOptions['type']) => {
    if (!type || !preview || preview.field !== field) return null;
    return (
      <div className="mt-2 border border-zinc-200 rounded-lg bg-white p-2.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-700">AI 미리보기</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleAiGenerate(field, type)}
              disabled={generatingField === field}
              className="px-2 py-0.5 text-[10px] bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 disabled:opacity-60"
            >
              다시 생성
            </button>
            <button
              onClick={handleApplyPreview}
              className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              적용
            </button>
            <button
              onClick={() => setPreview(null)}
              className="px-2 py-0.5 text-[10px] bg-white border border-zinc-200 text-zinc-600 rounded hover:bg-zinc-100"
            >
              닫기
            </button>
          </div>
        </div>
        <textarea
          className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none h-20 text-zinc-800 placeholder:text-zinc-500"
          value={preview.text}
          onChange={(e) => setPreview(prev => prev ? { ...prev, text: e.target.value } : prev)}
        />
      </div>
    );
  };

  const handleChange = useCallback((field: keyof ClassPlan) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ [field]: e.target.value });
  }, [onChange]);

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

  const toggleContext = (field: keyof ClassPlan, value: string) => {
    setContexts((prev) => {
      const current = prev[field as string] || [];
      const exists = current.includes(value);
      return {
        ...prev,
        [field as string]: exists ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  };

  return (
    <div className="p-3 bg-zinc-100">
      {errorMsg && (
        <div className="mb-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">
          {errorMsg}
        </div>
      )}
      <div className="grid grid-cols-12 gap-3.5">
        {/* Row 1: 수강대상 20%, 홍보문구 및 특이사항 80% */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
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
              <label className="block text-[13px] font-bold text-blue-600 uppercase cursor-pointer" onClick={() => onChange({ showTargetStudent: !classPlan.showTargetStudent })}>수강대상</label>
            </div>
            <FontSizeControl
              value={getFontSize('targetStudent')}
              onChange={(size) => handleFieldFontSizeChange('targetStudent', size)}
            />
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
              <label className="text-[13px] font-bold text-blue-600 uppercase cursor-pointer" onClick={() => onChange({ showEtc: !classPlan.showEtc })}>홍보문구 및 특이사항 (필요한 경우에만 입력)</label>
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
              <FontSizeControl
                value={getFontSize('etc')}
                onChange={(size) => handleFieldFontSizeChange('etc', size)}
              />
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
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pr-1 mt-1 ml-[54px]">
              {contextOptions.promoCopy.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleContext('etc', c)}
                  className={`px-1.5 py-0.5 rounded text-[9px] border ${
                    (contexts['etc'] || []).includes(c)
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      : 'bg-white text-zinc-600 border-sky-200 hover:border-indigo-300'
                  }`}
                >
                  {c}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseExisting((prev) => ({ ...prev, etc: !prev.etc }))}
                className={`px-1.5 py-0.5 rounded text-[9px] border ${
                  useExisting.etc
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white text-zinc-600 border-sky-200 hover:border-amber-200'
                }`}
                title="기존 문구 활용"
              >
                기존 문구
              </button>
            </div>
          </div>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none h-16 text-zinc-800 placeholder:text-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed"
            value={classPlan.etc || ''}
            onChange={handleChange('etc')}
            placeholder="강좌 홍보 문구, 특이사항 (템플릿에는 타이틀 없이 표시)"
            disabled={!classPlan.showEtc}
            aria-label="홍보문구 및 특이사항"
          />
          {renderPreview('etc', 'promoCopy')}
        </div>

        {/* Row 2: 학부모 안내글 (인트로) */}
        <div className="col-span-12">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <label className="text-[13px] font-bold text-zinc-600 uppercase">학부모 안내글 (인트로)</label>
                <FontSizeControl
                  value={getFontSize('parentIntro')}
                  onChange={(size) => handleFieldFontSizeChange('parentIntro', size)}
                />
              </div>
            <div className="flex items-center gap-1 ml-auto justify-end">
              <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pr-1 justify-end">
                  {contextOptions.parentIntro.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleContext('parentIntro', c)}
                      className={`px-1.5 py-0.5 rounded text-[9px] border ${
                        (contexts['parentIntro'] || []).includes(c)
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                          : 'bg-white text-zinc-600 border-sky-200 hover:border-indigo-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUseExisting((prev) => ({ ...prev, parentIntro: !prev.parentIntro }))}
                    className={`px-1.5 py-0.5 rounded text-[9px] border ${
                  useExisting.parentIntro
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white text-zinc-600 border-sky-200 hover:border-amber-200'
                    }`}
                    title="기존 문구 활용"
                  >
                    기존 문구
                  </button>
                </div>
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
            </div>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none h-16 text-zinc-800 placeholder:text-zinc-500"
            value={classPlan.parentIntro || ''}
            onChange={handleChange('parentIntro')}
            placeholder="학부모님께 전하는 인사말 및 안내 문구"
            aria-label="학부모 안내글"
          />
          {renderPreview('parentIntro', 'parentIntro')}
        </div>

        {/* Row 3: 반명/강좌명, 강사명, 수업요일, 수업시간 */}
        <div className="col-span-3 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="flex bg-zinc-100 rounded-md p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => onChange({ titleType: 'class' })}
                className={`flex-1 px-3 py-1.5 text-[13px] rounded font-medium transition-all whitespace-nowrap ${
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
                className={`flex-1 px-3 py-1.5 text-[13px] rounded font-medium transition-all whitespace-nowrap ${
                  classPlan.titleType === 'name'
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-zinc-700 hover:text-zinc-900'
                }`}
              >
                강좌명
              </button>
            </div>
            <FontSizeControl
              value={getFontSize('title')}
              onChange={(size) => handleFieldFontSizeChange('title', size)}
              max={36}
              label="폰트 13" // 표시용 주석: 실 폰트는 입력 필드에서 조정
            />
          </div>
          <input
            type="text"
            className="w-full text-[13px] px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500 whitespace-nowrap overflow-x-auto flex-1 min-h-[48px]"
            value={classPlan.title || ''}
            onChange={handleChange('title')}
            placeholder={classPlan.titleType === 'name' ? "예: 수학 몰입특강" : "예: A반"}
            aria-label={classPlan.titleType === 'name' ? "강좌명" : "반명"}
          />
        </div>
        <div className="col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[13px] font-bold text-blue-600 uppercase">강사명</label>
            <FontSizeControl
              value={getFontSize('teacherName')}
              onChange={(size) => handleFieldFontSizeChange('teacherName', size)}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            {/* 첫 번째 줄 */}
            <input
              type="text"
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500"
              value={(classPlan.teacherName || '').split('\n')[0] || ''}
              onChange={(e) => {
                const lines = (classPlan.teacherName || '').split('\n');
                lines[0] = e.target.value;
                onChange({ teacherName: lines.filter((_, i) => i === 0 || lines[i]).join('\n') });
              }}
              placeholder="홍길동"
              aria-label="강사명 1"
            />
            {/* 두 번째 줄 */}
            <input
              type="text"
              className="w-full text-xs px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none transition text-zinc-800 placeholder:text-zinc-400"
              value={(classPlan.teacherName || '').split('\n')[1] || ''}
              onChange={(e) => {
                const lines = (classPlan.teacherName || '').split('\n');
                lines[1] = e.target.value;
                onChange({ teacherName: e.target.value ? `${lines[0] || ''}\n${e.target.value}` : (lines[0] || '') });
              }}
              placeholder="(추가 강사명)"
              aria-label="강사명 2"
            />
          </div>
        </div>
        <div className="col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[13px] font-bold text-blue-600 uppercase">수업요일</label>
            <FontSizeControl
              value={getFontSize('classDay')}
              onChange={(size) => handleFieldFontSizeChange('classDay', size)}
            />
          </div>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500 resize-none flex-1 min-h-[48px]"
            value={classPlan.classDay || ''}
            onChange={handleChange('classDay')}
            onKeyDown={(e) => {
              // Enter만 누르면 blur, Shift+Enter는 줄바꿈 허용
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
            placeholder="월수금 (Shift+Enter로 줄바꿈)"
            aria-label="수업요일"
            rows={2}
          />
        </div>
        <div className="col-span-3 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[13px] font-bold text-blue-600 uppercase">수업시간</label>
          </div>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-zinc-800 placeholder:text-zinc-500 resize-none flex-1 min-h-[48px]"
            value={classPlan.classTime || ''}
            onChange={handleChange('classTime')}
            onKeyDown={(e) => {
              // Enter만 누르면 blur, Shift+Enter는 줄바꿈 허용
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
            placeholder="13:00-17:00 (Shift+Enter로 줄바꿈)"
            aria-label="수업시간"
            rows={2}
          />
        </div>
        
        {/* Row 4: 학습과정1, 교재1, 학습과정2, 교재2 (각각 25%) */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[13px] font-bold text-blue-600 uppercase">학습과정1</label>
            <FontSizeControl
              value={getFontSize('course1')}
              onChange={(size) => handleFieldFontSizeChange('course1', size)}
            />
          </div>
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
          <div className="flex items-center justify-between mb-1">
            <label className="text-[13px] font-bold text-blue-600 uppercase">교재1</label>
            <FontSizeControl
              value={getFontSize('material1')}
              onChange={(size) => handleFieldFontSizeChange('material1', size)}
            />
          </div>
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
          <div className="flex items-center justify-between mb-1">
            <label className="text-[13px] font-bold text-blue-600 uppercase">학습과정2</label>
            <FontSizeControl
              value={getFontSize('course2')}
              onChange={(size) => handleFieldFontSizeChange('course2', size)}
            />
          </div>
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
          <div className="flex items-center justify-between mb-1">
            <label className="text-[13px] font-bold text-blue-600 uppercase">교재2</label>
            <FontSizeControl
              value={getFontSize('material2')}
              onChange={(size) => handleFieldFontSizeChange('material2', size)}
            />
          </div>
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
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-[13px] font-bold text-blue-600 uppercase">학습목표</label>
                <FontSizeControl
                  value={getFontSize('learningGoal')}
                  onChange={(size) => handleFieldFontSizeChange('learningGoal', size)}
                />
              </div>
            <div className="flex items-center gap-1 ml-auto justify-end">
              <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pr-1 justify-end">
                {contextOptions.learningGoal.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleContext('learningGoal', c)}
                    className={`px-1.5 py-0.5 rounded text-[9px] border ${
                      (contexts['learningGoal'] || []).includes(c)
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      : 'bg-white text-zinc-600 border-sky-200 hover:border-indigo-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseExisting((prev) => ({ ...prev, learningGoal: !prev.learningGoal }))}
                  className={`px-1.5 py-0.5 rounded text-[9px] border ${
                    useExisting.learningGoal
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white text-zinc-600 border-sky-200 hover:border-amber-200'
                  }`}
                  title="기존 문구 활용"
                >
                  기존 문구
                </button>
              </div>
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
            </div>
          </div>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none text-zinc-800 placeholder:text-zinc-500"
            style={{ height: '7.875rem' }}
            value={classPlan.learningGoal || ''}
            onChange={handleChange('learningGoal')}
            placeholder="학습 목표"
            aria-label="학습목표"
          />
          {renderPreview('learningGoal', 'learningGoal')}
        </div>
        <div className="col-span-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-[13px] font-bold text-blue-600 uppercase">학습관리</label>
                <FontSizeControl
                  value={getFontSize('management')}
                  onChange={(size) => handleFieldFontSizeChange('management', size)}
                />
              </div>
              <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pr-1">
                {contextOptions.management.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleContext('management', c)}
                    className={`px-1.5 py-0.5 rounded text-[9px] border ${
                      (contexts['management'] || []).includes(c)
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-indigo-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseExisting((prev) => ({ ...prev, management: !prev.management }))}
                  className={`px-1.5 py-0.5 rounded text-[9px] border ${
                    useExisting.management
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-amber-200'
                  }`}
                  title="기존 문구 활용"
                >
                  기존 문구
                </button>
              </div>
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
            </div>
          </div>
          <textarea
            className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none text-zinc-800 placeholder:text-zinc-500"
            style={{ height: '7.875rem' }}
            value={classPlan.management || ''}
            onChange={handleChange('management')}
            placeholder="테스트/클리닉/피드백"
            aria-label="학습관리"
          />
          {renderPreview('management', 'management')}
        </div>

      </div>
    </div>
  );
};

export default BasicInfoSection;
