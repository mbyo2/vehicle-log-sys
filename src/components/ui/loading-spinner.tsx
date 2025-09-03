import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'primary' | 'muted';
}

export function LoadingSpinner({ 
  size = 24, 
  className = "",
  variant = 'default' 
}: LoadingSpinnerProps) {
  const variants = {
    default: 'text-foreground',
    primary: 'text-primary',
    muted: 'text-muted-foreground'
  };

  return (
    <Loader2 
      className={cn(
        "animate-spin",
        variants[variant],
        className
      )}
      size={size}
    />
  );
}