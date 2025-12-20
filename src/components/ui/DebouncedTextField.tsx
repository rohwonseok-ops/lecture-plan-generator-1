'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

interface DebouncedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

/**
 * 디바운싱이 적용된 Input 컴포넌트
 * - 로컬 상태로 즉각적인 타이핑 반응
 * - 디바운스 후 부모에 값 전달
 */
export function DebouncedInput({
  value,
  onChange,
  debounceMs = 150,
  ...props
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInternalChange = useRef(false);

  // 외부 값 변경 시 로컬 값 동기화 (내부 변경이 아닐 때만)
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalValue(value);
    }
    isInternalChange.current = false;
  }, [value]);

  // 클린업
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    isInternalChange.current = true;
    setLocalValue(newValue);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  }, [onChange, debounceMs]);

  // 포커스 아웃 시 즉시 반영 (입력 중 다른 곳 클릭 시)
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (localValue !== value) {
      onChange(localValue);
    }
    props.onBlur?.(e);
  }, [localValue, value, onChange, props]);

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

/**
 * 디바운싱이 적용된 Textarea 컴포넌트
 * - 로컬 상태로 즉각적인 타이핑 반응
 * - 디바운스 후 부모에 값 전달
 */
export function DebouncedTextarea({
  value,
  onChange,
  debounceMs = 150,
  ...props
}: DebouncedTextareaProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInternalChange = useRef(false);

  // 외부 값 변경 시 로컬 값 동기화 (내부 변경이 아닐 때만)
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalValue(value);
    }
    isInternalChange.current = false;
  }, [value]);

  // 클린업
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    isInternalChange.current = true;
    setLocalValue(newValue);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  }, [onChange, debounceMs]);

  // 포커스 아웃 시 즉시 반영
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (localValue !== value) {
      onChange(localValue);
    }
    props.onBlur?.(e);
  }, [localValue, value, onChange, props]);

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

export default DebouncedInput;
