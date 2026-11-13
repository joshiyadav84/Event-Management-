import { Router, type Response } from 'express';
import { db } from '../db/database.ts';
import { authenticate, requireAdmin, type AuthenticatedRequest } from '../services/auth.ts';

const router = Router();

// GET /api/events (Public / Authenticated)
router.get('/', (req, res) => {
  try {
    const { search, category, month, date, availability } = req.query;

    const events = db.getEvents({
      search: typeof search === 'string' ? search : undefined,
      category: typeof category === 'string' ? category : undefined,
      month: typeof month === 'string' ? month : undefined,
      date: typeof date === 'string' ? date : undefined,
      availability: availability === 'available' || availability === 'full' ? availability : 'all',
    });

    return res.json({ events, count: events.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch events.' });
  }
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  try {
    const event = db.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: `Event with ID '${req.params.id}' not found.` });
    }
    return res.json({ event });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch event.' });
  }
});

// POST /api/events (Admin only)
router.post('/', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, date, time, venue, category, speaker, maximum_capacity } = req.body;

    if (!name || !date || !time || !venue || !maximum_capacity) {
      return res.status(400).json({
        error: 'Missing required event fields: name, date, time, venue, maximum_capacity.',
      });
    }

    const newEvent = db.createEvent({
      name: name.trim(),
      description: (description || '').trim(),
      date,
      time: time.trim(),
      venue: venue.trim(),
      category: (category || 'General Academic').trim(),
      speaker: speaker ? speaker.trim() : undefined,
      maximum_capacity: Number(maximum_capacity),
    });

    return res.status(201).json({
      message: 'Event created successfully.',
      event: newEvent,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create event.' });
  }
});

// PUT /api/events/:id (Admin only)
router.put('/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateEvent(req.params.id, req.body);
    return res.json({
      message: 'Event updated successfully.',
      event: updated,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update event.' });
  }
});

// DELETE /api/events/:id (Admin only)
router.delete('/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteEvent(req.params.id);
    return res.json({
      message: 'Event deleted successfully and related registrations cleaned up.',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete event.' });
  }
});

export default router;
