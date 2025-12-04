'use client';

import React from 'react';
import { ClassPlan } from '@/lib/types';
import MonthlyCalendar from './MonthlyCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

// 네이비 블루 테마 템플릿 - 전문적이고 신뢰감 있는 스타일
const TemplateBlue: React.FC<Props> = ({ classPlan }) => {
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, typeof feeInfo.rows> = {};
  feeInfo?.rows.forEach(row => {
    if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
    groupedByMonth[row.month].push(row);
  });

  return (
    <div className="w-[240mm] min-h-[260mm] bg-white flex flex-col text-zinc-900 font-jeju" style={{ fontSize: '11pt' }}>
      {/* Header - 네이비 그라데이션 */}
      <div className="px-10 pt-6 pb-6 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-400/30 text-blue-100 border-blue-300/30">2025 WINTER</Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight">겨울특강 계획서</h1>
            <p className="text-blue-200 mt-1">원리와 해석 수학학원</p>
          </div>
          <div className="text-right">
            <img 
              src="/images/1.png" 
              alt="원리와 해석 수학학원" 
              className="h-14 object-contain brightness-0 invert opacity-80 mb-2"
            />
          </div>
        </div>
      </div>

      {/* 강좌 정보 바 */}
      <div className="px-8 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div><span className="text-blue-600 font-bold">강좌명</span> <span className="ml-1">{classPlan.title}</span></div>
          <div><span className="text-blue-600 font-bold">담당</span> <span className="ml-1">{classPlan.teacherName}</span></div>
          <div><span className="text-blue-600 font-bold">대상</span> <span className="ml-1">{classPlan.targetStudent}</span></div>
        </div>
        <Badge className="bg-blue-600 text-white">{classPlan.classDay} {classPlan.classTime}</Badge>
      </div>

      <div className="px-8 py-5 flex-1 flex flex-col gap-4" style={{ fontSize: '10pt' }}>
        {/* 학습 개요 */}
        <Card className="border-blue-200 overflow-hidden shadow-sm">
          <CardHeader className="p-3 pb-2 bg-blue-800 text-white">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              학습목표
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm leading-6 whitespace-pre-wrap">
              {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
            </p>
          </CardContent>
        </Card>

        {/* 학부모 안내글 */}
        {classPlan.parentIntro && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="text-sm leading-6 text-zinc-700 whitespace-pre-wrap">{classPlan.parentIntro}</p>
          </div>
        )}

        {/* 학습과정 및 학습관리 - 2열 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-blue-200 overflow-hidden">
            <CardHeader className="p-3 pb-2 bg-blue-800 text-white">
              <CardTitle className="text-sm font-bold">학습과정 및 교재</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="border-blue-100">
                    <TableCell className="py-2.5 w-20 bg-blue-50 font-bold text-blue-800">과정 1</TableCell>
                    <TableCell className="py-2.5">{classPlan.course1 || '-'}</TableCell>
                    <TableCell className="py-2.5 text-right text-zinc-500">{classPlan.material1 || '-'}</TableCell>
                  </TableRow>
                  <TableRow className="border-blue-100">
                    <TableCell className="py-2.5 bg-blue-50 font-bold text-blue-800">과정 2</TableCell>
                    <TableCell className="py-2.5">{classPlan.course2 || '-'}</TableCell>
                    <TableCell className="py-2.5 text-right text-zinc-500">{classPlan.material2 || '-'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-blue-200 overflow-hidden">
            <CardHeader className="p-3 pb-2 bg-blue-800 text-white">
              <CardTitle className="text-sm font-bold">학습관리</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <p className="text-sm leading-5 whitespace-pre-wrap">
                {classPlan.management || "학습 관리 계획이 입력되지 않았습니다."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 홍보문구 */}
        {classPlan.etc && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm leading-5 text-zinc-700 whitespace-pre-wrap">{classPlan.etc}</p>
          </div>
        )}

        {/* 주차별 학습계획 및 달력 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-blue-200 overflow-hidden">
            <CardHeader className="p-3 pb-2 bg-blue-800 text-white">
              <CardTitle className="text-sm font-bold">주차별 학습계획</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-1.5">
                {(classPlan.weeklyPlan || []).slice(0, 8).map((week, i) => {
                  const defaultLabel = `${i + 1}주`;
                  const displayLabel = week.weekLabel || defaultLabel;
                  return (
                    <div key={i} className="flex items-start gap-2 p-1.5 rounded hover:bg-blue-50 transition-colors">
                      <span className="inline-flex items-center justify-center min-w-[32px] h-5 px-1.5 text-[9pt] font-bold text-white bg-blue-700 rounded shrink-0">
                        {displayLabel}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-zinc-800">{week.topic || '-'}</div>
                        {week.detail && <div className="text-[9pt] text-zinc-500">{week.detail}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 overflow-hidden">
            <CardHeader className="p-3 pb-2 bg-blue-800 text-white">
              <CardTitle className="text-sm font-bold">수업 일정</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <MonthlyCalendar classPlan={classPlan} />
            </CardContent>
          </Card>
        </div>

        {/* 수강료 안내 */}
        {feeInfo && feeInfo.rows.length > 0 && (
          <Card className="border-blue-300 overflow-hidden shadow-sm mt-auto">
            <CardHeader className="p-3 pb-2 bg-blue-800 text-white">
              <CardTitle className="text-sm font-bold">{feeInfo.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50 border-blue-100">
                    <TableHead className="text-[10pt] h-8 font-bold text-blue-800">월</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-blue-800">수업구분</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-blue-800">요일</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-blue-800">시간</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-blue-800 text-right">수강료</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-blue-800 text-center">회차</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-blue-800 text-right">합계</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-blue-800 text-right">총 합계</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedByMonth).map(([month, rows]) => {
                    const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                      rows.reduce((sum, row) => sum + row.subtotal, 0);
                    return rows.map((row, idx) => (
                      <TableRow key={`${month}-${idx}`} className="border-blue-100">
                        {idx === 0 && (
                          <TableCell className="py-2 font-bold bg-blue-50 text-blue-800" rowSpan={rows.length}>{month}</TableCell>
                        )}
                        <TableCell className="py-2">{row.classType}</TableCell>
                        <TableCell className="py-2">{row.day}</TableCell>
                        <TableCell className="py-2">{row.time}</TableCell>
                        <TableCell className="py-2 text-right">{row.unitFee.toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-center">{row.sessions}</TableCell>
                        <TableCell className="py-2 text-right font-medium">{row.subtotal.toLocaleString()}</TableCell>
                        {idx === 0 && (
                          <TableCell className="py-2 text-right font-bold text-blue-600 bg-blue-50" rowSpan={rows.length}>
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
      <div className="bg-blue-900 text-white py-3 px-10 mt-4 flex justify-between items-center text-[10pt]">
        <div className="font-bold">원리와 해석 수학학원</div>
        <div className="text-blue-300">Principle and Analysis Math Academy</div>
      </div>
    </div>
  );
};

export default TemplateBlue;

