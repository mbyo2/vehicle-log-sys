
export interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  service_interval: number;
  current_kilometers?: number;
  last_service_kilometers?: number;
  vehicle_services?: VehicleService[];
  comments?: VehicleComment[];
  fitness_expiry?: string;
  road_tax_expiry?: string;
  insurance_expiry?: string;
  assigned_to?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
}

export interface VehicleService {
  id: string;
  kilometers: number;
  service_date: string;
}

export interface VehicleComment {
  id?: string;
  text: string;
  timestamp: string;
}

export interface TripLog {
  vehicle_id: string;
  vehicleId?: string; // Added for compatibility
  plateNumber?: string; // Added for compatibility
  driver: string;
  driver_id?: string;
  driverId?: string; // Added for compatibility
  date: string;
  startTime: string;
  endTime: string;
  startKilometers: number;
  endKilometers: number;
  purpose: string;
  comment: string;
  totalKilometers: number;
  timestamp?: string | null; // Added for compatibility with existing code
  approval_status?: string;
  approval_comment?: string;
}

export interface FuelLog {
  id?: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost: number;
  odometer: number;
  efficiency?: number;
  costPerKm?: number;
}

export interface MaintenanceSchedule {
  id: string;
  vehicle_id: string;
  service_type: string;
  scheduled_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimated_cost?: number;
  description?: string;
}
