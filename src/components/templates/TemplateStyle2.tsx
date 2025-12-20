'use client';

/* eslint-disable @next/next/no-img-element */

import React, { useMemo } from 'react';
import { ClassPlan, ColorTheme, FeeRow } from '@/lib/types';
import { ColorPalette, colorThemes } from '@/lib/colorThemes';
import { buildScheduleRows, calculateTeacherScheduleRatio } from '@/lib/utils';
import MonthlyCalendar from './MonthlyCalendar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createStyleHelpers, createAccentHelpers, textColors } from './sections';

interface Props {
  classPlan: ClassPlan;
  colorTheme: ColorTheme;
}

/**
 * TemplateStyle2 - 프로젝트 보고서 스타일
 */
const TemplateStyle2: React.FC<Props> = ({ classPlan, colorTheme }) => {
  const colors: ColorPalette = colorThemes[colorTheme] || colorThemes.blue;
  const feeInfo = classPlan.feeInfo;

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
    getLayoutStyle,
    getSize,
  } = styleHelpers;

  // 액센트 컬러 헬퍼
  const accentHelpers = useMemo(
    () => createAccentHelpers(colors, isDancheong),
    [colors, isDancheong]
  );
  const { getAccent, getAccentLight, getAccentLighter, getAccentMedium } = accentHelpers;

  // 메모이제이션된 데이터
  const groupedByMonth = useMemo(() => {
    const grouped: Record<string, FeeRow[]> = {};
    if (feeInfo?.rows) {
      feeInfo.rows.forEach(row => {
        if (!grouped[row.month]) grouped[row.month] = [];
        grouped[row.month].push(row);
      });
    }
    return grouped;
  }, [feeInfo?.rows]);

  const weeklyPlan = useMemo(() => classPlan.weeklyPlan || [], [classPlan.weeklyPlan]);
  const scheduleRows = useMemo(() => buildScheduleRows(classPlan.classDay, classPlan.classTime), [classPlan.classDay, classPlan.classTime]);
  const gridRatio = useMemo(() => calculateTeacherScheduleRatio(classPlan.classDay, classPlan.classTime), [classPlan.classDay, classPlan.classTime]);

  const courseRows = useMemo(() => [
    { label: '과정 1', course: classPlan.course1 || '-', material: classPlan.material1 || '-', courseSize: getSize('course1'), materialSize: getSize('material1'), labelSize: getSize('course1') },
    { label: '과정 2', course: classPlan.course2 || '-', material: classPlan.material2 || '-', courseSize: getSize('course2'), materialSize: getSize('material2'), labelSize: getSize('course2') },
  ], [classPlan.course1, classPlan.material1, classPlan.course2, classPlan.material2, getSize]);

  const { leftWeeks, rightWeeks, midPoint } = useMemo(() => {
    const mid = Math.ceil(weeklyPlan.length / 2);
    return { midPoint: mid, leftWeeks: weeklyPlan.slice(0, mid), rightWeeks: weeklyPlan.slice(mid) };
  }, [weeklyPlan]);

  const pageBackground = 'linear-gradient(135deg, #f8fafc 0%, #ffffff 55%, #f1f5f9 100%)';
  const headerShadow = '0 14px 34px rgba(15,23,42,0.12)';

  // 섹션 타이틀 렌더러
  const renderSectionTitle = (icon: React.ReactNode, title: string, accentIndex: number) => (
    <div className="flex items-center gap-2">
      <div className="w-1 h-4 rounded" style={{ backgroundColor: getAccent(accentIndex) }}></div>
      {icon}
      <h4 className={`text-xs ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight, color: '#18181b' }}>{title}</h4>
    </div>
  );

  // 스케줄 행 렌더러
  const renderScheduleRow = (row: { period: string; day: string; time: string }, i: number) => (
    <div key={i} className="flex items-stretch gap-1.5" style={{ padding: '0.25rem 0.2rem', borderRadius: 10, border: `1px solid ${colors.lighter}`, background: i % 2 === 0 ? `${colors.light}10` : 'transparent', boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.02)' }}>
      {row.period && (
        <div className={`${bodyFontClass} flex items-center justify-center`} style={{ padding: '0.3rem 0.55rem', minWidth: 70, background: `linear-gradient(180deg, ${colors.light} 0%, ${colors.lighter} 100%)`, color: textColors.strong, fontSize: `${getSize('classDay') * 0.9}pt`, fontWeight: titleWeight + 100, borderRadius: 8, border: `1px solid ${colors.lighter}`, whiteSpace: 'nowrap' }}>{row.period}</div>
      )}
      <div className={`${bodyFontClass} flex items-center justify-center`} style={{ padding: '0.3rem 0.55rem', minWidth: 52, color: textColors.primary, fontSize: `${getSize('classDay') * 0.9}pt`, fontWeight: bodyWeight + 50, borderRadius: 8, border: `1px solid ${colors.lighter}`, background: '#ffffff', whiteSpace: 'nowrap' }}>{row.day || '-'}</div>
      <div className={`${bodyFontClass} flex items-center flex-1 justify-start`} style={{ padding: '0.3rem 0.65rem', color: textColors.primary, fontSize: `${getSize('classDay') * 0.9}pt`, fontWeight: bodyWeight, borderRadius: 8, border: `1px solid ${colors.lighter}`, background: `${colors.light}18`, minWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.time || '-'}</div>
    </div>
  );

  // 과정 행 렌더러
  const renderCourseRow = (item: typeof courseRows[0], i: number) => (
    <div key={i} className="flex items-stretch gap-1.5" style={{ padding: '0.35rem 0.3rem', borderRadius: 10, border: `1px solid ${colors.lighter}`, background: i % 2 === 0 ? `${colors.light}12` : '#ffffff', boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.02)' }}>
      <div className={`${bodyFontClass} flex items-center justify-center`} style={{ padding: '0.35rem 0.55rem', minWidth: 60, background: `linear-gradient(180deg, ${colors.light} 0%, ${colors.lighter} 100%)`, color: textColors.strong, fontSize: `${item.labelSize}pt`, fontWeight: titleWeight + 100, borderRadius: 8, border: `1px solid ${colors.lighter}` }}>{item.label}</div>
      <div className={`${bodyFontClass} flex items-center justify-start`} style={{ padding: '0.35rem 0.6rem', color: textColors.primary, fontSize: `${item.courseSize}pt`, fontWeight: bodyWeight, borderRadius: 8, border: `1px solid ${colors.lighter}`, background: '#ffffff', minWidth: 120, flex: '0 0 25%' }}>{item.course}</div>
      <div className={`${bodyFontClass} flex items-center flex-1 justify-start`} style={{ padding: '0.35rem 0.6rem', color: textColors.primary, fontSize: `${item.materialSize}pt`, fontWeight: bodyWeight, borderRadius: 8, border: `1px solid ${colors.lighter}`, background: `${colors.light}16`, minWidth: 120 }}>{item.material}</div>
    </div>
  );

  // 주차 행 렌더러
  const renderWeekRow = (week: { weekLabel?: string; topic?: string }, index: number, actualIndex: number) => {
    const displayLabel = (week.weekLabel || '').trim();
    const hasLabel = displayLabel.length > 0;
    const rowBg = actualIndex % 2 === 0 ? getAccentLighter(6) : 'transparent';
    return (
      <div key={index} className="flex items-start gap-2 p-1.5 rounded" style={{ backgroundColor: rowBg }}>
        {hasLabel && (
          <span className="inline-flex items-center justify-center min-w-[32px] h-5 px-1.5 font-medium rounded shrink-0" style={{ fontSize: `${getSize('weeklyPlanWeek')}pt`, backgroundColor: getAccentLight(6), color: getAccent(6), border: `1px solid ${colors.border}` }}>{displayLabel}</span>
        )}
        <div className="flex-1 min-w-0">
          <div className={`text-zinc-800 ${bodyFontClass}`} style={{ fontSize: `${getSize('weeklyPlanTopic')}pt`, fontWeight: bodyWeight }}>{week.topic || ''}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-full p-5 relative" style={{ background: pageBackground }}>
      <div className={`flex-1 rounded-3xl border border-white/70 bg-white/92 backdrop-blur flex flex-col text-slate-900 shadow-[0_22px_55px_rgba(15,23,42,0.10)] ${bodyFontClass}`} style={{ fontSize: `${typography.bodySize}pt`, fontWeight: bodyWeight }}>
        {/* Header */}
        <div data-section-id="header" className="px-10 pt-6 pb-4 flex items-start justify-between rounded-t-3xl shadow-[0_12px_30px_rgba(15,23,42,0.08)]" style={{ backgroundColor: '#ffffff', borderBottom: `2px solid ${colors.border || colors.dark || colors.primary}`, boxShadow: headerShadow, ...getLayoutStyle('header') }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: getAccent(0) }}>
              <svg className="fill-none stroke-current" style={{ width: `${(typography.titleSize + 4) * 1.1}pt`, height: `${(typography.titleSize + 4) * 1.1}pt` }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <h1 className={`text-2xl tracking-tight ${titleFontClass}`} style={{ fontSize: `${(typography.titleSize + 4) * 1.2}pt`, fontWeight: titleWeight, color: '#0f172a' }}>
                {classPlan.showTitle && classPlan.title && (<span className="mr-2" style={{ fontSize: `${getSize('title')}pt`, color: getAccent(0) }}>[{classPlan.title}]</span>)}
                <span style={{ color: '#0f172a' }}>윈터 프로그램 안내문</span>
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#0f172a' }}>2026 WINTER</p>
            </div>
          </div>
          <div className="text-right"><img src="/images/2.png" alt="원리와 해석 수학학원" className="h-16 object-contain" /></div>
        </div>

        {/* 수강대상 + 홍보문구 */}
        {classPlan.showTargetStudent && classPlan.targetStudent && classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'top' && (
          <div className="px-8 mb-4 flex gap-3">
            <div className="w-1/4">
              <div className="space-y-1.5">
                {renderSectionTitle(<svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(1) }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, '수강대상', 1)}
                <Card className="overflow-hidden" style={{ borderColor: colors.border }}><CardContent className="p-2.5"><p className={`leading-4 ${bodyFontClass}`} style={{ fontSize: `${getSize('targetStudent')}pt`, fontWeight: bodyWeight, color: '#3f3f46' }}>{classPlan.targetStudent}{classPlan.targetStudentDetail && <span className="ml-1" style={{ fontSize: '0.833em', color: '#6b7280' }}>({classPlan.targetStudentDetail})</span>}</p></CardContent></Card>
              </div>
            </div>
            <div className="flex-1">
              <Card style={{ borderColor: colors.border, background: `linear-gradient(to right, ${getAccentLighter(1)}, ${getAccentLight(1)})` }}><CardContent className="p-3"><p className={`leading-5 whitespace-pre-wrap ${bodyFontClass}`} style={{ fontSize: `${getSize('etc')}pt`, fontWeight: bodyWeight, color: '#3f3f46', lineHeight: 1.6 }}>{classPlan.etc}</p></CardContent></Card>
            </div>
          </div>
        )}

        {classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'top' && (!classPlan.showTargetStudent || !classPlan.targetStudent) && (
          <div className="px-8 mb-4"><Card style={{ borderColor: colors.border, background: `linear-gradient(to right, ${getAccentLighter(1)}, ${getAccentLight(1)})` }}><CardContent className="p-3"><p className={`leading-5 text-zinc-700 whitespace-pre-wrap ${bodyFontClass}`} style={{ fontSize: `${getSize('etc')}pt`, lineHeight: 1.6 }}>{classPlan.etc}</p></CardContent></Card></div>
        )}

        {/* 학부모 안내글 */}
        {classPlan.parentIntro && (
          <div data-section-id="parent-intro" className="px-8 mb-4 mt-4" style={{ marginTop: 'calc(1rem + 5pt)', ...getLayoutStyle('parent-intro') }}>
            <Card style={{ borderColor: colors.border, backgroundColor: getAccentLight(2) }}><CardContent className="p-3"><p className={`leading-6 text-zinc-700 whitespace-pre-wrap ${bodyFontClass}`} style={{ fontSize: `${getSize('parentIntro')}pt`, fontWeight: bodyWeight, lineHeight: 1.6 }}>{classPlan.parentIntro}</p></CardContent></Card>
          </div>
        )}

        <div className="px-8 flex-1 flex flex-col gap-5 mb-4" style={{ fontSize: `${typography.bodySize}pt` }}>
          {/* 담임강사 + 수업일정 + 학습과정 */}
          <div className="grid gap-3 items-stretch" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="grid gap-3 h-full" style={{ gridTemplateColumns: `${gridRatio.teacher}fr ${gridRatio.schedule}fr` }}>
              {/* 담임강사 */}
              <div className="space-y-1.5 flex flex-col h-full">
                {renderSectionTitle(<svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(1) }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, '담임강사', 1)}
                <Card data-section-id="teacher-info" className="overflow-hidden flex-1" style={{ borderColor: colors.border, ...getLayoutStyle('teacher-info') }}>
                  <CardContent className="relative flex items-center justify-center text-center" style={{ minHeight: '2.4rem', padding: '0.75rem 1rem' }}>
                    <p className={`${bodyFontClass}`} style={{ fontSize: `${getSize('teacherName')}pt`, fontWeight: bodyWeight, color: '#3f3f46', whiteSpace: 'pre-line', width: '100%', textAlign: 'center', lineHeight: 1.15 }}>{classPlan.teacherName}</p>
                  </CardContent>
                </Card>
              </div>
              {/* 수업일정 */}
              <div className="space-y-1.5 flex flex-col h-full">
                {renderSectionTitle(<svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(3) }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, '수업일정', 3)}
                <Card data-section-id="schedule-info" className="overflow-hidden flex-1" style={{ borderColor: colors.border, ...getLayoutStyle('schedule-info') }}>
                  <CardContent className="p-1.5 relative" style={{ minHeight: '2.4rem', display: 'flex', alignItems: 'center' }}>
                    {scheduleRows.length === 0 ? <p className={`leading-4 ${bodyFontClass}`} style={{ fontSize: `${getSize('classDay')}pt`, fontWeight: bodyWeight, color: textColors.primary }}>-</p> : <div className="flex flex-col gap-1.5 w-full">{scheduleRows.map((row, i) => renderScheduleRow(row, i))}</div>}
                  </CardContent>
                </Card>
              </div>
            </div>
            {/* 학습과정 */}
            <div className="space-y-1.5 flex flex-col h-full">
              {renderSectionTitle(<svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(4) }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, '학습과정 및 교재', 4)}
              <Card data-section-id="course-info" className="overflow-hidden flex-1" style={{ borderColor: colors.border, ...getLayoutStyle('course-info') }}>
                <CardContent className="p-0 h-full flex flex-col justify-center"><div className="flex flex-col gap-1.25 p-2">{courseRows.map((item, i) => renderCourseRow(item, i))}</div></CardContent>
              </Card>
            </div>
          </div>

          {/* 학습목표 + 학습관리 */}
          <div className="grid grid-cols-2 gap-3 items-stretch">
            <div className="space-y-1.5 flex flex-col h-full">
              {renderSectionTitle(<svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.35}pt`, height: `${typography.titleSize * 0.75 * 1.35}pt`, color: getAccent(5) }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, '학습목표', 5)}
              <Card data-section-id="learning-goal" className="overflow-hidden h-full flex flex-col" style={{ borderColor: colors.border, backgroundColor: getAccentLight(4), ...getLayoutStyle('learning-goal') }}>
                <CardContent className="p-2.5 flex-1"><p className={`leading-4 whitespace-pre-wrap text-zinc-700 ${bodyFontClass}`} style={{ fontSize: `${getSize('learningGoal')}pt`, fontWeight: bodyWeight, lineHeight: 1.45, paddingLeft: '4px' }}>{classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}</p></CardContent>
              </Card>
            </div>
            <div className="space-y-1.5 flex flex-col h-full">
              {renderSectionTitle(<svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.35}pt`, height: `${typography.titleSize * 0.75 * 1.35}pt`, color: getAccent(5) }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>, '학습관리', 5)}
              <Card data-section-id="management" className="overflow-hidden h-full flex flex-col" style={{ borderColor: colors.border, backgroundColor: getAccentLight(5), ...getLayoutStyle('management') }}>
                <CardContent className="p-2.5 flex-1 flex items-center"><p className={`leading-4 whitespace-pre-wrap text-zinc-700 ${bodyFontClass}`} style={{ fontSize: `${getSize('management')}pt`, fontWeight: bodyWeight, lineHeight: 1.45, paddingLeft: '4px' }}>{classPlan.management || "학습 관리 계획이 입력되지 않았습니다."}</p></CardContent>
              </Card>
            </div>
          </div>

          {/* 홍보문구 - 하단 */}
          {classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'bottom' && (
            <Card style={{ borderColor: colors.border, background: `linear-gradient(to right, ${getAccentLighter(1)}, ${getAccentLight(1)})` }}><CardContent className="p-3"><p className={`leading-5 text-zinc-700 whitespace-pre-wrap ${bodyFontClass}`} style={{ fontSize: `${getSize('etc')}pt`, lineHeight: 1.6 }}>{classPlan.etc}</p></CardContent></Card>
          )}

          {/* 주차별 학습계획 */}
          <div data-section-id="weekly-plan" className="space-y-2" style={getLayoutStyle('weekly-plan')}>
            {renderSectionTitle(<svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.5}pt`, height: `${typography.titleSize * 0.75 * 1.5}pt`, color: getAccent(6) }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>, '주차별 학습계획', 6)}
            <Card className="overflow-hidden" style={{ borderColor: colors.border }}>
              <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">{leftWeeks.map((week, i) => renderWeekRow(week, i, i))}</div>
                  <div className="space-y-1">{rightWeeks.map((week, i) => renderWeekRow(week, i, midPoint + i))}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 월간계획 */}
          <div data-section-id="monthly-calendar" style={getLayoutStyle('monthly-calendar')}>
            <Card className="overflow-hidden" style={{ borderColor: colors.border || getAccent(7) }}>
              <CardContent className="p-3 space-y-2">
                {renderSectionTitle(<svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.5}pt`, height: `${typography.titleSize * 0.75 * 1.5}pt`, color: getAccent(7) }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, '월간계획', 7)}
                <div className="-mt-1"><MonthlyCalendar classPlan={classPlan} colorTheme={colorTheme} /></div>
              </CardContent>
            </Card>
          </div>

          {/* 수강료 */}
          {feeInfo && feeInfo.rows.length > 0 && (
            <div data-section-id="fee-table" className="space-y-2 mt-auto" style={getLayoutStyle('fee-table')}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded" style={{ backgroundColor: getAccent(8) }}></div>
                <span style={{ fontSize: `${typography.titleSize * 0.75 * 1.2}pt` }}>📌</span>
                <h3 className={`text-base text-zinc-800 ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight }}>{feeInfo.title}</h3>
              </div>
              <Card className="overflow-hidden shadow-sm" style={{ borderColor: colors.border }}>
                <CardContent className="p-0" style={{ fontSize: `${getSize('feeTable')}pt` }}>
                  <Table style={{ fontSize: `${getSize('feeTable')}pt` }}>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: getAccentMedium(8) }}>
                        <TableHead className={`h-9 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>월</TableHead>
                        <TableHead className={`h-9 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>수업구분</TableHead>
                        <TableHead className={`h-9 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>요일</TableHead>
                        <TableHead className={`h-9 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>시간</TableHead>
                        <TableHead className={`h-9 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>수강료</TableHead>
                        <TableHead className={`h-9 text-center ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>회차</TableHead>
                        <TableHead className={`h-9 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>합계</TableHead>
                        <TableHead className={`h-9 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight }}>총 합계</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedByMonth).map(([month, rows]) => {
                        const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || rows.reduce((sum, row) => sum + row.subtotal, 0);
                        return rows.map((row, idx) => (
                          <TableRow key={`${month}-${idx}`} style={{ borderColor: colors.border, ...(idx === 0 ? { borderTopWidth: '2px', borderTopColor: colors.border } : {}) }}>
                            {idx === 0 && <TableCell className={`py-2 ${bodyFontClass}`} rowSpan={rows.length} style={{ backgroundColor: '#f5f5f5', color: '#666666', fontSize: `${getSize('feeTable')}pt`, fontWeight: titleWeight, borderRight: '2px solid #e5e5e5' }}>{month}</TableCell>}
                            <TableCell className={`py-2 text-zinc-700 ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight }}>{row.classType}</TableCell>
                            <TableCell className={`py-2 text-zinc-700 ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight }}>{row.day}</TableCell>
                            <TableCell className={`py-2 text-zinc-700 ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight }}>{row.time}</TableCell>
                            <TableCell className={`py-2 text-right text-zinc-700 ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight }}>{row.unitFee.toLocaleString()}</TableCell>
                            <TableCell className={`py-2 text-center text-zinc-700 ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight }}>{row.sessions}</TableCell>
                            <TableCell className={`py-2 text-right text-zinc-900 ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable')}pt`, fontWeight: bodyWeight }}>{row.subtotal.toLocaleString()}</TableCell>
                            {idx === 0 && <TableCell className={`py-2 text-right ${bodyFontClass}`} rowSpan={rows.length} style={{ backgroundColor: '#f5f5f5', color: '#333333', fontSize: `${getSize('feeTable')}pt`, fontWeight: 700 }}>{monthTotal.toLocaleString()}</TableCell>}
                          </TableRow>
                        ));
                      })}
                    </TableBody>
                  </Table>
                  <div className="px-3 pt-4 pb-3 border-t border-zinc-200">
                    <div className="space-y-1">
                      <p className={`text-xs ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable') * 0.95}pt`, fontWeight: bodyWeight, color: '#6b7280', lineHeight: 1.4 }}>* 형제 할인 등이 적용되지 않은 기준 수강료 안내입니다. (수납 문자는 할인 반영된 금액으로 전송됩니다)</p>
                      <p className={`text-xs ${bodyFontClass}`} style={{ fontSize: `${getSize('feeTable') * 0.95}pt`, fontWeight: bodyWeight, color: '#6b7280', lineHeight: 1.4 }}>* 방학 중 늘어난 특강수업 시간에 대해서는 할인이 적용되지 않는 점 양해 부탁드립니다.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TemplateStyle2);
