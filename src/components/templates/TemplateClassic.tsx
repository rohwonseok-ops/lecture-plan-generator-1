'use client';

import React from 'react';
import { ClassPlan } from '@/lib/types';
import MonthlyCalendar from './MonthlyCalendar';
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

// 기본형 클래식 템플릿 - 깔끔하고 정돈된 스타일
const TemplateClassic: React.FC<Props> = ({ classPlan }) => {
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, typeof feeInfo.rows> = {};
  feeInfo?.rows.forEach(row => {
    if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
    groupedByMonth[row.month].push(row);
  });

  return (
    <div className="w-[240mm] min-h-[260mm] bg-white flex flex-col text-zinc-900 font-jeju" style={{ fontSize: '11pt' }}>
      {/* Header */}
      <div className="px-10 pt-8 pb-6 border-b-2 border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">겨울특강 강의계획서</h1>
            <p className="text-zinc-500 mt-1">원리와 해석 수학학원</p>
          </div>
          <img 
            src="/images/1.png" 
            alt="원리와 해석 수학학원" 
            className="h-14 object-contain"
          />
        </div>
      </div>

      <div className="px-8 py-6 flex-1 flex flex-col gap-5" style={{ fontSize: '10pt' }}>
        {/* 기본 정보 테이블 */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <Table>
            <TableBody>
              <TableRow className="border-zinc-200">
                <TableCell className="py-3 w-28 bg-zinc-100 font-bold text-zinc-700 border-r border-zinc-200">강좌명</TableCell>
                <TableCell className="py-3">{classPlan.title}</TableCell>
                <TableCell className="py-3 w-28 bg-zinc-100 font-bold text-zinc-700 border-r border-l border-zinc-200">담당강사</TableCell>
                <TableCell className="py-3">{classPlan.teacherName}</TableCell>
              </TableRow>
              <TableRow className="border-zinc-200">
                <TableCell className="py-3 bg-zinc-100 font-bold text-zinc-700 border-r border-zinc-200">수강대상</TableCell>
                <TableCell className="py-3">
                  {classPlan.targetStudent}
                  {classPlan.targetStudentDetail && ` (${classPlan.targetStudentDetail})`}
                </TableCell>
                <TableCell className="py-3 bg-zinc-100 font-bold text-zinc-700 border-r border-l border-zinc-200">수업일정</TableCell>
                <TableCell className="py-3">{classPlan.classDay} {classPlan.classTime}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* 학습목표 */}
        <div className="space-y-2">
          <h3 className="font-bold text-base text-zinc-800 border-l-4 border-zinc-800 pl-3">학습목표</h3>
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
            <p className="text-sm leading-6 whitespace-pre-wrap">
              {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
            </p>
          </div>
        </div>

        {/* 학부모 안내글 */}
        {classPlan.parentIntro && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm leading-6 text-zinc-700 whitespace-pre-wrap">{classPlan.parentIntro}</p>
          </div>
        )}

        {/* 학습과정 및 교재 */}
        <div className="space-y-2">
          <h3 className="font-bold text-base text-zinc-800 border-l-4 border-zinc-800 pl-3">학습과정 및 교재</h3>
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-100 border-zinc-200">
                  <TableHead className="text-[10pt] h-10 font-bold text-zinc-700 w-24">구분</TableHead>
                  <TableHead className="text-[10pt] h-10 font-bold text-zinc-700">학습과정</TableHead>
                  <TableHead className="text-[10pt] h-10 font-bold text-zinc-700 text-right">교재</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-zinc-200">
                  <TableCell className="py-3 bg-zinc-50 font-medium">과정 1</TableCell>
                  <TableCell className="py-3">{classPlan.course1 || '-'}</TableCell>
                  <TableCell className="py-3 text-right">{classPlan.material1 || '-'}</TableCell>
                </TableRow>
                <TableRow className="border-zinc-200">
                  <TableCell className="py-3 bg-zinc-50 font-medium">과정 2</TableCell>
                  <TableCell className="py-3">{classPlan.course2 || '-'}</TableCell>
                  <TableCell className="py-3 text-right">{classPlan.material2 || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 학습관리 */}
        {classPlan.management && (
          <div className="space-y-2">
            <h3 className="font-bold text-base text-zinc-800 border-l-4 border-zinc-800 pl-3">학습관리</h3>
            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <p className="text-sm leading-6 whitespace-pre-wrap">{classPlan.management}</p>
            </div>
          </div>
        )}

        {/* 홍보문구 */}
        {classPlan.etc && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm leading-5 text-zinc-700 whitespace-pre-wrap">{classPlan.etc}</p>
          </div>
        )}

        {/* 주차별 학습계획 및 달력 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-bold text-base text-zinc-800 border-l-4 border-zinc-800 pl-3">주차별 학습계획</h3>
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <div className="p-3 space-y-1.5">
                {(classPlan.weeklyPlan || []).slice(0, 8).map((week, i) => {
                  const defaultLabel = `${i + 1}주`;
                  const displayLabel = week.weekLabel || defaultLabel;
                  return (
                    <div key={i} className="flex items-start gap-3 p-2 rounded hover:bg-zinc-50">
                      <span className="inline-flex items-center justify-center min-w-[36px] h-6 px-2 text-[9pt] font-bold text-white bg-zinc-700 rounded shrink-0">
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
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-zinc-800 border-l-4 border-zinc-800 pl-3">수업 일정</h3>
            <MonthlyCalendar classPlan={classPlan} />
          </div>
        </div>

        {/* 수강료 안내 */}
        {feeInfo && feeInfo.rows.length > 0 && (
          <div className="space-y-2 mt-auto">
            <h3 className="font-bold text-base text-zinc-800 border-l-4 border-zinc-800 pl-3">{feeInfo.title}</h3>
            <div className="border border-zinc-300 rounded-lg overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-800 text-white">
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
                      <TableRow key={`${month}-${idx}`} className="border-zinc-200">
                        {idx === 0 && (
                          <TableCell className="py-2 font-bold bg-zinc-100" rowSpan={rows.length}>{month}</TableCell>
                        )}
                        <TableCell className="py-2">{row.classType}</TableCell>
                        <TableCell className="py-2">{row.day}</TableCell>
                        <TableCell className="py-2">{row.time}</TableCell>
                        <TableCell className="py-2 text-right">{row.unitFee.toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-center">{row.sessions}</TableCell>
                        <TableCell className="py-2 text-right font-medium">{row.subtotal.toLocaleString()}</TableCell>
                        {idx === 0 && (
                          <TableCell className="py-2 text-right font-bold bg-zinc-100" rowSpan={rows.length}>
                            {monthTotal.toLocaleString()}
                          </TableCell>
                        )}
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-zinc-800 text-white py-3 px-10 mt-4 flex justify-between items-center text-[10pt]">
        <div className="font-bold">원리와 해석 수학학원</div>
        <div className="text-zinc-400">Principle and Analysis Math Academy</div>
      </div>
    </div>
  );
};

export default TemplateClassic;

