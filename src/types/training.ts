
export interface TrainingCourse {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  duration_hours: number;
  created_at: string;
  updated_at: string;
}

export interface DriverTraining {
  id: string;
  driver_id: string;
  course_id: string;
  company_id: string;
  completion_date: string;
  expiry_date?: string;
  certificate_file_path?: string;
  certificate_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  course?: TrainingCourse;
}
