import { Router, type Response } from 'express';
import { db } from '../db/database.ts';
import { authenticate, type AuthenticatedRequest } from '../services/auth.ts';
import { createGoogleCalendarEvent, generateGoogleCalendarWebUrl } from '../services/calendar.ts';

const router = Router();

// POST /api/registrations (Student registers for event)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ error: 'event_id is required.' });
    }

    // Determine target student ID (students can only register themselves)
    const student_id = user.role === 'admin' && req.body.student_id ? req.body.student_id : user.student_id;

    // Retrieve event details
    const event = db.getEventById(event_id);
    if (!event) {
      return res.status(404).json({ error: `Event with ID '${event_id}' not found.` });
    }

    // Attempt registration through database engine with duplicate & capacity checks
    let registration;
    try {
      registration = db.registerStudent(student_id, event_id);
    } catch (err: any) {
      // Direct exact requirement messages
      return res.status(400).json({ error: err.message });
    }

    // Attempt Google Calendar Event integration
    const googleTokenHeader = req.headers['x-google-access-token'] as string | undefined;
    const calResult = await createGoogleCalendarEvent(event, user.email, googleTokenHeader);

    if (calResult.calendar_event_id) {
      db.updateRegistrationCalendarId(registration.registration_id, calResult.calendar_event_id);
      registration.calendar_event_id = calResult.calendar_event_id;
    }

    const calendarWebUrl = generateGoogleCalendarWebUrl(event);

    return res.status(201).json({
      message: calResult.message || 'Registration successful! The event has been added to your Google Calendar.',
      registration,
      calendar: {
        calendar_event_id: registration.calendar_event_id,
        calendar_link: calResult.calendar_link || calendarWebUrl,
        synced: calResult.success,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to process registration.' });
  }
});

// GET /api/registrations/my (Current student registrations)
router.get('/my', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const registrations = db.getRegistrations({ student_id: user.student_id });

    // Enhance with calendar web links
    const enhanced = registrations.map((r) => ({
      ...r,
      calendar_web_url: r.event ? generateGoogleCalendarWebUrl(r.event) : null,
    }));

    return res.json({ registrations: enhanced, count: enhanced.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch registrations.' });
  }
});

// GET /api/registrations/event/:eventId
router.get('/event/:eventId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const eventId = req.params.eventId;

    if (user.role !== 'admin') {
      // Students can only see their own registration status for this event
      const studentRegs = db.getRegistrations({ student_id: user.student_id, event_id: eventId });
      return res.json({ registrations: studentRegs });
    }

    const registrations = db.getRegistrations({ event_id: eventId });
    return res.json({ registrations, count: registrations.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch event registrations.' });
  }
});

// GET /api/registrations/:id
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const registration = db.getRegistrationById(req.params.id);

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    if (user.role !== 'admin' && registration.student_id !== user.student_id) {
      return res.status(403).json({ error: 'Unauthorized to view this registration.' });
    }

    return res.json({
      registration: {
        ...registration,
        calendar_web_url: registration.event ? generateGoogleCalendarWebUrl(registration.event) : null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch registration.' });
  }
});

// DELETE /api/registrations/:id (Cancel registration)
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const registrationId = req.params.id;

    const existing = db.getRegistrationById(registrationId);
    if (!existing) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    // Role check: students can only cancel their own registrations
    if (user.role !== 'admin' && existing.student_id !== user.student_id) {
      return res.status(403).json({ error: 'Unauthorized: You can only cancel your own registrations.' });
    }

    const updated = db.cancelRegistrationById(registrationId);

    return res.json({
      message: 'Registration has been successfully cancelled. The reserved seat has been released.',
      registration: updated,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to cancel registration.' });
  }
});

export default router;
