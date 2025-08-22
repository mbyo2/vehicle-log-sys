import DOMPurify from 'dompurify';

// Input validation and sanitization utilities
export class SecurityUtils {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input);
  }

  /**
   * Validate and sanitize email input
   */
  static validateEmail(email: string): { isValid: boolean; sanitized: string } {
    const sanitized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(sanitized),
      sanitized
    };
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { 
    isValid: boolean; 
    score: number; 
    feedback: string[] 
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Password must be at least 8 characters long');

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password must contain at least one uppercase letter');

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password must contain at least one lowercase letter');

    // Number check
    if (/\d/.test(password)) score += 1;
    else feedback.push('Password must contain at least one number');

    // Special character check
    if (/[@$!%*?&]/.test(password)) score += 1;
    else feedback.push('Password must contain at least one special character (@$!%*?&)');

    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      score = 0;
      feedback.push('Password is too common');
    }

    return {
      isValid: score >= 5,
      score,
      feedback
    };
  }

  /**
   * Sanitize string input to prevent injection attacks
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate and sanitize file upload
   */
  static validateFileUpload(file: File): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Rate limiting helper
   */
  static createRateLimiter(maxAttempts: number, windowMs: number) {
    const attempts = new Map<string, { count: number; resetTime: number }>();

    return {
      isAllowed: (identifier: string): boolean => {
        const now = Date.now();
        const record = attempts.get(identifier);

        if (!record || now > record.resetTime) {
          attempts.set(identifier, { count: 1, resetTime: now + windowMs });
          return true;
        }

        if (record.count >= maxAttempts) {
          return false;
        }

        record.count++;
        return true;
      },
      
      reset: (identifier: string): void => {
        attempts.delete(identifier);
      }
    };
  }

  /**
   * Check for suspicious patterns in user input
   */
  static detectSuspiciousActivity(input: string): { 
    isSuspicious: boolean; 
    reasons: string[] 
  } {
    const reasons: string[] = [];
    
    // SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
      /(UNION\s+SELECT)/i,
      /(\'\s*OR\s*\'\d+\'\s*=\s*\'\d+)/i
    ];

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    // Check for SQL injection
    sqlPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        reasons.push('Potential SQL injection detected');
      }
    });

    // Check for XSS
    xssPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        reasons.push('Potential XSS attack detected');
      }
    });

    // Check for path traversal
    if (/\.\.\//.test(input)) {
      reasons.push('Path traversal attempt detected');
    }

    // Check for command injection
    if (/[;&|`$()]/.test(input)) {
      reasons.push('Potential command injection detected');
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons
    };
  }

  /**
   * Enhanced vehicle data validation
   */
  static validateVehicleData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.plate_number && !this.validateLicensePlate(data.plate_number)) {
      errors.push('Invalid license plate format');
    }
    
    if (data.make && this.detectSuspiciousActivity(data.make).isSuspicious) {
      errors.push('Vehicle make contains suspicious content');
    }
    
    if (data.model && this.detectSuspiciousActivity(data.model).isSuspicious) {
      errors.push('Vehicle model contains suspicious content');
    }
    
    if (data.current_kilometers && (parseInt(data.current_kilometers) < 0 || parseInt(data.current_kilometers) > 10000000)) {
      errors.push('Invalid odometer reading');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate license plate format
   */
  static validateLicensePlate(plate: string): boolean {
    const sanitized = this.sanitizeString(plate);
    // Basic alphanumeric validation with dashes and spaces
    return /^[A-Z0-9\s\-]{1,15}$/i.test(sanitized);
  }

  /**
   * Enhanced trip log validation
   */
  static validateTripLog(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.start_location && this.detectSuspiciousActivity(data.start_location).isSuspicious) {
      errors.push('Start location contains suspicious content');
    }
    
    if (data.end_location && this.detectSuspiciousActivity(data.end_location).isSuspicious) {
      errors.push('End location contains suspicious content');
    }
    
    if (data.purpose && this.detectSuspiciousActivity(data.purpose).isSuspicious) {
      errors.push('Trip purpose contains suspicious content');
    }
    
    if (data.start_kilometers && data.end_kilometers) {
      if (parseInt(data.end_kilometers) <= parseInt(data.start_kilometers)) {
        errors.push('End odometer reading must be greater than start reading');
      }
      if ((parseInt(data.end_kilometers) - parseInt(data.start_kilometers)) > 2000) {
        errors.push('Trip distance seems unusually long (>2000km)');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Enhanced integration credentials validation
   */
  static validateIntegrationCredentials(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.api_key && !this.validateApiKey(data.api_key)) {
      errors.push('Invalid API key format');
    }
    
    if (data.username && this.detectSuspiciousActivity(data.username).isSuspicious) {
      errors.push('Username contains suspicious content');
    }
    
    if (data.endpoint_url && !this.validateUrl(data.endpoint_url)) {
      errors.push('Invalid endpoint URL');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate API key format
   */
  static validateApiKey(key: string): boolean {
    // Basic API key validation - alphanumeric with common separators
    return /^[a-zA-Z0-9_\-\.]{8,128}$/.test(key);
  }

  /**
   * Enhanced URL validation
   */
  static validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Only allow HTTPS for security
      return parsed.protocol === 'https:' && parsed.hostname.length > 0;
    } catch {
      return false;
    }
  }
}

// Rate limiters for common operations
export const loginRateLimiter = SecurityUtils.createRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const signupRateLimiter = SecurityUtils.createRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour
export const passwordResetRateLimiter = SecurityUtils.createRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour