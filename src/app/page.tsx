'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClassPlanStore } from '@/store/classPlanStore';
import { useAuthStore } from '@/store/authStore';
import { recordActivity } from '@/lib/activityLogger';
import { Plus, Download, ZoomIn, ZoomOut, Save, Upload, Layout, Trash2, Settings, History, LayoutTemplate, Archive } from 'lucide-react';
import { ClassPlan, TemplateId, TemplateCategory, ColorTheme, parseTemplateId, FontFamily, TypographySettings, ClassPlanStatus, classPlanStatusNames } from '@/lib/types';
import { colorThemeNames, templateCategoryNames } from '@/lib/colorThemes';
import { getDefaultTypography } from '@/lib/utils';
import TemplateStyle1 from '@/components/templates/TemplateStyle1';
import TemplateStyle2 from '@/components/templates/TemplateStyle2';
import TemplateStyle3 from '@/components/templates/TemplateStyle3';
import { downloadAsJpg } from '@/lib/download';
import ClassListDropdown from '@/components/editor/ClassListDropdown';
import EditorPanel from '@/components/editor/EditorPanel';
import CsvUploadModal from '@/components/import/CsvUploadModal';
import BulkDownloadModal from '@/components/import/BulkDownloadModal';
import TeacherDropdown from '@/components/editor/TeacherDropdown';
import EditModeToolbar from '@/components/templates/EditModeToolbar';
import TemplateEditOverlay from '@/components/templates/TemplateEditOverlay';
import { useTemplateEditStore } from '@/store/templateEditStore';
import { TemplateLayoutConfig } from '@/lib/types';

// 템플릿 카테고리 목록
const templateCategories: TemplateCategory[] = ['style1', 'style2', 'style3'];

// 색상 테마 목록
const colorThemeList: ColorTheme[] = ['green', 'blue', 'purple', 'orange', 'teal', 'dancheong'];

// A4 비율 상수
const A4_RATIO = 297 / 210; // ≈ 1.414 (세로/가로)
const BASE_WIDTH_PX = 794; // 210mm at 96dpi
const BASE_HEIGHT_PX = 1123; // 297mm at 96dpi

