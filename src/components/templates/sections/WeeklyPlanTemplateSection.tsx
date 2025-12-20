'use client';

import React, { useMemo, CSSProperties } from 'react';
import { BaseSectionProps, createWeekBadgeStyle, textColors } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeeklyPlanTemplateSectionProps extends BaseSectionProps {
  isDancheong: boolean;
  useGradientHeaders: boolean;
}

/**
 * 주차별 학습계획 섹션 (템플릿용)
 */
const WeeklyPlanTemplateSection: React.FC<WeeklyPlanTemplateSectionProps> = ({
  classPlan,
  colors,
  typography,
  titleFontClass,
  bodyFontClass,
  titleWeight,
  bodyWeight,
  helpers,
  isDancheong,
  useGradientHeaders,
}) => {
  const { getLayoutStyle, getHeaderStyle, getHeaderTextClass, getSize } = helpers;

  // 주차별 계획 (메모이제이션)
  const weeklyPlan = useMemo(() => classPlan.weeklyPlan || [], [classPlan.weeklyPlan]);

  // 주차별 계획 분할 (메모이제이션)
  const { leftWeeks, rightWeeks, midPoint } = useMemo(() => {
    const mid = Math.ceil(weeklyPlan.length / 2);
    return {
      midPoint: mid,
      leftWeeks: weeklyPlan.slice(0, mid),
      rightWeeks: weeklyPlan.slice(mid),
    };
  }, [weeklyPlan]);

  // 주차 배지 스타일
  const weekBadgeStyle = createWeekBadgeStyle(colors, useGradientHeaders, isDancheong);

  const headerStyle: CSSProperties = {
    ...getHeaderStyle(6),
    padding: '0.7rem 0.95rem',
    minHeight: '2.35rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  };

  const renderWeekRow = (week: { weekLabel?: string; topic?: string }, index: number, actualIndex: number) => {
    const displayLabel = (week.weekLabel || '').trim();
    const hasLabel = displayLabel.length > 0;
    const rowBg = actualIndex % 2 === 0 ? colors.light : 'transparent';

    return (
      <div
        key={index}
        className="flex items-start gap-2 p-1.5 rounded transition-colors"
        style={{ backgroundColor: rowBg }}
      >
        {hasLabel && (
          <span
            className="inline-flex items-center justify-center min-w-[30px] h-5 px-1.5 font-bold rounded shrink-0"
            style={{ ...weekBadgeStyle, fontSize: `${getSize('weeklyPlanWeek')}pt` }}
          >
            {displayLabel}
          </span>
        )}
        <div className="flex-1 min-w-0 relative">
          <div
            className={`leading-tight ${bodyFontClass}`}
            style={{ fontSize: `${getSize('weeklyPlanTopic')}pt`, fontWeight: bodyWeight, color: textColors.strong }}
          >
            {week.topic || ''}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card
      data-section-id="weekly-plan"
      className="overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
      style={{
        borderColor: colors.border,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(242,245,247,0.92))',
        ...getLayoutStyle('weeklyPlan'),
      }}
    >
      <CardHeader className={`${getHeaderTextClass()}`} style={headerStyle}>
        <CardTitle
          className={`text-xs flex w-full items-center justify-start gap-1.5 text-left ${titleFontClass}`}
          style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight, textAlign: 'left' }}
        >
          <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          주차별 학습계획
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="grid grid-cols-2 gap-2">
          {/* 왼쪽 블록 */}
          <div className="space-y-1.5">
            {leftWeeks.map((week, i) => renderWeekRow(week, i, i))}
          </div>
          {/* 오른쪽 블록 */}
          <div className="space-y-1.5">
            {rightWeeks.map((week, i) => renderWeekRow(week, i, midPoint + i))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(WeeklyPlanTemplateSection);
