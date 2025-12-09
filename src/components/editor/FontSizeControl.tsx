'use client';

import React from 'react';
import { Minus, Plus, Type } from 'lucide-react';

interface FontSizeControlProps {
  value: number;
  onChange: (size: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  compact?: boolean;
}

const FontSizeControl: React.FC<FontSizeControlProps> = ({
  value,
  onChange,
  min = 8,
  max = 24,
  step = 1,
  label,
  compact = true,
}) => {
  const decrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const increase = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-0.5 bg-zinc-100 rounded px-1 py-0.5">
        <button
          type="button"
          onClick={decrease}
          disabled={value <= min}
          className="p-0.5 text-zinc-500 hover:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
          title="폰트 크기 줄이기"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-[9px] font-medium text-zinc-600 min-w-[20px] text-center">
          {value}pt
        </span>
        <button
          type="button"
          onClick={increase}
          disabled={value >= max}
          className="p-0.5 text-zinc-500 hover:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
          title="폰트 크기 키우기"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {label && (
        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
          <Type className="w-3 h-3" />
          <span>{label}</span>
        </div>
      )}
      <div className="inline-flex items-center gap-1 bg-zinc-100 rounded-md px-1.5 py-1">
        <button
          type="button"
          onClick={decrease}
          disabled={value <= min}
          className="p-0.5 text-zinc-500 hover:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed rounded hover:bg-zinc-200"
          title="폰트 크기 줄이기"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const newValue = Math.min(max, Math.max(min, Number(e.target.value) || min));
            onChange(newValue);
          }}
          className="w-10 text-center text-[11px] font-medium text-zinc-700 bg-white border border-zinc-200 rounded px-1 py-0.5 focus:outline-none focus:border-blue-400"
          min={min}
          max={max}
        />
        <span className="text-[10px] text-zinc-500">pt</span>
        <button
          type="button"
          onClick={increase}
          disabled={value >= max}
          className="p-0.5 text-zinc-500 hover:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed rounded hover:bg-zinc-200"
          title="폰트 크기 키우기"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default FontSizeControl;

