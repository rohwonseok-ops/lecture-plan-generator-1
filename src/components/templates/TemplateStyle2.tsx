'use client';

/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { ClassPlan, ColorTheme } from '@/lib/types';
import { ColorPalette, colorThemes } from '@/lib/colorThemes';
import { getFontClassName, getDefaultTypography } from '@/lib/utils';
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

interface Props {
  classPlan: ClassPlan;
  colorTheme: ColorTheme;
}

/**
 * TemplateStyle2 - 프로젝트 보고서 스타일
 * 
 * 특징:
 * - 아이콘 박스 + 타이틀 헤더 (흰 배경)
 * - 우측 정보 카드
 * - 색상 바가 있는 섹션 제목들
 * - 테이블 기반 강좌 개요
 * - 2열 레이아웃 (주차별 계획 + 달력)
 */
const TemplateStyle2: React.FC<Props> = ({ classPlan, colorTheme }) => {
  // 안전한 색상 테마 가져오기
  const colors: ColorPalette = colorThemes[colorTheme] || colorThemes.blue;
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, Array<{ month: string; classType: string; day: string; time: string; unitFee: number; sessions: number; subtotal: number }>> = {};
  if (feeInfo?.rows) {
    feeInfo.rows.forEach(row => {
      if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
      groupedByMonth[row.month].push(row);
    });
  }

  // 연한 배경색 계산 (투명도 적용)
  const lightBg = `${colors.border}30`;
  const lighterBg = `${colors.border}20`;
  // 조금 더 진한 배경색 (light보다 약간 진하게) - border에 40% 투명도 적용
  const mediumLight = `${colors.border}66`;

  // 단청 멀티 포인트 컬러들
  const dancheongAccents = ['#FF4FD2', '#11C3FF', '#FF9A3D', '#6BE87D', '#FFC857', '#7C5CFF'];
  const getAccent = (index: number) => isDancheong ? dancheongAccents[index % dancheongAccents.length] : colors.primary;
  const getAccentLight = (index: number) => isDancheong ? `${getAccent(index)}1A` : lightBg;      // ≈10% 투명
  const getAccentLighter = (index: number) => isDancheong ? `${getAccent(index)}0D` : lighterBg;  // ≈5% 투명
  const getAccentMedium = (index: number) => isDancheong ? `${getAccent(index)}33` : mediumLight; // ≈20% 투명

  // 타이포그래피 설정
  const typography = classPlan.typography || getDefaultTypography();
  const titleFontClass = getFontClassName(typography.titleFont);
  const bodyFontClass = getFontClassName(typography.bodyFont);
  
  const titleWeight = typography.titleWeight || 400;
  const bodyWeight = typography.bodyWeight || 400;
  const headerShadow = '0 14px 34px rgba(15,23,42,0.12)';

  // 신규 테마 감지
  const isDancheong = colorTheme === 'dancheong';
  // 단청 멀티도 밝은 배경 유지
  const pageBackground = 'linear-gradient(135deg, #f8fafc 0%, #ffffff 55%, #f1f5f9 100%)';

  const weeklyPlan = classPlan.weeklyPlan || [];
  const midPoint = Math.ceil(weeklyPlan.length / 2);
  const leftWeeks = weeklyPlan.slice(0, midPoint);
  const rightWeeks = weeklyPlan.slice(midPoint);

  return (
    <div
      className="w-full min-h-full p-5 relative"
      style={{ background: pageBackground }}
    >
      {/* 단청 멀티는 어두운 오버레이를 제거하고 밝은 바탕으로 표시 */}
      <div
        className={`flex-1 rounded-3xl border border-white/70 bg-white/92 backdrop-blur flex flex-col text-slate-900 shadow-[0_22px_55px_rgba(15,23,42,0.10)] ${bodyFontClass}`}
        style={{ fontSize: `${typography.bodySize}pt`, fontWeight: bodyWeight }}
      >
        {/* Header - 아이콘과 타이틀 */}
        <div
          className="px-10 pt-6 pb-4 flex items-start justify-between rounded-t-3xl shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
          style={{
            backgroundColor: '#ffffff',
            borderBottom: `1px solid ${colors.border}`,
            boxShadow: headerShadow,
          }}
        >
        <div className="flex items-start gap-3">
          {/* 아이콘 박스 */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg" 
            style={{ backgroundColor: getAccent(0) }}
          >
            <svg className="fill-none stroke-current" style={{ width: `${(typography.titleSize + 4) * 0.8}pt`, height: `${(typography.titleSize + 4) * 0.8}pt` }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className={`text-2xl tracking-tight ${titleFontClass}`} style={{ fontSize: `${typography.titleSize + 4}pt`, fontWeight: titleWeight, color: '#0f172a' }}>
              {classPlan.showTitle && classPlan.title && (
                <span className="mr-2" style={{ color: '#0f172a' }}>[{classPlan.title}]</span>
              )}
              <span style={{ color: '#0f172a' }}>윈터 프로그램</span>{' '}
              <span style={{ color: getAccent(0) }}>안내문</span>
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>2026 WINTER</p>
          </div>
        </div>
        <div className="text-right">
          <img 
            src="/images/2.png" 
            alt="원리와 해석 수학학원" 
            className="h-16 object-contain"
          />
        </div>
      </div>

      {/* 수강대상 - 홍보문구 왼쪽 (맨위) */}
      {classPlan.showTargetStudent && classPlan.targetStudent && classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'top' && (
        <div className="px-8 mb-4 flex gap-3">
          <div className="w-1/4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded" style={{ backgroundColor: getAccent(1) }}></div>
                <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(1) }} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h4 className={`text-xs ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight, color: '#18181b' }}>수강대상</h4>
              </div>
              <Card className="overflow-hidden" style={{ borderColor: colors.border, background: undefined }}>
                <CardContent className="p-2.5 relative">
                  <p className={`leading-4 ${bodyFontClass}`} style={{ fontSize: '0.75em', fontWeight: bodyWeight, color: '#3f3f46' }}>
                    {classPlan.targetStudent}
                    {classPlan.targetStudentDetail && (
                      <span className="ml-1" style={{ fontSize: '0.833em', fontWeight: bodyWeight, color: '#6b7280' }}>({classPlan.targetStudentDetail})</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex-1">
            <Card style={{ borderColor: colors.border, background: `linear-gradient(to right, ${getAccentLighter(1)}, ${getAccentLight(1)})` }}>
              <CardContent className="p-3 relative">
                <p
                  className={`leading-5 whitespace-pre-wrap ${bodyFontClass}`}
                  style={{ fontSize: '0.9em', fontWeight: bodyWeight, color: '#3f3f46', lineHeight: 1.6 }}
                >
                  {classPlan.etc}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* 홍보문구 - 맨위 (학부모 안내글 위, 수강대상이 없을 때) */}
      {classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'top' && (!classPlan.showTargetStudent || !classPlan.targetStudent) && (
        <div className="px-8 mb-4">
          <Card style={{ borderColor: colors.border, background: `linear-gradient(to right, ${getAccentLighter(1)}, ${getAccentLight(1)})` }}>
            <CardContent className="p-3">
              <p
                className={`text-sm leading-5 text-zinc-700 whitespace-pre-wrap ${bodyFontClass}`}
                style={{ lineHeight: 1.6 }}
              >
                {classPlan.etc}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 학부모 안내글 - 헤더 바로 아래 */}
      {classPlan.parentIntro && (
        <div className="px-8 mb-4 mt-4" style={{ fontSize: `${typography.bodySize}pt` }}>
          <Card style={{ borderColor: colors.border, backgroundColor: getAccentLight(2) }}>
            <CardContent className="p-3 relative">
              <p
                className={`leading-6 text-zinc-700 whitespace-pre-wrap ${bodyFontClass}`}
                style={{ fontSize: '0.95em', fontWeight: bodyWeight, lineHeight: 1.6 }}
              >
                {classPlan.parentIntro}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="px-8 flex-1 flex flex-col gap-5 mb-4" style={{ fontSize: `${typography.bodySize}pt` }}>
        {/* 두 번째 줄: 담임강사 25%, 수업일정 25%, 학습과정 및 교재 50% */}
        <div className="grid grid-cols-4 gap-3 items-end">
          {/* 담임강사 */}
          <div className="space-y-1.5 flex flex-col h-full">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded" style={{ backgroundColor: getAccent(1) }}></div>
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(1) }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h4 className={`text-xs ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight, color: '#18181b' }}>담임강사</h4>
            </div>
            <Card className="overflow-hidden flex-1" style={{ borderColor: colors.border, background: undefined }}>
              <CardContent className="p-2 relative" style={{ minHeight: '3.75rem', display: 'flex', alignItems: 'center' }}>
                <p className={`leading-4 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight, color: '#3f3f46' }}>{classPlan.teacherName}</p>
              </CardContent>
            </Card>
          </div>

          {/* 수업일정 */}
          <div className="space-y-1.5 flex flex-col h-full">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded" style={{ backgroundColor: getAccent(3) }}></div>
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(3) }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className={`text-xs ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight, color: '#18181b' }}>수업일정</h4>
            </div>
            <Card className="overflow-hidden flex-1" style={{ borderColor: colors.border, background: undefined }}>
              <CardContent className="p-2 relative" style={{ minHeight: '3.75rem', display: 'flex', alignItems: 'center' }}>
                <p className={`leading-4 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight, color: '#3f3f46' }}>{classPlan.classDay} {classPlan.classTime}</p>
              </CardContent>
            </Card>
          </div>

          {/* 학습과정 및 교재 */}
          <div className="space-y-1.5 col-span-2 flex flex-col h-full">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded" style={{ backgroundColor: getAccent(4) }}></div>
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(4) }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h4 className={`text-xs ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight, color: '#18181b' }}>학습과정 및 교재</h4>
            </div>
            <Card className="overflow-hidden flex-1" style={{ borderColor: colors.border, background: undefined }}>
              <CardContent className="p-0 h-full flex flex-col justify-center" style={{ fontSize: `${typography.bodySize}pt` }}>
                <Table style={{ fontSize: `${typography.bodySize}pt`, color: undefined }}>
                  <TableBody>
                    <TableRow style={{ borderColor: colors.border }}>
                      <TableCell className={`py-1.5 px-2 ${bodyFontClass}`} style={{ background: `linear-gradient(180deg, ${getAccentLighter(5)} 0%, ${getAccentLight(5)} 100%)`, color: getAccent(5), fontSize: '0.9em', fontWeight: titleWeight, boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.04)' }}>과정 1</TableCell>
                      <TableCell className={`py-1.5 px-2 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight, borderRight: `1px solid ${colors.border}`, color: '#18181b' }}>{classPlan.course1 || '-'}</TableCell>
                      <TableCell className={`py-1.5 px-2 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight, color: '#18181b' }}>{classPlan.material1 || '-'}</TableCell>
                    </TableRow>
                    <TableRow style={{ borderColor: colors.border }}>
                      <TableCell className={`py-1.5 px-2 ${bodyFontClass}`} style={{ background: `linear-gradient(180deg, ${getAccentLighter(5)} 0%, ${getAccentLight(5)} 100%)`, color: getAccent(5), fontSize: '0.9em', fontWeight: titleWeight, boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.04)' }}>과정 2</TableCell>
                      <TableCell className={`py-1.5 px-2 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight, borderRight: `1px solid ${colors.border}`, color: '#18181b' }}>{classPlan.course2 || '-'}</TableCell>
                      <TableCell className={`py-1.5 px-2 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight, color: '#18181b' }}>{classPlan.material2 || '-'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 세 번째 줄: 학습목표 50%, 학습관리 50% */}
        <div className="grid grid-cols-2 gap-3 items-stretch">
          {/* 학습목표 */}
          <div className="space-y-1.5 flex flex-col h-full">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded" style={{ backgroundColor: getAccent(5) }}></div>
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(5) }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className={`text-xs text-zinc-800 ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>학습목표</h4>
            </div>
            <Card className="overflow-hidden h-full flex flex-col" style={{ borderColor: colors.border, backgroundColor: getAccentLight(4) }}>
              <CardContent className="p-2.5 relative flex-1">
                <p className={`leading-4 whitespace-pre-wrap text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>
                  {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 학습관리 */}
          <div className="space-y-1.5 flex flex-col h-full">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded" style={{ backgroundColor: getAccent(5) }}></div>
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(5) }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h4 className={`text-xs text-zinc-800 ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>학습관리</h4>
            </div>
            <Card className="overflow-hidden h-full flex flex-col" style={{ borderColor: colors.border, backgroundColor: getAccentLight(5) }}>
              <CardContent className="p-2.5 relative flex-1">
                <p className={`leading-4 whitespace-pre-wrap text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>
                  {classPlan.management || "학습 관리 계획이 입력되지 않았습니다."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 홍보문구 - 맨아래 (수강료 위) */}
        {classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'bottom' && (
            <Card style={{ borderColor: colors.border, background: `linear-gradient(to right, ${getAccentLighter(1)}, ${getAccentLight(1)})` }}>
            <CardContent className="p-3">
              <p
                className={`text-sm leading-5 text-zinc-700 whitespace-pre-wrap ${bodyFontClass}`}
                style={{ lineHeight: 1.6 }}
              >
                {classPlan.etc}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 주차별 학습계획 - 동적 2열 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded" style={{ backgroundColor: getAccent(6) }}></div>
            <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(6) }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className={`text-base text-zinc-800 ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>주차별 학습계획</h3>
          </div>
          
          <Card className="overflow-hidden" style={{ borderColor: colors.border }}>
            <CardContent className="p-2">
              <div className="grid grid-cols-2 gap-3">
                {/* 왼쪽 블록 */}
                <div className="space-y-1">
                  {leftWeeks.map((week, i) => {
                    const weekIndex = i;
                    const displayLabel = (week.weekLabel || '').trim();
                    const hasLabel = displayLabel.length > 0;
                    const rowBg = weekIndex % 2 === 0 ? getAccentLighter(6) : 'transparent';
                    return (
                      <div 
                        key={weekIndex} 
                        className="flex items-start gap-2 p-1.5 rounded" 
                        style={{ backgroundColor: rowBg }}
                      >
                        {hasLabel && (
                          <span 
                            className="inline-flex items-center justify-center min-w-[32px] h-5 px-1.5 text-[11pt] font-medium rounded shrink-0"
                            style={{ backgroundColor: getAccentLight(6), color: getAccent(6), border: `1px solid ${colors.border}` }}
                          >
                            {displayLabel}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="relative">
                            <div className={`text-zinc-800 ${bodyFontClass}`} style={{ fontSize: '0.85em', fontWeight: bodyWeight }}>{week.topic || ''}</div>
                          </div>
                          {week.detail && (
                            <div className="relative">
                            <div className={`text-zinc-500 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>{week.detail}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* 오른쪽 블록 */}
                <div className="space-y-1">
                  {rightWeeks.map((week, i) => {
                    const weekIndex = midPoint + i;
                    const displayLabel = (week.weekLabel || '').trim();
                    const hasLabel = displayLabel.length > 0;
                    const rowBg = weekIndex % 2 === 0 ? getAccentLighter(6) : 'transparent';
                    return (
                      <div 
                        key={weekIndex} 
                        className="flex items-start gap-2 p-1.5 rounded" 
                        style={{ backgroundColor: rowBg }}
                      >
                        {hasLabel && (
                          <span 
                            className="inline-flex items-center justify-center min-w-[32px] h-5 px-1.5 text-[11pt] font-medium rounded shrink-0"
                            style={{ backgroundColor: getAccentLight(6), color: getAccent(6), border: `1px solid ${colors.border}` }}
                          >
                            {displayLabel}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="relative">
                            <div className={`text-zinc-800 ${bodyFontClass}`} style={{ fontSize: '0.85em', fontWeight: bodyWeight }}>{week.topic || ''}</div>
                          </div>
                          {week.detail && (
                            <div className="relative">
                            <div className={`text-zinc-500 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>{week.detail}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 월간계획 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded" style={{ backgroundColor: getAccent(7) }}></div>
            <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: getAccent(7) }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className={`text-base text-zinc-800 ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>월간계획</h3>
          </div>
          <div className="-mt-2">
            <MonthlyCalendar classPlan={classPlan} colorTheme={colorTheme} />
          </div>
        </div>

        {/* 수강료 안내 */}
        {feeInfo && feeInfo.rows.length > 0 && (
          <div className="space-y-2 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded" style={{ backgroundColor: getAccent(8) }}></div>
              <span style={{ fontSize: `${typography.titleSize * 0.75 * 1.2}pt` }}>📌</span>
              <h3 className={`text-base text-zinc-800 ${titleFontClass}`} style={{ fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>{feeInfo.title}</h3>
            </div>
            
            <Card className="overflow-hidden shadow-sm" style={{ borderColor: colors.border }}>
              <CardContent className="p-0" style={{ fontSize: `${typography.bodySize}pt` }}>
                <Table style={{ fontSize: `${typography.bodySize}pt` }}>
                  <TableHeader>
                    <TableRow style={{ backgroundColor: getAccentMedium(8) }}>
                      <TableHead className={`h-9 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: '0.9em', fontWeight: titleWeight }}>월</TableHead>
                      <TableHead className={`h-9 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: '0.9em', fontWeight: titleWeight }}>수업구분</TableHead>
                      <TableHead className={`h-9 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: '0.9em', fontWeight: titleWeight }}>요일</TableHead>
                      <TableHead className={`h-9 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: '0.9em', fontWeight: titleWeight }}>시간</TableHead>
                      <TableHead className={`h-9 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: '0.9em', fontWeight: titleWeight }}>수강료</TableHead>
                      <TableHead className={`h-9 text-center ${bodyFontClass}`} style={{ color: colors.dark, fontSize: '0.9em', fontWeight: titleWeight }}>회차</TableHead>
                      <TableHead className={`h-9 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: '0.9em', fontWeight: titleWeight }}>합계</TableHead>
                      <TableHead className={`h-9 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: '0.9em', fontWeight: titleWeight }}>총 합계</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedByMonth).map(([month, rows]) => {
                      const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                        rows.reduce((sum, row) => sum + row.subtotal, 0);
                      return rows.map((row, idx) => (
                        <TableRow key={`${month}-${idx}`} style={{ borderColor: colors.border, ...(idx === 0 ? { borderTopWidth: '2px', borderTopColor: colors.border } : {}) }}>
                          {idx === 0 && (
                            <TableCell className={`py-2 ${bodyFontClass}`} rowSpan={rows.length} style={{ backgroundColor: '#f5f5f5', color: '#666666', fontSize: '0.9em', fontWeight: titleWeight, borderRight: '2px solid', borderRightColor: '#e5e5e5' }}>{month}</TableCell>
                          )}
                          <TableCell className={`py-2 text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>
                            {row.classType}
                          </TableCell>
                          <TableCell className={`py-2 text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>
                            {row.day}
                          </TableCell>
                          <TableCell className={`py-2 text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>
                            {row.time}
                          </TableCell>
                          <TableCell className={`py-2 text-right text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>
                            {row.unitFee.toLocaleString()}
                          </TableCell>
                          <TableCell className={`py-2 text-center text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>
                            {row.sessions}
                          </TableCell>
                          <TableCell className={`py-2 text-right text-zinc-900 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>
                            {row.subtotal.toLocaleString()}
                          </TableCell>
                          {idx === 0 && (
                            <TableCell className={`py-2 text-right ${bodyFontClass}`} rowSpan={rows.length} style={{ backgroundColor: '#f5f5f5', color: '#333333', fontSize: '0.9em', fontWeight: 700 }}>
                              {monthTotal.toLocaleString()}
                            </TableCell>
                          )}
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default TemplateStyle2;

