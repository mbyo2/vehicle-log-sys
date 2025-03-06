
export interface Document {
  id: string;
  name: string;
  file_path: string;
  type: string;
  status: 'pending' | 'verified' | 'rejected';
  upload_date: string;
  expiry_date?: string;
  company_id?: string;
  created_by?: string;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  vehicle_id?: string;
  driver_id?: string;
  metadata?: Record<string, any>;
}

export type DocumentType = 'driver_license' | 'vehicle_registration' | 'insurance' | 'fitness_certificate' | 'road_tax' | 'other';
