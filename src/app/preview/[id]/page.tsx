'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useClassPlanStore } from '@/store/classPlanStore';
import { TemplateId, parseTemplateId } from '@/lib/types';
import { colorThemeNames, templateCategoryNames } from '@/lib/colorThemes';
import TemplateStyle1 from '@/components/templates/TemplateStyle1';
import TemplateStyle2 from '@/components/templates/TemplateStyle2';
import TemplateStyle3 from '@/components/templates/TemplateStyle3';
import { downloadAsJpg } from '@/lib/download';
import { ArrowLeft, Download } from 'lucide-react';

export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { classPlans, loadFromRemote } = useClassPlanStore();
  const classPlan = classPlans.find(p => p.id === id);
  
  const [templateId, setTemplateId] = useState<TemplateId>('style1-green');
  const [scale, setScale] = useState(0.6);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (classPlan?.templateId) {
      setTemplateId(classPlan.templateId);
    }
  }, [classPlan]);

  useEffect(() => {
    if (!classPlan) {
      loadFromRemote();
    }
  }, [classPlan, loadFromRemote]);

  if (!classPlan) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl font-bold text-zinc-600 mb-4">강의 계획을 찾을 수 없습니다</p>
          <button 
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const templateOptions: TemplateId[] = [
    'style1-blue',
    'style1-purple',
    'style1-teal',
    'style2-blue',
    'style2-purple',
    'style3-blue',
    'style3-orange',
    // 레거시 호환 옵션
    'classic',
    'report',
    'modern',
  ];

  const getTemplateNameKorean = (tid: TemplateId) => {
    const legacyNames: Partial<Record<TemplateId, string>> = {
      classic: '기본형',
      blue: '네이비',
      report: '리포트',
      modern: '모던',
      purple: '프로젝트',
      mentoring: '활동형',
      academic: '학술형',
      dark: '다크',
    };
    if (legacyNames[tid]) return legacyNames[tid] as string;

    const { category, color } = parseTemplateId(tid);
    const categoryName = templateCategoryNames[category] || category;
    const colorName = colorThemeNames[color] || color;
    return `${categoryName} · ${colorName}`;
  };

  const handleDownload = () => {
    const year = new Date().getFullYear().toString().slice(-2); // 26
    const templateName = getTemplateNameKorean(templateId);
    const fileName = `${year}년_겨울특강_${classPlan.title || '강좌명'}_${classPlan.teacherName || '강사명'}_${templateName}`;
    downloadAsJpg(canvasRef, fileName.replace(/\s+/g, '_'));
  };

  const { category, color } = parseTemplateId(templateId);
  const TemplateComponent =
    {
      style1: TemplateStyle1,
      style2: TemplateStyle2,
      style3: TemplateStyle3,
    }[category] || TemplateStyle1;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-gray-800">Preview & Export</h2>
          <div className="h-6 w-px bg-gray-300 mx-2" />
          <span className="text-sm text-gray-500">{classPlan.title}</span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Template</span>
            <div className="flex bg-gray-100 rounded-lg p-1 flex-wrap gap-1">
              {templateOptions.map(t => (
                <button
                  key={t}
                  onClick={() => setTemplateId(t)}
                  className={`px-2.5 py-1 text-xs rounded-md capitalize transition-all ${
                    templateId === t ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {getTemplateNameKorean(t)}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleDownload}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>Download JPG</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-200/50 flex items-center justify-center p-8 relative">
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur rounded-full px-4 py-2 text-xs font-medium text-gray-500 shadow-sm border border-gray-200">
          Preview Mode ({Math.round(scale * 100)}%)
        </div>

        {/* Transform Wrapper for Scale */}
        <div 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'center top',
            transition: 'transform 0.2s ease'
          }}
        >
          <div 
            ref={canvasRef} 
            className="shadow-2xl"
          >
            <TemplateComponent classPlan={classPlan} colorTheme={color} />
          </div>
        </div>
      </div>
      
      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-200 p-1 flex space-x-1">
        <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">-</button>
        <span className="w-12 text-center flex items-center justify-center text-xs font-medium text-gray-500">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(1.5, s + 0.1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">+</button>
      </div>
    </div>
  );
}

