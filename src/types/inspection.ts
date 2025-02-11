
export interface VehicleInspection {
  id: string;
  driver_id: string;
  vehicle_id: string;
  inspection_date: string;
  checklist: {
    [key: string]: {
      status: 'pass' | 'fail';
      notes?: string;
    };
  };
  comments?: string;
  status: 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export type InspectionItem = 
  | 'Brakes'
  | 'Lights'
  | 'Tires'
  | 'Oil Level'
  | 'Windshield'
  | 'Mirrors'
  | 'Horn'
  | 'Seatbelts'
  | 'Emergency Kit'
  | 'Fuel Level';
