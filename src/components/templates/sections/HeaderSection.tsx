'use client';

/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { BaseSectionProps } from './types';

interface HeaderSectionProps extends BaseSectionProps {
  headerBackground: string;
  headerShadow: string;
}

/**
 * 헤더 섹션 - 템플릿 상단 헤더
 */
const HeaderSection: React.FC<HeaderSectionProps> = ({
  classPlan,
  typography,
  titleFontClass,
  titleWeight,
  helpers,
  headerBackground,
  headerShadow,
}) => {
  const { getLayoutStyle, getSize } = helpers;

  return (
    <div
      data-section-id="header"
      className="px-10 text-white rounded-t-3xl"
      style={{
        background: headerBackground,
        paddingTop: '2rem',
        paddingBottom: '2rem',
        boxShadow: headerShadow,
        ...getLayoutStyle('header'),
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="px-3 py-1 rounded-full text-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF', fontWeight: titleWeight }}
            >
              2026 WINTER
            </span>
          </div>
          <h1
            className={`text-3xl tracking-tight ${titleFontClass}`}
            style={{ fontSize: `${(typography.titleSize + 4) * 1.2}pt`, fontWeight: titleWeight }}
          >
            {classPlan.showTitle && classPlan.title && (
              <span className="mr-2" style={{ fontSize: `${getSize('title')}pt` }}>
                [{classPlan.title}]
              </span>
            )}
            윈터 프로그램 안내문
          </h1>
        </div>
        <div className="text-right flex-shrink-0 ml-6">
          <img
            src="/images/2-1.png"
            alt="원리와 해석 수학학원"
            className="object-contain"
            style={{ height: '4.5rem' }}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeaderSection);
