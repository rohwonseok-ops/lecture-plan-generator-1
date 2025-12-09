'use client';

import React from 'react';
import { Edit3, Save, X, Copy } from 'lucide-react';
import { useTemplateEditStore } from '@/store/templateEditStore';
import { TemplateCategory, TemplateLayoutConfig } from '@/lib/types';

interface EditModeToolbarProps {
  currentCategory: TemplateCategory;
  onSave: (config: TemplateLayoutConfig, applyToCategory: boolean) => void;
}

const EditModeToolbar: React.FC<EditModeToolbarProps> = ({
  currentCategory,
  onSave,
}) => {
  const {
    isEditMode,
    setEditMode,
    applyToCategory,
    setApplyToCategory,
    getPendingChanges,
    clearPendingChanges,
  } = useTemplateEditStore();

  const handleSave = () => {
    const changes = getPendingChanges();
    onSave(changes, applyToCategory);
    clearPendingChanges();
    setEditMode(false);
  };

  const handleCancel = () => {
    clearPendingChanges();
    setEditMode(false);
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      handleCancel();
    } else {
      setEditMode(true);
    }
  };

  const categoryLabels: Record<TemplateCategory, string> = {
    style1: '스타일 1',
    style2: '스타일 2',
    style3: '스타일 3',
  };

  return (
    <div 
      className="flex items-center gap-2 p-2 bg-white border border-zinc-200 rounded-lg shadow-sm"
      data-no-export="true"
    >
      {!isEditMode ? (
        <button
          onClick={handleToggleEditMode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          레이아웃 편집
        </button>
      ) : (
        <>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[10px]">
            <Edit3 className="w-3 h-3" />
            편집 모드
          </div>
          
          <div className="h-4 w-px bg-zinc-200" />
          
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToCategory}
              onChange={(e) => setApplyToCategory(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <Copy className="w-3 h-3" />
            {categoryLabels[currentCategory]} 전체 적용
          </label>
          
          <div className="h-4 w-px bg-zinc-200" />
          
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          >
            <Save className="w-3 h-3" />
            저장
          </button>
          
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 rounded hover:bg-zinc-200 transition-colors"
          >
            <X className="w-3 h-3" />
            취소
          </button>
        </>
      )}
    </div>
  );
};

export default EditModeToolbar;

