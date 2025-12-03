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

const TemplateReport: React.FC<Props> = ({ classPlan }) => {
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, typeof feeInfo.rows> = {};
  feeInfo?.rows.forEach(row => {
    if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
    groupedByMonth[row.month].push(row);
  });

  return (
    <div className="w-[240mm] min-h-[260mm] bg-white flex flex-col text-zinc-900 font-jeju relative" style={{ fontSize: '11pt' }}>
      {/* 상단 오렌지 포인트 바 */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"></div>
      
      {/* Header */}
      <div className="px-10 pt-8 pb-4 mt-3">
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-4">
          <div className="text-left">
            <Badge className="bg-orange-500 text-white border-orange-500 mb-2 text-xs hover:bg-orange-500">
              ▶ WINTER SPECIAL
            </Badge>
            <h1 className="text-3xl font-black tracking-tight mb-1">겨울특강 계획서</h1>
            <p className="text-orange-500 font-bold text-sm tracking-widest">Winter Special Class Plan</p>
          </div>
          <img 
            src="/images/1.png" 
            alt="원리와 해석 수학학원" 
            className="h-16 object-contain"
          />
        </div>
      </div>

      <div className="px-8 py-2 flex-1 flex flex-col gap-3" style={{ fontSize: '10pt' }}>
        {/* 학부모 안내글 */}
        {classPlan.parentIntro && (
          <Card className="border-orange-200 bg-orange-50/30 shadow-sm">
            <CardContent className="p-3">
              <p className="text-sm leading-6 text-zinc-700 whitespace-pre-wrap">{classPlan.parentIntro}</p>
            </CardContent>
          </Card>
        )}

        {/* 기본 정보 카드들 */}
        <div className="grid grid-cols-12 gap-3">
          <Card className="col-span-4 border-zinc-200 bg-zinc-50 shadow-sm">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-[10pt] font-bold text-zinc-500 uppercase tracking-wider">강좌명</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-bold text-zinc-900">{classPlan.title}</div>
            </CardContent>
          </Card>
          
          <Card className="col-span-2 border-zinc-200 bg-zinc-50 shadow-sm">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-[10pt] font-bold text-zinc-500 uppercase tracking-wider">담당강사</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-base font-bold text-zinc-900">{classPlan.teacherName}</div>
            </CardContent>
          </Card>

          <Card className="col-span-6 border-zinc-200 bg-white shadow-sm">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10pt] font-bold text-zinc-500 uppercase block mb-1">수강대상</span>
                  <div className="font-bold text-sm text-zinc-900">{classPlan.targetStudent}</div>
                  {classPlan.targetStudentDetail && (
                    <div className="text-[10pt] text-zinc-600">{classPlan.targetStudentDetail}</div>
                  )}
                </div>
                <div>
                  <span className="text-[10pt] font-bold text-zinc-500 uppercase block mb-1">일정</span>
                  <div className="font-bold text-sm text-zinc-900">
                    {classPlan.classDay} {classPlan.classTime}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 학습과정 및 교재 / 학습목표 및 학습관리 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-sm"></span>
                학습과정 및 교재
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-200">
                    <TableHead className="text-[10pt] text-zinc-500 h-8 w-14">구분</TableHead>
                    <TableHead className="text-[10pt] text-zinc-500 h-8">과정명</TableHead>
                    <TableHead className="text-[10pt] text-zinc-500 h-8 text-right">교재</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-zinc-100">
                    <TableCell className="py-2 text-zinc-500 font-medium">과정1</TableCell>
                    <TableCell className="py-2">{classPlan.course1 || '-'}</TableCell>
                    <TableCell className="py-2 text-right">{classPlan.material1 || '-'}</TableCell>
                  </TableRow>
                  <TableRow className="border-zinc-100">
                    <TableCell className="py-2 text-zinc-400 font-medium">과정2</TableCell>
                    <TableCell className="py-2">{classPlan.course2 || '-'}</TableCell>
                    <TableCell className="py-2 text-right">{classPlan.material2 || '-'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="space-y-3">
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm font-bold text-zinc-800 border-b-2 border-zinc-800 pb-1 inline-block">학습목표</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <p className="text-sm leading-5 text-zinc-600 whitespace-pre-wrap border-l-2 border-zinc-300 pl-3">
                  {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
                </p>
              </CardContent>
            </Card>
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm font-bold text-zinc-800 border-b-2 border-zinc-800 pb-1 inline-block">학습관리</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <p className="text-sm leading-5 text-zinc-600 whitespace-pre-wrap border-l-2 border-zinc-300 pl-3">
                  {classPlan.management || "학습 관리 계획이 입력되지 않았습니다."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="bg-zinc-200" />

        {/* 홍보문구 */}
        {classPlan.etc && (
          <Card className="border-orange-200 bg-orange-50/30 shadow-sm">
            <CardContent className="p-3">
              <p className="text-sm leading-5 text-zinc-700 whitespace-pre-wrap">{classPlan.etc}</p>
            </CardContent>
          </Card>
        )}

        {/* 주차별 학습계획 */}
        <div>
          <h3 className="font-bold text-sm mb-2 text-zinc-800 flex items-center gap-2">
            <span className="w-1 h-4 bg-zinc-800 rounded-sm"></span>
            주차별 학습계획
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(classPlan.weeklyPlan || []).slice(0, 8).map((week, i) => {
              const defaultLabel = `${i + 1}주`;
              const displayLabel = week.weekLabel || defaultLabel;
              return (
                <Card key={i} className="border-zinc-200 bg-zinc-50 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-2 flex items-center gap-2">
                    <Badge variant="outline" className="border-zinc-400 text-zinc-700 text-[9pt] px-2 py-0.5 shrink-0">
                      {displayLabel}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs text-zinc-800 truncate">{week.topic || '-'}</div>
                      {week.detail && <div className="text-[9pt] text-zinc-500 truncate">{week.detail}</div>}
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
          <Card className="mt-auto border-zinc-300 shadow-md overflow-hidden">
            <CardHeader className="p-3 pb-2 bg-zinc-800 text-white">
              <CardTitle className="text-sm font-bold">{feeInfo.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-100 border-zinc-200">
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-700">월</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-700">수업구분</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-700">요일</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-700">시간</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-700 text-right">수강료</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-700 text-center">회차</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-700 text-right">합계</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-700 text-right">총 합계</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedByMonth).map(([month, rows]) => {
                    const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                      rows.reduce((sum, row) => sum + row.subtotal, 0);
                    return rows.map((row, idx) => (
                      <TableRow key={`${month}-${idx}`} className="border-zinc-100">
                        {idx === 0 && (
                          <TableCell className="py-2 font-bold bg-zinc-50 text-zinc-800" rowSpan={rows.length}>{month}</TableCell>
                        )}
                        <TableCell className="py-2">{row.classType}</TableCell>
                        <TableCell className="py-2">{row.day}</TableCell>
                        <TableCell className="py-2">{row.time}</TableCell>
                        <TableCell className="py-2 text-right">{row.unitFee.toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-center">{row.sessions}</TableCell>
                        <TableCell className="py-2 text-right font-medium">{row.subtotal.toLocaleString()}</TableCell>
                        {idx === 0 && (
                          <TableCell className="py-2 text-right font-bold text-orange-500 bg-zinc-50" rowSpan={rows.length}>
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
      <div className="bg-zinc-100 py-3 px-10 flex justify-between items-center text-[10pt] text-zinc-500 font-bold tracking-wide border-t border-zinc-200">
        <div>원리와 해석 수학학원</div>
        <div>Principle and Analysis Math Academy</div>
      </div>
    </div>
  );
};

export default TemplateReport;
