export interface Classroom {
  id: number;
  school_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  pivot: {
    event_id: number;
    classroom_id: number;
  };
}