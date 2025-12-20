'use client';

import React, { CSSProperties } from 'react';
import { BaseSectionProps } from './types';
import { ColorTheme } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MonthlyCalendar from '../MonthlyCalendar';

interface CalendarSectionProps extends BaseSectionProps {
  colorTheme: ColorTheme;
}

/**
 * 월간계획 섹션
 */
const CalendarSection: React.FC<CalendarSectionProps> = ({
  classPlan,
  colors,
  typography,
  titleFontClass,
  titleWeight,
  helpers,
  colorTheme,
}) => {
  const { getLayoutStyle, getHeaderStyle, getHeaderTextClass, getSize } = helpers;

  const headerStyle: CSSProperties = {
    ...getHeaderStyle(7),
    padding: '0.7rem 0.95rem',
    minHeight: '2.35rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  };

  return (
    <Card
      data-section-id="monthly-calendar"
      className="overflow-hidden"
      style={{
        borderColor: colors.border,
        background: undefined,
        ...getLayoutStyle('monthlyCalendar'),
      }}
    >
      <CardHeader className={`${getHeaderTextClass()}`} style={headerStyle}>
        <CardTitle
          className={`text-xs flex w-full items-center justify-start gap-1.5 text-left ${titleFontClass}`}
          style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight, textAlign: 'left' }}
        >
          <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          월간계획
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <MonthlyCalendar classPlan={classPlan} colorTheme={colorTheme} fontSize={getSize('monthlyCalendar')} />
      </CardContent>
    </Card>
  );
};

export default React.memo(CalendarSection);
