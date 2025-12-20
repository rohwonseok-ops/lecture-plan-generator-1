'use client';

import React from 'react';
import { Check, Loader2, AlertCircle, Circle } from 'lucide-react';

export type SaveState = 'idle' | 'saving' | 'error' | 'unsaved';

interface SaveStatusProps {
  state: SaveState;
  lastSaveTime?: string | null;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * 상대 시간 포맷 (예: "2분 전")
 */
function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const saved = new Date();
  const [hours, minutes] = dateStr.split(':').map(Number);
  saved.setHours(hours, minutes, 0, 0);

  const diffMs = now.getTime() - saved.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  return dateStr;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({
  state,
  lastSaveTime,
  error,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {state === 'idle' && lastSaveTime && (
        <>
          <Check className="w-3.5 h-3.5 text-green-600" />
          <span className="text-[10px] text-zinc-600">
            {formatRelativeTime(lastSaveTime)} 저장됨
          </span>
        </>
      )}

      {state === 'saving' && (
        <>
          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          <span className="text-[10px] text-blue-600 font-medium">
            저장 중...
          </span>
        </>
      )}

      {state === 'error' && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          <span className="text-[10px] text-red-600">
            저장 실패
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[10px] text-blue-600 hover:text-blue-700 underline"
            >
              재시도
            </button>
          )}
          {error && (
            <span className="text-[9px] text-red-500 max-w-[150px] truncate" title={error}>
              ({error})
            </span>
          )}
        </>
      )}

      {state === 'unsaved' && (
        <>
          <Circle className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
          <span className="text-[10px] text-amber-600 font-medium">
            변경사항 있음
          </span>
        </>
      )}
    </div>
  );
};

export default SaveStatus;
