export interface Vehicle {
  plateNumber: string;
  currentKilometers: number;
  lastServiceKilometers: number;
  serviceInterval: number;
  comments: Array<{
    text: string;
    timestamp: string;
  }>;
}

export interface TripLog {
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