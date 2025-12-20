'use client';

import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { X, Download } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { toBlob } from 'html-to-image';
import { ClassPlan, TemplateCategory, ColorTheme } from '@/lib/types';
import { A4_WIDTH_PX, A4_HEIGHT_PX, calculateA4Scale } from '@/lib/a4Utils';
import TemplateStyle1 from '@/components/templates/TemplateStyle1';
import TemplateStyle2 from '@/components/templates/TemplateStyle2';
import TemplateStyle3 from '@/components/templates/TemplateStyle3';
import { templateCategoryNames, colorThemeNames } from '@/lib/colorThemes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classPlans: ClassPlan[];
}

type TeacherTemplateConfig = {
  category: TemplateCategory;
  color: ColorTheme;
};

const templateCategories: TemplateCategory[] = ['style1', 'style2', 'style3'];
const colorThemeList: ColorTheme[] = ['green', 'blue', 'purple', 'orange', 'teal', 'dancheong'];

const BulkDownloadModal: React.FC<Props> = ({ isOpen, onClose, classPlans }) => {
  // 모든 강사 목록 추출
  const allTeachers = useMemo(() => {
    const teachers = Array.from(new Set(classPlans.map(p => p.teacherName).filter(Boolean)));
    return teachers.sort();
  }, [classPlans]);

  // 선택된 강사 목록
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());

  // 각 강사별 템플릿 설정
  const [teacherTemplates, setTeacherTemplates] = useState<Record<string, TeacherTemplateConfig>>({});

  // 다운로드 진행 상태
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    currentPlan: string | null;
  }>({ current: 0, total: 0, currentPlan: null });

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedTeachers.size === allTeachers.length) {
      setSelectedTeachers(new Set());
    } else {
      setSelectedTeachers(new Set(allTeachers));
    }
  };

  // 강사 선택 토글
  const handleToggleTeacher = (teacher: string) => {
    const newSelected = new Set(selectedTeachers);
    if (newSelected.has(teacher)) {
      newSelected.delete(teacher);
    } else {
      newSelected.add(teacher);
      // 기본 템플릿 설정 (style1-green)
      if (!teacherTemplates[teacher]) {
        setTeacherTemplates(prev => ({
          ...prev,
          [teacher]: { category: 'style1', color: 'green' }
        }));
      }
    }
    setSelectedTeachers(newSelected);
  };

  // 템플릿 카테고리 변경
  const handleCategoryChange = (teacher: string, category: TemplateCategory) => {
    setTeacherTemplates(prev => ({
      ...prev,
      [teacher]: { ...prev[teacher], category }
    }));
  };

  // 테마색 변경
  const handleColorChange = (teacher: string, color: ColorTheme) => {
    setTeacherTemplates(prev => ({
      ...prev,
      [teacher]: { ...prev[teacher], color }
    }));
  };

  // 일괄 다운로드 실행 (ZIP 압축)
  const handleBulkDownload = async () => {
    if (selectedTeachers.size === 0) {
      toast.warning('다운로드할 강사를 선택해주세요.');
      return;
    }

    // 선택된 강사들의 강좌 수집
    const plansToDownload: Array<{ plan: ClassPlan; templateConfig: TeacherTemplateConfig }> = [];
    
    selectedTeachers.forEach(teacher => {
      const config = teacherTemplates[teacher] || { category: 'style1', color: 'green' };
      const teacherPlans = classPlans.filter(p => p.teacherName === teacher);
      teacherPlans.forEach(plan => {
        plansToDownload.push({ plan, templateConfig: config });
      });
    });

    if (plansToDownload.length === 0) {
      toast.warning('다운로드할 강좌가 없습니다.');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: plansToDownload.length, currentPlan: null });

    const zip = new JSZip();
    const year = new Date().getFullYear().toString().slice(-2);

    try {
      // 모든 이미지를 생성하여 ZIP에 추가
      for (let i = 0; i < plansToDownload.length; i++) {
        const { plan, templateConfig } = plansToDownload[i];
        setDownloadProgress({ 
          current: i + 1, 
          total: plansToDownload.length, 
          currentPlan: `${plan.title || '강좌명'} (${plan.teacherName})` 
        });

        try {
          const blob = await getPngBlobFromPlan(plan, templateConfig);
          if (blob) {
            const templateName = `${templateCategoryNames[templateConfig.category]} ${colorThemeNames[templateConfig.color]}`;
            const fileName = `${year}년_겨울특강_${plan.title || '강좌명'}_${plan.teacherName || '강사명'}_${templateName}`.replace(/\s+/g, '_');
            zip.file(`${fileName}.jpg`, blob);
          }
        } catch (error) {
          console.error(`이미지 생성 실패: ${plan.title}`, error);
        }
      }

      // ZIP 파일 생성 및 다운로드
      setDownloadProgress({ 
        current: plansToDownload.length, 
        total: plansToDownload.length, 
        currentPlan: 'ZIP 파일 생성 중...' 
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.download = `${year}년_겨울특강_일괄다운로드.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0, currentPlan: null });
      toast.success('다운로드 완료', { description: `${plansToDownload.length}개 파일이 ZIP으로 압축되었습니다.` });
    } catch (error) {
      console.error('ZIP 다운로드 실패:', error);
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0, currentPlan: null });
      toast.error('다운로드 실패', { description: (error as Error).message });
    }
  };

  // 개별 강좌 JPG를 Blob으로 반환 (템플릿 적용)
  // Phase 4: html2canvas → html-to-image 전환, 오프스크린 렌더링 개선
  const getPngBlobFromPlan = async (
    plan: ClassPlan,
    templateConfig: TeacherTemplateConfig
  ): Promise<Blob | null> => {
    // 임시 컨테이너 생성
    // html-to-image는 화면 내 요소가 필요하므로 opacity: 0으로 숨김 (렌더링은 유지)
    const container = document.createElement('div');
    container.id = 'bulk-download-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = `${A4_WIDTH_PX}px`;
    container.style.minHeight = `${A4_HEIGHT_PX}px`;
    container.style.backgroundColor = '#ffffff';
    container.style.zIndex = '-9999';
    container.style.opacity = '0';           // 보이지 않지만 렌더링됨
    container.style.pointerEvents = 'none';  // 클릭 불가
    container.style.overflow = 'visible';
    document.body.appendChild(container);

    let root: ReturnType<typeof createRoot> | null = null;

    try {
      const props = { classPlan: plan, colorTheme: templateConfig.color };
      let TemplateComponent: React.ComponentType<{ classPlan: ClassPlan; colorTheme: ColorTheme }>;

      switch (templateConfig.category) {
        case 'style1':
          TemplateComponent = TemplateStyle1;
          break;
        case 'style2':
          TemplateComponent = TemplateStyle2;
          break;
        case 'style3':
          TemplateComponent = TemplateStyle3;
          break;
        default:
          TemplateComponent = TemplateStyle1;
      }

      // React 컴포넌트 렌더링
      root = createRoot(container);
      root.render(React.createElement(TemplateComponent, props));

      // 렌더링 대기 (React가 DOM에 반영되도록)
      await new Promise(resolve => setTimeout(resolve, 100));

      // 폰트 로딩 대기 (고정 시간 대신 Promise 사용)
      try {
        if (document.fonts && document.fonts.ready) {
          await Promise.race([
            document.fonts.ready,
            new Promise(resolve => setTimeout(resolve, 2000)) // 최대 2초 대기
          ]);
        }
      } catch {
        // 폰트 대기 실패 시 계속 진행
      }

      // 추가 렌더링 대기 (이미지, 스타일 적용 등)
      await new Promise(resolve => setTimeout(resolve, 100));

      // A4 비율 계산 (a4Utils 활용)
      const contentWidth = container.scrollWidth;
      const contentHeight = container.scrollHeight;
      const { width: targetWidth, height: targetHeight } = calculateA4Scale(contentWidth, contentHeight);

      // html-to-image 사용 (opacity: 0이어도 렌더링된 요소 캡처 가능)
      const blob = await toBlob(container, {
        quality: 0.92,
        pixelRatio: 2,                  // 2배 해상도
        backgroundColor: '#ffffff',
        width: targetWidth,
        height: targetHeight,
        style: {
          opacity: '1',                 // 캡처 시에만 opacity 복원
        },
        filter: (node) => {
          // data-no-export 속성을 가진 요소 제외
          if (node instanceof HTMLElement && node.getAttribute('data-no-export') === 'true') {
            return false;
          }
          return true;
        },
      });

      // 정리
      root.unmount();
      root = null;

      return blob;
    } catch (error) {
      console.error('JPG 생성 중 오류:', error);
      return null;
    } finally {
      if (root) {
        try {
          root.unmount();
        } catch {
          // unmount 실패 무시
        }
      }
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    }
  };

  // 다운로드 중이 아니고 모달이 닫혀있으면 상태바도 숨김
  if (!isOpen && !isDownloading) return null;

  // 다운로드 중에는 화면 하단에 상태바만 표시
  if (!isOpen && isDownloading) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-2xl border border-zinc-200 p-4 w-80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900">일괄 다운로드 중...</span>
          <span className="text-xs font-semibold text-blue-700">
            {downloadProgress.current} / {downloadProgress.total}
          </span>
        </div>
        {downloadProgress.currentPlan && (
          <div className="text-xs text-zinc-600 truncate mb-2">
            {downloadProgress.currentPlan}
          </div>
        )}
        <div className="w-full bg-blue-100 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={isDownloading ? undefined : onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] p-6 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-zinc-800 mb-6">일괄 다운로드</h2>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* 강사 선택 영역 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-zinc-800">강사 선택</h3>
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedTeachers.size === allTeachers.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="border border-zinc-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              {allTeachers.length === 0 ? (
                <div className="text-sm text-zinc-500 text-center py-4">등록된 강사가 없습니다</div>
              ) : (
                <div className="space-y-2">
                  {allTeachers.map(teacher => (
                    <label
                      key={teacher}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-zinc-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeachers.has(teacher)}
                        onChange={() => handleToggleTeacher(teacher)}
                        className="w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-zinc-800 flex-1">{teacher}</span>
                      <span className="text-xs text-zinc-500">
                        ({classPlans.filter(p => p.teacherName === teacher).length}개 강좌)
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 템플릿 설정 영역 */}
          {selectedTeachers.size > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-800 mb-3">템플릿 설정</h3>
              <div className="space-y-4">
                {Array.from(selectedTeachers).map(teacher => {
                  const config = teacherTemplates[teacher] || { category: 'style1', color: 'green' };
                  return (
                    <div key={teacher} className="border border-zinc-200 rounded-lg p-4">
                      <div className="font-medium text-zinc-800 mb-3">{teacher}</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 mb-1.5">스타일</label>
                          <select
                            value={config.category}
                            onChange={(e) => handleCategoryChange(teacher, e.target.value as TemplateCategory)}
                            className="w-full px-3 py-1.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {templateCategories.map(cat => (
                              <option key={cat} value={cat}>{templateCategoryNames[cat]}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 mb-1.5">테마색</label>
                          <select
                            value={config.color}
                            onChange={(e) => handleColorChange(teacher, e.target.value as ColorTheme)}
                            className="w-full px-3 py-1.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {colorThemeList.map(color => (
                              <option key={color} value={color}>{colorThemeNames[color]}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 진행 상태 */}
          {isDownloading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">다운로드 중...</span>
                <span className="text-xs text-blue-700">
                  {downloadProgress.current} / {downloadProgress.total}
                </span>
              </div>
              {downloadProgress.currentPlan && (
                <div className="text-xs text-blue-700 mt-1">
                  현재: {downloadProgress.currentPlan}
                </div>
              )}
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-200">
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleBulkDownload}
            disabled={isDownloading || selectedTeachers.size === 0}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? '다운로드 중...' : '일괄 다운로드'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDownloadModal;

