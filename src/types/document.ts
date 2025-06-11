
export interface Document {
  id: string;
  name: string;
  storage_path: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  type: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  expiry_date?: string;
  company_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  vehicle_id?: string;
  driver_id?: string;
  metadata?: Record<string, any>;
}

export type DocumentType = 'driver_license' | 'vehicle_registration' | 'insurance' | 'fitness_certificate' | 'road_tax' | 'other';
