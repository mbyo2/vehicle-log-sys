
import { z } from 'zod';

// Base validation schemas
export const emailSchema = z.string().email('Please enter a valid email address');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

export const phoneSchema = z.string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
  .min(10, 'Phone number must be at least 10 digits');

export const plateNumberSchema = z.string()
  .min(4, 'Plate number must be at least 4 characters')
  .max(10, 'Plate number must not exceed 10 characters')
  .regex(/^[A-Z0-9\-\s]+$/i, 'Plate number can only contain letters, numbers, hyphens, and spaces');

export const licenseNumberSchema = z.string()
  .min(8, 'License number must be at least 8 characters')
  .max(20, 'License number must not exceed 20 characters');

export const manNumberSchema = z.string()
  .min(4, 'MAN number must be at least 4 characters')
  .max(15, 'MAN number must not exceed 15 characters');

// User validation schemas
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Company validation schemas
export const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  branding_primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color').optional(),
  branding_secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color').optional(),
});

// Vehicle validation schemas
export const vehicleSchema = z.object({
  plate_number: plateNumberSchema,
  make: z.string().min(2, 'Make must be at least 2 characters'),
  model: z.string().min(2, 'Model must be at least 2 characters'),
  year: z.number()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  current_kilometers: z.number().min(0, 'Kilometers must be non-negative').optional(),
  service_interval: z.number().min(1000, 'Service interval must be at least 1000 km'),
  insurance_expiry: z.date().optional(),
  road_tax_expiry: z.date().optional(),
  fitness_cert_expiry: z.date().optional(),
});

// Driver validation schemas
export const driverSchema = z.object({
  profile_id: z.string().uuid('Invalid profile ID'),
  man_number: manNumberSchema,
  license_number: licenseNumberSchema.optional(),
  license_expiry: z.date().optional(),
});

// Document validation schemas
export const documentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.enum(['driver_license', 'vehicle_registration', 'insurance', 'fitness_certificate', 'road_tax', 'other']),
  expiry_date: z.date().optional(),
  vehicle_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
});

// Trip validation schemas
export const tripLogSchema = z.object({
  vehicle_id: z.string().uuid('Please select a vehicle'),
  driver_id: z.string().uuid('Please select a driver'),
  purpose: z.string().min(3, 'Purpose must be at least 3 characters'),
  start_time: z.date(),
  start_kilometers: z.number().min(0, 'Start kilometers must be non-negative'),
  start_location: z.object({
    address: z.string().min(3, 'Start location is required'),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  end_time: z.date().optional(),
  end_kilometers: z.number().min(0, 'End kilometers must be non-negative').optional(),
  end_location: z.object({
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  comments: z.string().optional(),
}).refine((data) => {
  if (data.end_kilometers && data.start_kilometers) {
    return data.end_kilometers >= data.start_kilometers;
  }
  return true;
}, {
  message: "End kilometers must be greater than or equal to start kilometers",
  path: ["end_kilometers"],
});

// Maintenance validation schemas
export const maintenanceScheduleSchema = z.object({
  vehicle_id: z.string().uuid('Please select a vehicle'),
  service_type: z.string().min(3, 'Service type must be at least 3 characters'),
  scheduled_date: z.date(),
  estimated_cost: z.number().min(0, 'Cost must be non-negative').optional(),
  description: z.string().optional(),
  kilometer_interval: z.number().min(0, 'Kilometer interval must be non-negative').optional(),
  time_interval_days: z.number().min(1, 'Time interval must be at least 1 day').optional(),
});

// Service booking validation schemas
export const serviceBookingSchema = z.object({
  vehicle_id: z.string().uuid('Please select a vehicle'),
  service_center_id: z.string().uuid('Please select a service center'),
  service_type: z.string().min(3, 'Service type must be at least 3 characters'),
  booking_date: z.date(),
  notes: z.string().optional(),
});

// File validation
export const fileValidation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif'
  ],
  validateFile: (file: File) => {
    const errors: string[] = [];
    
    if (file.size > fileValidation.maxSize) {
      errors.push('File size must be less than 10MB');
    }
    
    if (!fileValidation.allowedTypes.includes(file.type)) {
      errors.push('File type not supported. Please use PDF, DOC, DOCX, JPG, PNG, or GIF');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Form validation helper
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};
