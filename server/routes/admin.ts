import { Router, type Response } from 'express';
import { db } from '../db/database.ts';
import { authenticate, requireAdmin, type AuthenticatedRequest } from '../services/auth.ts';

const router = Router();

// Require admin for all routes in this file
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = db.getDashboardStatistics();
    return res.json({ stats });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch dashboard metrics.' });
  }
});

// GET /api/admin/registrations
router.get('/registrations', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { event_id, course, search, status } = req.query;

    let registrations = db.getRegistrations({
      event_id: typeof event_id === 'string' && event_id !== 'all' ? event_id : undefined,
      status: status === 'confirmed' || status === 'cancelled' ? status : undefined,
    });

    if (course && typeof course === 'string' && course !== 'all') {
      const c = course.toLowerCase();
      registrations = registrations.filter((r) => r.student?.course.toLowerCase().includes(c));
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      registrations = registrations.filter(
        (r) =>
          r.student?.name.toLowerCase().includes(q) ||
          r.student?.email.toLowerCase().includes(q) ||
          r.student_id.toLowerCase().includes(q) ||
          r.registration_id.toLowerCase().includes(q) ||
          r.event?.name.toLowerCase().includes(q)
      );
    }

    return res.json({
      registrations,
      count: registrations.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch registrations.' });
  }
});

// GET /api/admin/participants
router.get('/participants', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { course, search } = req.query;
    let students = db.getStudents().filter((s) => s.role === 'student');

    if (course && typeof course === 'string' && course !== 'all') {
      const c = course.toLowerCase();
      students = students.filter((s) => s.course.toLowerCase().includes(c));
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.student_id.toLowerCase().includes(q) ||
          s.course.toLowerCase().includes(q)
      );
    }

    const participants = students.map((s) => {
      const regs = db.getRegistrations({ student_id: s.student_id, status: 'confirmed' });
      return {
        student_id: s.student_id,
        name: s.name,
        email: s.email,
        course: s.course,
        registered_events_count: regs.length,
        created_at: s.created_at,
        events: regs.map((r) => ({
          event_id: r.event_id,
          name: r.event?.name,
          date: r.event?.date,
        })),
      };
    });

    return res.json({
      participants,
      count: participants.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch participants.' });
  }
});

export default router;
