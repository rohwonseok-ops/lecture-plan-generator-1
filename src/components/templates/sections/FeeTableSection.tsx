'use client';

import React, { useMemo, CSSProperties } from 'react';
import { BaseSectionProps, textColors } from './types';
import { FeeRow } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * 수강료 안내 섹션
 */
const FeeTableSection: React.FC<BaseSectionProps> = ({
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
  const feeInfo = classPlan.feeInfo;

  // 월별 그룹화 (메모이제이션)
  const groupedByMonth = useMemo(() => {
    const grouped: Record<string, FeeRow[]> = {};
    if (feeInfo?.rows) {
      feeInfo.rows.forEach(row => {
        if (!grouped[row.month]) grouped[row.month] = [];
        grouped[row.month].push(row);
      });
    }
    return grouped;
  }, [feeInfo?.rows]);

  if (!feeInfo || feeInfo.rows.length === 0) {
    return null;
  }

  const headerStyle: CSSProperties = {
    ...getHeaderStyle(8),
    padding: '0.7rem 0.95rem',
    minHeight: '2.35rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  };

  const fontSize = getSize('feeTable');

  return (
    <Card
      data-section-id="fee-table"
      className="overflow-hidden shadow-sm mt-auto"
      style={{
        borderColor: colors.border,
        background: undefined,
        ...getLayoutStyle('feeTable'),
      }}
    >
      <CardHeader className={`${getHeaderTextClass()}`} style={headerStyle}>
        <CardTitle
          className={`text-sm flex w-full items-center justify-start gap-2 text-left ${titleFontClass}`}
          style={{ fontSize: `${typography.titleSize * 0.875}pt`, fontWeight: titleWeight, textAlign: 'left' }}
        >
          <span style={{ fontSize: `${typography.titleSize * 0.875 * 1.2}pt` }}>📌</span>
          {feeInfo.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0" style={{ fontSize: `${fontSize}pt` }}>
        <Table style={{ fontSize: `${fontSize}pt` }}>
          <TableHeader>
            <TableRow style={{ backgroundColor: colors.light, borderColor: colors.lighter }}>
              <TableHead className={`h-8 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${fontSize}pt`, fontWeight: titleWeight }}>월</TableHead>
              <TableHead className={`h-8 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${fontSize}pt`, fontWeight: titleWeight }}>수업구분</TableHead>
              <TableHead className={`h-8 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${fontSize}pt`, fontWeight: titleWeight }}>요일</TableHead>
              <TableHead className={`h-8 ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${fontSize}pt`, fontWeight: titleWeight }}>시간</TableHead>
              <TableHead className={`h-8 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${fontSize}pt`, fontWeight: titleWeight }}>수강료</TableHead>
              <TableHead className={`h-8 text-center ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${fontSize}pt`, fontWeight: titleWeight }}>회차</TableHead>
              <TableHead className={`h-8 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${fontSize}pt`, fontWeight: titleWeight }}>합계</TableHead>
              <TableHead className={`h-8 text-right ${bodyFontClass}`} style={{ color: colors.dark, fontSize: `${fontSize}pt`, fontWeight: titleWeight }}>총 합계</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedByMonth).map(([month, rows]) => {
              const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total ||
                rows.reduce((sum, row) => sum + row.subtotal, 0);
              return rows.map((row, idx) => (
                <TableRow
                  key={`${month}-${idx}`}
                  style={{
                    borderColor: colors.lighter,
                    ...(idx === 0 ? { borderTopWidth: '2px', borderTopColor: colors.border || colors.primary } : {}),
                  }}
                >
                  {idx === 0 && (
                    <TableCell
                      className={`py-2 ${bodyFontClass}`}
                      rowSpan={rows.length}
                      style={{
                        backgroundColor: colors.light,
                        color: colors.dark,
                        fontSize: `${fontSize}pt`,
                        fontWeight: titleWeight,
                        borderRight: '2px solid',
                        borderRightColor: colors.border || colors.primary,
                      }}
                    >
                      {month}
                    </TableCell>
                  )}
                  <TableCell className={`py-2 ${bodyFontClass}`} style={{ fontSize: `${fontSize}pt`, fontWeight: bodyWeight, color: textColors.primary }}>
                    {row.classType}
                  </TableCell>
                  <TableCell className={`py-2 ${bodyFontClass}`} style={{ fontSize: `${fontSize}pt`, fontWeight: bodyWeight, color: textColors.primary }}>
                    {row.day}
                  </TableCell>
                  <TableCell className={`py-2 ${bodyFontClass}`} style={{ fontSize: `${fontSize}pt`, fontWeight: bodyWeight, color: textColors.primary }}>
                    {row.time}
                  </TableCell>
                  <TableCell className={`py-2 text-right ${bodyFontClass}`} style={{ fontSize: `${fontSize}pt`, fontWeight: bodyWeight, color: textColors.primary }}>
                    {row.unitFee.toLocaleString()}
                  </TableCell>
                  <TableCell className={`py-2 text-center ${bodyFontClass}`} style={{ fontSize: `${fontSize}pt`, fontWeight: bodyWeight, color: textColors.primary }}>
                    {row.sessions}
                  </TableCell>
                  <TableCell className={`py-2 text-right ${bodyFontClass}`} style={{ fontSize: `${fontSize}pt`, fontWeight: bodyWeight, color: textColors.strong }}>
                    {row.subtotal.toLocaleString()}
                  </TableCell>
                  {idx === 0 && (
                    <TableCell
                      className={`py-2 text-right ${bodyFontClass}`}
                      rowSpan={rows.length}
                      style={{
                        backgroundColor: colors.light,
                        color: colors.dark || colors.primary,
                        fontSize: `${fontSize}pt`,
                        fontWeight: 700,
                      }}
                    >
                      {monthTotal.toLocaleString()}
                    </TableCell>
                  )}
                </TableRow>
              ));
            })}
          </TableBody>
        </Table>
        {/* 수강료 안내 멘트 */}
        <div className="px-3 pt-4 pb-3 border-t border-zinc-200">
          <div className="space-y-1">
            <p className={`text-xs ${bodyFontClass}`} style={{ fontSize: `${fontSize * 0.95}pt`, fontWeight: bodyWeight, color: '#6b7280', lineHeight: 1.4 }}>
              * 형제 할인 등이 적용되지 않은 기준 수강료 안내입니다. (수납 문자는 할인 반영된 금액으로 전송됩니다)
            </p>
            <p className={`text-xs ${bodyFontClass}`} style={{ fontSize: `${fontSize * 0.95}pt`, fontWeight: bodyWeight, color: '#6b7280', lineHeight: 1.4 }}>
              * 방학 중 늘어난 특강수업 시간에 대해서는 할인이 적용되지 않는 점 양해 부탁드립니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(FeeTableSection);
