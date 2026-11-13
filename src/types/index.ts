export interface Student {
  student_id: string;
  name: string;
  email: string;
  course: string;
  password_hash: string;
  role: 'student' | 'admin';
  created_at: string;
}

export interface CollegeEvent {
  event_id: string;
  name: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM - 01:00 PM"
  venue: string;
  category: string;
  speaker?: string;
  maximum_capacity: number;
  current_registration_count: number;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  registration_id: string;
  student_id: string;
  event_id: string;
  registration_date: string;
  status: 'confirmed' | 'cancelled';
  calendar_event_id: string | null;
  created_at: string;
  // Joined fields for convenience
  event?: CollegeEvent;
  student?: {
    student_id: string;
    name: string;
    email: string;
    course: string;
  };
}

export interface DashboardStatistics {
  totalEvents: number;
  upcomingEvents: number;
  totalStudents: number;
  totalRegistrations: number;
  eventsThisMonth: number;
  mostPopularEvent: {
    name: string;
    registrations: number;
  } | null;
  categoryStats?: { category: string; count: number }[];
  recentRegistrations?: Registration[];
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: {
    name: string;
    args: any;
    result?: any;
  }[];
  eventCard?: CollegeEvent;
  quickAction?: {
    type: 'register' | 'view_event' | 'calendar';
    eventId?: string;
    label: string;
  };
}
