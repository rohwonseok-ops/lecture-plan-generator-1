'use client';

import React from 'react';
import { ClassPlan, ColorTheme } from '@/lib/types';
import { colorThemes, ColorPalette } from '@/lib/colorThemes';

interface Props {
  classPlan: ClassPlan;
  colorTheme?: ColorTheme;
  typography?: ClassPlan['typography'];
}

interface CalendarDay {
  date: number;
  dayOfWeek: number; // 0 = 일요일, 1 = 월요일, ...
  isSunday: boolean;
  isHoliday: boolean;
  isClassDay: boolean;
  holidayLabel?: string;
  classType?: 'regular' | 'special'; // 정규수업 또는 특강수업
}

const MonthlyCalendar: React.FC<Props> = ({ classPlan, colorTheme = 'blue', typography }) => {
  // 색상 테마 가져오기
  const colors: ColorPalette = colorThemes[colorTheme] || colorThemes.blue;

  // 특강수업 색상 계산 헬퍼 함수 (더 세련된 색상)
  const getSpecialColor = (primary: string) => {
    // 블루 계열 (#6A9FB8 등) → 세련된 파스텔 보라색 (블루와 잘 어울림)
    if (primary.includes('6A9F') || primary.includes('3B82') || primary.includes('4A7F')) {
      return { bg: '#E9D5FF', text: '#6B21A8', border: '#C084FC' }; // 부드러운 파스텔 보라
    }
    // 퍼플 계열 → 세련된 민트/틸 계열
    if (primary.includes('7C3A') || primary.includes('5B21')) {
      return { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' }; // 부드러운 민트 그린
    }
    // 오렌지 계열 → 세련된 라벤더/퍼플 계열
    if (primary.includes('F973') || primary.includes('EA58')) {
      return { bg: '#E9D5FF', text: '#6B21A8', border: '#C084FC' }; // 부드러운 라벤더
    }
    // 틸 계열 → 세련된 피치/코랄 계열
    if (primary.includes('14B8') || primary.includes('0D94')) {
      return { bg: '#FED7AA', text: '#9A3412', border: '#FDBA74' }; // 부드러운 피치
    }
    // 그린 계열 → 세련된 라벤더/퍼플 계열
    if (primary.includes('0E6A') || primary.includes('0A4E')) {
      return { bg: '#E9D5FF', text: '#6B21A8', border: '#C084FC' }; // 부드러운 라벤더
    }
    // 기본값: 부드러운 파스텔 보라
    return { bg: '#E9D5FF', text: '#6B21A8', border: '#C084FC' };
  };
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
      '2': { start: 15, end: 18, label: '설연휴' }, // 2026년 2월 15-18일
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
      
      // 정규수업/특강수업 구분
      // 1월 10일까지: 정규수업, 1월 12일부터 2월 말까지: 특강수업
      let classType: 'regular' | 'special' | undefined;
      if (isClassDay && !isHoliday) {
        if (month === 1 && date <= 10) {
          classType = 'regular';
        } else if ((month === 1 && date >= 12) || month === 2) {
          classType = 'special';
        }
      }

      calendar.push({
        date,
        dayOfWeek,
        isSunday,
        isHoliday,
        isClassDay,
        holidayLabel,
        classType,
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
        <div className="mb-1 text-center" style={{ fontSize: '11pt', fontWeight: 600 }}>2026년 {monthName}</div>
        <div className="border border-zinc-300 rounded">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-zinc-300">
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className={`font-bold py-0.5 text-center border-r border-zinc-300 last:border-r-0 ${
                  idx === 0 ? 'text-red-600' : 'text-zinc-700'
                }`}
                style={{ fontSize: '11pt' }}
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
                      className="h-6 border-r border-zinc-300 last:border-r-0 bg-zinc-50"
                    />
                  );
                }

                const isHolidayRange = day.isHoliday;
                const isSunday = day.isSunday && !isHolidayRange;
                const isClassDay = day.isClassDay && !isHolidayRange;
                const isRegularClass = day.classType === 'regular';
                const isSpecialClass = day.classType === 'special';

                // 정규수업: 파스텔 베이지 계열 배경 (테두리 없음)
                const regularBgColor = '#F7E9D8'; // 밝고 세련된 베이지 배경
                const regularTextColor = '#6B5B4F'; // 세련된 베이지/브라운 텍스트

                // 특강수업: 같은 블루 계열이지만 더 어둡게
                const specialBgColor = colors.lighter || `${colors.primary}60`; // 정규수업보다 더 진한 블루
                const specialTextColor = colors.dark || colors.primary; // 테마의 진한 텍스트색
                const specialBorderColor = colors.border || colors.primary; // 테마의 테두리색

                return (
                  <div
                    key={dayIdx}
                    className={`h-6 border-r border-zinc-300 last:border-r-0 flex items-center justify-center font-medium ${
                      isHolidayRange
                        ? 'bg-red-200 text-red-800'
                        : isSunday
                        ? 'text-red-600 bg-white'
                        : isRegularClass
                        ? ''
                        : isSpecialClass
                        ? ''
                        : isClassDay
                        ? 'bg-zinc-50 text-zinc-700'
                        : 'bg-white text-zinc-600'
                    }`}
                    style={
                      isRegularClass
                        ? {
                            fontSize: '11pt',
                            backgroundColor: regularBgColor,
                            color: regularTextColor,
                          }
                        : isSpecialClass
                        ? {
                            fontSize: '11pt',
                            backgroundColor: specialBgColor,
                            color: specialTextColor,
                            borderColor: specialBorderColor,
                          }
                        : { fontSize: '11pt' }
                    }
                  >
                    <div className="text-center leading-tight">
                      <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                        <span>{day.date}</span>
                        {day.holidayLabel && (
                          <span style={{ fontSize: day.date === 1 ? '8pt' : '9pt' }}>{day.holidayLabel}</span>
                        )}
                      </div>
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
    <div className="mb-3">
      <div className="flex gap-2">
        <CalendarGrid month={1} calendar={january} monthName="1월" />
        <div className="flex-1 flex flex-col">
          <CalendarGrid month={2} calendar={february} monthName="2월" />
          {/* 범례 */}
          <div className="mt-2 flex gap-3" style={{ fontSize: '11pt' }}>
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4" 
                style={{ 
                  backgroundColor: '#F7E9D8',
                }}
              ></div>
              <span>정규수업</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 border" 
                style={{ 
                  backgroundColor: colors.lighter || `${colors.primary}60`,
                  borderColor: colors.border || colors.primary,
                }}
              ></div>
              <span>특강수업</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-200"></div>
              <span>공휴일</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCalendar;

