import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  loading?: 'lazy' | 'eager';
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallback = '/placeholder.svg',
  loading = 'lazy',
  className,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (imageSrc !== fallback) {
      setImageSrc(fallback);
    }
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-all duration-300',
          isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100',
          hasError && 'opacity-60',
          className
        )}
        {...props}
      />
    </div>
  );
}