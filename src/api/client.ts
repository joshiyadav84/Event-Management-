import { CollegeEvent, Registration, DashboardStatistics } from '../types/index.ts';

const TOKEN_KEY = 'academic_events_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

import { getGoogleAccessToken } from '../services/googleCalendarAuth.ts';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach in-memory Google OAuth access token if connected
  const googleToken = await getGoogleAccessToken();
  if (googleToken) {
    headers['x-google-access-token'] = googleToken;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ message: string; token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: { name: string; email: string; course: string; password: string; role?: string }) =>
      request<{ message: string; token: string; user: any }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    profile: () => request<{ user: any }>('/api/auth/profile'),
  },

  // Events
  events: {
    getAll: (params?: { search?: string; category?: string; month?: string; date?: string; availability?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.month) searchParams.append('month', params.month);
      if (params?.date) searchParams.append('date', params.date);
      if (params?.availability) searchParams.append('availability', params.availability);

      const qs = searchParams.toString();
      return request<{ events: CollegeEvent[]; count: number }>(`/api/events${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => request<{ event: CollegeEvent }>(`/api/events/${id}`),
    create: (eventData: Partial<CollegeEvent>) =>
      request<{ message: string; event: CollegeEvent }>('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
    update: (id: string, updates: Partial<CollegeEvent>) =>
      request<{ message: string; event: CollegeEvent }>(`/api/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/api/events/${id}`, {
        method: 'DELETE',
      }),
  },

  // Registrations
  registrations: {
    register: (eventId: string, studentId?: string) =>
      request<{ message: string; registration: Registration; calendar: { calendar_event_id: string; calendar_link: string; synced: boolean } }>(
        '/api/registrations',
        {
          method: 'POST',
          body: JSON.stringify({ event_id: eventId, student_id: studentId }),
        }
      ),
    getMyRegistrations: () =>
      request<{ registrations: (Registration & { calendar_web_url?: string })[]; count: number }>('/api/registrations/my'),
    getById: (id: string) =>
      request<{ registration: Registration & { calendar_web_url?: string } }>(`/api/registrations/${id}`),
    cancel: (id: string) =>
      request<{ message: string; registration: Registration }>(`/api/registrations/${id}`, {
        method: 'DELETE',
      }),
  },

  // Admin
  admin: {
    getDashboard: () => request<{ stats: DashboardStatistics }>('/api/admin/dashboard'),
    getRegistrations: (params?: { event_id?: string; course?: string; search?: string; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.event_id) searchParams.append('event_id', params.event_id);
      if (params?.course) searchParams.append('course', params.course);
      if (params?.search) searchParams.append('search', params.search);
      if (params?.status) searchParams.append('status', params.status);

      const qs = searchParams.toString();
      return request<{ registrations: Registration[]; count: number }>(`/api/admin/registrations${qs ? `?${qs}` : ''}`);
    },
    getParticipants: (params?: { course?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.course) searchParams.append('course', params.course);
      if (params?.search) searchParams.append('search', params.search);

      const qs = searchParams.toString();
      return request<{ participants: any[]; count: number }>(`/api/admin/participants${qs ? `?${qs}` : ''}`);
    },
  },

  // AI Assistant
  ai: {
    chat: (message: string, history?: { role: 'user' | 'assistant'; content: string }[]) =>
      request<{ reply: string; toolCalls: any[]; user: any }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      }),
  },
};
