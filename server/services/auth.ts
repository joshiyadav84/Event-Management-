import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/database.ts';
import type { Student } from '../../src/types/index.ts';

const TOKEN_SECRET = process.env.JWT_SECRET || 'academic-event-management-super-secret-key-2026';

export interface AuthUser {
  student_id: string;
  name: string;
  email: string;
  course: string;
  role: 'student' | 'admin';
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateToken(user: AuthUser): string {
  const payload = {
    sub: user.student_id,
    email: user.email,
    role: user.role,
    name: user.name,
    course: user.course,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payloadB64)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) return null;

    return {
      student_id: payload.sub,
      name: payload.name,
      email: payload.email,
      course: payload.course,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

// Express Request augmentation
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing or invalid Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid authentication token.' });
  }

  // Verify user still exists in database
  const student = db.getStudentById(user.student_id);
  if (!student) {
    return res.status(401).json({ error: 'User account no longer exists.' });
  }

  req.user = {
    student_id: student.student_id,
    name: student.name,
    email: student.email,
    course: student.course,
    role: student.role,
  };

  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden: Administrator privileges required.' });
  }
  next();
}

export function sanitizeUser(student: Student): AuthUser {
  return {
    student_id: student.student_id,
    name: student.name,
    email: student.email,
    course: student.course,
    role: student.role,
  };
}
