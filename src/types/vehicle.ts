
// If the file doesn't exist, we'll create it with proper types
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  current_kilometers?: number;
  service_interval?: number;
  insurance_expiry?: string;
  road_tax_expiry?: string;
  fitness_cert_expiry?: string;
  company_id?: string;
  assigned_to?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
}

export interface TripLog {
  id?: string;
  vehicleId: string;
  driverId: string;
  date: string;
  startTime: string;
  endTime: string;
  startKilometers: number; // Explicitly typed as number
  endKilometers: number; // Explicitly typed as number
  totalKilometers: number; // Explicitly typed as number
  purpose: string;
  comment: string;
  driver?: string;
  plateNumber?: string;
  timestamp: string | null;
  // Additional fields can be added here
  vehicle_id?: string; // For backward compatibility
  driver_id?: string; // For backward compatibility
}

export interface VehicleAssignment {
  vehicle_id: string;
  driver_id: string;
  start_date: string;
  end_date?: string;
}

export interface VehicleService {
  id: string;
  vehicle_id: string;
  service_type: string;
  service_date: string;
  kilometers: number;
  cost?: number;
  description?: string;
}

export interface ServiceBooking {
  id: string;
  vehicle_id: string;
  service_type: string;
  booking_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  service_center_id?: string;
}
