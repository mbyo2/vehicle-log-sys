import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    // Monitor performance metrics
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      const renderTime = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      
      // Memory usage (if available)
      const memoryUsage = (performance as any).memory ? 
        (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0;

      setMetrics({
        loadTime,
        renderTime,
        memoryUsage
      });
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !metrics) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-2 text-xs font-mono shadow-lg z-50 opacity-75 hover:opacity-100 transition-opacity">
      <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
      <div>Render: {metrics.renderTime.toFixed(0)}ms</div>
      {metrics.memoryUsage > 0 && (
        <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
      )}
    </div>
  );
}