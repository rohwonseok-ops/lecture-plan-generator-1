'use client';

import React, { useMemo } from 'react';
import { BaseSectionProps, createInfoCardStyle, createInfoHeaderStyle, textColors } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 학습과정 및 교재 섹션
 */
const CourseInfoSection: React.FC<BaseSectionProps> = ({
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
  const infoCardStyle = createInfoCardStyle(colors);

  // 학습과정/교재 행 데이터 (메모이제이션)
  const courseRows = useMemo(() => [
    {
      label: '과정 1',
      course: classPlan.course1 || '-',
      material: classPlan.material1 || '-',
      courseSize: getSize('course1'),
      materialSize: getSize('material1'),
      labelSize: getSize('course1'),
    },
    {
      label: '과정 2',
      course: classPlan.course2 || '-',
      material: classPlan.material2 || '-',
      courseSize: getSize('course2'),
      materialSize: getSize('material2'),
      labelSize: getSize('course2'),
    },
  ], [classPlan.course1, classPlan.material1, classPlan.course2, classPlan.material2, getSize]);

  const getInfoHeaderStyle = (index: number) => createInfoHeaderStyle(getHeaderStyle(index));

  return (
    <Card
      data-section-id="course-info"
      className="overflow-hidden h-full flex flex-col"
      style={{
        ...infoCardStyle,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(240,243,246,0.94))',
        ...getLayoutStyle('courseInfo'),
      }}
    >
      <CardHeader
        className={`${getHeaderTextClass()} border-b border-white/20`}
        style={getInfoHeaderStyle(3)}
      >
        <CardTitle
          className={`flex w-full items-center justify-start gap-1.5 leading-none text-left ${titleFontClass}`}
          style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight + 100, textAlign: 'left' }}
        >
          <svg className="fill-none stroke-current" style={{ width: `${typography.titleSize}pt`, height: `${typography.titleSize}pt` }} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          학습과정 및 교재
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col" style={{ fontSize: `${typography.bodySize}pt` }}>
        <div className="flex flex-col gap-1.25 p-2">
          {courseRows.map((item, i) => (
            <div
              key={i}
              className="flex items-stretch gap-1.5"
              style={{
                padding: '0.35rem 0.3rem',
                borderRadius: 10,
                border: `1px solid ${colors.lighter}`,
                background: i % 2 === 0 ? `${colors.light}12` : '#ffffff',
                boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.02)',
              }}
            >
              <div
                className={`${bodyFontClass} flex items-center justify-center`}
                style={{
                  padding: '0.35rem 0.55rem',
                  minWidth: 60,
                  background: `linear-gradient(180deg, ${colors.light} 0%, ${colors.lighter} 100%)`,
                  color: textColors.strong,
                  fontSize: `${item.labelSize}pt`,
                  fontWeight: titleWeight + 100,
                  letterSpacing: '-0.01em',
                  borderRadius: 8,
                  boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.03)',
                  border: `1px solid ${colors.lighter}`,
                }}
              >
                {item.label}
              </div>
              <div
                className={`${bodyFontClass} flex items-center justify-start`}
                style={{
                  padding: '0.35rem 0.6rem',
                  color: textColors.primary,
                  fontSize: `${item.courseSize}pt`,
                  fontWeight: bodyWeight,
                  letterSpacing: '-0.01em',
                  borderRadius: 8,
                  border: `1px solid ${colors.lighter}`,
                  background: '#ffffff',
                  minWidth: 120,
                  flex: '0 0 25%',
                }}
              >
                {item.course}
              </div>
              <div
                className={`${bodyFontClass} flex items-center flex-1 justify-start`}
                style={{
                  padding: '0.35rem 0.6rem',
                  color: textColors.primary,
                  fontSize: `${item.materialSize}pt`,
                  fontWeight: bodyWeight,
                  letterSpacing: '-0.01em',
                  borderRadius: 8,
                  border: `1px solid ${colors.lighter}`,
                  background: `${colors.light}16`,
                  minWidth: 120,
                }}
              >
                {item.material}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(CourseInfoSection);
