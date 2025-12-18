'use client';

/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { ClassPlan, ColorTheme, FeeRow, FieldFontSizes, TemplateLayoutConfig } from '@/lib/types';
import { sectionIdToConfigKey, isValidPosition, isValidSize } from '@/store/templateEditStore';
import { ColorPalette, colorThemes } from '@/lib/colorThemes';
import { getFontClassName, getDefaultTypography, getFieldFontSize, buildScheduleRows } from '@/lib/utils';
import MonthlyCalendar from './MonthlyCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  const feeInfo = classPlan.feeInfo;
  const layoutConfig = classPlan.layoutConfig;
  
  // 레이아웃 스타일 헬퍼 함수 (중앙화된 값 검증 사용)
  // sectionId: camelCase 형식 (예: 'scheduleInfo') 또는 하이픈 형식 (예: 'schedule-info')
  const getLayoutStyle = (sectionId: string): React.CSSProperties => {
    if (!layoutConfig) return {};
    
    // 하이픈 형식이면 sectionIdToConfigKey로 변환, 아니면 직접 사용
    const configKey = (sectionIdToConfigKey[sectionId] || sectionId) as keyof TemplateLayoutConfig;
    
    const layout = layoutConfig[configKey];
    if (!layout || typeof layout === 'boolean') return {};
    
    const style: React.CSSProperties = {};
    
    // 중앙화된 값 검증 함수 사용
    const x = isValidPosition(layout.x) ? layout.x : 0;
    const y = isValidPosition(layout.y) ? layout.y : 0;
    
    if (x !== 0 || y !== 0) {
      style.transform = `translate(${x}px, ${y}px)`;
    }
    if (isValidSize(layout.width) && layout.width !== 0) {
      style.width = `calc(100% + ${layout.width}px)`;
    }
    if (isValidSize(layout.height) && layout.height !== 0) {
      style.height = `calc(100% + ${layout.height}px)`;
    }
    return style;
  };
  
  const groupedByMonth: Record<string, FeeRow[]> = {};
  if (feeInfo?.rows) {
    feeInfo.rows.forEach(row => {
      if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
      groupedByMonth[row.month].push(row);
    });
  }

  // 타이포그래피 설정
  const typography = classPlan.typography || getDefaultTypography();
  const titleFontClass = getFontClassName(typography.titleFont);
  const bodyFontClass = getFontClassName(typography.bodyFont);
  
  const titleWeight = typography.titleWeight || 400;
  const bodyWeight = typography.bodyWeight || 400;
  const fieldFontSizes = typography.fieldFontSizes;

  // 필드별 폰트 크기 가져오기 헬퍼
  const getSize = (field: keyof FieldFontSizes): number => {
    return getFieldFontSize(fieldFontSizes, field, typography.bodySize);
  };
  const headerBackground = `linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 45%), ${colors.gradient || colors.primary}`;
  const headerShadow = '0 14px 34px rgba(15,23,42,0.18)';

  // 신규 테마 감지
  const isDancheong = colorTheme === 'dancheong';

  // 배경색 (기본은 라이트 톤)
  const pageBackground = 'linear-gradient(135deg, #f8fafc 0%, #ffffff 55%, #f1f5f9 100%)';

  // 퍼플/오렌지/틸/에메랄드/블루에서 카드 헤더를 테마 그라데이션으로 강조
  const useGradientHeaders =
    colorTheme === 'purple' ||
    colorTheme === 'orange' ||
    colorTheme === 'teal' ||
    colorTheme === 'green' ||
    colorTheme === 'blue';
  const isSoftGradientTheme =
    colorTheme === 'purple' ||
    colorTheme === 'orange' ||
    colorTheme === 'teal';
  const useSubduedHeaders = false;
  // 조금 더 진한 배경색 (현재는 사용 안 함)
  const mediumLightBg = useSubduedHeaders ? `${colors.border}66` : colors.primary;
  const cardHeaderStyle = useSubduedHeaders
    ? {
        backgroundColor: mediumLightBg,
        borderBottom: `1px solid ${colors.border}`,
      }
    : { backgroundColor: colors.primary };
  const cardHeaderTextClass = useSubduedHeaders ? 'text-slate-900' : 'text-white';
  const gradientHeaderStyle = useGradientHeaders
    ? {
        // 소프트 테마에서는 그라데이션 질감과 더 진한 색감 적용
        background: isSoftGradientTheme
          ? `linear-gradient(135deg, ${colors.primary}b3 0%, ${colors.dark || colors.primary}e6 100%)`
          : headerBackground,
        color: isSoftGradientTheme ? '#FFFFFF' : undefined,
        borderBottom: isSoftGradientTheme ? `1px solid ${colors.primary}f2` : '1px solid rgba(255,255,255,0.25)',
        boxShadow: isSoftGradientTheme ? 'inset 0 -1px 0 rgba(0,0,0,0.25)' : undefined,
      }
    : undefined;

  // 단청 멀티: 카드 헤더 컬러를 팔레트 순환 적용 (핑크 단일색 방지)
  const dancheongHeaderGradients = [
    'linear-gradient(135deg, #FF4FD2 0%, #D63BAA 100%)',
    'linear-gradient(135deg, #11C3FF 0%, #0E9CD4 100%)',
    'linear-gradient(135deg, #FF9A3D 0%, #E67F1F 100%)',
    'linear-gradient(135deg, #6BE87D 0%, #3FB35B 100%)',
    'linear-gradient(135deg, #FFC857 0%, #E6A93C 100%)',
    'linear-gradient(135deg, #7C5CFF 0%, #5B3FD6 100%)',
  ];
  const getHeaderStyle = (index: number) => {
    if (isDancheong) {
      const bg = dancheongHeaderGradients[index % dancheongHeaderGradients.length];
      return {
        background: bg,
        borderBottom: '1px solid rgba(255,255,255,0.18)',
      };
    }
    if (useGradientHeaders && gradientHeaderStyle) {
      return gradientHeaderStyle;
    }
    return cardHeaderStyle;
  };
  const getHeaderTextClass = () => {
    if (isDancheong) return 'text-white';
    // 소프트 테마(퍼플/오렌지/틸)는 텍스트를 테마의 진한 색으로
    if (isSoftGradientTheme) return ''; // 클래스 생략 시 빈 문자열 반환
    if (useGradientHeaders) return 'text-white';
    return cardHeaderTextClass;
  };

  // 테마별 주차 배지 스타일 (연한 톤)
  const weekBadgeStyle = useGradientHeaders || isDancheong
    ? {
        backgroundColor: colors.light,
        border: `1px solid ${colors.border}`,
        color: colors.dark,
      }
    : {
        backgroundColor: colors.primary,
        color: '#FFFFFF',
      };

  const weeklyPlan = classPlan.weeklyPlan || [];
  const scheduleRows = buildScheduleRows(classPlan.classDay, classPlan.classTime);
  const midPoint = Math.ceil(weeklyPlan.length / 2);
  const leftWeeks = weeklyPlan.slice(0, midPoint);
  const rightWeeks = weeklyPlan.slice(midPoint);

  // 학습과정/교재 행 데이터
  const courseRows = [
    {
      label: '과정 1',
      course: classPlan.course1 || '-',
      material: classPlan.material1 || '-',
      courseSize: getSize('course1'),
      materialSize: getSize('material1'),
      labelSize: getSize('course1'),
    },
    {
      label: '과정 2',
      course: classPlan.course2 || '-',
      material: classPlan.material2 || '-',
      courseSize: getSize('course2'),
      materialSize: getSize('material2'),
      labelSize: getSize('course2'),
    },
  ];

  const primaryText = '#3f3f46';
  const strongText = '#27272a';

  // 두 번째 줄 카드 공통 스타일(담임강사/수업일정/학습과정)
  const infoCardStyle: React.CSSProperties = {
    borderColor: colors.border,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,246,248,0.92))',
    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
  };

  const getInfoHeaderStyle = (index: number) => ({
    ...getHeaderStyle(index),
    padding: '0.7rem 0.95rem',
    minHeight: '2.35rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  });

  const infoBodyPadding = '0.95rem 1.1rem';

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
        <div
          data-section-id="header"
          className="px-10 text-white rounded-t-3xl"
          style={{
            background: headerBackground,
            paddingTop: '2rem',
            paddingBottom: '2rem',
            boxShadow: headerShadow,
            ...getLayoutStyle('header'),
          }}
        >
          <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF', fontWeight: titleWeight }}
              >
                2026 WINTER
              </span>
            </div>
            <h1 className={`text-3xl tracking-tight ${titleFontClass}`} style={{ fontSize: `${(typography.titleSize + 4) * 1.2}pt`, fontWeight: titleWeight }}>
              {classPlan.showTitle && classPlan.title && (
                <span className="mr-2" style={{ fontSize: `${getSize('title')}pt` }}>[{classPlan.title}]</span>
              )}
              윈터 프로그램 안내문
            </h1>
          </div>
          <div className="text-right flex-shrink-0 ml-6">
            <img 
              src="/images/2-1.png" 
              alt="원리와 해석 수학학원" 
              className="object-contain"
              style={{ height: '4.5rem' }}
            />
          </div>
          </div>
        </div>

      {/* 수강대상 - 홍보문구 왼쪽 (맨위) */}
      {classPlan.showTargetStudent && classPlan.targetStudent && classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'top' && (
        <div className="px-8 mt-4 flex gap-3">
          <div className="w-1/4">
            <Card
              className="overflow-hidden shadow-sm"
              style={{
                borderColor: colors.border,
                background: undefined,
              }}
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
              <p className={`leading-5 ${bodyFontClass}`} style={{ fontSize: `${getSize('targetStudent')}pt`, fontWeight: bodyWeight, color: primaryText }}>
                {classPlan.targetStudent}
                {classPlan.targetStudentDetail && (
                  <span className="text-zinc-500 ml-1" style={{ fontSize: '0.833em', fontWeight: bodyWeight, color: undefined }}>({classPlan.targetStudentDetail})</span>
                )}
              </p>
            </CardContent>
            </Card>
          </div>
          <div className="flex-1">
            <div
              className="p-3 rounded-lg border relative"
              style={{
                backgroundColor: '#FFFBEB',
                borderColor: '#FCD34D',
              }}
            >
            <p
              className={`leading-5 whitespace-pre-wrap ${bodyFontClass}`}
              style={{ fontSize: `${getSize('etc')}pt`, fontWeight: bodyWeight, color: primaryText, lineHeight: 1.6 }}
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
            <p className={`leading-5 text-zinc-700 whitespace-pre-wrap ${bodyFontClass}`} style={{ fontSize: `${getSize('etc')}pt` }}>{classPlan.etc}</p>
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
              style={{ fontSize: `${getSize('parentIntro')}pt`, fontWeight: bodyWeight, color: primaryText, lineHeight: 1.5 }}
            >
              {classPlan.parentIntro}
            </p>
          </div>
        </div>
      )}

      <div className="px-8 py-4 flex-1 flex flex-col gap-3" style={{ fontSize: `${typography.bodySize}pt` }}>
        {/* 두 번째 줄: 좌측(담임강사+수업일정) 50%, 우측(학습과정/교재) 50% */}
        <div className="grid gap-3 items-stretch" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="grid gap-3 h-full" style={{ gridTemplateColumns: '0.8fr 1.2fr' }}>
            {/* 담임강사 카드 */}
            <Card
              data-section-id="teacher-info"
              className="overflow-hidden h-full flex flex-col"
              style={{
                ...infoCardStyle,
                ...getLayoutStyle('teacherInfo'),
              }}
            >
              <CardHeader className={`${getHeaderTextClass()} border-b border-white/20`} style={getInfoHeaderStyle(1)}>
                <CardTitle
                className={`flex w-full items-center justify-start gap-1.5 leading-none text-left ${titleFontClass}`}
                style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight + 100, textAlign: 'left' }}
                >
                  <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  담임강사
                </CardTitle>
              </CardHeader>
              <CardContent className="relative flex items-center flex-1" style={{ padding: infoBodyPadding }}>
                <p className={`leading-6 ${bodyFontClass}`} style={{ fontSize: `${getSize('teacherName')}pt`, fontWeight: bodyWeight + 100, color: primaryText, whiteSpace: 'pre-line' }}>
                  {classPlan.teacherName}
                </p>
              </CardContent>
            </Card>

            {/* 수업일정 카드 */}
            <Card
              data-section-id="schedule-info"
              className="overflow-hidden h-full flex flex-col"
              style={{
                ...infoCardStyle,
                ...getLayoutStyle('scheduleInfo'),
              }}
            >
              <CardHeader className={`${getHeaderTextClass()} border-b border-white/20`} style={getInfoHeaderStyle(2)}>
                <CardTitle
                className={`flex w-full items-center justify-start gap-1.5 leading-none text-left ${titleFontClass}`}
                style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight + 100, textAlign: 'left' }}
                >
                  <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  수업일정
                </CardTitle>
              </CardHeader>
              <CardContent className="relative flex-1 flex items-center overflow-hidden" style={{ padding: '0.6rem 0.5rem' }}>
                {scheduleRows.length === 0 ? (
                  <p className={`leading-6 ${bodyFontClass}`} style={{ fontSize: `${getSize('classDay')}pt`, fontWeight: bodyWeight + 50, color: primaryText }}>-</p>
                ) : (
                  <div className="flex flex-col gap-1.5 w-full">
                    {scheduleRows.map((row, i) => (
                      <div
                        key={i}
                        className="flex items-stretch gap-1.5"
                        style={{
                          padding: '0.25rem 0.2rem',
                          borderRadius: 10,
                          border: `1px solid ${colors.lighter}`,
                          background: i % 2 === 0 ? `${colors.light}10` : 'transparent',
                          boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.02)',
                        }}
                      >
                        {row.period && (
                          <div
                            className={`${bodyFontClass} flex items-center justify-center`}
                            style={{
                              padding: '0.3rem 0.55rem',
                              minWidth: 70,
                              background: `linear-gradient(180deg, ${colors.light} 0%, ${colors.lighter} 100%)`,
                              color: strongText,
                              fontSize: `${getSize('classDay') * 0.9}pt`,
                              fontWeight: titleWeight + 100,
                              letterSpacing: '-0.01em',
                              borderRadius: 8,
                              boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.03)',
                              border: `1px solid ${colors.lighter}`,
                            whiteSpace: 'nowrap',
                            }}
                          >
                            {row.period}
                          </div>
                        )}
                        <div
                          className={`${bodyFontClass} flex items-center justify-center`}
                          style={{
                            padding: '0.3rem 0.55rem',
                            minWidth: 52,
                            color: primaryText,
                            fontSize: `${getSize('classDay') * 0.9}pt`,
                            fontWeight: bodyWeight + 50,
                            letterSpacing: '-0.01em',
                            borderRadius: 8,
                            border: `1px solid ${colors.lighter}`,
                            background: '#ffffff',
                          whiteSpace: 'nowrap',
                          }}
                        >
                          {row.day || '-'}
                        </div>
                        <div
                          className={`${bodyFontClass} flex items-center flex-1 justify-start`}
                          style={{
                            padding: '0.3rem 0.65rem',
                            color: primaryText,
                            fontSize: `${getSize('classDay') * 0.9}pt`,
                            fontWeight: bodyWeight,
                            letterSpacing: '-0.01em',
                            borderRadius: 8,
                            border: `1px solid ${colors.lighter}`,
                            background: `${colors.light}18`,
                            minWidth: 120,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          }}
                        >
                          {row.time || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 학습과정 및 교재 카드 */}
          <Card
            data-section-id="course-info"
            className="overflow-hidden h-full flex flex-col"
            style={{
              ...infoCardStyle,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(240,243,246,0.94))',
              ...getLayoutStyle('courseInfo'),
            }}
          >
            <CardHeader
              className={`${getHeaderTextClass()} border-b border-white/20`}
              style={getInfoHeaderStyle(3)}
            >
              <CardTitle
                className={`flex w-full items-center justify-start gap-1.5 leading-none text-left ${titleFontClass}`}
                style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight + 100, textAlign: 'left' }}
              >
                <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                학습과정 및 교재
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col" style={{ fontSize: `${typography.bodySize}pt` }}>
              <div className="flex flex-col gap-1.25 p-2">
                {courseRows.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-stretch gap-1.5"
                    style={{
                      padding: '0.35rem 0.3rem',
                      borderRadius: 10,
                      border: `1px solid ${colors.lighter}`,
                      background: i % 2 === 0 ? `${colors.light}12` : '#ffffff',
                      boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.02)',
                    }}
                  >
                    <div
                      className={`${bodyFontClass} flex items-center justify-center`}
                      style={{
                        padding: '0.35rem 0.55rem',
                        minWidth: 60,
                        background: `linear-gradient(180deg, ${colors.light} 0%, ${colors.lighter} 100%)`,
                        color: strongText,
                        fontSize: `${item.labelSize}pt`,
                        fontWeight: titleWeight + 100,
                        letterSpacing: '-0.01em',
                        borderRadius: 8,
                        boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.03)',
                        border: `1px solid ${colors.lighter}`,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`${bodyFontClass} flex items-center justify-start`}
                      style={{
                        padding: '0.35rem 0.6rem',
                        color: primaryText,
                        fontSize: `${item.courseSize}pt`,
                        fontWeight: bodyWeight,
                        letterSpacing: '-0.01em',
                        borderRadius: 8,
                        border: `1px solid ${colors.lighter}`,
                        background: '#ffffff',
                        minWidth: 120,
                        flex: '0 0 25%',
                      }}
                    >
                      {item.course}
                    </div>
                    <div
                      className={`${bodyFontClass} flex items-center flex-1 justify-start`}
                      style={{
                        padding: '0.35rem 0.6rem',
                        color: primaryText,
                        fontSize: `${item.materialSize}pt`,
                        fontWeight: bodyWeight,
                        letterSpacing: '-0.01em',
                        borderRadius: 8,
                        border: `1px solid ${colors.lighter}`,
                        background: `${colors.light}16`,
                        minWidth: 120,
                      }}
                    >
                      {item.material}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 세 번째 줄: 학습목표 50%, 학습관리 50% */}
        <div className="grid grid-cols-2 gap-3 items-stretch">
          {/* 학습목표 카드 */}
          <Card
            data-section-id="learning-goal"
            className="overflow-hidden shadow-[0_10px_28px_rgba(15,23,42,0.12)] h-full flex flex-col"
            style={{
              borderColor: colors.border,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,248,250,0.9))',
              ...getLayoutStyle('learningGoal'),
            }}
          >
            <CardHeader
              className={`${getHeaderTextClass()}`}
              style={{
                ...getHeaderStyle(4),
                padding: '0.7rem 0.95rem',
                minHeight: '2.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <CardTitle className={`text-xs flex w-full items-center justify-start gap-1.5 text-left ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight, textAlign: 'left' }}>
                <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                학습목표
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 relative flex-1">
              <p
                className={`leading-4 whitespace-pre-wrap ${bodyFontClass}`}
                style={{ fontSize: `${getSize('learningGoal')}pt`, fontWeight: bodyWeight, color: primaryText, lineHeight: 1.45, paddingLeft: '4px' }}
              >
                {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
              </p>
            </CardContent>
          </Card>

          {/* 학습관리 카드 */}
          <Card
            data-section-id="management"
            className="overflow-hidden shadow-[0_10px_28px_rgba(15,23,42,0.12)] h-full flex flex-col"
            style={{
              borderColor: colors.border,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,248,250,0.9))',
              ...getLayoutStyle('management'),
            }}
          >
            <CardHeader
              className={`${getHeaderTextClass()}`}
              style={{
                ...getHeaderStyle(5),
                padding: '0.7rem 0.95rem',
                minHeight: '2.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <CardTitle className={`text-xs flex w-full items-center justify-start gap-1.5 text-left ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight, textAlign: 'left' }}>
                <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                학습관리
              </CardTitle>
          </CardHeader>
          <CardContent className="p-3 relative flex-1 flex items-center">
            <p
              className={`leading-4 whitespace-pre-wrap ${bodyFontClass}`}
              style={{ fontSize: `${getSize('management')}pt`, fontWeight: bodyWeight, color: primaryText, lineHeight: 1.45, paddingLeft: '4px' }}
            >
              {classPlan.management || "학습 관리 계획이 입력되지 않았습니다."}
            </p>
            </CardContent>
          </Card>
        </div>

        {/* 홍보문구 - 맨아래 (수강료 위) */}
        {classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'bottom' && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 relative">
            <p
              className={`leading-5 whitespace-pre-wrap ${bodyFontClass}`}
              style={{ fontSize: `${getSize('etc')}pt`, fontWeight: bodyWeight, color: primaryText, lineHeight: 1.6 }}
            >
              {classPlan.etc}
            </p>
          </div>
        )}

        {/* 주차별 학습계획 - 동적 2열 */}
        <Card
          data-section-id="weekly-plan"
          className="overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          style={{
            borderColor: colors.border,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(242,245,247,0.92))',
            ...getLayoutStyle('weeklyPlan'),
          }}
        >
          <CardHeader
            className={`${getHeaderTextClass()}`}
            style={{
              ...getHeaderStyle(6),
              padding: '0.7rem 0.95rem',
              minHeight: '2.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <CardTitle className={`text-xs flex w-full items-center justify-start gap-1.5 text-left ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight, textAlign: 'left' }}>
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              주차별 학습계획
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="grid grid-cols-2 gap-2">
              {/* 왼쪽 블록 */}
              <div className="space-y-1.5">
                {leftWeeks.map((week, i) => {
                  const weekIndex = i;
                  const displayLabel = (week.weekLabel || '').trim();
                  const hasLabel = displayLabel.length > 0;
                  const rowBg = weekIndex % 2 === 0 ? colors.light : 'transparent';
                  return (
                    <div 
                      key={weekIndex} 
                      className="flex items-start gap-2 p-1.5 rounded transition-colors"
                      style={{ backgroundColor: rowBg }}
                    >
                      {hasLabel && (
                        <span 
                          className="inline-flex items-center justify-center min-w-[30px] h-5 px-1.5 font-bold rounded shrink-0"
                          style={{ ...weekBadgeStyle, fontSize: `${getSize('weeklyPlanWeek')}pt` }}
                        >
                          {displayLabel}
                        </span>
                      )}
                      <div className="flex-1 min-w-0 relative">
                        <div className={`leading-tight ${bodyFontClass}`} style={{ fontSize: `${getSize('weeklyPlanTopic')}pt`, fontWeight: bodyWeight, color: strongText }}>{week.topic || ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 오른쪽 블록 */}
              <div className="space-y-1.5">
                {rightWeeks.map((week, i) => {
                  const weekIndex = midPoint + i;
                  const displayLabel = (week.weekLabel || '').trim();
                  const hasLabel = displayLabel.length > 0;
                  const rowBg = weekIndex % 2 === 0 ? colors.light : 'transparent';
                  return (
                    <div 
                      key={weekIndex} 
                      className="flex items-start gap-2 p-1.5 rounded transition-colors"
                      style={{ backgroundColor: rowBg }}
                    >
                      {hasLabel && (
                        <span 
                          className="inline-flex items-center justify-center min-w-[30px] h-5 px-1.5 font-bold rounded shrink-0"
                          style={{ ...weekBadgeStyle, fontSize: `${getSize('weeklyPlanWeek')}pt` }}
                        >
                          {displayLabel}
                        </span>
                      )}
                      <div className="flex-1 min-w-0 relative">
                        <div className={`leading-tight ${bodyFontClass}`} style={{ fontSize: `${getSize('weeklyPlanTopic')}pt`, fontWeight: bodyWeight, color: strongText }}>{week.topic || ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 월간계획 */}
        <Card 
          data-section-id="monthly-calendar" 
          className="overflow-hidden" 
          style={{ 
            borderColor: colors.border, 
            background: undefined,
            ...getLayoutStyle('monthlyCalendar'),
          }}
        >
          <CardHeader
            className={`${getHeaderTextClass()}`}
            style={{
              ...getHeaderStyle(7),
              padding: '0.7rem 0.95rem',
              minHeight: '2.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <CardTitle className={`text-xs flex w-full items-center justify-start gap-1.5 text-left ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight, textAlign: 'left' }}>
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              월간계획
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <MonthlyCalendar classPlan={classPlan} colorTheme={colorTheme} fontSize={getSize('monthlyCalendar')} />
          </CardContent>
        </Card>

        {/* 수강료 안내 */}
        {feeInfo && feeInfo.rows.length > 0 && (
          <Card 
            data-section-id="fee-table" 
            className="overflow-hidden shadow-sm mt-auto" 
            style={{ 
              borderColor: colors.border, 
              background: undefined,
              ...getLayoutStyle('feeTable'),
            }}
          >
            <CardHeader
              className={`${getHeaderTextClass()}`}
              style={{
                ...getHeaderStyle(8),
                padding: '0.7rem 0.95rem',
                minHeight: '2.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <CardTitle className={`text-sm flex w-full items-center justify-start gap-2 text-left ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight, textAlign: 'left' }}>
                <span style={{ fontSize: `${typography.titleSize * 0.875 * 1.2}pt` }}>📌</span>
                {feeInfo.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0" style={{ fontSize: `${getSize('feeTable')}pt` }}>
              <Table style={{ fontSize: `${getSize('feeTable')}pt` }}>
                 <TableHeader>
                   <TableRow style={{ backgroundColor: colors.light, borderColor: colors.lighter }}>
                     <TableHead className={`h-8 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>월</TableHead>
                     <TableHead className={`h-8 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>수업구분</TableHead>
                     <TableHead className={`h-8 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>요일</TableHead>
                     <TableHead className={`h-8 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>시간</TableHead>
                     <TableHead className={`h-8 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>수강료</TableHead>
                     <TableHead className={`h-8 text-center ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>회차</TableHead>
                     <TableHead className={`h-8 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>합계</TableHead>
                     <TableHead className={`h-8 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>총 합계</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {Object.entries(groupedByMonth).map(([month, rows]) => {
                    const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                      rows.reduce((sum, row) => sum + row.subtotal, 0);
                    return rows.map((row, idx) => (
                      <TableRow key={`${month}-${idx}`} style={{ borderColor: colors.lighter, ...(idx === 0 ? { borderTopWidth: '2px', borderTopColor: colors.border || colors.primary } : {}) }}>
                        {idx === 0 && (
                          <TableCell 
                            className={`py-2 ${bodyFontClass}`}
                            rowSpan={rows.length}
                             style={{ backgroundColor: colors.light, color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight, borderRight: '2px solid', borderRightColor: colors.border || colors.primary }}
                          >
                            {month}
                          </TableCell>
                        )}
                         <TableCell className={`py-2 ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight, color: primaryText }}>
                          {row.classType}
                        </TableCell>
                         <TableCell className={`py-2 ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight, color: primaryText }}>
                          {row.day}
                        </TableCell>
                         <TableCell className={`py-2 ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight, color: primaryText }}>
                          {row.time}
                        </TableCell>
                         <TableCell className={`py-2 text-right ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight, color: primaryText }}>
                          {row.unitFee.toLocaleString()}
                        </TableCell>
                         <TableCell className={`py-2 text-center ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight, color: primaryText }}>
                          {row.sessions}
                        </TableCell>
                         <TableCell className={`py-2 text-right ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight, color: strongText }}>
                          {row.subtotal.toLocaleString()}
                        </TableCell>
                        {idx === 0 && (
                          <TableCell 
                            className={`py-2 text-right ${bodyFontClass}`}
                            rowSpan={rows.length}
                             style={{ backgroundColor: colors.light, color: colors.dark || colors.primary, fontSize: `${getSize('feeTable')}pt`, fontWeight: 700 }}
                          >
                            {monthTotal.toLocaleString()}
                          </TableCell>
                        )}
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
              {/* 수강료 안내 멘트 */}
              <div className="px-3 pt-4 pb-3 border-t border-zinc-200">
                <div className="space-y-1">
                  <p className={`text-xs ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable') * 0.95}pt`, fontWeight: bodyWeight, color: '#6b7280', lineHeight: 1.4 }}>
                    * 형제 할인 등이 적용되지 않은 기준 수강료 안내입니다. (수납 문자는 할인 반영된 금액으로 전송됩니다)
                  </p>
                  <p className={`text-xs ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable') * 0.95}pt`, fontWeight: bodyWeight, color: '#6b7280', lineHeight: 1.4 }}>
                    * 방학 중 늘어난 특강수업 시간에 대해서는 할인이 적용되지 않는 점 양해 부탁드립니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      </div>
    </div>
  );
};

export default TemplateStyle1;

