'use client';

import React, { useEffect } from 'react';
import { ClassPlan, FeeInfo, FeeRow } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  classPlan: ClassPlan;
  onChange: (patch: Partial<ClassPlan>) => void;
}

const defaultFeeInfo: FeeInfo = {
  title: '[수1/수2] 몰입특강 수강료',
  rows: [
    { month: '1월', classType: '진도수업', day: '월수금', time: '각4시간', unitFee: 52500, sessions: 10, subtotal: 525000 },
    { month: '1월', classType: '확인학습', day: '', time: '매회', unitFee: 8000, sessions: 8, subtotal: 64000 },
  ],
  monthlyTotals: [{ month: '1월', total: 589000 }]
};

const FeeTableSection: React.FC<Props> = ({ classPlan, onChange }) => {
  const feeInfo = classPlan.feeInfo || defaultFeeInfo;

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

  const updateFeeInfo = (newFeeInfo: Partial<FeeInfo>) => {
    const updatedFeeInfo = { ...feeInfo, ...newFeeInfo };
    onChange({ feeInfo: updatedFeeInfo });
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
    const lastRow = feeInfo.rows[feeInfo.rows.length - 1];
    const newRow: FeeRow = {
      month: lastRow?.month || '1월',
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
  };

  const removeRow = (index: number) => {
    const newRows = feeInfo.rows.filter((_, i) => i !== index);
    const monthlyTotals = calculateMonthlyTotals(newRows);
    onChange({ feeInfo: { ...feeInfo, rows: newRows, monthlyTotals } });
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
    <div className="h-full flex flex-col p-3 bg-white overflow-hidden">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-xs font-bold text-zinc-700">💰 수강료 안내</h3>
          <input
            type="text"
            className="text-sm px-2.5 py-1 bg-white border border-zinc-300 rounded focus:border-blue-500 outline-none w-52 text-zinc-800 placeholder:text-zinc-400"
            value={feeInfo.title}
            onChange={(e) => updateFeeInfo({ title: e.target.value })}
            placeholder="수강료 안내 제목"
          />
        </div>
        <button
          onClick={addRow}
          className="flex items-center space-x-1 text-xs px-2.5 py-1 bg-zinc-800 text-white rounded hover:bg-zinc-900 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>행 추가</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
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
                      <td className="px-2 py-1.5 font-bold text-zinc-700 border-r border-zinc-200 bg-zinc-50" rowSpan={monthRows.length}>
                        <input
                          type="text"
                          className="w-full px-1 py-0.5 bg-transparent border-none outline-none font-bold text-zinc-700 text-xs"
                          value={row.month}
                          onChange={(e) => updateRow(globalIdx, 'month', e.target.value)}
                        />
                      </td>
                    )}
                    <td className="px-1.5 py-1.5 border-r border-zinc-200">
                      <input
                        type="text"
                        className="w-full px-2 py-1 bg-white border border-zinc-200 hover:border-zinc-400 rounded focus:border-blue-500 outline-none text-zinc-800 text-xs"
                        value={row.classType}
                        onChange={(e) => updateRow(globalIdx, 'classType', e.target.value)}
                      />
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-zinc-200">
                      <input
                        type="text"
                        className="w-full px-2 py-1 bg-white border border-zinc-200 hover:border-zinc-400 rounded focus:border-blue-500 outline-none text-zinc-800 text-xs"
                        value={row.day}
                        onChange={(e) => updateRow(globalIdx, 'day', e.target.value)}
                      />
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-zinc-200">
                      <input
                        type="text"
                        className="w-full px-2 py-1 bg-white border border-zinc-200 hover:border-zinc-400 rounded focus:border-blue-500 outline-none text-zinc-800 text-xs"
                        value={row.time}
                        onChange={(e) => updateRow(globalIdx, 'time', e.target.value)}
                      />
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-zinc-200 text-right">
                      <input
                        type="number"
                        className="w-full px-2 py-1 bg-white border border-zinc-200 hover:border-zinc-400 rounded focus:border-blue-500 outline-none text-right text-zinc-800 text-xs"
                        value={row.unitFee}
                        onChange={(e) => updateRow(globalIdx, 'unitFee', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-zinc-200 text-center">
                      <input
                        type="number"
                        className="w-16 px-2 py-1 bg-white border border-zinc-200 hover:border-zinc-400 rounded focus:border-blue-500 outline-none text-center mx-auto text-zinc-800 text-xs"
                        value={row.sessions}
                        onChange={(e) => updateRow(globalIdx, 'sessions', Number(e.target.value))}
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
                        className="p-0.5 text-zinc-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-3 h-3" />
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
