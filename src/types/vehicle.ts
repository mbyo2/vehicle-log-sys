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
  fitness_expiry?: string;
  last_service_kilometers?: number;
  company_id?: string;
  assigned_to?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  vehicle_services?: Array<{
    id: string;
    service_date: string;
    kilometers: number;
    service_type: string;
    cost?: number;
    description?: string;
  }>;
  comments?: Array<{
    id?: string;
    text: string;
    timestamp: string;
  }>;
}

export interface TripLog {
  id?: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  startTime: string;
  endTime: string;
  startKilometers: number;
  endKilometers: number;
  totalKilometers: number;
  purpose: string;
  comment: string;
  driver?: string;
  plateNumber?: string;
  timestamp?: string | null;
  start_location?: { latitude: number; longitude: number };
  end_location?: { latitude: number; longitude: number };
  approval_status?: 'pending' | 'approved' | 'rejected';
  approval_comment?: string;
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
