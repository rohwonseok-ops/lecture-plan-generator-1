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

// 보라색 프로젝트 상태 보고서 스타일 템플릿
const TemplatePurple: React.FC<Props> = ({ classPlan }) => {
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, typeof feeInfo.rows> = {};
  feeInfo?.rows.forEach(row => {
    if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
    groupedByMonth[row.month].push(row);
  });

  return (
    <div className="w-[240mm] min-h-[260mm] bg-white flex flex-col text-zinc-900 font-jeju" style={{ fontSize: '11pt' }}>
      {/* Header - 보라색 아이콘과 타이틀 */}
      <div className="px-10 pt-6 pb-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* 아이콘 박스 */}
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span className="text-zinc-900">겨울특강</span>{' '}
              <span className="text-purple-600">계획서</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">WINTER CLASS PLAN</p>
          </div>
        </div>
        
        {/* 우측 정보 박스 */}
        <Card className="border-zinc-200 shadow-sm min-w-[200px]">
          <CardContent className="p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">강좌명</span>
              <span className="font-medium">{classPlan.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">담당강사</span>
              <span className="font-medium">{classPlan.teacherName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">일정</span>
              <span className="font-medium">{classPlan.classDay} {classPlan.classTime}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-8 flex-1 flex flex-col gap-4" style={{ fontSize: '10pt' }}>
        {/* Status Summary - 상태 요약 섹션 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-600 rounded"></div>
            <h3 className="font-bold text-base text-zinc-800">강좌 개요</h3>
          </div>
          
          <Card className="border-purple-100 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="border-purple-100 bg-purple-50/30">
                    <TableCell className="py-2.5 w-32 bg-purple-100/50 font-bold text-purple-800">수강대상</TableCell>
                    <TableCell className="py-2.5">
                      {classPlan.targetStudent}
                      {classPlan.targetStudentDetail && (
                        <span className="text-zinc-500 ml-2">({classPlan.targetStudentDetail})</span>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-purple-100">
                    <TableCell className="py-2.5 bg-purple-100/50 font-bold text-purple-800">학습목표</TableCell>
                    <TableCell className="py-2.5 whitespace-pre-wrap">
                      {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-purple-100 bg-purple-50/30">
                    <TableCell className="py-2.5 bg-purple-100/50 font-bold text-purple-800">학습관리</TableCell>
                    <TableCell className="py-2.5 whitespace-pre-wrap">
                      {classPlan.management || "학습 관리 계획이 입력되지 않았습니다."}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* 학부모 안내글 */}
        {classPlan.parentIntro && (
          <Card className="border-purple-100 bg-purple-50/30">
            <CardContent className="p-3">
              <p className="text-sm leading-6 text-zinc-700 whitespace-pre-wrap">{classPlan.parentIntro}</p>
            </CardContent>
          </Card>
        )}

        {/* 학습과정 및 교재 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-600 rounded"></div>
            <h3 className="font-bold text-base text-zinc-800">학습과정 및 교재</h3>
          </div>
          
          <Card className="border-purple-100 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-purple-100/50 border-purple-100">
                    <TableHead className="text-[10pt] h-9 font-bold text-purple-800 w-24">구분</TableHead>
                    <TableHead className="text-[10pt] h-9 font-bold text-purple-800">과정명</TableHead>
                    <TableHead className="text-[10pt] h-9 font-bold text-purple-800 text-right">교재</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-purple-100">
                    <TableCell className="py-2.5 bg-purple-50/50 font-medium text-purple-700">과정 1</TableCell>
                    <TableCell className="py-2.5">{classPlan.course1 || '-'}</TableCell>
                    <TableCell className="py-2.5 text-right">{classPlan.material1 || '-'}</TableCell>
                  </TableRow>
                  <TableRow className="border-purple-100">
                    <TableCell className="py-2.5 bg-purple-50/50 font-medium text-purple-700">과정 2</TableCell>
                    <TableCell className="py-2.5">{classPlan.course2 || '-'}</TableCell>
                    <TableCell className="py-2.5 text-right">{classPlan.material2 || '-'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* 홍보문구 */}
        {classPlan.etc && (
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardContent className="p-3">
              <p className="text-sm leading-5 text-zinc-700 whitespace-pre-wrap">{classPlan.etc}</p>
            </CardContent>
          </Card>
        )}

        {/* 주차별 학습계획 - 2열 레이아웃 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 주차별 계획 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-purple-600 rounded"></div>
              <h3 className="font-bold text-base text-zinc-800">주차별 학습계획</h3>
            </div>
            
            <Card className="border-purple-100 overflow-hidden">
              <CardContent className="p-2">
                <div className="space-y-1">
                  {(classPlan.weeklyPlan || []).slice(0, 8).map((week, i) => {
                    const defaultLabel = `${i + 1}주`;
                    const displayLabel = week.weekLabel || defaultLabel;
                    return (
                      <div key={i} className="flex items-start gap-2 p-1.5 rounded hover:bg-purple-50/50">
                        <span className="inline-flex items-center justify-center min-w-[32px] h-5 px-1.5 text-[9pt] font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded shrink-0">
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
          </div>

          {/* 달력 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-purple-600 rounded"></div>
              <h3 className="font-bold text-base text-zinc-800">일정</h3>
            </div>
            <MonthlyCalendar classPlan={classPlan} />
          </div>
        </div>

        {/* 수강료 안내 */}
        {feeInfo && feeInfo.rows.length > 0 && (
          <div className="space-y-2 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-purple-600 rounded"></div>
              <h3 className="font-bold text-base text-zinc-800">{feeInfo.title}</h3>
            </div>
            
            <Card className="border-purple-200 overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-600 text-white">
                      <TableHead className="text-[10pt] h-9 font-bold text-white">월</TableHead>
                      <TableHead className="text-[10pt] h-9 font-bold text-white">수업구분</TableHead>
                      <TableHead className="text-[10pt] h-9 font-bold text-white">요일</TableHead>
                      <TableHead className="text-[10pt] h-9 font-bold text-white">시간</TableHead>
                      <TableHead className="text-[10pt] h-9 font-bold text-white text-right">수강료</TableHead>
                      <TableHead className="text-[10pt] h-9 font-bold text-white text-center">회차</TableHead>
                      <TableHead className="text-[10pt] h-9 font-bold text-white text-right">합계</TableHead>
                      <TableHead className="text-[10pt] h-9 font-bold text-white text-right">총 합계</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedByMonth).map(([month, rows]) => {
                      const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                        rows.reduce((sum, row) => sum + row.subtotal, 0);
                      return rows.map((row, idx) => (
                        <TableRow key={`${month}-${idx}`} className="border-purple-100">
                          {idx === 0 && (
                            <TableCell className="py-2 font-bold bg-purple-50 text-purple-800" rowSpan={rows.length}>{month}</TableCell>
                          )}
                          <TableCell className="py-2">{row.classType}</TableCell>
                          <TableCell className="py-2">{row.day}</TableCell>
                          <TableCell className="py-2">{row.time}</TableCell>
                          <TableCell className="py-2 text-right">{row.unitFee.toLocaleString()}</TableCell>
                          <TableCell className="py-2 text-center">{row.sessions}</TableCell>
                          <TableCell className="py-2 text-right font-medium">{row.subtotal.toLocaleString()}</TableCell>
                          {idx === 0 && (
                            <TableCell className="py-2 text-right font-bold text-purple-600 bg-purple-50" rowSpan={rows.length}>
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

      {/* Footer */}
      <div className="bg-purple-600 text-white py-3 px-10 mt-4 flex justify-between items-center text-[10pt] font-bold">
        <div>원리와 해석 수학학원</div>
        <div className="text-purple-200">Principle and Analysis Math Academy</div>
      </div>
    </div>
  );
};

export default TemplatePurple;

