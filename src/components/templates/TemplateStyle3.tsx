'use client';

/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { ClassPlan, ColorTheme, FeeRow } from '@/lib/types';
import { ColorPalette, colorThemes } from '@/lib/colorThemes';
import { getFontClassName, getDefaultTypography } from '@/lib/utils';
import MonthlyCalendar from './MonthlyCalendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
 * TemplateStyle3 - 멘토링 활동 보고서 스타일
 * 
 * 특징:
 * - 장식 삼각형
 * - 그라데이션 헤더 (라운드 코너)
 * - 그리드 기반 정보 테이블
 * - 색상 포인트가 있는 섹션 제목
 * - 2열 레이아웃 (주차별 계획 + 달력)
 */
const TemplateStyle3: React.FC<Props> = ({ classPlan, colorTheme }) => {
  // 안전한 색상 테마 가져오기
  const colors: ColorPalette = colorThemes[colorTheme] || colorThemes.blue;
  const feeInfo = classPlan.feeInfo;
  
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
  const headerBackground = `linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 45%), ${colors.gradient || colors.primary}`;
  const headerShadow = '0 14px 34px rgba(15,23,42,0.18)';

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
      <div
        className={`flex-1 rounded-3xl border border-white/70 bg-white/92 backdrop-blur flex flex-col text-slate-900 shadow-[0_22px_55px_rgba(15,23,42,0.10)] relative ${bodyFontClass}`}
        style={{ fontSize: `${typography.bodySize}pt`, fontWeight: bodyWeight }}
      >
        {/* 좌상단 장식 삼각형 */}
        <div 
          className="absolute top-0 left-0 w-20 h-20"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.dark} 100%)`,
            clipPath: 'polygon(0 0, 100% 0, 0 100%)',
            opacity: 0.7
          }}
        ></div>
        
        {/* Header - 그라데이션 배경 */}
        <div 
          className="mx-6 mt-6 px-8 py-5 rounded-t-lg relative overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          style={{ background: headerBackground, boxShadow: headerShadow }}
        >
        {/* 장식 패턴 */}
        <div 
          className="absolute right-0 top-0 w-32 h-full"
          style={{ background: `linear-gradient(to left, ${colors.dark}30, transparent)` }}
        ></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="mb-2">
              <span
                className="px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF', fontWeight: titleWeight }}
              >
                2026 WINTER
              </span>
            </div>
            <h1 className={`text-2xl text-white ${titleFontClass}`} style={{ fontSize: `${typography.titleSize + 4}pt`, fontWeight: titleWeight }}>
              {classPlan.showTitle && classPlan.title && (
                <span className="mr-2">[{classPlan.title}]</span>
              )}
              윈터 프로그램 안내문
            </h1>
          </div>
          <div className="text-right text-white">
            <img 
              src="/images/2-1.png" 
              alt="Logo" 
              className="h-16 w-auto"
            />
          </div>
        </div>
      </div>

      {/* 수강대상 - 홍보문구 왼쪽 (맨위) */}
      {classPlan.showTargetStudent && classPlan.targetStudent && classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'top' && (
        <div className="mx-6 mt-4 flex gap-3">
          <div className="w-1/4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors.primary }}></div>
                <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: colors.primary }} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h4 className={`text-xs ${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>수강대상</h4>
              </div>
              <Card className="border-zinc-200 bg-zinc-50/50">
                <CardContent className="p-2.5 relative">
                  <p className={`leading-4 text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.75em', fontWeight: bodyWeight }}>
                    {classPlan.targetStudent}
                    {classPlan.targetStudentDetail && (
                      <span className="text-zinc-500 ml-1" style={{ fontSize: '0.833em', fontWeight: bodyWeight }}>({classPlan.targetStudentDetail})</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.primary }}></div>
                <h3 className={`${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight }}>특이 사항</h3>
              </div>
              <Card className="border-zinc-200">
                <CardContent className="p-3 relative">
                  <p className={`leading-5 whitespace-pre-wrap ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>{classPlan.etc}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      
      {/* 홍보문구 - 맨위 (학부모 안내글 위, 수강대상이 없을 때) */}
      {classPlan.showEtc && classPlan.etc && classPlan.etcPosition === 'top' && (!classPlan.showTargetStudent || !classPlan.targetStudent) && (
        <div className="mx-6 mt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.primary }}></div>
              <h3 className={`font-bold ${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.875}pt` }}>특이 사항</h3>
            </div>
            <Card className="border-zinc-200">
              <CardContent className="p-3">
                <p className={`text-sm leading-5 whitespace-pre-wrap ${bodyFontClass}`}>{classPlan.etc}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 학부모 안내글 - 헤더 바로 아래 */}
      {classPlan.parentIntro && (
        <div className="mx-6 mt-4" style={{ fontSize: `${typography.bodySize}pt` }}>
          <Card className="border-zinc-200 bg-zinc-50/50">
            <CardContent className="p-3 relative">
              <p className={`leading-6 whitespace-pre-wrap ${bodyFontClass}`} style={{ fontSize: '0.95em', fontWeight: bodyWeight }}>{classPlan.parentIntro}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="px-5 mx-6 py-4 pb-6 flex-1 flex flex-col gap-3 border-x border-b border-zinc-200 rounded-b-lg" style={{ fontSize: `${typography.bodySize}pt` }}>
        {/* 두 번째 줄: 담임강사 25%, 수업일정 25%, 학습과정 및 교재 50% */}
        <div className="grid grid-cols-4 gap-3 items-end">
          {/* 담임강사 */}
          <div className="space-y-1.5 flex flex-col h-full">
            <div className="flex items-center gap-2">
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: colors.primary }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h4 className={`${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>담임강사</h4>
            </div>
            <Card className="border-zinc-200 bg-zinc-50/50 flex-1">
              <CardContent className="p-2.5 relative h-full flex items-center">
                <p className={`leading-5 text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>{classPlan.teacherName}</p>
              </CardContent>
            </Card>
          </div>

          {/* 수업일정 */}
          <div className="space-y-1.5 flex flex-col h-full">
            <div className="flex items-center gap-2">
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: colors.primary }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className={`${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>수업일정</h4>
            </div>
            <Card className="border-zinc-200 bg-zinc-50/50 flex-1">
              <CardContent className="p-2.5 relative h-full flex items-center">
                <p className={`leading-5 text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>{classPlan.classDay} {classPlan.classTime}</p>
              </CardContent>
            </Card>
          </div>

          {/* 학습과정 및 교재 */}
          <div className="space-y-1.5 col-span-2 flex flex-col h-full">
            <div className="flex items-center gap-2">
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: colors.primary }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h4 className={`${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>학습과정 및 교재</h4>
            </div>
            <Card className="border-zinc-200 flex-1" style={{ backgroundColor: `${colors.light}50` }}>
              <CardContent className="p-0" style={{ fontSize: `${typography.bodySize}pt` }}>
                <Table style={{ fontSize: `${typography.bodySize}pt` }}>
                  <TableBody>
                    <TableRow style={{ borderColor: colors.border }}>
                      <TableCell className={`py-1.5 px-2 ${bodyFontClass}`} style={{ background: `linear-gradient(180deg, ${colors.light}90 0%, ${colors.light}60 100%)`, color: colors.primary, fontSize: '0.9em', fontWeight: titleWeight, boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.04)' }}>
                        과정 1
                      </TableCell>
                      <TableCell className={`py-1.5 px-2 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight, borderRight: `1px solid ${colors.border}` }}>
                        {classPlan.course1 || '-'}
                      </TableCell>
                      <TableCell className={`py-1.5 px-2 text-left text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>
                        {classPlan.material1 || '-'}
                      </TableCell>
                    </TableRow>
                    <TableRow style={{ borderColor: colors.border }}>
                      <TableCell className={`py-1.5 px-2 ${bodyFontClass}`} style={{ background: `linear-gradient(180deg, ${colors.light}90 0%, ${colors.light}60 100%)`, color: colors.primary, fontSize: '0.9em', fontWeight: titleWeight, boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.04)' }}>
                        과정 2
                      </TableCell>
                      <TableCell className={`py-1.5 px-2 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight, borderRight: `1px solid ${colors.border}` }}>
                        {classPlan.course2 || '-'}
                      </TableCell>
                      <TableCell className={`py-1.5 px-2 text-left text-zinc-700 ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: bodyWeight }}>
                        {classPlan.material2 || '-'}
                      </TableCell>
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
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: colors.primary }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className={`${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>학습목표</h4>
            </div>
            <Card className="border-zinc-200 bg-zinc-50/50 h-full flex flex-col">
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
              <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: colors.primary }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h4 className={`${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>학습관리</h4>
            </div>
            <Card className="border-zinc-200 bg-zinc-50/50 h-full flex flex-col">
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.primary }}></div>
              <h3 className={`font-bold ${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.875}pt` }}>특이 사항</h3>
            </div>
            <Card className="border-zinc-200">
              <CardContent className="p-3">
                <p className={`text-sm leading-5 whitespace-pre-wrap ${bodyFontClass}`}>{classPlan.etc}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 주차별 학습계획 - 동적 2열 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: colors.primary }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className={`${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>주차별 학습계획</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* 왼쪽 블록 */}
            <div className="space-y-1">
              {leftWeeks.map((week, i) => {
                const weekIndex = i;
                const displayLabel = (week.weekLabel || '').trim();
                const hasLabel = displayLabel.length > 0;
                return (
                  <Card key={weekIndex} className="border-zinc-200 transition-colors" style={{ ['--hover-border' as string]: colors.border }}>
                    <CardContent className="p-1.5 flex items-center gap-1.5">
                      {hasLabel && (
                        <Badge 
                          className="text-white text-[9pt] px-1.5 shrink-0"
                          style={{ backgroundColor: colors.primary }}
                        >
                          {displayLabel}
                        </Badge>
                      )}
                      <div className="flex-1 min-w-0 relative">
                        <div className={`truncate text-zinc-800 leading-tight ${bodyFontClass}`} style={{ fontSize: '0.8em', fontWeight: bodyWeight }}>{week.topic || ''}</div>
                        {week.detail && (
                          <div className="relative">
                            <div className={`truncate text-zinc-500 leading-tight ${bodyFontClass}`} style={{ fontSize: '0.75em', fontWeight: bodyWeight }}>{week.detail}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {/* 오른쪽 블록 */}
            <div className="space-y-1">
              {rightWeeks.map((week, i) => {
                const weekIndex = midPoint + i;
                const displayLabel = (week.weekLabel || '').trim();
                const hasLabel = displayLabel.length > 0;
                return (
                  <Card key={weekIndex} className="border-zinc-200 transition-colors" style={{ ['--hover-border' as string]: colors.border }}>
                    <CardContent className="p-1.5 flex items-center gap-1.5">
                      {hasLabel && (
                        <Badge 
                          className="text-white text-[9pt] px-1.5 shrink-0"
                          style={{ backgroundColor: colors.primary }}
                        >
                          {displayLabel}
                        </Badge>
                      )}
                      <div className="flex-1 min-w-0 relative">
                        <div className={`truncate text-zinc-800 leading-tight ${bodyFontClass}`} style={{ fontSize: '0.8em', fontWeight: bodyWeight }}>{week.topic || ''}</div>
                        {week.detail && (
                          <div className="relative">
                            <div className={`truncate text-zinc-500 leading-tight ${bodyFontClass}`} style={{ fontSize: '0.75em', fontWeight: bodyWeight }}>{week.detail}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* 월간계획 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize * 0.75 * 1.2}pt`, height: `${typography.titleSize * 0.75 * 1.2}pt`, color: colors.primary }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className={`${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>월간계획</h3>
          </div>
          <MonthlyCalendar classPlan={classPlan} colorTheme={colorTheme} />
        </div>

        {/* 수강료 안내 */}
        {feeInfo && feeInfo.rows.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: `${typography.titleSize * 0.75 * 1.2}pt` }}>📌</span>
              <h3 className={`${titleFontClass}`} style={{ color: colors.primary, fontSize: `${typography.titleSize * 0.75}pt`, fontWeight: titleWeight }}>{feeInfo.title}</h3>
            </div>
            <Card className="border-zinc-300 shadow-sm overflow-hidden">
              <CardContent className="p-0" style={{ fontSize: `${typography.bodySize}pt` }}>
                <Table style={{ fontSize: `${typography.bodySize}pt` }}>
                  <TableHeader>
                    <TableRow style={{ backgroundColor: colors.primary, borderColor: 'rgb(212, 212, 216)' }}>
                      <TableHead className={`h-8 text-white ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: titleWeight }}>월</TableHead>
                      <TableHead className={`h-8 text-white ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: titleWeight }}>수업구분</TableHead>
                      <TableHead className={`h-8 text-white ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: titleWeight }}>요일</TableHead>
                      <TableHead className={`h-8 text-white ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: titleWeight }}>시간</TableHead>
                      <TableHead className={`h-8 text-white text-right ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: titleWeight }}>수강료</TableHead>
                      <TableHead className={`h-8 text-white text-center ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: titleWeight }}>회차</TableHead>
                      <TableHead className={`h-8 text-white text-right ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: titleWeight }}>합계</TableHead>
                      <TableHead className={`h-8 text-white text-right ${bodyFontClass}`} style={{ fontSize: '0.9em', fontWeight: titleWeight }}>총 합계</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedByMonth).map(([month, rows]) => {
                      const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                        rows.reduce((sum, row) => sum + row.subtotal, 0);
                      return rows.map((row, idx) => (
                        <TableRow key={`${month}-${idx}`} className="border-zinc-100" style={idx === 0 ? { borderTopWidth: '2px', borderTopColor: 'rgb(212, 212, 216)' } : {}}>
                          {idx === 0 && (
                            <TableCell className={`py-2 bg-zinc-50 ${bodyFontClass}`} rowSpan={rows.length} style={{ fontSize: '0.9em', fontWeight: titleWeight, borderRight: '2px solid', borderRightColor: 'rgb(212, 212, 216)' }}>{month}</TableCell>
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
                            <TableCell 
                              className={`py-2 text-right bg-zinc-50 ${bodyFontClass}`}
                              rowSpan={rows.length}
                              style={{ color: colors.dark || colors.primary, fontSize: '0.9em', fontWeight: 700 }}
                            >
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
      
      {/* 우하단 장식 삼각형 */}
      <div 
        className="absolute bottom-0 right-0 w-16 h-16"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.dark} 100%)`,
          clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
          opacity: 0.7
        }}
      ></div>
      </div>
    </div>
  );
};

export default TemplateStyle3;

