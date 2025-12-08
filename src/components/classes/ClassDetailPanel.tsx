'use client';

import React, { useState } from 'react';
import { ClassPlan } from '@/lib/types';
import WeeklyPlanEditor from './WeeklyPlanEditor';
import { Layers, BookOpen, User, GraduationCap, Sparkles, MessageSquare } from 'lucide-react';
import { generateTextForClassPlan, AiGenerateOptions } from '@/lib/ai';

interface Props {
  classPlan?: ClassPlan;
  onChange: (patch: Partial<ClassPlan>) => void;
}

const ClassDetailPanel: React.FC<Props> = ({ classPlan, onChange }) => {
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!classPlan) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400 bg-white">
        <p className="font-bold text-lg text-zinc-600">편집할 강의를 선택하세요</p>
      </div>
    );
  }

  const handleAiGenerate = async (field: keyof ClassPlan, type: AiGenerateOptions['type']) => {
    if (!classPlan) return;

    setGeneratingField(field as string);
    try {
      const generatedText = await generateTextForClassPlan(classPlan, { type });
      onChange({ [field]: generatedText });
      setErrorMsg(null);
    } catch (error) {
      console.error("AI Generation failed", error);
      setErrorMsg(error instanceof Error ? error.message : 'AI 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingField(null);
    }
  };

  const SectionTitle = ({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) => (
    <h3 className={`text-sm font-extrabold flex items-center mb-4 ${color}`}>
      <Icon className="w-4 h-4 mr-2" />
      {title}
    </h3>
  );

  const AiButton = ({ onClick, isGenerating }: { onClick: () => void; isGenerating: boolean }) => (
    <button
      onClick={onClick}
      disabled={isGenerating}
      className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${isGenerating
          ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-wait'
          : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200'
        }`}
      title="AI로 내용 추천받기"
    >
      {isGenerating ? (
        <span className="flex items-center">
          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse mr-1.5"></span>
          생성 중...
        </span>
      ) : (
        <span className="flex items-center">
          <Sparkles className="w-3 h-3 mr-1" />
          AI 자동완성
        </span>
      )}
    </button>
  );

  const InputField = ({
    label,
    field,
    placeholder,
    multiline = false,
    className,
    aiType
  }: {
    label: string;
    field: keyof ClassPlan;
    placeholder?: string;
    multiline?: boolean;
    className?: string;
    aiType?: AiGenerateOptions['type'];
  }) => (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wide">{label}</label>
        {aiType && (
          <AiButton
            onClick={() => handleAiGenerate(field, aiType)}
            isGenerating={generatingField === field}
          />
        )}
      </div>
      {multiline ? (
        <textarea
          className="block w-full rounded-lg border-zinc-300 bg-white text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm p-2.5 border transition-all placeholder:text-zinc-300 min-h-[80px]"
          value={String(classPlan[field] || '')}
          onChange={(e) => onChange({ [field]: e.target.value })}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          className="block w-full rounded-lg border-zinc-300 bg-white text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm p-2.5 border transition-all placeholder:text-zinc-300"
          value={String(classPlan[field] || '')}
          onChange={(e) => onChange({ [field]: e.target.value })}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-5 py-4 border-b border-zinc-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold text-zinc-900">특강 내용 편집</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {errorMsg && (
          <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {errorMsg}
          </div>
        )}

        {/* 1. 기본 정보 */}
        <section className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-200/60">
          <SectionTitle icon={User} title="기본 정보" color="text-blue-600" />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="강좌명 (과목)" field="title" className="col-span-2" placeholder="예: 수학, 영어" />
            <InputField label="강사명" field="teacherName" />
            <InputField label="수업 일정" field="schedule" placeholder="요일 및 시간" />
            <InputField label="수강 대상" field="targetStudent" placeholder="예: 초등 5-6" />
            <InputField label="대상 상세 (학생명)" field="targetStudentDetail" placeholder="김철수 외 2명" />
          </div>
        </section>

        {/* 2. 학습 과정 (Courses) */}
        <section className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-200/60">
          <SectionTitle icon={BookOpen} title="학습 과정 및 교재" color="text-indigo-600" />
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-12 md:col-span-7">
                <InputField label="학습과정 1" field="course1" placeholder="메인 진도 과정명" />
              </div>
              <div className="col-span-12 md:col-span-5">
                <InputField label="교재 1" field="material1" placeholder="사용 교재" />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-12 md:col-span-7">
                <InputField label="학습과정 2 (선택)" field="course2" placeholder="서브 진도 과정명" />
              </div>
              <div className="col-span-12 md:col-span-5">
                <InputField label="교재 2" field="material2" placeholder="사용 교재" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. 학습 목표 및 관리 */}
        <section className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-200/60">
          <SectionTitle icon={GraduationCap} title="목표 및 관리 계획" color="text-emerald-600" />
          <div className="space-y-3">
            <InputField
              label="학습 목표"
              field="learningGoal"
              multiline
              placeholder="이번 특강의 주요 목표는?"
              aiType="learningGoal"
            />
            <InputField
              label="학습 관리 (테스트/클리닉)"
              field="management"
              multiline
              placeholder="테스트 일정, 오답 노트, 피드백 방식 등"
              aiType="management"
            />
          </div>
        </section>

        {/* 4. 홍보 및 안내 */}
        <section className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-200/60">
          <SectionTitle icon={MessageSquare} title="홍보 및 안내" color="text-pink-600" />
          <div className="space-y-3">
            <InputField
              label="학부모 안내 문구"
              field="parentIntro"
              multiline
              placeholder="가정통신문 인사말, 당부사항 등"
              aiType="parentIntro"
            />
            <InputField
              label="홍보 카피 (기타)"
              field="etc"
              multiline
              placeholder="강좌의 매력을 어필하는 홍보 문구"
              aiType="promoCopy"
            />
            <InputField
              label="키워드 (해시태그)"
              field="keywords"
              placeholder="#열정 #꼼꼼함 #성적향상"
              aiType="keywords"
            />
          </div>
        </section>

        {/* 5. 커리큘럼 */}
        <section className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-200/60">
          <SectionTitle icon={Layers} title="주차별 진도 계획" color="text-orange-600" />
          <WeeklyPlanEditor
            items={classPlan.weeklyPlan || []}
            onChange={(items) => onChange({ weeklyPlan: items })}
          />
        </section>

      </div>
    </div>
  );
};

export default ClassDetailPanel;
