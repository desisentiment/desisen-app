import { useEffect, useRef, useState } from 'react';

/**
 * Performance optimization hook for lazy loading and intersection observation
 */
export function usePerformanceOptimization(onVisible: () => void) {
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = componentRef.current;
    
    if (currentRef) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            onVisible();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(currentRef);

      return () => {
        if (currentRef) {
          observer.unobserve(currentRef);
        }
      };
    }
  }, [onVisible]);

  return { componentRef };
}

/**
 * Hook for optimizing expensive calculations with debouncing
 */
export function useDebouncedMemo<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for optimizing chart rendering
 */
export function useOptimizedChartData<T>(data: T[], transformFn: (data: T[]) => T[]) {
  const [optimizedData, setOptimizedData] = useState<T[]>([]);

  useEffect(() => {
    // Only process data if it's not empty and has changed significantly
    if (data.length > 0) {
      const result = transformFn(data);
      setOptimizedData(result);
    }
  }, [data, transformFn]);

  return optimizedData;
}
