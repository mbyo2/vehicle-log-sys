import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  from?: 'top' | 'bottom' | 'left' | 'right' | 'scale';
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 300,
  className = '',
  from = 'bottom'
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const fromVariants = {
    top: 'translate-y-[-20px]',
    bottom: 'translate-y-5',
    left: 'translate-x-[-20px]',
    right: 'translate-x-5',
    scale: 'scale-95'
  };

  const baseClasses = "transition-all ease-out";
  const hiddenClasses = `opacity-0 ${fromVariants[from]}`;
  const visibleClasses = "opacity-100 translate-y-0 translate-x-0 scale-100";

  return (
    <div
      className={cn(
        baseClasses,
        isVisible ? visibleClasses : hiddenClasses,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
}