
import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const frozen = useRef(false);

  const { 
    triggerOnce = false, 
    freezeOnceVisible = false, 
    ...observerOptions 
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        
        if (!frozen.current) {
          setIsIntersecting(isElementIntersecting);
          setEntry(entry);
          
          if (isElementIntersecting && !hasBeenVisible) {
            setHasBeenVisible(true);
            
            if (triggerOnce || freezeOnceVisible) {
              frozen.current = true;
            }
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...observerOptions,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [hasBeenVisible, triggerOnce, freezeOnceVisible, observerOptions]);

  return {
    ref: elementRef,
    targetRef: elementRef, // Alias for compatibility
    isIntersecting,
    hasBeenVisible,
    entry
  };
}
