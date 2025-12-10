'use client';

import React, { useCallback } from 'react';
import { ClassPlan, FeeInfo, FeeRow, FieldFontSizes } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { getFieldFontSize, getDefaultTypography } from '@/lib/utils';
import FontSizeControl from '../FontSizeControl';

interface Props {
  classPlan: ClassPlan;
  onChange: (patch: Partial<ClassPlan>) => void;
}

const defaultFeeInfo: FeeInfo = {
  title: '수강료 안내',
  rows: [
    { month: '1월', classType: '진도수업', day: '월수금', time: '각4시간', unitFee: 52500, sessions: 10, subtotal: 525000 },
    { month: '1월', classType: '확인학습', day: '', time: '매회', unitFee: 8000, sessions: 8, subtotal: 64000 },
  ],
  monthlyTotals: [{ month: '1월', total: 589000 }]
};

const FeeTableSection: React.FC<Props> = ({ classPlan, onChange }) => {
  // React hooks는 컴포넌트 최상단에 선언
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);
  const [showMessage, setShowMessage] = React.useState<string>('');

  const feeInfo = classPlan.feeInfo || defaultFeeInfo;

  // 타이포그래피 설정
  const typography = classPlan.typography || getDefaultTypography();
  const fieldFontSizes = typography.fieldFontSizes;

  // 필드별 폰트 크기 업데이트
  const handleFieldFontSizeChange = useCallback((field: keyof FieldFontSizes, size: number) => {
    const currentTypography = classPlan.typography || getDefaultTypography();
    const currentFieldSizes = currentTypography.fieldFontSizes || {};
    onChange({
      typography: {
        ...currentTypography,
        fieldFontSizes: {
          ...currentFieldSizes,
          [field]: size,
        },
      },
    });
  }, [classPlan.typography, onChange]);

  // 필드 폰트 크기 가져오기 (기본값: bodySize)
  const getFontSize = useCallback((field: keyof FieldFontSizes): number => {
    return getFieldFontSize(fieldFontSizes, field, typography.bodySize);
  }, [fieldFontSizes, typography.bodySize]);

  // 수강료 합계 자동 계산
  const calculateSubtotal = (unitFee: number, sessions: number) => unitFee * sessions;

  // 월별 총합계 계산
  const calculateMonthlyTotals = (rows: FeeRow[]) => {
    const monthTotals: Record<string, number> = {};
    rows.forEach(row => {
      if (!monthTotals[row.month]) monthTotals[row.month] = 0;
      monthTotals[row.month] += row.subtotal;
    });
    return Object.entries(monthTotals).map(([month, total]) => ({ month, total }));
  };

  const updateRow = (index: number, field: keyof FeeRow, value: string | number) => {
    const newRows = [...feeInfo.rows];
    newRows[index] = { ...newRows[index], [field]: value };
    
    // 자동 계산: subtotal = unitFee * sessions
    if (field === 'unitFee' || field === 'sessions') {
      const unitFee = field === 'unitFee' ? Number(value) : newRows[index].unitFee;
      const sessions = field === 'sessions' ? Number(value) : newRows[index].sessions;
      newRows[index].subtotal = calculateSubtotal(unitFee, sessions);
    }
    
    // 월별 총합계 재계산
    const monthlyTotals = calculateMonthlyTotals(newRows);
    
    onChange({ 
      feeInfo: { 
        ...feeInfo, 
        rows: newRows, 
        monthlyTotals 
      } 
    });
  };

  const addRow = () => {
    if (!selectedMonth) {
      setShowMessage('월을 선택해 주세요.');
      setTimeout(() => setShowMessage(''), 2000);
      return;
    }
    const newRow: FeeRow = {
      month: selectedMonth,
      classType: '진도수업',
      day: '',
      time: '',
      unitFee: 0,
      sessions: 0,
      subtotal: 0
    };
    const newRows = [...feeInfo.rows, newRow];
    const monthlyTotals = calculateMonthlyTotals(newRows);
    onChange({ feeInfo: { ...feeInfo, rows: newRows, monthlyTotals } });
    setShowMessage('');
  };

  const removeRow = (index: number) => {
    if (!selectedMonth) {
      setShowMessage('월을 선택해 주세요.');
      setTimeout(() => setShowMessage(''), 2000);
      return;
    }
    const rowToRemove = feeInfo.rows[index];
    if (rowToRemove.month !== selectedMonth) {
      setShowMessage('선택한 월의 행만 삭제할 수 있습니다.');
      setTimeout(() => setShowMessage(''), 2000);
      return;
    }
    const newRows = feeInfo.rows.filter((_, i) => i !== index);
    const monthlyTotals = calculateMonthlyTotals(newRows);
    onChange({ feeInfo: { ...feeInfo, rows: newRows, monthlyTotals } });
    setShowMessage('');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('ko-KR');
  };

  // 월별로 그룹화
  const groupedByMonth: Record<string, { rows: FeeRow[]; indices: number[] }> = {};
  feeInfo.rows.forEach((row, idx) => {
    if (!groupedByMonth[row.month]) {
      groupedByMonth[row.month] = { rows: [], indices: [] };
    }
    groupedByMonth[row.month].rows.push(row);
    groupedByMonth[row.month].indices.push(idx);
  });

  return (
    <div className="p-2 bg-white">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-bold text-blue-600">수강료 안내</h3>
          <FontSizeControl
            value={getFontSize('feeTable')}
            onChange={(size) => handleFieldFontSizeChange('feeTable', size)}
          />
        </div>
        <div className="flex items-center gap-2">
        <button
          onClick={addRow}
          className="flex items-center space-x-1 text-xs px-2.5 py-1 bg-zinc-800 text-white rounded hover:bg-zinc-900 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>행 추가</span>
        </button>
          <button
            onClick={() => {
              if (!selectedMonth) {
                setShowMessage('월을 선택해 주세요.');
                setTimeout(() => setShowMessage(''), 2000);
                return;
              }
              const monthIndices = feeInfo.rows
                .map((row, idx) => row.month === selectedMonth ? idx : -1)
                .filter(idx => idx !== -1);
              if (monthIndices.length > 0) {
                const lastIndex = monthIndices[monthIndices.length - 1];
                removeRow(lastIndex);
              }
            }}
            className="flex items-center space-x-1 text-xs px-2.5 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>행 삭제</span>
          </button>
        </div>
      </div>
      {showMessage && (
        <div className="mb-1.5 text-xs text-red-600 font-medium">{showMessage}</div>
      )}

      <div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-700 text-white">
              <th className="px-2 py-1.5 text-left font-medium border-r border-zinc-600">월</th>
              <th className="px-2 py-1.5 text-left font-medium border-r border-zinc-600">수업구분</th>
              <th className="px-2 py-1.5 text-left font-medium border-r border-zinc-600">요일</th>
              <th className="px-2 py-1.5 text-left font-medium border-r border-zinc-600">시간</th>
              <th className="px-2 py-1.5 text-right font-medium border-r border-zinc-600">수강료</th>
              <th className="px-2 py-1.5 text-center font-medium border-r border-zinc-600">회차</th>
              <th className="px-2 py-1.5 text-right font-medium border-r border-zinc-600">합계</th>
              <th className="px-2 py-1.5 text-right font-medium">총 합계</th>
              <th className="px-1 py-1.5 w-6"></th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedByMonth).map(([month, { rows: monthRows, indices }]) => {
              const monthTotal = feeInfo.monthlyTotals.find(m => m.month === month)?.total || 
                monthRows.reduce((sum, row) => sum + row.subtotal, 0);
              
              return monthRows.map((row, localIdx) => {
                const globalIdx = indices[localIdx];
                const isFirstOfMonth = localIdx === 0;
                
                return (
                  <tr key={globalIdx} className="border-b border-zinc-200 hover:bg-blue-50/50">
                    {isFirstOfMonth && (
                      <td 
                        className={`px-2 py-1.5 font-bold text-zinc-700 border-r border-zinc-200 bg-zinc-50 cursor-pointer transition-colors ${
                          selectedMonth === month ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                        }`}
                        rowSpan={monthRows.length}
                        onClick={() => {
                          setSelectedMonth(month);
                          setShowMessage('');
                        }}
                      >
                        <div className="w-full px-1 py-0.5 font-bold text-zinc-700 text-xs">
                          {row.month}
                        </div>
                      </td>
                    )}
                    <td className="px-1.5 py-1.5 border-r border-zinc-200">
                      <input
                        type="text"
                        className="w-full px-2 py-1 bg-white border border-zinc-200 hover:border-zinc-400 rounded focus:border-blue-500 outline-none text-zinc-800 text-xs"
                        value={row.classType}
                        onChange={(e) => updateRow(globalIdx, 'classType', e.target.value)}
                        aria-label={`${row.month} 수업구분`}
                      />
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-zinc-200">
                      <input
                        type="text"
                        className="w-full px-2 py-1 bg-white border border-zinc-200 hover:border-zinc-400 rounded focus:border-blue-500 outline-none text-zinc-800 text-xs"
                        value={row.day}
                        onChange={(e) => updateRow(globalIdx, 'day', e.target.value)}
                        aria-label={`${row.month} 요일`}
                      />
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-zinc-200">
                      <input
                        type="text"
                        className="w-full px-2 py-1 bg-white border border-zinc-200 hover:border-zinc-400 rounded focus:border-blue-500 outline-none text-zinc-800 text-xs"
                        value={row.time}
                        onChange={(e) => updateRow(globalIdx, 'time', e.target.value)}
                        aria-label={`${row.month} 시간`}
                      />
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-zinc-200 text-right">
                      <input
                        type="number"
                        className="w-full px-2 py-1 bg-white border border-zinc-200 hover:border-zinc-400 rounded focus:border-blue-500 outline-none text-right text-zinc-800 text-xs"
                        value={row.unitFee}
                        onChange={(e) => updateRow(globalIdx, 'unitFee', Number(e.target.value))}
                        aria-label={`${row.month} 수강료`}
                      />
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-zinc-200 text-center">
                      <input
                        type="number"
                        className="w-16 px-2 py-1 bg-white border border-zinc-200 hover:border-zinc-400 rounded focus:border-blue-500 outline-none text-center mx-auto text-zinc-800 text-xs"
                        value={row.sessions}
                        onChange={(e) => updateRow(globalIdx, 'sessions', Number(e.target.value))}
                        aria-label={`${row.month} 회차`}
                      />
                    </td>
                    <td className="px-2 py-1.5 border-r border-zinc-200 text-right font-medium text-zinc-700 bg-zinc-50 text-xs">
                      {formatCurrency(row.subtotal)}
                    </td>
                    {isFirstOfMonth && (
                      <td className="px-2 py-1.5 text-right font-bold text-red-600 bg-zinc-50 text-xs" rowSpan={monthRows.length}>
                        {formatCurrency(monthTotal)}
                      </td>
                    )}
                    <td className="px-1 py-1.5">
                      <button
                        onClick={() => removeRow(globalIdx)}
                        className="p-0.5 text-zinc-600 hover:text-red-500 transition"
                        aria-label={`${row.month} ${row.classType} 행 삭제`}
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeeTableSection;
