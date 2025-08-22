import { useState } from 'react';
import { SecurityUtils } from '@/lib/security';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface EnhancedSecurityValidationProps {
  data: any;
  validationType: 'vehicle' | 'trip' | 'integration';
  onValidationChange?: (result: ValidationResult) => void;
}

export function EnhancedSecurityValidation({ 
  data, 
  validationType, 
  onValidationChange 
}: EnhancedSecurityValidationProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, errors: [] });

  const validateData = () => {
    let result: ValidationResult;
    
    switch (validationType) {
      case 'vehicle':
        result = SecurityUtils.validateVehicleData(data);
        break;
      case 'trip':
        result = SecurityUtils.validateTripLog(data);
        break;
      case 'integration':
        result = SecurityUtils.validateIntegrationCredentials(data);
        break;
      default:
        result = { isValid: true, errors: [] };
    }
    
    setValidationResult(result);
    onValidationChange?.(result);
    return result;
  };

  // Auto-validate when data changes
  useState(() => {
    if (data) {
      validateData();
    }
  });

  if (validationResult.isValid) {
    return (
      <Alert className="border-success bg-success/10">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertDescription className="text-success">
          Security validation passed
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-1">
          <div className="font-medium">Security validation failed:</div>
          {validationResult.errors.map((error, index) => (
            <div key={index} className="text-sm">• {error}</div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}