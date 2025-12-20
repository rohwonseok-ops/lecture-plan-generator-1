'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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
import TeacherDropdown from '@/components/editor/TeacherDropdown';
import EditModeToolbar from '@/components/templates/EditModeToolbar';
import { useTemplateEditStore } from '@/store/templateEditStore';
import { TemplateLayoutConfig } from '@/lib/types';
import { A4_RATIO, A4_WIDTH_PX, calculateA4Width, measureContentSize } from '@/lib/a4Utils';
import { toast } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SaveStatus } from '@/components/ui/SaveStatus';

// 동적 임포트: 무거운 컴포넌트 (필요할 때만 로드)
const CsvUploadModal = dynamic(
  () => import('@/components/import/CsvUploadModal'),
  { ssr: false }
);

const BulkDownloadModal = dynamic(
  () => import('@/components/import/BulkDownloadModal'),
  { ssr: false }
);

const TemplateEditOverlay = dynamic(
  () => import('@/components/templates/TemplateEditOverlay'),
  { ssr: false }
);

// 템플릿 카테고리 목록
const templateCategories: TemplateCategory[] = ['style1', 'style2', 'style3'];

// 색상 테마 목록
const colorThemeList: ColorTheme[] = ['green', 'blue', 'purple', 'orange', 'teal', 'dancheong'];

