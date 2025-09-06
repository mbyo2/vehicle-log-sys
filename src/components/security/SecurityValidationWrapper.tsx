import { useEffect } from 'react';
import { useEnhancedSecurity } from '@/hooks/useEnhancedSecurity';
import { useToast } from '@/hooks/use-toast';

interface SecurityValidationWrapperProps {
  children: React.ReactNode;
  enableGlobalValidation?: boolean;
}

export function SecurityValidationWrapper({ 
  children, 
  enableGlobalValidation = true 
}: SecurityValidationWrapperProps) {
  const { checkSuspiciousActivity } = useEnhancedSecurity();
  const { toast } = useToast();

  useEffect(() => {
    if (!enableGlobalValidation) return;

    // Monitor form inputs for suspicious activity
    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target || !target.value) return;

      // Skip password fields and other sensitive inputs
      if (target.type === 'password' || target.type === 'email') return;

      const result = checkSuspiciousActivity(target.value, `form_input_${target.name || 'unknown'}`);
      
      if (result.isSuspicious) {
        // Clear the suspicious input
        target.value = '';
        
        toast({
          variant: "destructive",
          title: "Security Alert",
          description: "Suspicious input detected and blocked for security reasons.",
        });
      }
    };

    // Add global event listeners
    document.addEventListener('input', handleInput);
    
    return () => {
      document.removeEventListener('input', handleInput);
    };
  }, [enableGlobalValidation, checkSuspiciousActivity, toast]);

  return <>{children}</>;
}