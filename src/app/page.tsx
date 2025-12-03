'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useClassPlanStore } from '@/store/classPlanStore';
import { Plus, Download, ZoomIn, ZoomOut, Save, RefreshCw, Upload, BookOpen, Layout } from 'lucide-react';
import { ClassPlan, TemplateId } from '@/lib/types';
import TemplateClassic from '@/components/templates/TemplateClassic';
import TemplateBlue from '@/components/templates/TemplateBlue';
import TemplateReport from '@/components/templates/TemplateReport';
import TemplateModern from '@/components/templates/TemplateModern';
import TemplatePurple from '@/components/templates/TemplatePurple';
import TemplateMentoring from '@/components/templates/TemplateMentoring';
import TemplateAcademic from '@/components/templates/TemplateAcademic';
import TemplateDark from '@/components/templates/TemplateDark';
import { downloadAsPng } from '@/lib/download';
import ClassListDropdown from '@/components/editor/ClassListDropdown';
import EditorPanel from '@/components/editor/EditorPanel';
import CsvUploadModal from '@/components/import/CsvUploadModal';
import TeacherDropdown from '@/components/editor/TeacherDropdown';

export default function HomePage() {
  const { classPlans, selectedId, addClassPlan, updateClassPlan, setSelectedId, saveToStorage } = useClassPlanStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.70);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  
  const filteredPlans = selectedTeacher 
    ? classPlans.filter(p => p.teacherName === selectedTeacher)
    : classPlans;
  const selectedPlan = filteredPlans.find(p => p.id === selectedId) || classPlans.find(p => p.id === selectedId);

  const handleAddNew = () => {
    const newPlan: ClassPlan = {
      id: crypto.randomUUID(),
      title: '새로운 강의',
      subject: '',
      targetStudent: '',
      teacherName: '',
      classDay: '',
      classTime: '',
      templateId: 'classic',
      sizePreset: 'A4',
      weeklyPlan: Array.from({ length: 8 }, (_, i) => ({
        weekLabel: `${i + 1}주차`,
        topic: ''
      }))
    };
    addClassPlan(newPlan);
  };

  const getTemplateNameKorean = (templateId?: TemplateId) => {
    const names: Record<TemplateId, string> = {
      classic: '기본형',
      blue: '네이비',
      report: '리포트',
      modern: '모던',
      purple: '프로젝트',
      mentoring: '활동형',
      academic: '학술형',
      dark: '다크'
    };
    return names[templateId || 'classic'];
  };

  const handleDownload = () => {
    if (selectedPlan && canvasRef.current) {
      const year = new Date().getFullYear().toString().slice(-2); // 26
      const templateName = getTemplateNameKorean(selectedPlan.templateId);
      const fileName = `${year}년_겨울특강_${selectedPlan.title || '강좌명'}_${selectedPlan.teacherName || '강사명'}_${templateName}`;
      downloadAsPng(canvasRef, fileName.replace(/\s+/g, '_'));
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    saveToStorage();
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    setLastSaveTime(now);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleApplyToTemplate = () => {
    // 템플릿에 반영 (이미 실시간 반영되지만, 명시적 저장)
    handleSave();
  };

  const getTemplateComponent = (templateId?: TemplateId) => {
    switch (templateId) {
      case 'blue': return TemplateBlue;
      case 'report': return TemplateReport;
      case 'modern': return TemplateModern;
      case 'purple': return TemplatePurple;
      case 'mentoring': return TemplateMentoring;
      case 'academic': return TemplateAcademic;
      case 'dark': return TemplateDark;
      default: return TemplateClassic;
    }
  };
  
  const TemplateComponent = getTemplateComponent(selectedPlan?.templateId);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-12 bg-zinc-900 text-white flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Layout className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">강의계획서 매니저</span>
          </div>
          
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>일괄 등록 (CSV)</span>
          </button>
        </div>

      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Editor */}
        <div className="w-[55%] min-w-[700px] bg-white border-r border-zinc-200 flex flex-col overflow-hidden">
          {/* Class Selector Bar */}
          <div className="h-11 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <TeacherDropdown
                plans={classPlans}
                selectedTeacher={selectedTeacher}
                onSelect={setSelectedTeacher}
              />
              {selectedTeacher && (
                <span className="text-xs text-zinc-600 font-medium">{selectedTeacher}</span>
              )}
              <ClassListDropdown 
                plans={filteredPlans}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
              <button
                onClick={handleAddNew}
                className="flex items-center space-x-1 text-xs bg-zinc-900 text-white px-2.5 py-1 rounded-md hover:bg-black transition font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>새 강의</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {lastSaveTime && (
                <span className="text-[10px] text-zinc-500">마지막 저장: {lastSaveTime}</span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-pulse' : ''}`} />
                <span>{isSaving ? '저장 중...' : '임시저장'}</span>
              </button>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-hidden">
            {selectedPlan ? (
              <EditorPanel
                classPlan={selectedPlan}
                onChange={(patch) => selectedId && updateClassPlan(selectedId, patch)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400">
                <p>강의를 선택하거나 새로 추가하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="flex-1 bg-zinc-200/50 flex flex-col overflow-hidden">
          {/* Preview Toolbar */}
          <div className="h-11 bg-white border-b border-zinc-200 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center space-x-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">템플릿</span>
              <div className="flex bg-zinc-100 rounded-md p-0.5 flex-wrap gap-0.5">
                {(['classic', 'blue', 'report', 'modern', 'purple', 'mentoring', 'academic', 'dark'] as TemplateId[]).map(t => (
                  <button
                    key={t}
                    onClick={() => selectedId && updateClassPlan(selectedId, { templateId: t })}
                    className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                      selectedPlan?.templateId === t 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {{
                      classic: '기본형',
                      blue: '네이비',
                      report: '리포트',
                      modern: '모던',
                      purple: '프로젝트',
                      mentoring: '활동형',
                      academic: '학술형',
                      dark: '다크'
                    }[t]}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-zinc-100 rounded-md p-0.5">
                <button 
                  onClick={() => setScale(s => Math.max(0.2, s - 0.05))}
                  className="p-1 hover:bg-white rounded text-zinc-500"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-medium text-zinc-500 w-10 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button 
                  onClick={() => setScale(s => Math.min(1, s + 0.05))}
                  className="p-1 hover:bg-white rounded text-zinc-500"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <button 
                onClick={handleDownload}
                disabled={!selectedPlan}
                className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG 다운로드</span>
              </button>
            </div>
          </div>

          {/* Preview Canvas */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-6">
            {selectedPlan ? (
              <div 
                style={{ 
                  transform: `scale(${scale})`, 
                  transformOrigin: 'top center',
                }}
                className="shadow-2xl"
              >
                <div ref={canvasRef}>
                  <TemplateComponent classPlan={selectedPlan} />
                </div>
              </div>
            ) : (
              <div className="text-zinc-400 text-sm">강의를 선택하세요</div>
            )}
          </div>
        </div>
      </div>
      
      <CsvUploadModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} />
    </div>
  );
}
