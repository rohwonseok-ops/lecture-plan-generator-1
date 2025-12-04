'use client';

import React from 'react';
import { ClassPlan } from '@/lib/types';
import MonthlyCalendar from './MonthlyCalendar';

interface Props {
  classPlan: ClassPlan;
}

/**
 * TemplateReport - Design System Based (Orange/Zinc Theme)
 * 
 * Color Palette:
 * - Primary: #EA580C (orange-600)
 * - Dark: #C2410C (orange-700)
 * - Soft: #FB923C (orange-400)
 * - Text: #18181B (zinc-900)
 * - Secondary: #71717A (zinc-500)
 * 
 * Design Tokens from design.json:
 * - radius: card 18px, panel 16px, chip 24px, button 999px
 * - shadow: 0px 2px 8px rgba(0,0,0,0.04)
 */

const TemplateReport: React.FC<Props> = ({ classPlan }) => {
  const feeInfo = classPlan.feeInfo;
  
  const groupedByMonth: Record<string, typeof feeInfo.rows> = {};
  feeInfo?.rows.forEach(row => {
    if (!groupedByMonth[row.month]) groupedByMonth[row.month] = [];
    groupedByMonth[row.month].push(row);
  });

  return (
    <div 
      className="w-[240mm] min-h-[260mm] flex flex-col font-jeju"
      style={{ 
        background: '#FAFAFA',
        color: '#18181B',
        fontSize: '11pt'
      }}
    >
      {/* Header */}
      <header 
        className="px-8 py-5 flex items-center justify-between"
        style={{ 
          background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
          color: '#FFFFFF'
        }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            W
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">겨울특강 계획서</h1>
            <p className="text-sm opacity-70">Winter Special Program 2026</p>
          </div>
        </div>
        <img 
          src="/images/1.png" 
          alt="학원 로고" 
          className="h-12 object-contain brightness-0 invert opacity-80"
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-6 flex flex-col gap-5">
        
        {/* Info Strip */}
        <section className="flex flex-wrap gap-3">
          {classPlan.showTitle && (
            <div 
              className="px-5 py-2.5 flex items-center gap-2"
              style={{ 
                background: '#FFFFFF',
                borderRadius: '24px',
                boxShadow: '0px 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <span className="text-xs font-bold uppercase" style={{ color: '#71717A' }}>강좌</span>
              <span className="font-bold text-sm" style={{ color: '#18181B' }}>{classPlan.title}</span>
            </div>
          )}
          <div 
            className="px-5 py-2.5 flex items-center gap-2"
            style={{ 
              background: '#FFFFFF',
              borderRadius: '24px',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <span className="text-xs font-bold uppercase" style={{ color: '#71717A' }}>대상</span>
            <span className="font-bold text-sm" style={{ color: '#18181B' }}>
              {classPlan.targetStudent}
              {classPlan.targetStudentDetail && <span style={{ color: '#71717A' }}> · {classPlan.targetStudentDetail}</span>}
            </span>
          </div>
          <div 
            className="px-5 py-2.5 flex items-center gap-2"
            style={{ 
              background: '#FFFFFF',
              borderRadius: '24px',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <span className="text-xs font-bold uppercase" style={{ color: '#71717A' }}>강사</span>
            <span className="font-bold text-sm" style={{ color: '#EA580C' }}>{classPlan.teacherName}</span>
          </div>
          <div 
            className="px-5 py-2.5 flex items-center gap-2"
            style={{ 
              background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
              borderRadius: '24px',
              color: '#FFFFFF'
            }}
          >
            <span className="text-xs font-bold uppercase opacity-80">일정</span>
            <span className="font-bold text-sm">{classPlan.classDay} {classPlan.classTime}</span>
          </div>
        </section>

        {/* Parent Intro */}
        {classPlan.parentIntro && (
          <section 
            className="px-5 py-4"
            style={{ 
              background: '#FFFFFF',
              borderRadius: '18px',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.04)',
              borderLeft: '4px solid #EA580C'
            }}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#71717A' }}>
              {classPlan.parentIntro}
            </p>
          </section>
        )}

        {/* Two Column Grid */}
        <div className="grid grid-cols-2 gap-5">
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            <section 
              className="p-5 flex-1"
              style={{ 
                background: '#FFFFFF',
                borderRadius: '18px',
                boxShadow: '0px 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: '#EA580C' }}></div>
                <h3 className="font-bold text-sm" style={{ color: '#EA580C' }}>학습목표</h3>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#71717A' }}>
                {classPlan.learningGoal || "학습 목표가 입력되지 않았습니다."}
              </p>
            </section>

            <section 
              className="p-5 flex-1"
              style={{ 
                background: '#FFFFFF',
                borderRadius: '18px',
                boxShadow: '0px 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: '#FB923C' }}></div>
                <h3 className="font-bold text-sm" style={{ color: '#EA580C' }}>학습관리</h3>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#71717A' }}>
                {classPlan.management || "학습 관리 계획이 입력되지 않았습니다."}
              </p>
            </section>
          </div>

          {/* Right Column - Courses */}
          <section 
            className="p-5"
            style={{ 
              background: '#FFFFFF',
              borderRadius: '18px',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: '#C2410C' }}></div>
              <h3 className="font-bold text-sm" style={{ color: '#EA580C' }}>학습과정 및 교재</h3>
            </div>
            
            <div className="space-y-3">
              <div 
                className="p-4 flex items-center justify-between"
                style={{ 
                  background: 'rgba(234, 88, 12, 0.06)',
                  borderRadius: '16px'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: '#EA580C', color: '#FFFFFF' }}
                  >
                    01
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: '#18181B' }}>{classPlan.course1 || '-'}</div>
                    {classPlan.material1 && (
                      <div className="text-xs" style={{ color: '#71717A' }}>{classPlan.material1}</div>
                    )}
                  </div>
                </div>
              </div>

              <div 
                className="p-4 flex items-center justify-between"
                style={{ 
                  background: 'rgba(251, 146, 60, 0.1)',
                  borderRadius: '16px'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: '#FB923C', color: '#FFFFFF' }}
                  >
                    02
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: '#18181B' }}>{classPlan.course2 || '-'}</div>
                    {classPlan.material2 && (
                      <div className="text-xs" style={{ color: '#71717A' }}>{classPlan.material2}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Notice */}
        {classPlan.etc && (
          <section 
            className="px-5 py-4"
            style={{ 
              background: 'linear-gradient(135deg, rgba(234,88,12,0.08) 0%, rgba(251,146,60,0.08) 100%)',
              borderRadius: '18px'
            }}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#18181B' }}>
              {classPlan.etc}
            </p>
          </section>
        )}

        {/* Weekly Plan */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div 
              className="px-3 py-1 text-xs font-bold uppercase"
              style={{ 
                background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                borderRadius: '999px',
                color: '#FFFFFF'
              }}
            >
              Weekly
            </div>
            <h3 className="font-bold" style={{ color: '#18181B' }}>주차별 학습계획</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {(classPlan.weeklyPlan || []).slice(0, 8).map((week, i) => {
              const displayLabel = week.weekLabel || `${i + 1}주`;
              return (
                <div 
                  key={i}
                  className="p-3"
                  style={{ 
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    boxShadow: '0px 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <div 
                    className="text-[10px] font-bold mb-1 px-2 py-0.5 inline-block"
                    style={{ 
                      background: 'rgba(234, 88, 12, 0.1)',
                      borderRadius: '999px',
                      color: '#EA580C'
                    }}
                  >
                    {displayLabel}
                  </div>
                  <div className="font-medium text-xs truncate" style={{ color: '#18181B' }}>
                    {week.topic || '-'}
                  </div>
                  {week.detail && (
                    <div className="text-[10px] truncate mt-0.5" style={{ color: '#71717A' }}>
                      {week.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Calendar */}
        <MonthlyCalendar classPlan={classPlan} />

        {/* Fee Table */}
        {feeInfo && feeInfo.rows.length > 0 && (
          <section 
            className="mt-auto overflow-hidden"
            style={{ 
              background: '#FFFFFF',
              borderRadius: '18px',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div 
              className="px-5 py-3"
              style={{ 
                background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                color: '#FFFFFF'
              }}
            >
              <h3 className="font-bold text-sm">{feeInfo.title}</h3>
            </div>
            
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(234, 88, 12, 0.06)' }}>
                  <th className="px-3 py-2 text-left font-bold" style={{ color: '#C2410C' }}>월</th>
                  <th className="px-3 py-2 text-left font-bold" style={{ color: '#C2410C' }}>수업구분</th>
                  <th className="px-3 py-2 text-left font-bold" style={{ color: '#C2410C' }}>요일</th>
                  <th className="px-3 py-2 text-left font-bold" style={{ color: '#C2410C' }}>시간</th>
                  <th className="px-3 py-2 text-right font-bold" style={{ color: '#C2410C' }}>수강료</th>
                  <th className="px-3 py-2 text-center font-bold" style={{ color: '#C2410C' }}>회차</th>
                  <th className="px-3 py-2 text-right font-bold" style={{ color: '#C2410C' }}>합계</th>
                  <th className="px-3 py-2 text-right font-bold" style={{ color: '#C2410C' }}>총 합계</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedByMonth).map(([month, rows]) => {
                  const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                    rows.reduce((sum, row) => sum + row.subtotal, 0);
                  return rows.map((row, idx) => (
                    <tr 
                      key={`${month}-${idx}`}
                      style={{ borderBottom: '1px solid #E4E4E7' }}
                    >
                      {idx === 0 && (
                        <td 
                          className="px-3 py-2 font-bold" 
                          rowSpan={rows.length}
                          style={{ background: 'rgba(234, 88, 12, 0.04)', color: '#C2410C' }}
                        >
                          {month}
                        </td>
                      )}
                      <td className="px-3 py-2" style={{ color: '#18181B' }}>{row.classType}</td>
                      <td className="px-3 py-2" style={{ color: '#18181B' }}>{row.day}</td>
                      <td className="px-3 py-2" style={{ color: '#18181B' }}>{row.time}</td>
                      <td className="px-3 py-2 text-right" style={{ color: '#18181B' }}>{row.unitFee.toLocaleString()}</td>
                      <td className="px-3 py-2 text-center" style={{ color: '#18181B' }}>{row.sessions}</td>
                      <td className="px-3 py-2 text-right font-medium" style={{ color: '#18181B' }}>{row.subtotal.toLocaleString()}</td>
                      {idx === 0 && (
                        <td 
                          className="px-3 py-2 text-right font-bold" 
                          rowSpan={rows.length}
                          style={{ background: 'rgba(234, 88, 12, 0.04)', color: '#EA580C' }}
                        >
                          {monthTotal.toLocaleString()}
                        </td>
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer 
        className="px-8 py-4 flex items-center justify-between text-xs"
        style={{ 
          background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
          color: '#FFFFFF'
        }}
      >
        <div className="font-bold">원리와 해석 수학학원</div>
        <div className="opacity-70">Principle and Analysis Math Academy</div>
      </footer>
    </div>
  );
};

export default TemplateReport;
