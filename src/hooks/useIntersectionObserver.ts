
import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const frozen = useRef(false);

  const { freezeOnceVisible = false, ...observerOptions } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        
        if (!frozen.current) {
          setIsIntersecting(isElementIntersecting);
          setEntry(entry);
          
          if (freezeOnceVisible && isElementIntersecting) {
            frozen.current = true;
          }
        }
      },
      observerOptions
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [freezeOnceVisible, observerOptions.threshold, observerOptions.root, observerOptions.rootMargin]);

  return {
    ref: elementRef,
    isIntersecting,
    entry
  };
}
