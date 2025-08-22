import { useCallback } from 'react';
import { SecurityUtils } from '@/lib/security';
import { useSecurityMonitoring } from './useSecurityMonitoring';
import { useToast } from '@/hooks/use-toast';

interface SecurityValidationOptions {
  validateInput?: boolean;
  logActivity?: boolean;
  rateLimitCheck?: boolean;
}

export function useEnhancedSecurity() {
  const { logSecurityEvent, logSuspiciousActivity } = useSecurityMonitoring();
  const { toast } = useToast();

  const validateAndSanitizeVehicleData = useCallback((data: any, options: SecurityValidationOptions = {}) => {
    const { validateInput = true, logActivity = true } = options;
    
    if (validateInput) {
      const validation = SecurityUtils.validateVehicleData(data);
      if (!validation.isValid) {
        if (logActivity) {
          logSuspiciousActivity('invalid_vehicle_data', { 
            errors: validation.errors,
            data: data 
          });
        }
        
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: validation.errors.join(', ')
        });
        
        return { isValid: false, sanitizedData: null, errors: validation.errors };
      }
    }

    // Sanitize the data
    const sanitizedData = {
      ...data,
      make: data.make ? SecurityUtils.sanitizeString(data.make) : data.make,
      model: data.model ? SecurityUtils.sanitizeString(data.model) : data.model,
      license_plate: data.license_plate ? SecurityUtils.sanitizeString(data.license_plate).toUpperCase() : data.license_plate,
    };

    if (logActivity) {
      logSecurityEvent({ 
        eventType: 'vehicle_data_validated', 
        riskLevel: 'low', 
        eventData: { vehicle_id: data.id } 
      });
    }

    return { isValid: true, sanitizedData, errors: [] };
  }, [logSecurityEvent, logSuspiciousActivity, toast]);

  const validateAndSanitizeTripData = useCallback((data: any, options: SecurityValidationOptions = {}) => {
    const { validateInput = true, logActivity = true } = options;
    
    if (validateInput) {
      const validation = SecurityUtils.validateTripLog(data);
      if (!validation.isValid) {
        if (logActivity) {
          logSuspiciousActivity('invalid_trip_data', { 
            errors: validation.errors,
            data: data 
          });
        }
        
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: validation.errors.join(', ')
        });
        
        return { isValid: false, sanitizedData: null, errors: validation.errors };
      }
    }

    // Sanitize the data
    const sanitizedData = {
      ...data,
      start_location: data.start_location ? SecurityUtils.sanitizeString(data.start_location) : data.start_location,
      end_location: data.end_location ? SecurityUtils.sanitizeString(data.end_location) : data.end_location,
      purpose: data.purpose ? SecurityUtils.sanitizeString(data.purpose) : data.purpose,
    };

    if (logActivity) {
      logSecurityEvent({ 
        eventType: 'trip_data_validated', 
        riskLevel: 'low', 
        eventData: { vehicle_id: data.vehicle_id } 
      });
    }

    return { isValid: true, sanitizedData, errors: [] };
  }, [logSecurityEvent, logSuspiciousActivity, toast]);

  const validateIntegrationCredentials = useCallback((data: any, options: SecurityValidationOptions = {}) => {
    const { validateInput = true, logActivity = true } = options;
    
    if (validateInput) {
      const validation = SecurityUtils.validateIntegrationCredentials(data);
      if (!validation.isValid) {
        if (logActivity) {
          logSuspiciousActivity('invalid_integration_credentials', { 
            errors: validation.errors,
            integration_type: data.type || data.system_type
          });
        }
        
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: validation.errors.join(', ')
        });
        
        return { isValid: false, sanitizedData: null, errors: validation.errors };
      }
    }

    // Sanitize the data (don't log actual credentials)
    const sanitizedData = {
      ...data,
      username: data.username ? SecurityUtils.sanitizeString(data.username) : data.username,
      endpoint_url: data.endpoint_url ? data.endpoint_url.trim() : data.endpoint_url,
    };

    if (logActivity) {
      logSecurityEvent({ 
        eventType: 'integration_credentials_validated', 
        riskLevel: 'medium', 
        eventData: { integration_type: data.type || data.system_type } 
      });
    }

    return { isValid: true, sanitizedData, errors: [] };
  }, [logSecurityEvent, logSuspiciousActivity, toast]);

  const checkSuspiciousActivity = useCallback((input: string, context?: string) => {
    const result = SecurityUtils.detectSuspiciousActivity(input);
    
    if (result.isSuspicious) {
      logSuspiciousActivity('suspicious_input_detected', {
        context,
        reasons: result.reasons,
        input_length: input.length
      });
      
      toast({
        variant: "destructive",
        title: "Suspicious Activity Detected",
        description: "Your input contains potentially malicious content."
      });
    }
    
    return result;
  }, [logSuspiciousActivity, toast]);

  return {
    validateAndSanitizeVehicleData,
    validateAndSanitizeTripData,
    validateIntegrationCredentials,
    checkSuspiciousActivity,
  };
}