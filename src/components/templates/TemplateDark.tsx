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

// 다크모드 강좌 안내 스타일 템플릿
const TemplateDark: React.FC<Props> = ({ classPlan }) => {
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, typeof feeInfo.rows> = {};
  feeInfo?.rows.forEach(row => {
    if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
    groupedByMonth[row.month].push(row);
  });

  return (
    <div className="w-[240mm] min-h-[260mm] bg-zinc-950 flex flex-col text-zinc-100 font-jeju relative" style={{ fontSize: '11pt' }}>
      {/* 배경 그래픽 - 간소화 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 right-0 h-px bg-orange-500 opacity-10"></div>
        <div className="absolute top-1/3 left-0 right-0 h-px bg-orange-500 opacity-5"></div>
      </div>
      
      {/* 상하단 오렌지 포인트 바 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
      
      {/* Header */}
      <div className="relative px-10 pt-10 pb-8">
        <div className="text-center space-y-4">
          {/* 상단 작은 텍스트 */}
          <div className="flex justify-center items-center gap-2">
            <div className="h-px w-16 bg-orange-500 opacity-50"></div>
            <span className="text-orange-500 text-sm tracking-widest font-bold">단기 실전 완성 프로그램</span>
            <div className="h-px w-16 bg-orange-500 opacity-50"></div>
          </div>
          
          {/* 메인 타이틀 */}
          <h1 className="text-4xl font-black">
            <span className="text-orange-500">{classPlan.title}</span>
          </h1>
          
          {/* 부제목 */}
          <p className="text-zinc-400 text-lg">
            처음 시작이 <span className="text-orange-500 font-bold">합격</span>을 결정합니다
          </p>
          <p className="text-zinc-500 text-sm">
            원리와 해석 수학학원이 제안하는{' '}
            <span className="text-orange-500 font-bold">{classPlan.targetStudent}</span> 적응 프로그램!
          </p>
        </div>
      </div>

      <div className="relative px-8 py-4 flex-1 flex flex-col gap-4" style={{ fontSize: '10pt' }}>
        {/* 추천 대상 섹션 */}
        <Card className="bg-zinc-900 border-orange-500/30">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-bold text-center flex items-center justify-center gap-2">
              <span className="text-orange-500">👍</span>
              이런 분께 <span className="text-orange-500">추천</span>합니다
              <span className="text-orange-500">👍</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center border border-zinc-700">
                <p className="text-sm">{classPlan.targetStudent}를</p>
                <p className="text-sm">막 시작한 <span className="text-orange-500 font-bold">수험생</span></p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center border border-zinc-700">
                <p className="text-sm">기초 개념을</p>
                <p className="text-sm"><span className="text-orange-500 font-bold">빠르게</span> 다지고 싶은 학생</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center border border-zinc-700">
                <p className="text-sm">학습 루틴과 전략을</p>
                <p className="text-sm">잡고 싶은 <span className="text-orange-500 font-bold">초시생</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 프로그램 구성 */}
        <Card className="bg-zinc-900 border-orange-500/30">
          <CardHeader className="p-3 pb-2 border-b border-orange-500/30">
            <CardTitle className="text-sm font-bold text-center text-orange-500">
              프로그램 구성
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 border border-zinc-700 rounded-lg">
                <p className="text-zinc-400 text-xs mb-1">학습과정</p>
                <p className="text-orange-500 font-bold">{classPlan.course1 || '과정 1'}</p>
                {classPlan.material1 && <p className="text-xs text-zinc-500 mt-1">{classPlan.material1}</p>}
              </div>
              <div className="text-center p-3 border border-zinc-700 rounded-lg">
                <p className="text-zinc-400 text-xs mb-1">학습과정</p>
                <p className="text-orange-500 font-bold">{classPlan.course2 || '과정 2'}</p>
                {classPlan.material2 && <p className="text-xs text-zinc-500 mt-1">{classPlan.material2}</p>}
              </div>
              <div className="text-center p-3 border border-zinc-700 rounded-lg">
                <p className="text-zinc-400 text-xs mb-1">학습관리</p>
                <p className="text-orange-500 font-bold text-xs leading-relaxed whitespace-pre-wrap">
                  {classPlan.management || '학습 진단 컨설팅'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 수업 정보 */}
        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <TableRow className="border-zinc-700">
                  <TableCell className="py-2.5 w-24 bg-orange-500 text-white font-bold text-center">수업요일</TableCell>
                  <TableCell className="py-2.5 text-zinc-300">{classPlan.classDay}</TableCell>
                </TableRow>
                <TableRow className="border-zinc-700">
                  <TableCell className="py-2.5 bg-orange-500 text-white font-bold text-center">수업시간</TableCell>
                  <TableCell className="py-2.5 text-zinc-300">{classPlan.classTime}</TableCell>
                </TableRow>
                <TableRow className="border-zinc-700">
                  <TableCell className="py-2.5 bg-orange-500 text-white font-bold text-center">대상</TableCell>
                  <TableCell className="py-2.5 text-zinc-300">
                    {classPlan.targetStudent}
                    {classPlan.targetStudentDetail && ` / ${classPlan.targetStudentDetail}`}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 학습목표 & 안내사항 */}
        {(classPlan.learningGoal || classPlan.parentIntro) && (
          <div className="grid grid-cols-2 gap-3">
            {classPlan.learningGoal && (
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-bold text-orange-500">학습목표</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{classPlan.learningGoal}</p>
                </CardContent>
              </Card>
            )}
            {classPlan.parentIntro && (
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-bold text-orange-500">안내사항</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{classPlan.parentIntro}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 주차별 계획 & 달력 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 주차별 학습계획 */}
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader className="p-3 pb-2 border-b border-zinc-700">
              <CardTitle className="text-xs font-bold text-orange-500">주차별 학습계획</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {(classPlan.weeklyPlan || []).slice(0, 8).map((week, i) => {
                  const defaultLabel = `${i + 1}주`;
                  const displayLabel = week.weekLabel || defaultLabel;
                  return (
                    <div key={i} className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-800/50 transition-colors">
                      <Badge className="bg-orange-500 text-white hover:bg-orange-500 text-[9pt] px-2 shrink-0">
                        {displayLabel}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-zinc-300 truncate">{week.topic || '-'}</div>
                        {week.detail && <div className="text-[9pt] text-zinc-500 truncate">{week.detail}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 달력 */}
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader className="p-3 pb-2 border-b border-zinc-700">
              <CardTitle className="text-xs font-bold text-orange-500">수업 일정</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="[&_*]:!text-zinc-300 [&_table]:!border-zinc-700">
                <MonthlyCalendar classPlan={classPlan} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 수강료 안내 */}
        {feeInfo && feeInfo.rows.length > 0 && (
          <Card className="mt-auto bg-zinc-900 border-orange-500/30 overflow-hidden">
            <CardHeader className="p-3 pb-2 bg-orange-500 text-white">
              <CardTitle className="text-sm font-bold">{feeInfo.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-800 border-zinc-700">
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-300">월</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-300">수업구분</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-300">요일</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-300">시간</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-300 text-right">수강료</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-300 text-center">회차</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-300 text-right">합계</TableHead>
                    <TableHead className="text-[10pt] h-8 font-bold text-zinc-300 text-right">총 합계</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedByMonth).map(([month, rows]) => {
                    const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                      rows.reduce((sum, row) => sum + row.subtotal, 0);
                    return rows.map((row, idx) => (
                      <TableRow key={`${month}-${idx}`} className="border-zinc-700 bg-zinc-900/50">
                        {idx === 0 && (
                          <TableCell className="py-2 font-bold bg-zinc-800 text-orange-500" rowSpan={rows.length}>{month}</TableCell>
                        )}
                        <TableCell className="py-2 text-zinc-400">{row.classType}</TableCell>
                        <TableCell className="py-2 text-zinc-400">{row.day}</TableCell>
                        <TableCell className="py-2 text-zinc-400">{row.time}</TableCell>
                        <TableCell className="py-2 text-right text-zinc-400">{row.unitFee.toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-center text-zinc-400">{row.sessions}</TableCell>
                        <TableCell className="py-2 text-right font-medium text-zinc-400">{row.subtotal.toLocaleString()}</TableCell>
                        {idx === 0 && (
                          <TableCell className="py-2 text-right font-bold text-orange-500 bg-zinc-800" rowSpan={rows.length}>
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
      <div className="relative bg-zinc-900 py-4 px-10 border-t border-zinc-800">
        <div className="flex justify-between items-center text-[10pt]">
          <div className="font-bold text-zinc-400">원리와 해석 수학학원</div>
          <div className="flex items-center gap-6 text-zinc-500">
            <span>담당: {classPlan.teacherName}</span>
            <span>www.example.kr</span>
          </div>
        </div>
      </div>
      
      {/* 하단 오렌지 바 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"></div>
    </div>
  );
};

export default TemplateDark;

