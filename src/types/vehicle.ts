export interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  service_interval: number;
  vehicle_services?: VehicleService[];
}

export interface VehicleService {
  id: string;
  kilometers: number;
  service_date: string;
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