export default function HomePage() {
  const router = useRouter();
  const { session, logout } = useAuthStore();
  const [authHydrated, setAuthHydrated] = useState(false);
  const { classPlans, selectedId, addClassPlan, updateClassPlan, setSelectedId, savePlan, loadFromRemote, removeClassPlan, error: storeError } = useClassPlanStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.70);
  const [templateWidth, setTemplateWidth] = useState(BASE_WIDTH_PX); // 동적 너비
  const templateWidthRef = useRef(BASE_WIDTH_PX);
  const lastMeasuredHeightRef = useRef(0); // 마지막 측정 높이 (무한 루프 방지)
  const adjustCountRef = useRef(0); // 연속 조정 횟수 제한
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isBulkDownloadModalOpen, setIsBulkDownloadModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const { isEditMode } = useTemplateEditStore();

  useEffect(() => {
    const authPersist = useAuthStore.persist;
    const unsub = authPersist?.onFinishHydration?.(() => setAuthHydrated(true));
    setAuthHydrated(authPersist?.hasHydrated?.() ?? false);
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!authHydrated) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (session.mustChangePassword) {
      router.replace('/login/change-password');
    }
    loadFromRemote();
  }, [authHydrated, session, router, loadFromRemote]);

  const calculateA4Width = useCallback((height: number, maxWidthMultiplier = 2) => {
    const targetWidth = height / A4_RATIO;
    return Math.max(BASE_WIDTH_PX, Math.min(targetWidth, BASE_WIDTH_PX * maxWidthMultiplier));
  }, []);

  const adjustToA4 = useCallback(
    (options?: { force?: boolean; maxWidthMultiplier?: number }) => {
      const el = canvasRef.current;
      if (!el) return;

      // 연속 조정 횟수 제한 (무한 루프 방지)
      if (!options?.force && adjustCountRef.current >= 3) {
        return;
      }

      // minHeight 영향 없이 실제 콘텐츠 높이 측정
      const prevMinHeight = el.style.minHeight;
      const prevHeight = el.style.height;
      el.style.minHeight = 'auto';
      el.style.height = 'auto';
      const measuredHeight = Math.max(el.scrollHeight, BASE_HEIGHT_PX);
      el.style.minHeight = prevMinHeight;
      el.style.height = prevHeight;

      // 높이 변화가 미미하면 조정 건너뛰기 (무한 루프 방지)
      const heightDiff = Math.abs(measuredHeight - lastMeasuredHeightRef.current);
      if (!options?.force && heightDiff < 20) {
        return;
      }

      const newWidth = calculateA4Width(measuredHeight, options?.maxWidthMultiplier);
      const widthDiff = Math.abs(newWidth - templateWidthRef.current);
      const shouldUpdate = options?.force || widthDiff > 20;

      if (shouldUpdate) {
        lastMeasuredHeightRef.current = measuredHeight;
        adjustCountRef.current += 1;
        
        setTemplateWidth(() => {
          templateWidthRef.current = newWidth;
          return newWidth;
        });

        // 일정 시간 후 조정 카운터 리셋
        setTimeout(() => {
          adjustCountRef.current = 0;
        }, 500);
      }
    },
    [calculateA4Width, setTemplateWidth]
  );

  // A4 비율 자동 조정 (콘텐츠 변경 시 ResizeObserver 사용)
  useEffect(() => {
    if (!canvasRef.current) return;
    
    let isAdjusting = false;
    let adjustTimeout: NodeJS.Timeout;
    let lastObservedHeight = 0;
    
    const adjustA4Ratio = () => {
      if (isAdjusting) return;
      
      const el = canvasRef.current;
      if (!el) return;
      
      // 현재 높이와 마지막 관측된 높이 비교 (무한 루프 방지)
      const currentHeight = el.getBoundingClientRect().height;
      if (Math.abs(currentHeight - lastObservedHeight) < 10) {
        return;
      }
      lastObservedHeight = currentHeight;
      
      isAdjusting = true;
      adjustToA4();
      setTimeout(() => { isAdjusting = false; }, 300);
    };
    
    // ResizeObserver로 콘텐츠 크기 변화 감지
    const resizeObserver = new ResizeObserver((entries) => {
      // 너비 변화만 있는 경우는 무시 (높이 변화에만 반응)
      const entry = entries[0];
      if (!entry) return;
      
      clearTimeout(adjustTimeout);
      adjustTimeout = setTimeout(adjustA4Ratio, 300);
    });
    
    resizeObserver.observe(canvasRef.current);
    
    // 초기 조정 - selectedId 변경 시 카운터 리셋
    adjustCountRef.current = 0;
    lastMeasuredHeightRef.current = 0;
    adjustTimeout = setTimeout(() => adjustToA4({ force: true }), 300);
    
    return () => {
      resizeObserver.disconnect();
      clearTimeout(adjustTimeout);
    };
  }, [selectedId, classPlans, adjustToA4]);

  if (!authHydrated || !session || session.mustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-600">
        로그인 후 이용해주세요.
      </div>
    );
  }
  
  const filteredPlans = selectedTeacher 
    ? classPlans.filter(p => p.teacherName === selectedTeacher)
    : classPlans;
  const selectedPlan = filteredPlans.find(p => p.id === selectedId) || classPlans.find(p => p.id === selectedId);

  // 현재 선택된 템플릿에서 카테고리와 색상 추출 (안전한 파싱)
  const currentTemplateId = selectedPlan?.templateId || 'style1-blue';
  const { category: currentCategory, color: currentColor } = parseTemplateId(currentTemplateId);

  const handleAddNew = async () => {
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
      templateId: currentTemplateId,
      sizePreset: 'A4',
      weeklyPlan: Array.from({ length: 8 }, () => ({
        weekLabel: '',
        topic: ''
      }))
    };
    await addClassPlan(newPlan);
    recordActivity('class.create', `새 강의 생성: ${newPlan.title || '무제 강의'}`);
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
      downloadAsJpg(canvasRef, fileName.replace(/\s+/g, '_'));
      recordActivity('class.download', `${selectedPlan.title || '강좌'} JPG 다운로드`);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    // A4 비율 재조정 (임시저장 시 강제 적용)
    adjustToA4({ force: true, maxWidthMultiplier: 1.5 });
    
    if (selectedPlan) {
      try {
        await savePlan(selectedPlan.id);
        const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        setLastSaveTime(now);
        setSaveError(null);
        recordActivity('class.save', `${selectedPlan.title || '강좌'} 저장`);
      } catch (error) {
        console.error('저장 실패:', error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : storeError || '저장 중 오류가 발생했습니다.';
        setSaveError(errorMessage);
        
        // 사용자에게 알림 표시
        if (typeof window !== 'undefined') {
          alert(`저장 실패: ${errorMessage}`);
        }
      } finally {
        setTimeout(() => setIsSaving(false), 500);
      }
    } else {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (status: ClassPlanStatus) => {
    if (!selectedId || !selectedPlan) return;
    
    updateClassPlan(selectedId, { status });
    
    // 로그인 상태 확인 후 자동 저장
    if (session) {
      try {
        await savePlan(selectedId);
        recordActivity('class.status', `${selectedPlan.title || '강좌'} 단계 변경: ${classPlanStatusNames[status]}`);
      } catch (error) {
        console.error('단계 저장 실패:', error);
        // 저장 실패해도 로컬 상태는 유지됨
      }
    }
    // 로그인이 안 되어 있으면 로컬 상태만 업데이트 (저장은 나중에 임시저장 버튼으로)
  };

  const handleDeleteCurrent = async () => {
    if (!selectedId) return;
    if (!window.confirm('현재 선택된 강의를 휴지통으로 이동할까요?\n\n휴지통에서 복원하거나 영구 삭제할 수 있습니다.')) return;
    await removeClassPlan(selectedId);
    const next = classPlans.find((p) => p.id !== selectedId);
    setSelectedId(next?.id);
    recordActivity('class.delete', `강의 삭제(휴지통 이동): ${selectedPlan?.title || '무제 강의'}`);
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

  // 레이아웃 저장 핸들러
  const handleLayoutSave = async (config: TemplateLayoutConfig, applyToCategory: boolean) => {
    if (!selectedId) return;
    
    // applyToCategory 파라미터를 config에 반영
    const finalConfig = { ...config, applyToCategory };
    
    // 현재 강의에 레이아웃 설정 저장
    updateClassPlan(selectedId, { layoutConfig: finalConfig });
    
    const targets: string[] = [selectedId];
    // 카테고리 전체 적용 시에만 다른 강의에도 적용
    if (applyToCategory) {
      const currentCategory = parseTemplateId(selectedPlan?.templateId).category;
      classPlans.forEach(plan => {
        const planCategory = parseTemplateId(plan.templateId).category;
        if (plan.id !== selectedId && planCategory === currentCategory) {
          updateClassPlan(plan.id, { layoutConfig: finalConfig });
          targets.push(plan.id);
        }
      });
    }
    
    // 즉시 영속화하여 새로고침/재접속 시에도 유지
    for (const planId of Array.from(new Set(targets))) {
      await savePlan(planId);
    }
    
    recordActivity('template.layout', `레이아웃 저장${applyToCategory ? ' (카테고리 전체 적용)' : ''}`);
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
          <button
            onClick={() => setIsBulkDownloadModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>일괄 다운로드</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {session.role === 'admin' && (
            <>
              <Link
                href="/admin/accounts"
                className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md transition font-medium flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" /> 운영 설정
              </Link>
              <Link
                href="/admin/logs"
                className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md transition font-medium flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" /> 활동 로그
              </Link>
              <Link
                href="/admin/templates"
                className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md transition font-medium flex items-center gap-1"
              >
                <LayoutTemplate className="w-3.5 h-3.5" /> 템플릿 관리
              </Link>
            </>
          )}
          <span className="text-[11px] text-zinc-200 px-2 py-1 bg-white/5 rounded-md">
            {session.name} · {session.role === 'admin' ? '관리자' : '일반'}
          </span>
          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition font-semibold"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel: Editor */}
        <div className="w-[55%] min-w-[700px] bg-white border-r border-zinc-200 flex flex-col overflow-hidden min-h-0">
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
              <button
                onClick={handleDeleteCurrent}
                disabled={!selectedId}
                className="flex items-center space-x-1 text-xs bg-red-500 text-white px-2.5 py-1 rounded-md hover:bg-red-600 transition font-medium disabled:opacity-40"
              >
                <Trash2 className="w-3 h-3" />
                <span>현 강의 삭제</span>
              </button>
              <Link
                href="/trash"
                className="flex items-center space-x-1 text-xs bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md hover:bg-zinc-300 transition font-medium"
              >
                <Archive className="w-3 h-3" />
                <span>휴지통</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              {lastSaveTime && (
                <span className="text-[10px] text-zinc-600">마지막 저장: {lastSaveTime}</span>
              )}
              {saveError && (
                <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 max-w-xs">
                  {saveError}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-pulse' : ''}`} />
                <span>{isSaving ? '저장 중...' : '임시저장'}</span>
              </button>
              {selectedPlan && (
                <div className="flex items-center space-x-1 border-l border-zinc-300 pl-2">
                  {(['draft', 'teacher-reviewed', 'admin-reviewed'] as ClassPlanStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`px-2 py-1 text-[10px] rounded transition-all ${
                        selectedPlan.status === status || (!selectedPlan.status && status === 'draft')
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                      title={classPlanStatusNames[status]}
                    >
                      {classPlanStatusNames[status]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
            {selectedPlan ? (
              <EditorPanel
                classPlan={selectedPlan}
                onChange={(patch) => selectedId && updateClassPlan(selectedId, patch)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600">
                <p>강의를 선택하거나 새로 추가하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="flex-1 bg-zinc-200/50 flex flex-col overflow-hidden min-h-0">
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
                        : 'text-zinc-700 hover:text-zinc-900'
                    }`}
                  >
                    {templateCategoryNames[cat]}
                  </button>
                ))}
              </div>
              
              {/* 폰트 설정 */}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-zinc-200 text-[11px] leading-none">
                <span className="text-[10px] font-bold text-zinc-700 uppercase">제목</span>
                <select
                  value={typography.titleFont}
                  onChange={(e) => handleTypographyChange('titleFont', e.target.value as FontFamily)}
                  className="text-[10px] px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  aria-label="제목 폰트 선택"
                >
                  {fontOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={typography.titleWeight || 300}
                  onChange={(e) => handleTypographyChange('titleWeight', parseInt(e.target.value) || 300)}
                  className="text-[10px] px-1 py-0.5 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-16"
                  aria-label="제목 굵기 선택"
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
                  className="w-12 text-[10px] px-1 py-0.5 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  aria-label="제목 크기 (pt)"
                />
                <span className="text-[10px] text-zinc-500">pt</span>
                
                <span className="text-[10px] font-bold text-zinc-700 uppercase ml-2">본문</span>
                <select
                  value={typography.bodyFont}
                  onChange={(e) => handleTypographyChange('bodyFont', e.target.value as FontFamily)}
                  className="text-[10px] px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  aria-label="본문 폰트 선택"
                >
                  {fontOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 두 번째 줄: 색상 선택 + 레이아웃 편집 + 줌/다운로드 */}
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
                          : 'text-zinc-700 hover:text-zinc-900'
                      }`}
                    >
                      {colorThemeNames[color]}
                    </button>
                  ))}
                </div>
                
                {/* 레이아웃 편집 툴바 */}
                <EditModeToolbar
                  currentCategory={currentCategory}
                  onSave={handleLayoutSave}
                />
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="flex items-center bg-zinc-100 rounded-md p-0.5">
                  <button 
                    onClick={() => setScale(s => Math.max(0.2, s - 0.05))}
                    className="p-1 hover:bg-white rounded text-zinc-600"
                    aria-label="축소"
                  >
                    <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <span className="text-[10px] font-medium text-zinc-600 w-10 text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button 
                    onClick={() => setScale(s => Math.min(1, s + 0.05))}
                    className="p-1 hover:bg-white rounded text-zinc-600"
                    aria-label="확대"
                  >
                    <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                
                <button 
                  onClick={handleDownload}
                  disabled={!selectedPlan}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60"
                  aria-label="JPG 다운로드"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>JPG 다운로드</span>
                </button>
              </div>
            </div>
          </div>

          {/* Preview Canvas */}
          <div className={`flex-1 min-h-0 overflow-auto flex items-start justify-center p-6 custom-scrollbar ${isEditMode ? 'bg-amber-50/50' : ''}`}>
            {selectedPlan ? (
              <div 
                style={{ 
                  transform: `scale(${scale})`, 
                  transformOrigin: 'top center',
                }}
                className="shadow-2xl"
              >
                {/* 편집 모드 안내 */}
                {isEditMode && (
                  <div className="mb-2 text-center text-[10px] text-amber-700 bg-amber-100 border border-amber-200 rounded px-3 py-1" data-no-export="true">
                    드래그하여 요소 이동, 모서리 드래그하여 크기 조절
                  </div>
                )}
                {/* A4 비율 유지 컨테이너 - 콘텐츠에 따라 동적 크기 조절 */}
                <div 
                  ref={canvasRef}
                  className="relative"
                  style={{
                    width: `${templateWidth}px`,
                    minHeight: `${templateWidth * A4_RATIO}px`,
                  }}
                >
                  {renderTemplate()}
                  {/* 편집 모드 오버레이 */}
                  <TemplateEditOverlay />
                </div>
              </div>
            ) : (
              <div className="text-zinc-600 text-sm">강의를 선택하세요</div>
            )}
          </div>
        </div>
      </div>
      
      <CsvUploadModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} />
      <BulkDownloadModal 
        isOpen={isBulkDownloadModalOpen} 
        onClose={() => setIsBulkDownloadModalOpen(false)}
        classPlans={classPlans}
      />
    </div>
  );
}