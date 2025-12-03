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

// 오렌지 멘토링 활동 보고서 스타일 템플릿
const TemplateMentoring: React.FC<Props> = ({ classPlan }) => {
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, typeof feeInfo.rows> = {};
  feeInfo?.rows.forEach(row => {
    if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
    groupedByMonth[row.month].push(row);
  });

  return (
    <div className="w-[240mm] min-h-[260mm] bg-white flex flex-col text-zinc-900 font-jeju relative" style={{ fontSize: '11pt' }}>
      {/* 좌상단 장식 삼각형 */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-zinc-500 to-zinc-400 clip-triangle"></div>
      
      {/* Header - 오렌지 배경 */}
      <div className="mx-6 mt-6 px-8 py-5 bg-gradient-to-r from-orange-500 to-orange-400 rounded-t-lg relative overflow-hidden">
        {/* 장식 패턴 */}
        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-orange-600/30 to-transparent"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">
              겨울특강 <span className="font-normal">계획서</span>
            </h1>
          </div>
          <div className="text-right text-white">
            <p className="text-sm opacity-80">작성 일자</p>
            <p className="font-bold">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="px-8 mx-6 py-4 flex-1 flex flex-col gap-4 border-x border-b border-zinc-200 rounded-b-lg" style={{ fontSize: '10pt' }}>
        {/* 기본 정보 테이블 */}
        <Card className="border-zinc-300 overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="grid grid-cols-8 text-sm">
              <div className="col-span-1 bg-zinc-700 text-white p-2 font-bold text-center flex items-center justify-center">
                강좌명
              </div>
              <div className="col-span-2 p-2 border-b border-r border-zinc-200 flex items-center">
                {classPlan.title}
              </div>
              <div className="col-span-1 bg-zinc-200 p-2 font-bold text-center flex items-center justify-center">
                담당강사
              </div>
              <div className="col-span-1 p-2 border-b border-r border-zinc-200 flex items-center">
                {classPlan.teacherName}
              </div>
              <div className="col-span-1 bg-zinc-700 text-white p-2 font-bold text-center flex items-center justify-center">
                대상
              </div>
              <div className="col-span-2 p-2 border-b border-zinc-200 flex items-center">
                {classPlan.targetStudent}
                {classPlan.targetStudentDetail && (
                  <span className="text-zinc-500 ml-1">({classPlan.targetStudentDetail})</span>
                )}
              </div>
              
              <div className="col-span-1 bg-zinc-700 text-white p-2 font-bold text-center flex items-center justify-center">
                일 정
              </div>
              <div className="col-span-7 p-2 flex items-center">
                {classPlan.classDay} {classPlan.classTime}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 수업 일시 배너 */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white py-2.5 px-4 rounded-lg text-center font-bold shadow-sm">
          수업 일정 | {classPlan.classDay} {classPlan.classTime}
        </div>

        {/* 학습목표 섹션 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
            <h3 className="font-bold text-orange-500">학습 목표</h3>
          </div>
          <Card className="border-zinc-200 bg-zinc-50/50">
            <CardContent className="p-3">
              <p className="text-sm leading-6 whitespace-pre-wrap">
                {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 학습과정 섹션 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
            <h3 className="font-bold text-orange-500">학습 과정</h3>
          </div>
          <Card className="border-zinc-200 bg-orange-50/30">
            <CardContent className="p-3 space-y-2">
              <div className="flex gap-2">
                <Badge className="bg-zinc-700 text-white hover:bg-zinc-700">01</Badge>
                <span>{classPlan.course1 || '-'}</span>
                {classPlan.material1 && <span className="text-zinc-500">({classPlan.material1})</span>}
              </div>
              <div className="flex gap-2">
                <Badge className="bg-zinc-700 text-white hover:bg-zinc-700">02</Badge>
                <span>{classPlan.course2 || '-'}</span>
                {classPlan.material2 && <span className="text-zinc-500">({classPlan.material2})</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 학습관리 섹션 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
            <h3 className="font-bold text-orange-500">학습 관리</h3>
          </div>
          <Card className="border-zinc-200 bg-zinc-50/50">
            <CardContent className="p-3">
              <p className="text-sm leading-6 whitespace-pre-wrap">
                {classPlan.management || "학습 관리 계획이 입력되지 않았습니다."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 학부모 안내글 */}
        {classPlan.parentIntro && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
              <h3 className="font-bold text-orange-500">안내 사항</h3>
            </div>
            <Card className="border-zinc-200 bg-zinc-50/50">
              <CardContent className="p-3">
                <p className="text-sm leading-6 whitespace-pre-wrap">{classPlan.parentIntro}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 홍보문구 */}
        {classPlan.etc && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
              <h3 className="font-bold text-orange-500">특이 사항</h3>
            </div>
            <Card className="border-zinc-200">
              <CardContent className="p-3">
                <p className="text-sm leading-5 whitespace-pre-wrap">{classPlan.etc}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 주차별 계획 & 달력 - 2열 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 주차별 학습계획 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
              <h3 className="font-bold text-orange-500">주차별 학습계획</h3>
            </div>
            <div className="space-y-1.5">
              {(classPlan.weeklyPlan || []).slice(0, 8).map((week, i) => {
                const defaultLabel = `${i + 1}주`;
                const displayLabel = week.weekLabel || defaultLabel;
                return (
                  <Card key={i} className="border-zinc-200 hover:border-orange-300 transition-colors">
                    <CardContent className="p-2 flex items-center gap-2">
                      <Badge className="bg-orange-500 text-white hover:bg-orange-500 text-[9pt] px-2 shrink-0">
                        {displayLabel}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate">{week.topic || '-'}</div>
                        {week.detail && <div className="text-[9pt] text-zinc-500 truncate">{week.detail}</div>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 달력 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
              <h3 className="font-bold text-orange-500">수업 일정</h3>
            </div>
            <MonthlyCalendar classPlan={classPlan} />
          </div>
        </div>

        {/* 수강료 안내 */}
        {feeInfo && feeInfo.rows.length > 0 && (
          <Card className="mt-auto border-zinc-300 shadow-sm overflow-hidden">
            <CardHeader className="p-3 pb-2 bg-zinc-700 text-white">
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
                          <TableCell className="py-2 font-bold bg-zinc-50" rowSpan={rows.length}>{month}</TableCell>
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
      <div className="mx-6 mb-4">
        <Separator className="my-3" />
        <div className="text-center text-[10pt] text-zinc-400 font-bold tracking-widest">
          원리와 해석 수학학원
        </div>
      </div>
      
      {/* 우하단 장식 삼각형 */}
      <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-orange-500 to-orange-400 clip-triangle-br"></div>
      
      <style jsx>{`
        .clip-triangle {
          clip-path: polygon(0 0, 100% 0, 0 100%);
        }
        .clip-triangle-br {
          clip-path: polygon(100% 0, 100% 100%, 0 100%);
        }
      `}</style>
    </div>
  );
};

export default TemplateMentoring;




