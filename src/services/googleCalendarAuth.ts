import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CollegeEvent } from '../types/index.ts';

// Configured scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.acls',
  'https://www.googleapis.com/auth/calendar.acls.readonly',
  'https://www.googleapis.com/auth/calendar.app.created',
  'https://www.googleapis.com/auth/calendar.calendarlist',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.calendars',
  'https://www.googleapis.com/auth/calendar.calendars.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
  'https://www.googleapis.com/auth/calendar.events.owned',
  'https://www.googleapis.com/auth/calendar.events.owned.readonly',
  'https://www.googleapis.com/auth/calendar.events.public.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.settings.readonly',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required Calendar scopes
SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory token cache (never stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const connectGoogleCalendar = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Google OAuth access token.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Calendar sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const disconnectGoogleCalendar = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Format college event dates into Asia/Kolkata timezone string
 */
function parseEventIST(dateStr: string, timeStr: string) {
  let startHour = 10;
  let startMin = 0;
  let endHour = 13;
  let endMin = 0;

  try {
    const parts = timeStr.split('-');
    if (parts.length >= 1) {
      const startMatch = parts[0].trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (startMatch) {
        let h = parseInt(startMatch[1], 10);
        const m = parseInt(startMatch[2], 10);
        const ampm = startMatch[3]?.toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        startHour = h;
        startMin = m;
      }
    }
    if (parts.length >= 2) {
      const endMatch = parts[1].trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (endMatch) {
        let h = parseInt(endMatch[1], 10);
        const m = parseInt(endMatch[2], 10);
        const ampm = endMatch[3]?.toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        endHour = h;
        endMin = m;
      }
    } else {
      endHour = startHour + 2;
    }
  } catch {
    // fallback defaults
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const startIso = `${dateStr}T${pad(startHour)}:${pad(startMin)}:00+05:30`;
  const endIso = `${dateStr}T${pad(endHour)}:${pad(endMin)}:00+05:30`;

  return { startIso, endIso };
}

/**
 * Creates Google Calendar event directly on user's primary calendar
 */
export const insertEventToGoogleCalendar = async (
  event: CollegeEvent,
  attendeeEmail: string
): Promise<{ id: string; htmlLink: string }> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Calendar is not connected. Please connect your Google account first.');
  }

  const { startIso, endIso } = parseEventIST(event.date, event.time);

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: `[College Event] ${event.name}`,
      description: `${event.description}\n\nCategory: ${event.category}\nVenue: ${event.venue}\nKeynote: ${event.speaker || 'Academic Faculty'}\nAttendee: ${attendeeEmail}`,
      location: event.venue,
      start: {
        dateTime: startIso,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endIso,
        timeZone: 'Asia/Kolkata',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Calendar API error (${response.status})`);
  }

  return response.json();
};

/**
 * Lists user's upcoming Google Calendar events
 */
export const listPrimaryCalendarEvents = async (maxResults = 5): Promise<any[]> => {
  const token = await getGoogleAccessToken();
  if (!token) return [];

  const timeMin = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
    timeMin
  )}&maxResults=${maxResults}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.warn('Failed to list Google Calendar events:', response.status);
    return [];
  }

  const data = await response.json();
  return data.items || [];
};
