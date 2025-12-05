'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useClassPlanStore } from '@/store/classPlanStore';
import { Plus, Download, ZoomIn, ZoomOut, Save, RefreshCw, Upload, BookOpen, Layout } from 'lucide-react';
import { ClassPlan, TemplateId, TemplateCategory, ColorTheme, parseTemplateId, FontFamily, TypographySettings } from '@/lib/types';
import { colorThemeNames, templateCategoryNames } from '@/lib/colorThemes';
import { getDefaultTypography } from '@/lib/utils';
import TemplateStyle1 from '@/components/templates/TemplateStyle1';
import TemplateStyle2 from '@/components/templates/TemplateStyle2';
import TemplateStyle3 from '@/components/templates/TemplateStyle3';
import { downloadAsPng } from '@/lib/download';
import ClassListDropdown from '@/components/editor/ClassListDropdown';
import EditorPanel from '@/components/editor/EditorPanel';
import CsvUploadModal from '@/components/import/CsvUploadModal';
import TeacherDropdown from '@/components/editor/TeacherDropdown';

// 템플릿 카테고리 목록
const templateCategories: TemplateCategory[] = ['style1', 'style2', 'style3'];

// 색상 테마 목록
const colorThemeList: ColorTheme[] = ['blue', 'purple', 'orange', 'teal', 'green', 'dancheong', 'navyGold', 'blackOrange'];

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

  // 현재 선택된 템플릿에서 카테고리와 색상 추출 (안전한 파싱)
  const currentTemplateId = selectedPlan?.templateId || 'style1-blue';
  const { category: currentCategory, color: currentColor } = parseTemplateId(currentTemplateId);

  const handleAddNew = () => {
    const newPlan: ClassPlan = {
      id: crypto.randomUUID(),
      title: '',
      titleType: 'class',
      subject: '',
      targetStudent: '',
      showTargetStudent: false,
      teacherName: '',
      classDay: '',
      classTime: '',
      templateId: 'style1-blue',
      sizePreset: 'A4',
      weeklyPlan: Array.from({ length: 8 }, (_, i) => ({
        weekLabel: `${i + 1}주차`,
        topic: ''
      }))
    };
    addClassPlan(newPlan);
  };

  const getTemplateNameKorean = (templateId?: TemplateId) => {
    if (!templateId) return '스타일1 블루';
    const { category, color } = parseTemplateId(templateId);
    return `${templateCategoryNames[category]} ${colorThemeNames[color]}`;
  };

  const handleDownload = () => {
    if (selectedPlan && canvasRef.current) {
      const year = new Date().getFullYear().toString().slice(-2);
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

  // 카테고리 변경
  const handleCategoryChange = (newCategory: TemplateCategory) => {
    if (selectedId) {
      const newTemplateId = `${newCategory}-${currentColor}` as TemplateId;
      updateClassPlan(selectedId, { templateId: newTemplateId });
    }
  };

  // 색상 변경
  const handleColorChange = (newColor: ColorTheme) => {
    if (selectedId) {
      const newTemplateId = `${currentCategory}-${newColor}` as TemplateId;
      updateClassPlan(selectedId, { templateId: newTemplateId });
    }
  };

  // 타이포그래피 설정 가져오기
  const typography = selectedPlan?.typography || getDefaultTypography();

  // 폰트 옵션
  const fontOptions: { value: FontFamily; label: string }[] = [
    { value: 'jeju', label: '제주고딕' },
    { value: 'nanum-square', label: '나눔스퀘어' },
    { value: 'nanum-human', label: '나눔휴먼' },
    { value: 'nanum-barun', label: '나눔바른고딕' },
    { value: 'pretendard', label: 'Pretendard' },
    { value: 'noto-sans-kr', label: 'Noto Sans KR' },
    { value: 'korail', label: '코레일체' },
  ];

  // 타이포그래피 변경
  const handleTypographyChange = (field: keyof TypographySettings, value: FontFamily | number | boolean) => {
    if (selectedId) {
      updateClassPlan(selectedId, {
        typography: {
          ...typography,
          [field]: value,
        },
      });
    }
  };

  // 폰트 굵기 옵션 (차이를 확연하게 구별)
  const fontWeightOptions = [
    { value: 300, label: '보통' },    // 300: Light
    { value: 500, label: '중간' },    // 500: Medium
    { value: 600, label: '세미볼드' }, // 600: SemiBold
    { value: 700, label: '볼드' },    // 700: Bold
  ];

  // 템플릿 컴포넌트 렌더링
  const renderTemplate = () => {
    if (!selectedPlan) return null;
    
    const props = { classPlan: selectedPlan, colorTheme: currentColor };
    
    switch (currentCategory) {
      case 'style1':
        return <TemplateStyle1 {...props} />;
      case 'style2':
        return <TemplateStyle2 {...props} />;
      case 'style3':
        return <TemplateStyle3 {...props} />;
      default:
        return <TemplateStyle1 {...props} />;
    }
  };

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
          <div className="h-auto bg-white border-b border-zinc-200 flex flex-col px-4 py-2 flex-shrink-0 gap-2">
            {/* 첫 번째 줄: 스타일 선택 + 폰트 설정 */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-zinc-100 rounded-md p-0.5 gap-0.5">
                {templateCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-2.5 py-1 text-[10px] rounded font-medium transition-all ${
                      currentCategory === cat 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {templateCategoryNames[cat]}
                  </button>
                ))}
              </div>
              
              {/* 폰트 설정 */}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-zinc-200">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typography.enableFontSizeChange || false}
                    onChange={(e) => handleTypographyChange('enableFontSizeChange', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 bg-white border-2 border-zinc-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-1 transition-all flex items-center justify-center">
                    {typography.enableFontSizeChange && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </label>
                <span className="text-[8px] text-zinc-500">크기조정</span>
                
                <span className="text-[9px] font-bold text-zinc-400 uppercase ml-2">제목</span>
                <select
                  value={typography.titleFont}
                  onChange={(e) => handleTypographyChange('titleFont', e.target.value as FontFamily)}
                  className="text-[9px] px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {fontOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={typography.titleWeight || 300}
                  onChange={(e) => handleTypographyChange('titleWeight', parseInt(e.target.value) || 300)}
                  className="text-[9px] px-1 py-0.5 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-14"
                  title="제목 굵기"
                >
                  {fontWeightOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="8"
                  max="32"
                  value={typography.titleSize}
                  onChange={(e) => handleTypographyChange('titleSize', parseInt(e.target.value) || 16)}
                  disabled={!typography.enableFontSizeChange}
                  className={`w-10 text-[9px] px-1 py-0.5 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${
                    !typography.enableFontSizeChange ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : ''
                  }`}
                  title="제목 크기 (pt)"
                />
                <span className="text-[8px] text-zinc-400">pt</span>
                
                <span className="text-[9px] font-bold text-zinc-400 uppercase ml-2">본문</span>
                <select
                  value={typography.bodyFont}
                  onChange={(e) => handleTypographyChange('bodyFont', e.target.value as FontFamily)}
                  className="text-[9px] px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {fontOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={typography.bodyWeight || 300}
                  onChange={(e) => handleTypographyChange('bodyWeight', parseInt(e.target.value) || 300)}
                  className="text-[9px] px-1 py-0.5 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-14"
                  title="본문 굵기"
                >
                  {fontWeightOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="8"
                  max="24"
                  value={typography.bodySize}
                  onChange={(e) => handleTypographyChange('bodySize', parseInt(e.target.value) || 13)}
                  disabled={!typography.enableFontSizeChange}
                  className={`w-10 text-[9px] px-1 py-0.5 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${
                    !typography.enableFontSizeChange ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : ''
                  }`}
                  title="본문 크기 (pt)"
                />
                <span className="text-[8px] text-zinc-400">pt</span>
              </div>
            </div>
            
            {/* 두 번째 줄: 색상 선택 + 줌/다운로드 */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex bg-zinc-100 rounded-md p-0.5 gap-0.5">
                  {colorThemeList.map(color => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                        currentColor === color 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      {colorThemeNames[color]}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
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
                  {renderTemplate()}
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
