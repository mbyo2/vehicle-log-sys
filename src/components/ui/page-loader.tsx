import { LoadingSpinner } from "./loading-spinner";

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function PageLoader({ 
  message = "Loading...", 
  fullScreen = true 
}: PageLoaderProps) {
  const containerClass = fullScreen 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        <div className="relative">
          <LoadingSpinner size={32} className="text-primary" />
          <div className="absolute inset-0 animate-ping">
            <LoadingSpinner size={32} className="opacity-20 text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}