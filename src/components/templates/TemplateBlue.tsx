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

const TemplateBlue: React.FC<Props> = ({ classPlan }) => {
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, typeof feeInfo.rows> = {};
  feeInfo?.rows.forEach(row => {
    if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
    groupedByMonth[row.month].push(row);
  });

  return (
    <div className="w-[240mm] min-h-[260mm] bg-gradient-to-b from-slate-50 to-blue-50 flex flex-col text-zinc-900 font-jeju" style={{ fontSize: '11pt' }}>
      {/* Header - 네이비 그라데이션 */}
      <div className="relative px-10 pt-8 pb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
        {/* 그리드 패턴 배경 */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
        
        <div className="relative flex items-center justify-between">
          <div className="text-left">
            <Badge className="bg-blue-500/30 text-blue-100 border-blue-400/50 mb-2 text-xs">
              ◆ Winter Special
            </Badge>
            <h1 className="text-3xl font-black tracking-tight mb-1">겨울특강 계획서</h1>
            <p className="text-blue-200/70 text-sm tracking-widest">Winter Special Class Plan</p>
          </div>
          <img 
            src="/images/1.png" 
            alt="원리와 해석 수학학원" 
            className="h-16 object-contain brightness-0 invert opacity-80"
          />
        </div>
      </div>

      <div className="px-8 py-4 flex-1 flex flex-col gap-4" style={{ fontSize: '10pt' }}>
        {/* 학부모 안내글 */}
        {classPlan.parentIntro && (
          <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
            <CardContent className="p-3">
              <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">{classPlan.parentIntro}</p>
            </CardContent>
          </Card>
        )}

        {/* 기본 정보 카드들 */}
        <div className="grid grid-cols-12 gap-3">
          <Card className="col-span-4 border-blue-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-[10pt] font-bold text-blue-600 uppercase tracking-wider">강좌명</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-bold text-slate-900">{classPlan.title}</div>
            </CardContent>
          </Card>
          
          <Card className="col-span-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-[10pt] font-bold text-blue-600 uppercase tracking-wider">담당강사</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-base font-bold text-slate-900">{classPlan.teacherName}</div>
            </CardContent>
          </Card>

          <Card className="col-span-6 border-blue-100 shadow-sm bg-white">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10pt] font-bold text-blue-600 uppercase block mb-1">수강대상</span>
                  <div className="font-bold text-sm text-slate-900">{classPlan.targetStudent}</div>
                  {classPlan.targetStudentDetail && (
                    <div className="text-[10pt] text-slate-600">{classPlan.targetStudentDetail}</div>
                  )}
                </div>
                <div>
                  <span className="text-[10pt] font-bold text-blue-600 uppercase block mb-1">일정</span>
                  <div className="font-bold text-sm text-slate-900">
                    {classPlan.classDay} {classPlan.classTime}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 학습과정 및 교재 / 학습목표 및 학습관리 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-blue-100 shadow-sm bg-white">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm font-bold text-blue-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded"></span>
                학습과정 및 교재
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-blue-100">
                    <TableHead className="text-[10pt] text-blue-600 h-8 w-14">구분</TableHead>
                    <TableHead className="text-[10pt] text-blue-600 h-8">과정명</TableHead>
                    <TableHead className="text-[10pt] text-blue-600 h-8 text-right">교재</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-blue-50">
                    <TableCell className="py-2 text-blue-600 font-medium">과정1</TableCell>
                    <TableCell className="py-2">{classPlan.course1 || '-'}</TableCell>
                    <TableCell className="py-2 text-right">{classPlan.material1 || '-'}</TableCell>
                  </TableRow>
                  <TableRow className="border-blue-50">
                    <TableCell className="py-2 text-blue-500 font-medium">과정2</TableCell>
                    <TableCell className="py-2">{classPlan.course2 || '-'}</TableCell>
                    <TableCell className="py-2 text-right">{classPlan.material2 || '-'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="space-y-3">
            <Card className="border-blue-100 shadow-sm bg-white">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm font-bold text-blue-700 border-b-2 border-blue-600 pb-1 inline-block">학습목표</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <p className="text-sm leading-5 text-slate-600 whitespace-pre-wrap border-l-2 border-blue-200 pl-3">
                  {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-100 shadow-sm bg-white">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm font-bold text-blue-700 border-b-2 border-blue-600 pb-1 inline-block">학습관리</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <p className="text-sm leading-5 text-slate-600 whitespace-pre-wrap border-l-2 border-blue-200 pl-3">
                  {classPlan.management || "학습 관리 계획이 입력되지 않았습니다."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="bg-blue-100" />

        {/* 홍보문구 */}
        {classPlan.etc && (
          <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
            <CardContent className="p-3">
              <p className="text-sm leading-5 text-slate-700 whitespace-pre-wrap">{classPlan.etc}</p>
            </CardContent>
          </Card>
        )}

        {/* 주차별 학습계획 */}
        <div>
          <h3 className="font-bold text-sm mb-2 text-slate-800 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded"></span>
            주차별 학습계획
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(classPlan.weeklyPlan || []).slice(0, 8).map((week, i) => {
              const defaultLabel = `${i + 1}주`;
              const displayLabel = week.weekLabel || defaultLabel;
              return (
                <Card key={i} className="border-blue-100 bg-white shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-2 flex items-center gap-2">
                    <Badge variant="outline" className="border-blue-400 text-blue-700 text-[9pt] px-2 py-0.5 shrink-0">
                      {displayLabel}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs text-slate-800 truncate">{week.topic || '-'}</div>
                      {week.detail && <div className="text-[9pt] text-slate-500 truncate">{week.detail}</div>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 달력 */}
        <MonthlyCalendar classPlan={classPlan} />

        {/* 수강료 안내 */}
        {feeInfo && feeInfo.rows.length > 0 && (
          <Card className="mt-auto border-blue-200 shadow-md overflow-hidden">
            <CardHeader className="p-3 pb-2 bg-gradient-to-r from-slate-800 to-blue-800 text-white">
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
                      <TableRow key={`${month}-${idx}`} className="border-blue-50">
                        {idx === 0 && (
                          <TableCell className="py-2 font-bold bg-blue-50 text-blue-800" rowSpan={rows.length}>{month}</TableCell>
                        )}
                        <TableCell className="py-2 text-slate-700">{row.classType}</TableCell>
                        <TableCell className="py-2 text-slate-700">{row.day}</TableCell>
                        <TableCell className="py-2 text-slate-700">{row.time}</TableCell>
                        <TableCell className="py-2 text-right text-slate-700">{row.unitFee.toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-center text-slate-700">{row.sessions}</TableCell>
                        <TableCell className="py-2 text-right font-medium text-slate-700">{row.subtotal.toLocaleString()}</TableCell>
                        {idx === 0 && (
                          <TableCell className="py-2 text-right font-bold text-blue-700 bg-blue-50" rowSpan={rows.length}>
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
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-3 px-10 flex justify-between items-center text-[10pt] font-bold tracking-wide">
        <div>원리와 해석 수학학원</div>
        <div className="text-blue-200/70">Principle and Analysis Math Academy</div>
      </div>
    </div>
  );
};

export default TemplateBlue;
