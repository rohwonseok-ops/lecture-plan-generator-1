'use client';

import React from 'react';
import { ClassPlan } from '@/lib/types';
import MonthlyCalendar from './MonthlyCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
}

// 학술 포스터 스타일 템플릿 - 청록색 테마
const TemplateAcademic: React.FC<Props> = ({ classPlan }) => {
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, typeof feeInfo.rows> = {};
  feeInfo?.rows.forEach(row => {
    if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
    groupedByMonth[row.month].push(row);
  });

  return (
    <div className="w-[240mm] min-h-[260mm] bg-white flex flex-col text-zinc-900 font-jeju relative" style={{ fontSize: '11pt' }}>
      {/* Header - 청록색 그라데이션 배경과 산 그래픽 */}
      <div className="relative px-8 pt-6 pb-8 bg-gradient-to-b from-teal-700 via-teal-600 to-teal-500 text-white overflow-hidden">
        {/* 산 모양 그래픽 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
          <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,120 L200,40 L400,80 L600,20 L800,60 L1000,30 L1200,70 L1200,120 Z" fill="currentColor" className="text-teal-800"/>
          </svg>
        </div>
        
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-teal-200">원리와 해석 수학학원</span>
              <span className="text-teal-300 text-xs">|</span>
              <span className="text-xs text-teal-200">Winter Special Class</span>
            </div>
            <h1 className="text-3xl font-black leading-tight">
              {classPlan.title.split('').slice(0, 6).join('')}
              <span className="text-teal-200">{classPlan.title.split('').slice(6).join('')}</span>
            </h1>
            <p className="text-lg mt-1 text-teal-100">{classPlan.targetStudent} 겨울특강</p>
          </div>
          <div className="text-right">
            <img 
              src="/images/1.png" 
              alt="원리와 해석 수학학원" 
              className="h-14 object-contain brightness-0 invert opacity-80 mb-2"
            />
            <Badge className="bg-white/20 text-white border-white/30 text-xs">
              {classPlan.classDay}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-8 py-4 flex-1 flex flex-col gap-4" style={{ fontSize: '10pt' }}>
        {/* 2열 메인 레이아웃 */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* 좌측 컬럼 */}
          <div className="space-y-4">
            {/* ABSTRACT (개요) */}
            <Card className="border-teal-200 overflow-hidden">
              <CardHeader className="p-3 pb-2 bg-teal-600 text-white">
                <CardTitle className="text-sm font-bold">ABSTRACT (개요)</CardTitle>
              </CardHeader>
              <CardContent className="p-3 text-sm leading-6">
                <p className="whitespace-pre-wrap">
                  {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
                </p>
              </CardContent>
            </Card>

            {/* INTRODUCTION (서론) */}
            <Card className="border-teal-200 overflow-hidden">
              <CardHeader className="p-3 pb-2 bg-teal-600 text-white">
                <CardTitle className="text-sm font-bold">INTRODUCTION (학습안내)</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div>
                  <span className="font-bold text-teal-700">대상:</span>{' '}
                  {classPlan.targetStudent}
                  {classPlan.targetStudentDetail && ` (${classPlan.targetStudentDetail})`}
                </div>
                <div>
                  <span className="font-bold text-teal-700">담당:</span>{' '}
                  {classPlan.teacherName} 선생님
                </div>
                <div>
                  <span className="font-bold text-teal-700">일정:</span>{' '}
                  {classPlan.classDay} {classPlan.classTime}
                </div>
                {classPlan.parentIntro && (
                  <p className="text-sm leading-5 whitespace-pre-wrap border-t border-teal-100 pt-2 mt-2">
                    {classPlan.parentIntro}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* METHODS (교재 및 과정) */}
            <Card className="border-teal-200 overflow-hidden">
              <CardHeader className="p-3 pb-2 bg-teal-600 text-white">
                <CardTitle className="text-sm font-bold">METHODS (학습과정)</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3 text-sm">
                <div>
                  <p className="font-bold text-teal-700 mb-1">학습 과정</p>
                  <ul className="space-y-1 ml-2">
                    <li className="flex gap-2">
                      <span className="text-teal-500">●</span>
                      <span>{classPlan.course1 || '-'}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-teal-500">●</span>
                      <span>{classPlan.course2 || '-'}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-teal-700 mb-1">교재</p>
                  <ul className="space-y-1 ml-2">
                    <li className="flex gap-2">
                      <span className="text-teal-500">○</span>
                      <span>{classPlan.material1 || '-'}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-teal-500">○</span>
                      <span>{classPlan.material2 || '-'}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-teal-700 mb-1">학습 관리</p>
                  <p className="whitespace-pre-wrap text-zinc-600">
                    {classPlan.management || "학습 관리 계획이 입력되지 않았습니다."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 우측 컬럼 */}
          <div className="space-y-4">
            {/* RESULTS (주차별 계획) */}
            <Card className="border-teal-200 overflow-hidden">
              <CardHeader className="p-3 pb-2 bg-teal-600 text-white">
                <CardTitle className="text-sm font-bold">CURRICULUM (주차별 계획)</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-1.5">
                  {(classPlan.weeklyPlan || []).slice(0, 8).map((week, i) => {
                    const defaultLabel = `${i + 1}주`;
                    const displayLabel = week.weekLabel || defaultLabel;
                    return (
                      <div key={i} className="flex items-start gap-2 p-1.5 rounded hover:bg-teal-50 transition-colors">
                        <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-teal-200 text-[9pt] px-2 shrink-0">
                          {displayLabel}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs">{week.topic || '-'}</div>
                          {week.detail && <div className="text-[9pt] text-zinc-500">{week.detail}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 달력 */}
            <Card className="border-teal-200 overflow-hidden">
              <CardHeader className="p-3 pb-2 bg-teal-600 text-white">
                <CardTitle className="text-sm font-bold">SCHEDULE (일정)</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <MonthlyCalendar classPlan={classPlan} />
              </CardContent>
            </Card>

            {/* CONCLUSIONS */}
            {classPlan.etc && (
              <Card className="border-teal-200 overflow-hidden">
                <CardHeader className="p-3 pb-2 bg-teal-600 text-white">
                  <CardTitle className="text-sm font-bold">CONCLUSIONS (특이사항)</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="text-sm leading-5 whitespace-pre-wrap">{classPlan.etc}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 수강료 안내 */}
        {feeInfo && feeInfo.rows.length > 0 && (
          <Card className="border-teal-300 shadow-sm overflow-hidden">
            <CardHeader className="p-3 pb-2 bg-teal-600 text-white">
              <CardTitle className="text-sm font-bold">{feeInfo.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-50 border-teal-100">
                    <TableHead className="text-[10pt] h-8 font-bold text-teal-800">월</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-teal-800">수업구분</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-teal-800">요일</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-teal-800">시간</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-teal-800 text-right">수강료</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-teal-800 text-center">회차</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-teal-800 text-right">합계</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-teal-800 text-right">총 합계</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedByMonth).map(([month, rows]) => {
                    const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                      rows.reduce((sum, row) => sum + row.subtotal, 0);
                    return rows.map((row, idx) => (
                      <TableRow key={`${month}-${idx}`} className="border-teal-100">
                        {idx === 0 && (
                          <TableCell className="py-2 font-bold bg-teal-50 text-teal-800" rowSpan={rows.length}>{month}</TableCell>
                        )}
                        <TableCell className="py-2">{row.classType}</TableCell>
                        <TableCell className="py-2">{row.day}</TableCell>
                        <TableCell className="py-2">{row.time}</TableCell>
                        <TableCell className="py-2 text-right">{row.unitFee.toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-center">{row.sessions}</TableCell>
                        <TableCell className="py-2 text-right font-medium">{row.subtotal.toLocaleString()}</TableCell>
                        {idx === 0 && (
                          <TableCell className="py-2 text-right font-bold text-teal-600 bg-teal-50" rowSpan={rows.length}>
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
        )}
      </div>

      {/* Footer */}
      <div className="bg-teal-700 text-white py-3 px-8 flex justify-between items-center text-[10pt]">
        <div className="flex items-center gap-4">
          <span className="font-bold">담당</span>
          <span>{classPlan.teacherName} 선생님</span>
        </div>
        <div className="font-bold tracking-wider">
          원리와 해석 수학학원
        </div>
      </div>
    </div>
  );
};

export default TemplateAcademic;




