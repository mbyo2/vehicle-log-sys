import { lazy, Suspense, ComponentType } from 'react';
import { PageLoader } from '@/components/ui/page-loader';

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <PageLoader message="Loading component..." />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Preload a component
export function preloadComponent(importFn: () => Promise<{ default: ComponentType<any> }>) {
  return importFn();
}

// Lazy load with retry logic
export function createLazyComponentWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  maxRetries: number = 3,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(async () => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await importFn();
      } catch (error) {
        retries++;
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    
    throw new Error('Failed to load component after retries');
  });
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <PageLoader message="Loading component..." />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}