'use client';

import React, { useMemo } from 'react';
import { ClassPlan, ColorTheme } from '@/lib/types';
import { ColorPalette, colorThemes } from '@/lib/colorThemes';
import { calculateTeacherScheduleRatio } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HeaderSection,
  TeacherScheduleSection,
  CourseInfoSection,
  GoalsManagementSection,
  WeeklyPlanTemplateSection,
  CalendarSection,
  FeeTableSection,
  createStyleHelpers,
  textColors,
} from './sections';

interface Props {
  classPlan: ClassPlan;
  colorTheme: ColorTheme;
}

/**
 * TemplateStyle1 - 카드 기반 깔끔한 레이아웃
 *
 * 특징:
 * - 풀 컬러 헤더
 * - 강좌 정보 바
 * - 카드 기반 섹션들
 * - 2열 레이아웃 (주차별 계획 + 달력)
 * - 풀 컬러 푸터
 */
const TemplateStyle1: React.FC<Props> = ({ classPlan, colorTheme }) => {
  // 안전한 색상 테마 가져오기
  const colors: ColorPalette = colorThemes[colorTheme] || colorThemes.blue;

  // 스타일 헬퍼 생성
  const styleHelpers = useMemo(
    () => createStyleHelpers(classPlan, colorTheme, colors),
    [classPlan, colorTheme, colors]
  );

  const {
    typography,
    titleFontClass,
    bodyFontClass,
    titleWeight,
    bodyWeight,
    isDancheong,
    useGradientHeaders,
    getLayoutStyle,
    getHeaderStyle,
    getHeaderTextClass,
    getSize,
  } = styleHelpers;

  // 공통 섹션 Props
  const baseSectionProps = {
    classPlan,
    colors,
    typography,
    titleFontClass,
    bodyFontClass,
    titleWeight,
    bodyWeight,
    helpers: {
      getLayoutStyle,
      getHeaderStyle,
      getHeaderTextClass,
      getSize,
    },
  };

  // 헤더 스타일
  const headerBackground = `linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 45%), ${colors.gradient || colors.primary}`;
  const headerShadow = '0 14px 34px rgba(15,23,42,0.18)';

  // 배경색
  const pageBackground = 'linear-gradient(135deg, #f8fafc 0%, #ffffff 55%, #f1f5f9 100%)';

  // 수업일정 텍스트 길이에 따른 그리드 비율 계산 (메모이제이션)
  const gridRatio = useMemo(
    () => calculateTeacherScheduleRatio(classPlan.classDay, classPlan.classTime),
    [classPlan.classDay, classPlan.classTime]
  );

  return (
    <div
      className="w-full min-h-full p-5 relative"
      style={{ background: pageBackground }}
    >
      <div
        className={`flex-1 rounded-3xl border border-white/70 bg-white/92 backdrop-blur flex flex-col text-slate-900 shadow-[0_22px_55px_rgba(15,23,42,0.10)] ${bodyFontClass}`}
        style={{ fontSize: `${typography.bodySize}pt`, fontWeight: bodyWeight }}
      >
        {/* Header */}
        <HeaderSection
          {...baseSectionProps}
          headerBackground={headerBackground}
          headerShadow={headerShadow}
        />

        {/* 수강대상 - 홍보문구 왼쪽 (맨위) */}
        {classPlan.showTargetStudent && classPlan.targetStudent && classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'top' && (
          <div className="px-8 mt-4 flex gap-3">
            <div className="w-1/4">
              <Card
                className="overflow-hidden shadow-sm"
                style={{ borderColor: colors.border }}
              >
                <CardHeader className={`p-2.5 pb-1.5 ${getHeaderTextClass()}`} style={getHeaderStyle(0)}>
                  <CardTitle className={`text-xs flex items-center gap-1.5 ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight }}>
                    <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    수강대상
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 relative">
                  <p className={`leading-5 ${bodyFontClass}`} style={{ fontSize: `${getSize('targetStudent')}pt`, fontWeight: bodyWeight, color: textColors.primary }}>
                    {classPlan.targetStudent}
                    {classPlan.targetStudentDetail && (
                      <span className="text-zinc-500 ml-1" style={{ fontSize: '0.833em' }}>({classPlan.targetStudentDetail})</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="flex-1">
              <div
                className="p-3 rounded-lg border relative"
                style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}
              >
                <p
                  className={`leading-5 whitespace-pre-wrap ${bodyFontClass}`}
                  style={{ fontSize: `${getSize('etc')}pt`, fontWeight: bodyWeight, color: textColors.primary, lineHeight: 1.6 }}
                >
                  {classPlan.etc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 홍보문구 - 맨위 (학부모 안내글 위, 수강대상이 없을 때) */}
        {classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'top' && (!classPlan.showTargetStudent || !classPlan.targetStudent) && (
          <div className="px-8 py-4 rounded-lg mx-8 mt-4">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className={`leading-5 text-zinc-700 whitespace-pre-wrap ${bodyFontClass}`} style={{ fontSize: `${getSize('etc')}pt` }}>
                {classPlan.etc}
              </p>
            </div>
          </div>
        )}

        {/* 학부모 안내글 - 헤더 바로 아래 */}
        {classPlan.parentIntro && (
          <div
            data-section-id="parent-intro"
            className="px-6 py-3 rounded-lg mx-8 mt-4"
            style={{
              backgroundColor: colors.light,
              border: `1px solid ${colors.border}`,
              fontSize: `${typography.bodySize}pt`,
              marginTop: 'calc(1rem + 5pt)',
              ...getLayoutStyle('parentIntro'),
            }}
          >
            <div className="relative">
              <p
                className={`leading-5 whitespace-pre-wrap ${bodyFontClass}`}
                style={{ fontSize: `${getSize('parentIntro')}pt`, fontWeight: bodyWeight, color: textColors.primary, lineHeight: 1.5 }}
              >
                {classPlan.parentIntro}
              </p>
            </div>
          </div>
        )}

        <div className="px-8 py-4 flex-1 flex flex-col gap-3" style={{ fontSize: `${typography.bodySize}pt` }}>
          {/* 두 번째 줄: 좌측(담임강사+수업일정) 50%, 우측(학습과정/교재) 50% */}
          <div className="grid gap-3 items-stretch" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <TeacherScheduleSection {...baseSectionProps} gridRatio={gridRatio} />
            <CourseInfoSection {...baseSectionProps} />
          </div>

          {/* 세 번째 줄: 학습목표 50%, 학습관리 50% */}
          <GoalsManagementSection {...baseSectionProps} />

          {/* 홍보문구 - 맨아래 (수강료 위) */}
          {classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'bottom' && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 relative">
              <p
                className={`leading-5 whitespace-pre-wrap ${bodyFontClass}`}
                style={{ fontSize: `${getSize('etc')}pt`, fontWeight: bodyWeight, color: textColors.primary, lineHeight: 1.6 }}
              >
                {classPlan.etc}
              </p>
            </div>
          )}

          {/* 주차별 학습계획 */}
          <WeeklyPlanTemplateSection
            {...baseSectionProps}
            isDancheong={isDancheong}
            useGradientHeaders={useGradientHeaders}
          />

          {/* 월간계획 */}
          <CalendarSection {...baseSectionProps} colorTheme={colorTheme} />

          {/* 수강료 안내 */}
          <FeeTableSection {...baseSectionProps} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(TemplateStyle1);
