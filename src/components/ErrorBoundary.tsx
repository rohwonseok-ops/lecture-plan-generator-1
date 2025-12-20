'use client';

import React, { ErrorInfo } from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps extends FallbackProps {
  title?: string;
  compact?: boolean;
}

/**
 * 에러 발생 시 표시되는 폴백 컴포넌트
 */
function ErrorFallback({ error, resetErrorBoundary, title = '오류 발생', compact = false }: ErrorFallbackProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 truncate">{error.message || '알 수 없는 오류'}</span>
        <button
          onClick={resetErrorBoundary}
          className="p-1 hover:bg-red-100 rounded transition"
          title="다시 시도"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-lg font-semibold text-red-700 mb-2">{title}</h2>
      <p className="text-sm text-red-600 mb-4 text-center max-w-md">
        {error.message || '예기치 않은 오류가 발생했습니다.'}
      </p>
      <details className="mb-4 text-xs text-red-500 max-w-full">
        <summary className="cursor-pointer hover:underline">상세 정보</summary>
        <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto max-h-32 text-left">
          {error.stack}
        </pre>
      </details>
      <button
        onClick={resetErrorBoundary}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-medium"
      >
        <RefreshCw className="w-4 h-4" />
        다시 시도
      </button>
    </div>
  );
}

interface Props {
  children: React.ReactNode;
  title?: string;
  compact?: boolean;
  onReset?: () => void;
  onError?: (error: Error, info: ErrorInfo) => void;
}

/**
 * 에러 바운더리 컴포넌트
 * - 자식 컴포넌트에서 발생한 에러를 캐치
 * - 폴백 UI 표시 및 복구 기능 제공
 */
export default function ErrorBoundary({
  children,
  title,
  compact = false,
  onReset,
  onError,
}: Props) {
  return (
    <ReactErrorBoundary
      FallbackComponent={(props) => (
        <ErrorFallback {...props} title={title} compact={compact} />
      )}
      onReset={onReset}
      onError={onError}
    >
      {children}
    </ReactErrorBoundary>
  );
}

/**
 * 섹션별 에러 바운더리 (컴팩트 버전)
 */
export function SectionErrorBoundary({
  children,
  title,
  onReset,
}: {
  children: React.ReactNode;
  title?: string;
  onReset?: () => void;
}) {
  return (
    <ErrorBoundary title={title} compact onReset={onReset}>
      {children}
    </ErrorBoundary>
  );
}
