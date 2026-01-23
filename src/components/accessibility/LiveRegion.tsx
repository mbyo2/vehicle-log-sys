import React from 'react';

interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

/**
 * Announces dynamic content changes to screen readers.
 * Use 'polite' for non-urgent updates, 'assertive' for important alerts.
 */
export function LiveRegion({ 
  children, 
  politeness = 'polite',
  atomic = true,
  relevant = 'additions'
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
}
