'use client';

import React, { useMemo } from 'react';
import { BaseSectionProps, createInfoCardStyle, createInfoHeaderStyle, textColors } from './types';
import { buildScheduleRows } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScheduleRow {
  period: string;
  day: string;
  time: string;
}

interface TeacherScheduleSectionProps extends BaseSectionProps {
  gridRatio: { teacher: number; schedule: number };
}

/**
 * 담임강사 + 수업일정 섹션
 */
const TeacherScheduleSection: React.FC<TeacherScheduleSectionProps> = ({
  classPlan,
  colors,
  typography,
  titleFontClass,
  bodyFontClass,
  titleWeight,
  bodyWeight,
  helpers,
  gridRatio,
}) => {
  const { getLayoutStyle, getHeaderStyle, getHeaderTextClass, getSize } = helpers;
  const infoCardStyle = createInfoCardStyle(colors);

  // 수업일정 계산 (메모이제이션)
  const scheduleRows = useMemo<ScheduleRow[]>(
    () => buildScheduleRows(classPlan.classDay, classPlan.classTime),
    [classPlan.classDay, classPlan.classTime]
  );

  const getInfoHeaderStyle = (index: number) => createInfoHeaderStyle(getHeaderStyle(index));

  return (
    <div className="grid gap-3 h-full" style={{ gridTemplateColumns: `${gridRatio.teacher}fr ${gridRatio.schedule}fr` }}>
      {/* 담임강사 카드 */}
      <Card
        data-section-id="teacher-info"
        className="overflow-hidden h-full flex flex-col"
        style={{
          ...infoCardStyle,
          ...getLayoutStyle('teacherInfo'),
        }}
      >
        <CardHeader className={`${getHeaderTextClass()} border-b border-white/20`} style={getInfoHeaderStyle(1)}>
          <CardTitle
            className={`flex w-full items-center justify-start gap-1.5 leading-none text-left ${titleFontClass}`}
            style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight + 100, textAlign: 'left' }}
          >
            <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            담임강사
          </CardTitle>
        </CardHeader>
        <CardContent className="relative flex items-center flex-1" style={{ padding: '0.95rem 1.1rem' }}>
          <p
            className={`leading-6 ${bodyFontClass}`}
            style={{ fontSize: `${getSize('teacherName')}pt`, fontWeight: bodyWeight + 100, color: textColors.primary, whiteSpace: 'pre-line' }}
          >
            {classPlan.teacherName}
          </p>
        </CardContent>
      </Card>

      {/* 수업일정 카드 */}
      <Card
        data-section-id="schedule-info"
        className="overflow-hidden h-full flex flex-col"
        style={{
          ...infoCardStyle,
          ...getLayoutStyle('scheduleInfo'),
        }}
      >
        <CardHeader className={`${getHeaderTextClass()} border-b border-white/20`} style={getInfoHeaderStyle(2)}>
          <CardTitle
            className={`flex w-full items-center justify-start gap-1.5 leading-none text-left ${titleFontClass}`}
            style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight + 100, textAlign: 'left' }}
          >
            <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            수업일정
          </CardTitle>
        </CardHeader>
        <CardContent className="relative flex-1 flex items-center overflow-hidden" style={{ padding: '0.6rem 0.5rem' }}>
          {scheduleRows.length === 0 ? (
            <p className={`leading-6 ${bodyFontClass}`} style={{ fontSize: `${getSize('classDay')}pt`, fontWeight: bodyWeight + 50, color: textColors.primary }}>
              -
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 w-full">
              {scheduleRows.map((row, i) => (
                <div
                  key={i}
                  className="flex items-stretch gap-1.5"
                  style={{
                    padding: '0.25rem 0.2rem',
                    borderRadius: 10,
                    border: `1px solid ${colors.lighter}`,
                    background: i % 2 === 0 ? `${colors.light}10` : 'transparent',
                    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.02)',
                  }}
                >
                  {row.period && (
                    <div
                      className={`${bodyFontClass} flex items-center justify-center`}
                      style={{
                        padding: '0.3rem 0.55rem',
                        minWidth: 70,
                        background: `linear-gradient(180deg, ${colors.light} 0%, ${colors.lighter} 100%)`,
                        color: textColors.strong,
                        fontSize: `${getSize('classDay') * 0.9}pt`,
                        fontWeight: titleWeight + 100,
                        letterSpacing: '-0.01em',
                        borderRadius: 8,
                        boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.03)',
                        border: `1px solid ${colors.lighter}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.period}
                    </div>
                  )}
                  <div
                    className={`${bodyFontClass} flex items-center justify-center`}
                    style={{
                      padding: '0.3rem 0.55rem',
                      minWidth: 52,
                      color: textColors.primary,
                      fontSize: `${getSize('classDay') * 0.9}pt`,
                      fontWeight: bodyWeight + 50,
                      letterSpacing: '-0.01em',
                      borderRadius: 8,
                      border: `1px solid ${colors.lighter}`,
                      background: '#ffffff',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.day || '-'}
                  </div>
                  <div
                    className={`${bodyFontClass} flex items-center flex-1 justify-start`}
                    style={{
                      padding: '0.3rem 0.65rem',
                      color: textColors.primary,
                      fontSize: `${getSize('classDay') * 0.9}pt`,
                      fontWeight: bodyWeight,
                      letterSpacing: '-0.01em',
                      borderRadius: 8,
                      border: `1px solid ${colors.lighter}`,
                      background: `${colors.light}18`,
                      minWidth: 120,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row.time || '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(TeacherScheduleSection);
