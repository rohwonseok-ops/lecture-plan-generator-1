import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 값 디바운싱 훅
 * @param value 디바운싱할 값
 * @param delay 지연 시간 (ms)
 * @returns 디바운싱된 값
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 콜백 디바운싱 훅
 * @param callback 디바운싱할 콜백 함수
 * @param delay 지연 시간 (ms)
 * @returns 디바운싱된 콜백 함수
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 콜백 참조 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 클린업
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;

  return debouncedCallback;
}

export default useDebounce;
