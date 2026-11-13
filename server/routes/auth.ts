import { Router, type Response } from 'express';
import { db } from '../db/database.ts';
import { hashPassword, generateToken, authenticate, sanitizeUser, type AuthenticatedRequest } from '../services/auth.ts';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { name, email, course, password, role } = req.body;

    if (!name || !email || !password || !course) {
      return res.status(400).json({ error: 'Name, email, course, and password are required.' });
    }

    const existing = db.getStudentByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'student';

    const newStudent = db.createStudent({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      course: course.trim(),
      password_hash: hashPassword(password),
      role: assignedRole,
    });

    const userPayload = sanitizeUser(newStudent);
    const token = generateToken(userPayload);

    return res.status(201).json({
      message: 'Account successfully registered.',
      token,
      user: userPayload,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const student = db.getStudentByEmail(email);
    if (!student) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const hashedInput = hashPassword(password);
    if (student.password_hash !== hashedInput) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userPayload = sanitizeUser(student);
    const token = generateToken(userPayload);

    return res.json({
      message: 'Login successful.',
      token,
      user: userPayload,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

router.get('/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({ user: req.user });
});

export default router;
