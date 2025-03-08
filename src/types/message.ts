
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  company_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_name?: string;
}
