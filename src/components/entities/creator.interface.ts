export interface Creator {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  updated_at: string;
  classroom_id: number | null;
}