'use client';

import React from 'react';
import { ClassPlan } from '@/lib/types';
import MonthlyCalendar from './MonthlyCalendar';

interface Props {
  classPlan: ClassPlan;
}

/**
 * TemplateTeal - design.v3.json 기반
 * 학술 연구 포스터 스타일 - 깔끔하고 정돈된 레이아웃
 * 
 * 색상 팔레트:
 * - teal900: #1B7A6E (주요 강조색)
 * - teal600: #3AAFA0
 * - teal400: #7BCFC5
 * - gray700: #374151 (본문 텍스트)
 * - white: #FFFFFF (배경)
 */
const TemplateTeal: React.FC<Props> = ({ classPlan }) => {
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, typeof feeInfo.rows> = {};
  feeInfo?.rows.forEach(row => {
    if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
    groupedByMonth[row.month].push(row);
  });

  return (
    <div 
      className="w-[240mm] min-h-[260mm] bg-white flex flex-col font-['Noto_Sans_KR',_sans-serif]"
      style={{ fontSize: '14px', lineHeight: '1.8', color: '#374151' }}
    >
      {/* Header Banner */}
      <div 
        className="relative bg-white px-12 pt-6 pb-8"
        style={{ borderBottom: '4px solid #1B7A6E' }}
      >
        {/* Top Right Badge */}
        <div 
          className="absolute top-0 right-0 w-[120px] h-[120px] flex flex-col items-center justify-center"
          style={{ 
            backgroundColor: '#1B7A6E',
            clipPath: 'polygon(100% 0, 100% 100%, 0 0)'
          }}
        >
          <img 
            src="/images/1.png" 
            alt="원리와 해석" 
            className="w-10 h-10 object-contain brightness-0 invert absolute top-4 right-4"
          />
        </div>

        {/* Logo Area */}
        <div className="flex items-center gap-2 mb-4">
          <div 
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ backgroundColor: '#1B7A6E' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-semibold" style={{ fontSize: '18px', color: '#1B7A6E' }}>
            원리와 해석 수학학원
          </span>
        </div>

        {/* Title */}
        <h1 
          className="font-bold"
          style={{ 
            fontSize: '48px', 
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            color: '#1B7A6E'
          }}
        >
          {classPlan.title || '강좌명'}
        </h1>
        <p style={{ fontSize: '14px', color: '#57BCB1', marginTop: '4px' }}>
          {classPlan.targetStudent} 겨울특강 · {classPlan.classDay} {classPlan.classTime}
        </p>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 grid grid-cols-2">
        {/* Left Column */}
        <div className="flex flex-col">
          {/* ABSTRACT (학습목표) */}
          <section>
            <div 
              className="py-4 px-8"
              style={{ backgroundColor: '#1B7A6E' }}
            >
              <h2 
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: '22px', color: '#FFFFFF' }}
              >
                ABSTRACT (학습목표)
              </h2>
            </div>
            <div className="p-8 bg-white">
              <p className="whitespace-pre-wrap" style={{ color: '#374151', lineHeight: '1.8' }}>
                {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
              </p>
            </div>
          </section>

          {/* INTRODUCTION (학습안내) */}
          <section>
            <div 
              className="py-4 px-8"
              style={{ backgroundColor: '#1B7A6E' }}
            >
              <h2 
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: '22px', color: '#FFFFFF' }}
              >
                INTRODUCTION (학습안내)
              </h2>
            </div>
            <div className="p-8 bg-white space-y-4">
              <div className="flex gap-4">
                <span className="font-bold" style={{ color: '#1B7A6E', minWidth: '60px' }}>대상</span>
                <span>
                  {classPlan.targetStudent}
                  {classPlan.targetStudentDetail && ` (${classPlan.targetStudentDetail})`}
                </span>
              </div>
              <div className="flex gap-4">
                <span className="font-bold" style={{ color: '#1B7A6E', minWidth: '60px' }}>담당</span>
                <span>{classPlan.teacherName} 선생님</span>
              </div>
              <div className="flex gap-4">
                <span className="font-bold" style={{ color: '#1B7A6E', minWidth: '60px' }}>일정</span>
                <span>{classPlan.classDay} {classPlan.classTime}</span>
              </div>
              {classPlan.parentIntro && (
                <div 
                  className="mt-4 pt-4"
                  style={{ borderTop: '1px solid #E5E7EB' }}
                >
                  <p className="whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: '1.8' }}>
                    {classPlan.parentIntro}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* METHODS (학습과정) */}
          <section>
            <div 
              className="py-4 px-8"
              style={{ backgroundColor: '#1B7A6E' }}
            >
              <h2 
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: '22px', color: '#FFFFFF' }}
              >
                METHODS (학습과정)
              </h2>
            </div>
            <div className="p-8 bg-white space-y-6">
              {/* 학습과정 */}
              <div>
                <p className="font-bold mb-3" style={{ color: '#1B7A6E' }}>학습 과정</p>
                <ul className="space-y-2 ml-2">
                  <li className="flex items-start gap-3">
                    <span style={{ color: '#57BCB1', fontSize: '8px', marginTop: '8px' }}>●</span>
                    <span>{classPlan.course1 || '-'}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span style={{ color: '#57BCB1', fontSize: '8px', marginTop: '8px' }}>●</span>
                    <span>{classPlan.course2 || '-'}</span>
                  </li>
                </ul>
              </div>

              {/* 교재 */}
              <div>
                <p className="font-bold mb-3" style={{ color: '#1B7A6E' }}>교재</p>
                <ul className="space-y-2 ml-2">
                  <li className="flex items-start gap-3">
                    <span style={{ color: '#57BCB1', fontSize: '8px', marginTop: '8px' }}>○</span>
                    <span>{classPlan.material1 || '-'}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span style={{ color: '#57BCB1', fontSize: '8px', marginTop: '8px' }}>○</span>
                    <span>{classPlan.material2 || '-'}</span>
                  </li>
                </ul>
              </div>

              {/* 학습관리 */}
              {classPlan.management && (
                <div>
                  <p className="font-bold mb-3" style={{ color: '#1B7A6E' }}>학습 관리</p>
                  <p className="whitespace-pre-wrap" style={{ color: '#6B7280', fontSize: '14px' }}>
                    {classPlan.management}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="flex flex-col">
          {/* CURRICULUM (주차별 계획) */}
          <section>
            <div 
              className="py-4 px-8"
              style={{ backgroundColor: '#1B7A6E' }}
            >
              <h2 
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: '22px', color: '#FFFFFF' }}
              >
                CURRICULUM (주차별 계획)
              </h2>
            </div>
            <div className="p-8 bg-white">
              <div className="space-y-3">
                {(classPlan.weeklyPlan || []).slice(0, 8).map((week, i) => {
                  const displayLabel = week.weekLabel || `${i + 1}주`;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <span 
                        className="shrink-0 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold"
                        style={{ 
                          backgroundColor: '#B8E6E1', 
                          color: '#1B7A6E'
                        }}
                      >
                        {displayLabel}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: '#374151' }}>{week.topic || '-'}</p>
                        {week.detail && (
                          <p className="text-xs" style={{ color: '#6B7280' }}>{week.detail}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SCHEDULE (일정) */}
          <section>
            <div 
              className="py-4 px-8"
              style={{ backgroundColor: '#1B7A6E' }}
            >
              <h2 
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: '22px', color: '#FFFFFF' }}
              >
                SCHEDULE (일정)
              </h2>
            </div>
            <div className="p-8 bg-white">
              <MonthlyCalendar classPlan={classPlan} />
            </div>
          </section>

          {/* CONCLUSIONS (특이사항) */}
          {classPlan.etc && (
            <section>
              <div 
                className="py-4 px-8"
                style={{ backgroundColor: '#1B7A6E' }}
              >
                <h2 
                  className="font-bold uppercase tracking-wider"
                  style={{ fontSize: '22px', color: '#FFFFFF' }}
                >
                  CONCLUSIONS (특이사항)
                </h2>
              </div>
              <div className="p-8 bg-white">
                <p className="whitespace-pre-wrap" style={{ color: '#374151', lineHeight: '1.8' }}>
                  {classPlan.etc}
                </p>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* 수강료 안내 Section */}
      {feeInfo && feeInfo.rows.length > 0 && (
        <section>
          <div 
            className="py-4 px-8"
            style={{ backgroundColor: '#1B7A6E' }}
          >
            <h2 
              className="font-bold uppercase tracking-wider"
              style={{ fontSize: '22px', color: '#FFFFFF' }}
            >
              {feeInfo.title}
            </h2>
          </div>
          <div className="p-8 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '2px solid #1B7A6E' }}>
                  <th className="py-3 px-2 text-left font-bold" style={{ color: '#1B7A6E' }}>월</th>
                  <th className="py-3 px-2 text-left font-bold" style={{ color: '#1B7A6E' }}>수업구분</th>
                  <th className="py-3 px-2 text-left font-bold" style={{ color: '#1B7A6E' }}>요일</th>
                  <th className="py-3 px-2 text-left font-bold" style={{ color: '#1B7A6E' }}>시간</th>
                  <th className="py-3 px-2 text-right font-bold" style={{ color: '#1B7A6E' }}>수강료</th>
                  <th className="py-3 px-2 text-center font-bold" style={{ color: '#1B7A6E' }}>회차</th>
                  <th className="py-3 px-2 text-right font-bold" style={{ color: '#1B7A6E' }}>합계</th>
                  <th className="py-3 px-2 text-right font-bold" style={{ color: '#1B7A6E' }}>총 합계</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedByMonth).map(([month, rows]) => {
                  const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                    rows.reduce((sum, row) => sum + row.subtotal, 0);
                  return rows.map((row, idx) => (
                    <tr key={`${month}-${idx}`} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      {idx === 0 && (
                        <td 
                          className="py-3 px-2 font-bold" 
                          rowSpan={rows.length}
                          style={{ backgroundColor: '#D4F1EE', color: '#1B7A6E' }}
                        >
                          {month}
                        </td>
                      )}
                      <td className="py-3 px-2">{row.classType}</td>
                      <td className="py-3 px-2">{row.day}</td>
                      <td className="py-3 px-2">{row.time}</td>
                      <td className="py-3 px-2 text-right">{row.unitFee.toLocaleString()}</td>
                      <td className="py-3 px-2 text-center">{row.sessions}</td>
                      <td className="py-3 px-2 text-right font-medium">{row.subtotal.toLocaleString()}</td>
                      {idx === 0 && (
                        <td 
                          className="py-3 px-2 text-right font-bold" 
                          rowSpan={rows.length}
                          style={{ backgroundColor: '#D4F1EE', color: '#1B7A6E' }}
                        >
                          {monthTotal.toLocaleString()}
                        </td>
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Footer */}
      <div 
        className="px-12 py-4 flex justify-between items-center"
        style={{ backgroundColor: '#1B7A6E', color: '#FFFFFF' }}
      >
        <div className="flex items-center gap-4">
          <span className="font-bold">담당</span>
          <span>{classPlan.teacherName} 선생님</span>
        </div>
        <span className="font-bold tracking-wider">원리와 해석 수학학원</span>
      </div>
    </div>
  );
};

export default TemplateTeal;

