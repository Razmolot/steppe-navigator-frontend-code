import type { Classroom } from './classroom.interface'
import type { Creator } from './creator.interface'

export interface EventStudentLite {
  id: number;
  name: string;
  classroom_id?: number | null;
}

export interface CalendarEvent {
  id: number;
  title: string;
  text: string;
  type: string[];
  date: string;
  time_from: string;
  time_to: string;
  place: string;
  description: string;
  creator_id: number;
  created_at: string;
  updated_at: string;
  classrooms: Classroom[];
  creator: Creator;

  // Direct assignments (explicitly selected students)
  students?: EventStudentLite[];

  // Computed by backend for counselor UI: direct + via assigned classrooms
  assigned_students?: EventStudentLite[];
}
