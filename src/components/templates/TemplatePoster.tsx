'use client';

import React from 'react';
import { ClassPlan } from '@/lib/types';
import MonthlyCalendar from './MonthlyCalendar';

interface Props {
  classPlan: ClassPlan;
}

/**
 * TemplatePoster - design.v2.json 기반
 * 연구 포스터 스타일의 카드 기반 레이아웃
 * 
 * 색상 팔레트:
 * - brandPrimary: #0E6A5B
 * - brandDark: #0A4E43
 * - brandSoft: #A7D3C7
 * - backgroundMain: #F2F5F4
 * - surfacePrimary: #FFFFFF
 */
const TemplatePoster: React.FC<Props> = ({ classPlan }) => {
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, typeof feeInfo.rows> = {};
  feeInfo?.rows.forEach(row => {
    if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
    groupedByMonth[row.month].push(row);
  });

  return (
    <div 
      className="w-[240mm] min-h-[260mm] flex flex-col font-['Pretendard',_'Apple_SD_Gothic_Neo',_sans-serif]"
      style={{ 
        backgroundColor: '#F2F5F4',
        fontSize: '13px',
        lineHeight: '1.7',
        color: '#4B5563'
      }}
    >
      {/* Header Section */}
      <div className="bg-white px-9 pt-6 pb-5">
        <div className="flex items-start justify-between">
          {/* Title Block */}
          <div>
            <h1 
              className="font-extrabold tracking-tight"
              style={{ 
                fontSize: '44px', 
                lineHeight: '1.2',
                letterSpacing: '-0.02em',
                color: '#0E6A5B' 
              }}
            >
              {classPlan.title || '강좌명'}
            </h1>
            <p className="mt-1" style={{ color: '#6B7280', fontSize: '12px' }}>
              {classPlan.targetStudent} 겨울특강 · {classPlan.classDay} {classPlan.classTime}
            </p>
          </div>
          
          {/* Meta Badges */}
          <div className="flex flex-col items-end gap-2">
            <div 
              className="px-4 py-1.5 rounded-full flex items-center gap-2"
              style={{ 
                background: 'linear-gradient(180deg, #0E6A5B 0%, #0A4E43 100%)',
                color: '#FFFFFF'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-semibold text-sm">{classPlan.teacherName || '담당강사'}</span>
            </div>
            <div 
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#E7F1EE', color: '#0A4E43' }}
            >
              원리와 해석 수학학원
            </div>
          </div>
        </div>
        
        {/* Mountain Band Decoration */}
        <div 
          className="mt-4 h-8 rounded-lg overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #CBE1DD 0%, #E4F0ED 100%)' }}
        >
          <svg viewBox="0 0 800 32" className="w-full h-full" preserveAspectRatio="none">
            <path 
              d="M0,32 L100,12 L200,20 L300,8 L400,16 L500,6 L600,18 L700,10 L800,22 L800,32 Z" 
              fill="#A7D3C7" 
              opacity="0.5"
            />
          </svg>
        </div>
      </div>

      {/* Main Content - 2 Column Grid */}
      <div className="flex-1 px-9 py-5 grid grid-cols-2 gap-5">
        {/* Left Column */}
        <div className="flex flex-col gap-5">
          {/* 학습목표 Card */}
          <div 
            className="bg-white rounded-[18px] overflow-hidden"
            style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.06)', border: '1px solid #D9E5E1' }}
          >
            <div className="px-5 py-2.5" style={{ backgroundColor: '#0E6A5B' }}>
              <h2 className="font-bold text-white" style={{ fontSize: '16px' }}>학습목표</h2>
            </div>
            <div className="p-5">
              <p className="whitespace-pre-wrap" style={{ color: '#4B5563', lineHeight: '1.7' }}>
                {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
              </p>
            </div>
          </div>

          {/* 학부모 안내 Card */}
          {classPlan.parentIntro && (
            <div 
              className="bg-white rounded-[18px] overflow-hidden"
              style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.06)', border: '1px solid #D9E5E1' }}
            >
              <div className="px-5 py-2.5" style={{ backgroundColor: '#0E6A5B' }}>
                <h2 className="font-bold text-white" style={{ fontSize: '16px' }}>학부모님께</h2>
              </div>
              <div className="p-5">
                <p className="whitespace-pre-wrap" style={{ color: '#4B5563', lineHeight: '1.7' }}>
                  {classPlan.parentIntro}
                </p>
              </div>
            </div>
          )}

          {/* 학습과정 Card */}
          <div 
            className="bg-white rounded-[18px] overflow-hidden"
            style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.06)', border: '1px solid #D9E5E1' }}
          >
            <div className="px-5 py-2.5" style={{ backgroundColor: '#0E6A5B' }}>
              <h2 className="font-bold text-white" style={{ fontSize: '16px' }}>학습과정 및 교재</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span 
                  className="shrink-0 px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ backgroundColor: '#E7F1EE', color: '#0E6A5B' }}
                >
                  과정1
                </span>
                <div className="flex-1">
                  <p className="font-medium" style={{ color: '#0F172A' }}>{classPlan.course1 || '-'}</p>
                  <p className="text-sm" style={{ color: '#6B7280' }}>{classPlan.material1 || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span 
                  className="shrink-0 px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ backgroundColor: '#E7F1EE', color: '#0E6A5B' }}
                >
                  과정2
                </span>
                <div className="flex-1">
                  <p className="font-medium" style={{ color: '#0F172A' }}>{classPlan.course2 || '-'}</p>
                  <p className="text-sm" style={{ color: '#6B7280' }}>{classPlan.material2 || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 학습관리 Card */}
          {classPlan.management && (
            <div 
              className="bg-white rounded-[18px] overflow-hidden"
              style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.06)', border: '1px solid #D9E5E1' }}
            >
              <div className="px-5 py-2.5" style={{ backgroundColor: '#0E6A5B' }}>
                <h2 className="font-bold text-white" style={{ fontSize: '16px' }}>학습관리</h2>
              </div>
              <div className="p-5">
                <p className="whitespace-pre-wrap" style={{ color: '#4B5563', lineHeight: '1.7' }}>
                  {classPlan.management}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-5">
          {/* 주차별 학습계획 Card */}
          <div 
            className="bg-white rounded-[18px] overflow-hidden"
            style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.06)', border: '1px solid #D9E5E1' }}
          >
            <div className="px-5 py-2.5" style={{ backgroundColor: '#0E6A5B' }}>
              <h2 className="font-bold text-white" style={{ fontSize: '16px' }}>주차별 학습계획</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {(classPlan.weeklyPlan || []).slice(0, 8).map((week, i) => {
                  const displayLabel = week.weekLabel || `${i + 1}주`;
                  return (
                    <div 
                      key={i} 
                      className="flex items-start gap-3 p-2.5 rounded-[10px] transition-colors"
                      style={{ backgroundColor: i % 2 === 0 ? '#F4FAF8' : 'transparent' }}
                    >
                      <span 
                        className="shrink-0 inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold"
                        style={{ backgroundColor: '#0E6A5B', color: '#FFFFFF' }}
                      >
                        {displayLabel}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm" style={{ color: '#0F172A' }}>{week.topic || '-'}</p>
                        {week.detail && (
                          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{week.detail}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 일정 달력 Card */}
          <div 
            className="bg-white rounded-[18px] overflow-hidden"
            style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.06)', border: '1px solid #D9E5E1' }}
          >
            <div className="px-5 py-2.5" style={{ backgroundColor: '#0E6A5B' }}>
              <h2 className="font-bold text-white" style={{ fontSize: '16px' }}>수업 일정</h2>
            </div>
            <div className="p-4">
              <MonthlyCalendar classPlan={classPlan} />
            </div>
          </div>

          {/* 홍보/기타 Card */}
          {classPlan.etc && (
            <div 
              className="rounded-[18px] p-5"
              style={{ 
                backgroundColor: '#E7F1EE', 
                border: '1px solid #A7C2BA'
              }}
            >
              <p className="whitespace-pre-wrap" style={{ color: '#0A4E43', lineHeight: '1.6' }}>
                {classPlan.etc}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 수강료 안내 Section */}
      {feeInfo && feeInfo.rows.length > 0 && (
        <div className="px-9 pb-5">
          <div 
            className="bg-white rounded-[18px] overflow-hidden"
            style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.06)', border: '1px solid #D9E5E1' }}
          >
            <div className="px-5 py-2.5" style={{ backgroundColor: '#0E6A5B' }}>
              <h2 className="font-bold text-white" style={{ fontSize: '16px' }}>{feeInfo.title}</h2>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E6ECEA' }}>
                    <th className="py-2 px-2 text-left font-bold" style={{ color: '#0E6A5B' }}>월</th>
                    <th className="py-2 px-2 text-left font-bold" style={{ color: '#0E6A5B' }}>수업구분</th>
                    <th className="py-2 px-2 text-left font-bold" style={{ color: '#0E6A5B' }}>요일</th>
                    <th className="py-2 px-2 text-left font-bold" style={{ color: '#0E6A5B' }}>시간</th>
                    <th className="py-2 px-2 text-right font-bold" style={{ color: '#0E6A5B' }}>수강료</th>
                    <th className="py-2 px-2 text-center font-bold" style={{ color: '#0E6A5B' }}>회차</th>
                    <th className="py-2 px-2 text-right font-bold" style={{ color: '#0E6A5B' }}>합계</th>
                    <th className="py-2 px-2 text-right font-bold" style={{ color: '#0E6A5B' }}>총 합계</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedByMonth).map(([month, rows]) => {
                    const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                      rows.reduce((sum, row) => sum + row.subtotal, 0);
                    return rows.map((row, idx) => (
                      <tr key={`${month}-${idx}`} style={{ borderBottom: '1px solid #E6ECEA' }}>
                        {idx === 0 && (
                          <td 
                            className="py-2 px-2 font-bold" 
                            rowSpan={rows.length}
                            style={{ backgroundColor: '#F4FAF8', color: '#0E6A5B' }}
                          >
                            {month}
                          </td>
                        )}
                        <td className="py-2 px-2" style={{ color: '#4B5563' }}>{row.classType}</td>
                        <td className="py-2 px-2" style={{ color: '#4B5563' }}>{row.day}</td>
                        <td className="py-2 px-2" style={{ color: '#4B5563' }}>{row.time}</td>
                        <td className="py-2 px-2 text-right" style={{ color: '#4B5563' }}>{row.unitFee.toLocaleString()}</td>
                        <td className="py-2 px-2 text-center" style={{ color: '#4B5563' }}>{row.sessions}</td>
                        <td className="py-2 px-2 text-right font-medium" style={{ color: '#0F172A' }}>{row.subtotal.toLocaleString()}</td>
                        {idx === 0 && (
                          <td 
                            className="py-2 px-2 text-right font-bold" 
                            rowSpan={rows.length}
                            style={{ backgroundColor: '#F4FAF8', color: '#0E6A5B' }}
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
          </div>
        </div>
      )}

      {/* Footer */}
      <div 
        className="px-9 py-3 flex justify-between items-center"
        style={{ backgroundColor: '#0E6A5B', color: '#FFFFFF' }}
      >
        <span className="font-bold text-sm">원리와 해석 수학학원</span>
        <span className="text-xs opacity-80">Principle and Analysis Math Academy</span>
      </div>
    </div>
  );
};

export default TemplatePoster;

