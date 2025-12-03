'use client';

import React from 'react';
import { ClassPlan } from '@/lib/types';

interface Props {
  classPlan: ClassPlan;
}

interface CalendarDay {
  date: number;
  dayOfWeek: number; // 0 = 일요일, 1 = 월요일, ...
  isSunday: boolean;
  isHoliday: boolean;
  isClassDay: boolean;
  holidayLabel?: string;
}

const MonthlyCalendar: React.FC<Props> = ({ classPlan }) => {
  // 수업 요일 파싱 (예: "월수금" -> [1, 3, 5])
  const parseClassDays = (classDay: string): number[] => {
    const dayMap: Record<string, number> = {
      '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6
    };
    const days: number[] = [];
    for (const char of classDay) {
      if (dayMap[char] !== undefined) {
        days.push(dayMap[char]);
      }
    }
    return days;
  };

  const classDays = parseClassDays(classPlan.classDay || '');

  // 2026년 1월과 2월 달력 생성
  const generateCalendar = (year: number, month: number): CalendarDay[] => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const calendar: CalendarDay[] = [];

    // 연휴 정의 (2026년 기준)
    const holidays: Record<string, { start: number; end: number; label: string }> = {
      '1': { start: 1, end: 1, label: '신정' }, // 1월 1일
      '2': { start: 7, end: 9, label: '설날 연휴' }, // 2026년 2월 7-9일 (음력 기준)
    };

    const monthKey = month.toString();
    const monthHoliday = holidays[monthKey];

    // 빈 칸 채우기
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push({
        date: 0,
        dayOfWeek: i,
        isSunday: i === 0,
        isHoliday: false,
        isClassDay: false,
      });
    }

    // 날짜 채우기
    for (let date = 1; date <= daysInMonth; date++) {
      const dayOfWeek = (startDayOfWeek + date - 1) % 7;
      const isSunday = dayOfWeek === 0;
      
      let isHoliday = false;
      let holidayLabel: string | undefined;
      
      if (monthHoliday && date >= monthHoliday.start && date <= monthHoliday.end) {
        isHoliday = true;
        if (date === monthHoliday.start) {
          holidayLabel = monthHoliday.label;
        }
      }
      
      const isClassDay = classDays.includes(dayOfWeek);

      calendar.push({
        date,
        dayOfWeek,
        isSunday,
        isHoliday,
        isClassDay,
        holidayLabel,
      });
    }

    return calendar;
  };

  const january = generateCalendar(2026, 1);
  const february = generateCalendar(2026, 2);

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const CalendarGrid = ({ month, calendar, monthName }: { month: number; calendar: CalendarDay[]; monthName: string }) => {
    const chunks: CalendarDay[][] = [];
    for (let i = 0; i < calendar.length; i += 7) {
      chunks.push(calendar.slice(i, i + 7));
    }

    return (
      <div className="flex-1">
        <div className="text-base font-bold mb-2 text-center">2026년 {monthName}</div>
        <div className="border border-zinc-300 rounded">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-zinc-300">
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className={`text-xs font-bold py-1 text-center border-r border-zinc-300 last:border-r-0 ${
                  idx === 0 ? 'text-red-600' : 'text-zinc-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* 날짜 그리드 */}
          {chunks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 border-b border-zinc-300 last:border-b-0">
              {week.map((day, dayIdx) => {
                if (day.date === 0) {
                  return (
                    <div
                      key={dayIdx}
                      className="h-8 border-r border-zinc-300 last:border-r-0 bg-zinc-50"
                    />
                  );
                }

                const isHolidayRange = day.isHoliday;
                const isSunday = day.isSunday && !isHolidayRange;
                const isClassDay = day.isClassDay && !isHolidayRange;

                return (
                  <div
                    key={dayIdx}
                    className={`h-8 border-r border-zinc-300 last:border-r-0 flex items-center justify-center text-xs font-medium ${
                      isHolidayRange
                        ? 'bg-red-600 text-white'
                        : isSunday
                        ? 'text-red-600 bg-white'
                        : isClassDay
                        ? 'bg-amber-50 text-zinc-700'
                        : 'bg-white text-zinc-600'
                    }`}
                  >
                    <div className="text-center">
                      <div>{day.date}</div>
                      {day.holidayLabel && (
                        <div className="text-[8px] leading-tight">{day.holidayLabel}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6">
      <h3 className="font-bold text-base mb-3 border-b-2 border-black pb-2 uppercase tracking-wide">
        월간계획
      </h3>
      <div className="flex gap-4">
        <CalendarGrid month={1} calendar={january} monthName="1월" />
        <CalendarGrid month={2} calendar={february} monthName="2월" />
      </div>
      
      {/* 범례 */}
      <div className="mt-3 flex gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-amber-50 border border-zinc-300"></div>
          <span>수업 요일</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-600"></div>
          <span>설날 연휴</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCalendar;