export default function HomePage() {
  const router = useRouter();
  const { session, logout } = useAuthStore();
  const [authHydrated, setAuthHydrated] = useState(false);
  const { classPlans, selectedId, addClassPlan, updateClassPlan, setSelectedId, savePlan, loadFromRemote, removeClassPlan, error: storeError } = useClassPlanStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.70);
  const [templateWidth, setTemplateWidth] = useState(A4_WIDTH_PX); // 동적 너비
  const templateWidthRef = useRef(A4_WIDTH_PX);
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

  // adjustToA4: a4Utils 유틸리티 활용
  const adjustToA4 = useCallback(
    (options?: { force?: boolean; maxWidthMultiplier?: number }) => {
      const el = canvasRef.current;
      if (!el) return;

      // 연속 조정 횟수 제한 (무한 루프 방지) - 5회로 완화
      if (!options?.force && adjustCountRef.current >= 5) {
        return;
      }

      // a4Utils의 measureContentSize 사용
      const { height: measuredHeight } = measureContentSize(el);

      // 높이 변화가 미미하면 조정 건너뛰기 (무한 루프 방지)
      const heightDiff = Math.abs(measuredHeight - lastMeasuredHeightRef.current);
      if (!options?.force && heightDiff < 20) {
        return;
      }

      // a4Utils의 calculateA4Width 사용
      const newWidth = calculateA4Width(measuredHeight, { maxWidthMultiplier: options?.maxWidthMultiplier });
      const widthDiff = Math.abs(newWidth - templateWidthRef.current);
      const shouldUpdate = options?.force || widthDiff > 10;

      if (shouldUpdate) {
        lastMeasuredHeightRef.current = measuredHeight;
        adjustCountRef.current += 1;

        setTemplateWidth(() => {
          templateWidthRef.current = newWidth;
          return newWidth;
        });

        // 일정 시간 후 조정 카운터 리셋 (800ms로 증가)
        setTimeout(() => {
          adjustCountRef.current = 0;
        }, 800);
      }
    },
    [setTemplateWidth]
  );

  // A4 비율 자동 조정 (콘텐츠 변경 시 ResizeObserver 사용) - requestAnimationFrame 최적화
  useEffect(() => {
    if (!canvasRef.current) return;

    let rafId: number | null = null;
    let lastObservedHeight = 0;
    const THRESHOLD = 10; // 변화량 임계값 (px)

    const adjustA4Ratio = () => {
      // 편집 모드에서는 자동 조정 비활성화 (DOM 직접 조작과의 충돌 방지)
      if (isEditMode) return;

      const el = canvasRef.current;
      if (!el) return;

      // 현재 높이와 마지막 관측된 높이 비교 (무한 루프 방지)
      const currentHeight = el.getBoundingClientRect().height;
      if (Math.abs(currentHeight - lastObservedHeight) < THRESHOLD) {
        return;
      }
      lastObservedHeight = currentHeight;
      adjustToA4();
    };

    // ResizeObserver로 콘텐츠 크기 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      // 이전 RAF 취소
      if (rafId !== null) cancelAnimationFrame(rafId);
      // requestAnimationFrame으로 스로틀링
      rafId = requestAnimationFrame(adjustA4Ratio);
    });

    resizeObserver.observe(canvasRef.current);

    // 초기 조정 - selectedId 변경 시 카운터 리셋
    adjustCountRef.current = 0;
    lastMeasuredHeightRef.current = 0;
    rafId = requestAnimationFrame(() => adjustToA4({ force: true }));

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [selectedId, classPlans, adjustToA4, isEditMode]);

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
      const toastId = toast.loading('저장 중...');
      try {
        await savePlan(selectedPlan.id);
        const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        setLastSaveTime(now);
        setSaveError(null);
        toast.success('저장되었습니다', { id: toastId });
        recordActivity('class.save', `${selectedPlan.title || '강좌'} 저장`);
      } catch (error) {
        console.error('저장 실패:', error);
        const errorMessage = error instanceof Error
          ? error.message
          : storeError || '저장 중 오류가 발생했습니다.';
        setSaveError(errorMessage);
        toast.error('저장 실패', { id: toastId, description: errorMessage });
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
    if (!window.confirm('정말 삭제하시겠습니까?\n휴지통으로 이동합니다.')) return;
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

  // 레이아웃 저장 핸들러 - Promise.allSettled로 병렬화
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

    // 병렬 저장 (Promise.allSettled)
    const uniqueTargets = Array.from(new Set(targets));
    const toastId = toast.loading(`레이아웃 저장 중... (${uniqueTargets.length}개)`);

    const results = await Promise.allSettled(
      uniqueTargets.map(planId => savePlan(planId))
    );

    // 실패한 항목 확인
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      toast.error(`${failed.length}개 항목 저장 실패`, { id: toastId });
    } else {
      toast.success('레이아웃 저장 완료', { id: toastId });
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
            className="hidden sm:flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">일괄 등록 (CSV)</span>
            <span className="md:hidden">CSV</span>
          </button>
          <button
            onClick={() => setIsBulkDownloadModalOpen(true)}
            className="hidden sm:flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">일괄 다운로드</span>
            <span className="md:hidden">다운</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {session.role === 'admin' && (
            <>
              <Link
                href="/admin/accounts"
                className="hidden md:flex px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md transition font-medium items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" /> <span className="hidden lg:inline">운영 설정</span>
              </Link>
              <Link
                href="/admin/logs"
                className="hidden lg:flex px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md transition font-medium items-center gap-1"
              >
                <History className="w-3.5 h-3.5" /> 활동 로그
              </Link>
              <Link
                href="/admin/templates"
                className="hidden lg:flex px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md transition font-medium items-center gap-1"
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
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Panel: Editor */}
        <div className="w-full lg:w-[55%] lg:min-w-[500px] bg-white border-r border-zinc-200 flex flex-col overflow-hidden min-h-0 lg:max-h-none max-h-[50vh]">
          {/* Class Selector Bar */}
          <div className="h-11 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between px-2 sm:px-4 flex-shrink-0">
            <div className="flex items-center space-x-1 sm:space-x-3">
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
              {/* 삭제/휴지통 드롭다운 */}
              <div className="relative group hidden sm:block">
                <button
                  disabled={!selectedId}
                  className="flex items-center space-x-1 text-xs bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md hover:bg-zinc-300 transition font-medium disabled:opacity-40"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden md:inline">삭제</span>
                </button>
                <div className="absolute left-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button
                    onClick={handleDeleteCurrent}
                    disabled={!selectedId}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3" />
                    현 강의 삭제
                  </button>
                  <Link
                    href="/trash"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                  >
                    <Archive className="w-3 h-3" />
                    휴지통 보기
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* 저장 상태 표시 */}
              <div className="hidden sm:block">
                <SaveStatus
                  state={isSaving ? 'saving' : saveError ? 'error' : 'idle'}
                  lastSaveTime={lastSaveTime}
                  error={saveError}
                  onRetry={handleSave}
                />
              </div>

              {/* 저장 버튼 */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">저장</span>
              </button>

              {/* 상태 버튼 (라디오 그룹 스타일) */}
              {selectedPlan && (
                <div className="hidden md:flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
                  {(['draft', 'teacher-reviewed', 'admin-reviewed'] as ClassPlanStatus[]).map((status) => {
                    const isActive = selectedPlan.status === status || (!selectedPlan.status && status === 'draft');
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`px-2.5 py-1 text-[10px] rounded-md transition-all ${
                          isActive
                            ? 'bg-white text-blue-600 font-semibold shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                        title={classPlanStatusNames[status]}
                      >
                        {classPlanStatusNames[status]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
            {selectedPlan ? (
              <ErrorBoundary title="편집기 오류" onReset={() => loadFromRemote()}>
                <EditorPanel
                  classPlan={selectedPlan}
                  onChange={(patch) => selectedId && updateClassPlan(selectedId, patch)}
                />
              </ErrorBoundary>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600">
                <p>강의를 선택하거나 새로 추가하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="flex-1 bg-zinc-200/50 flex flex-col overflow-hidden min-h-0">
          {/* Preview Toolbar - 1줄 컴팩트 레이아웃 */}
          <div className="h-auto bg-white border-b border-zinc-200 flex items-center px-2 sm:px-4 py-2 flex-shrink-0 gap-1 sm:gap-3 flex-wrap sm:flex-nowrap">
            {/* 템플릿 스타일 드롭다운 */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-md text-[11px] font-medium text-zinc-700 transition-colors">
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{templateCategoryNames[currentCategory]}</span>
                <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 top-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[100px]">
                {templateCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-zinc-50 first:rounded-t-md last:rounded-b-md ${
                      currentCategory === cat ? 'bg-blue-50 text-blue-600 font-medium' : 'text-zinc-700'
                    }`}
                  >
                    {templateCategoryNames[cat]}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden sm:block w-px h-5 bg-zinc-200" />

            {/* 색상 선택 - 원형 버튼 */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {colorThemeList.map(color => {
                const colorMap: Record<ColorTheme, string> = {
                  green: 'bg-emerald-500',
                  blue: 'bg-blue-500',
                  purple: 'bg-purple-500',
                  orange: 'bg-orange-500',
                  teal: 'bg-teal-500',
                  dancheong: 'bg-gradient-to-r from-pink-500 via-cyan-500 to-yellow-500',
                };
                return (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all ${colorMap[color]} ${
                      currentColor === color
                        ? 'ring-2 ring-offset-1 ring-zinc-400 scale-110'
                        : 'hover:scale-110'
                    }`}
                    title={colorThemeNames[color]}
                    aria-label={`색상: ${colorThemeNames[color]}`}
                  />
                );
              })}
            </div>

            <div className="hidden sm:block w-px h-5 bg-zinc-200" />

            {/* 폰트 설정 드롭다운 */}
            <div className="relative group hidden sm:block">
              <button className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-md text-[11px] font-medium text-zinc-700 transition-colors">
                <span className="font-serif">A</span>
                <span className="hidden md:inline">폰트</span>
                <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 top-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 p-3 min-w-[220px]">
                <div className="space-y-3">
                  {/* 제목 폰트 설정 */}
                  <div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5">제목</div>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={typography.titleFont}
                        onChange={(e) => handleTypographyChange('titleFont', e.target.value as FontFamily)}
                        className="flex-1 text-[10px] px-1.5 py-1 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 outline-none"
                        aria-label="제목 폰트"
                      >
                        {fontOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <select
                        value={typography.titleWeight || 300}
                        onChange={(e) => handleTypographyChange('titleWeight', parseInt(e.target.value) || 300)}
                        className="w-16 text-[10px] px-1 py-1 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 outline-none"
                        aria-label="제목 굵기"
                      >
                        {fontWeightOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          min="8"
                          max="32"
                          value={typography.titleSize}
                          onChange={(e) => handleTypographyChange('titleSize', parseInt(e.target.value) || 16)}
                          className="w-10 text-[10px] px-1 py-1 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 outline-none"
                          aria-label="제목 크기"
                        />
                        <span className="text-[9px] text-zinc-400">pt</span>
                      </div>
                    </div>
                  </div>
                  {/* 본문 폰트 설정 */}
                  <div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5">본문</div>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={typography.bodyFont}
                        onChange={(e) => handleTypographyChange('bodyFont', e.target.value as FontFamily)}
                        className="flex-1 text-[10px] px-1.5 py-1 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 outline-none"
                        aria-label="본문 폰트"
                      >
                        {fontOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <select
                        value={typography.bodyWeight || 300}
                        onChange={(e) => handleTypographyChange('bodyWeight', parseInt(e.target.value) || 300)}
                        className="w-16 text-[10px] px-1 py-1 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 outline-none"
                        aria-label="본문 굵기"
                      >
                        {fontWeightOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          min="6"
                          max="24"
                          value={typography.bodySize}
                          onChange={(e) => handleTypographyChange('bodySize', parseInt(e.target.value) || 10)}
                          className="w-10 text-[10px] px-1 py-1 bg-white border border-zinc-300 rounded text-zinc-700 focus:border-blue-500 outline-none"
                          aria-label="본문 크기"
                        />
                        <span className="text-[9px] text-zinc-400">pt</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:block w-px h-5 bg-zinc-200" />

            {/* 레이아웃 편집 툴바 */}
            <div className="hidden md:block">
              <EditModeToolbar
                currentCategory={currentCategory}
                onSave={handleLayoutSave}
              />
            </div>

            {/* 스페이서 */}
            <div className="flex-1" />

            {/* 줌 컨트롤 */}
            <div className="hidden sm:flex items-center bg-zinc-100 rounded-md p-0.5">
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

            {/* 다운로드 버튼 */}
            <button
              onClick={handleDownload}
              disabled={!selectedPlan}
              className="flex items-center gap-1 sm:gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-60"
              aria-label="JPG 다운로드"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">JPG</span>
            </button>
          </div>

          {/* Preview Canvas */}
          <div className={`flex-1 min-h-0 overflow-auto flex items-start justify-center p-2 sm:p-6 custom-scrollbar ${isEditMode ? 'bg-amber-50/50' : ''}`}>
            {selectedPlan ? (
              <div 
                style={{ 
                  transform: `scale(${scale})`, 
                  transformOrigin: 'top center',
                }}
                className="shadow-2xl"
              >
                {/* 편집 모드 배너 */}
                {isEditMode && (
                  <div className="mb-3 flex items-center justify-center gap-3 text-[11px] text-amber-800 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border border-amber-300 rounded-lg px-4 py-2 shadow-sm" data-no-export="true">
                    <div className="flex items-center gap-1.5">
                      <Layout className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold">레이아웃 편집 모드</span>
                    </div>
                    <span className="text-amber-400">│</span>
                    <span className="text-amber-700">요소를 드래그하여 이동하거나 모서리를 끌어 크기 조절</span>
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
                  <ErrorBoundary title="템플릿 렌더링 오류" compact>
                    {renderTemplate()}
                  </ErrorBoundary>
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