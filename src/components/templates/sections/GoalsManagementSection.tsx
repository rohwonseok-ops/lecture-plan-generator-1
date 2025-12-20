'use client';

import React from 'react';
import { BaseSectionProps, textColors } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 학습목표 + 학습관리 섹션
 */
const GoalsManagementSection: React.FC<BaseSectionProps> = ({
  classPlan,
  colors,
  typography,
  titleFontClass,
  bodyFontClass,
  titleWeight,
  bodyWeight,
  helpers,
}) => {
  const { getLayoutStyle, getHeaderStyle, getHeaderTextClass, getSize } = helpers;

  const cardStyle = {
    borderColor: colors.border,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,248,250,0.9))',
  };

  const headerStyle = (index: number) => ({
    ...getHeaderStyle(index),
    padding: '0.7rem 0.95rem',
    minHeight: '2.35rem',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
  });

  return (
    <div className="grid grid-cols-2 gap-3 items-stretch">
      {/* 학습목표 카드 */}
      <Card
        data-section-id="learning-goal"
        className="overflow-hidden shadow-[0_10px_28px_rgba(15,23,42,0.12)] h-full flex flex-col"
        style={{
          ...cardStyle,
          ...getLayoutStyle('learningGoal'),
        }}
      >
        <CardHeader className={`${getHeaderTextClass()}`} style={headerStyle(4)}>
          <CardTitle
            className={`text-xs flex w-full items-center justify-start gap-1.5 text-left ${titleFontClass}`}
            style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight, textAlign: 'left' }}
          >
            <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            학습목표
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 relative flex-1">
          <p
            className={`leading-4 whitespace-pre-wrap ${bodyFontClass}`}
            style={{ fontSize: `${getSize('learningGoal')}pt`, fontWeight: bodyWeight, color: textColors.primary, lineHeight: 1.45, paddingLeft: '4px' }}
          >
            {classPlan.learningGoal || '학습 목표가 입력되지 않았습니다.'}
          </p>
        </CardContent>
      </Card>

      {/* 학습관리 카드 */}
      <Card
        data-section-id="management"
        className="overflow-hidden shadow-[0_10px_28px_rgba(15,23,42,0.12)] h-full flex flex-col"
        style={{
          ...cardStyle,
          ...getLayoutStyle('management'),
        }}
      >
        <CardHeader className={`${getHeaderTextClass()}`} style={headerStyle(5)}>
          <CardTitle
            className={`text-xs flex w-full items-center justify-start gap-1.5 text-left ${titleFontClass}`}
            style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight, textAlign: 'left' }}
          >
            <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            학습관리
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 relative flex-1 flex items-center">
          <p
            className={`leading-4 whitespace-pre-wrap ${bodyFontClass}`}
            style={{ fontSize: `${getSize('management')}pt`, fontWeight: bodyWeight, color: textColors.primary, lineHeight: 1.45, paddingLeft: '4px' }}
          >
            {classPlan.management || '학습 관리 계획이 입력되지 않았습니다.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(GoalsManagementSection);
