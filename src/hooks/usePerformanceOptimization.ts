
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

// Debounce hook for performance
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for performance
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdated >= delay) {
      setThrottledValue(value);
      setLastUpdated(now);
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value);
        setLastUpdated(Date.now());
      }, delay - (now - lastUpdated));

      return () => clearTimeout(timeoutId);
    }
  }, [value, delay, lastUpdated]);

  return throttledValue;
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    totalHeight: visibleItems.totalHeight,
    offsetY: visibleItems.offsetY
  };
}

// Lazy loading hook
export function useLazyLoading<T>(
  loadFn: () => Promise<T[]>,
  deps: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const newData = await loadFn();
      if (newData.length === 0) {
        setHasMore(false);
      } else {
        setData(prev => [...prev, ...newData]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadFn, loading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
  }, []);

  useEffect(() => {
    reset();
    loadMore();
  }, deps);

  return {
    data,
    loading,
    hasMore,
    loadMore,
    reset
  };
}

// Memory management hook
export function useMemoryOptimization() {
  const memoCache = useMemo(() => new Map(), []);
  
  const memoize = useCallback(<Args extends any[], Return>(
    fn: (...args: Args) => Return,
    keyFn?: (...args: Args) => string
  ) => {
    return (...args: Args): Return => {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);
      
      if (memoCache.has(key)) {
        return memoCache.get(key);
      }
      
      const result = fn(...args);
      
      // Limit cache size to prevent memory leaks
      if (memoCache.size > 100) {
        const firstKey = memoCache.keys().next().value;
        memoCache.delete(firstKey);
      }
      
      memoCache.set(key, result);
      return result;
    };
  }, [memoCache]);

  const clearCache = useCallback(() => {
    memoCache.clear();
  }, [memoCache]);

  return { memoize, clearCache };
}
