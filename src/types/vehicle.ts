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
  vehicleId: string;
  plateNumber: string;
  driver: string;
  date: string;
  startTime: string;
  endTime: string;
  startKilometers: number;
  endKilometers: number;
  purpose: string;
  comment: string;
  totalKilometers: number;
  timestamp: string | null;
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