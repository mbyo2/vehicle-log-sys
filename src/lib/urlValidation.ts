/**
 * URL Security Utilities
 * Provides validation and sanitization for external URLs to prevent security vulnerabilities
 */

export interface URLValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  error?: string;
}

/**
 * Validates and sanitizes a URL for safe external navigation
 * Rejects dangerous schemes and validates URL format
 */
export function validateAndSanitizeUrl(url: string): URLValidationResult {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return {
      isValid: false,
      error: 'URL is required'
    };
  }

  const trimmedUrl = url.trim();

  // Check for dangerous schemes
  const dangerousSchemes = [
    'javascript:',
    'data:',
    'file:',
    'vbscript:',
    'about:',
    'chrome:',
    'chrome-extension:',
    'moz-extension:',
    'ms-browser-extension:'
  ];

  const lowerUrl = trimmedUrl.toLowerCase();
  for (const scheme of dangerousSchemes) {
    if (lowerUrl.startsWith(scheme)) {
      return {
        isValid: false,
        error: `Dangerous URL scheme detected: ${scheme}`
      };
    }
  }

  // Ensure URL has a valid protocol
  if (!trimmedUrl.match(/^https?:\/\//i)) {
    // If no protocol, assume https
    const withProtocol = `https://${trimmedUrl}`;
    try {
      new URL(withProtocol);
      return {
        isValid: true,
        sanitizedUrl: withProtocol
      };
    } catch {
      return {
        isValid: false,
        error: 'Invalid URL format'
      };
    }
  }

  // Validate URL format
  try {
    const urlObj = new URL(trimmedUrl);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'Only HTTP and HTTPS URLs are allowed'
      };
    }

    return {
      isValid: true,
      sanitizedUrl: urlObj.toString()
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Opens a URL safely after validation
 */
export function openUrlSafely(url: string, target: string = '_blank'): boolean {
  const validation = validateAndSanitizeUrl(url);
  
  if (!validation.isValid) {
    console.warn('URL validation failed:', validation.error);
    return false;
  }

  try {
    window.open(validation.sanitizedUrl, target, 'noopener,noreferrer');
    return true;
  } catch (error) {
    console.error('Failed to open URL:', error);
    return false;
  }
}