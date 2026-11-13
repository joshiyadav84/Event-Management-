import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Student, CollegeEvent, Registration } from '../../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

interface Schema {
  students: Student[];
  events: CollegeEvent[];
  registrations: Registration[];
}

export class Database {
  private data: Schema = {
    students: [],
    events: [],
    registrations: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure arrays exist
        if (!this.data.students) this.data.students = [];
        if (!this.data.events) this.data.events = [];
        if (!this.data.registrations) this.data.registrations = [];
        return;
      } catch (err) {
        console.error('Error parsing database.json, re-seeding:', err);
      }
    }

    this.seedDefaultData();
    this.save();
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  private seedDefaultData() {
    const hash = (pwd: string) => crypto.createHash('sha256').update(pwd).digest('hex');

    // Default Students & Admins
    this.data.students = [
      {
        student_id: 'std_001',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@college.edu',
        course: 'B.Tech Computer Science',
        password_hash: hash('student123'),
        role: 'student',
        created_at: '2026-09-01T09:00:00.000Z',
      },
      {
        student_id: 'std_002',
        name: 'Priya Patel',
        email: 'priya.patel@college.edu',
        course: 'MBA Business Analytics',
        password_hash: hash('student123'),
        role: 'student',
        created_at: '2026-09-02T10:00:00.000Z',
      },
      {
        student_id: 'std_003',
        name: 'Rohan Verma',
        email: 'rohan.verma@college.edu',
        course: 'B.Tech Information Technology',
        password_hash: hash('student123'),
        role: 'student',
        created_at: '2026-09-05T11:30:00.000Z',
      },
      {
        student_id: 'std_004',
        name: 'Ananya Gupta',
        email: 'ananya.gupta@college.edu',
        course: 'M.Tech AI & Data Science',
        password_hash: hash('student123'),
        role: 'student',
        created_at: '2026-09-10T14:15:00.000Z',
      },
      {
        student_id: 'adm_001',
        name: 'Prof. Rajesh K. Nair',
        email: 'admin@college.edu',
        course: 'Department of Academic Affairs',
        password_hash: hash('admin123'),
        role: 'admin',
        created_at: '2026-08-15T08:00:00.000Z',
      },
    ];

    // Default Sample Events (as requested)
    this.data.events = [
      {
        event_id: 'evt_001',
        name: 'AI & Machine Learning Workshop',
        description: 'Deep dive into practical Neural Networks, LLMs with Gemini, and hands-on PyTorch model deployment for real-world academic projects.',
        date: '2026-10-10',
        time: '10:00 AM - 01:00 PM',
        venue: 'Seminar Hall A, Tech Block 3',
        category: 'Artificial Intelligence',
        speaker: 'Dr. Vivek Malhotra, Principal AI Researcher at Tech Labs',
        maximum_capacity: 60,
        current_registration_count: 25,
        created_at: '2026-09-20T10:00:00.000Z',
        updated_at: '2026-09-20T10:00:00.000Z',
      },
      {
        event_id: 'evt_002',
        name: 'Business Analytics Workshop',
        description: 'Comprehensive case studies in predictive forecasting, Tableau dashboards, and revenue optimization for future business leaders.',
        date: '2026-10-14',
        time: '02:00 PM - 05:00 PM',
        venue: 'Auditorium 2, Management Block',
        category: 'Business Analytics',
        speaker: 'Meera Deshmukh, VP of Data Science at Apex Analytics',
        maximum_capacity: 50,
        current_registration_count: 48,
        created_at: '2026-09-22T11:00:00.000Z',
        updated_at: '2026-09-22T11:00:00.000Z',
      },
      {
        event_id: 'evt_003',
        name: 'Cybersecurity Awareness Seminar',
        description: 'Defensive computing, ethical hacking fundamentals, zero-day threat analysis, and safeguarding digital infrastructure on campus.',
        date: '2026-10-18',
        time: '11:00 AM - 01:30 PM',
        venue: 'Main Campus Convention Center',
        category: 'Cybersecurity',
        speaker: 'Col. K. Srinivas (Retd.), Cyber Defense Consultant',
        maximum_capacity: 100,
        current_registration_count: 70,
        created_at: '2026-09-25T09:30:00.000Z',
        updated_at: '2026-09-25T09:30:00.000Z',
      },
      {
        event_id: 'evt_004',
        name: 'Digital Marketing Masterclass',
        description: 'Growth marketing, multi-channel customer acquisition, SEO optimization, and data-driven branding strategies for collegiate startups.',
        date: '2026-10-22',
        time: '03:00 PM - 06:00 PM',
        venue: 'Media Lab 1, Humanities Wing',
        category: 'Marketing',
        speaker: 'Siddharth Rao, Founder at GrowthPulse Digital',
        maximum_capacity: 40,
        current_registration_count: 40, // Full capacity example
        created_at: '2026-09-28T14:00:00.000Z',
        updated_at: '2026-09-28T14:00:00.000Z',
      },
      {
        event_id: 'evt_005',
        name: 'Entrepreneurship & Startup Seminar',
        description: 'From idea validation to VC pitch decks: angel investing, intellectual property, incubation grants, and launching a college venture.',
        date: '2026-10-28',
        time: '10:30 AM - 01:30 PM',
        venue: 'Innovation & Incubation Center, Hall B',
        category: 'Entrepreneurship',
        speaker: 'Kavita Sundaram, Venture Partner at Genesis Seed Fund',
        maximum_capacity: 75,
        current_registration_count: 32,
        created_at: '2026-10-01T10:00:00.000Z',
        updated_at: '2026-10-01T10:00:00.000Z',
      },
      {
        event_id: 'evt_006',
        name: 'Cloud Native & DevOps Symposium',
        description: 'Modern microservices with Kubernetes, Docker containers, CI/CD pipelines, and cloud reliability engineering patterns.',
        date: '2026-11-05',
        time: '09:30 AM - 12:30 PM',
        venue: 'Computer Science Lab Complex 4',
        category: 'Cloud Computing',
        speaker: 'Naveen Joshi, Lead SRE Architect',
        maximum_capacity: 45,
        current_registration_count: 18,
        created_at: '2026-10-02T12:00:00.000Z',
        updated_at: '2026-10-02T12:00:00.000Z',
      },
    ];

    // Default Sample Registrations (showing initial states)
    this.data.registrations = [
      {
        registration_id: 'reg_001',
        student_id: 'std_001',
        event_id: 'evt_002', // Aarav registered for Business Analytics
        registration_date: '2026-09-25T14:30:00.000Z',
        status: 'confirmed',
        calendar_event_id: 'gcal_mock_001_aarav_ba',
        created_at: '2026-09-25T14:30:00.000Z',
      },
      {
        registration_id: 'reg_002',
        student_id: 'std_002',
        event_id: 'evt_001', // Priya registered for AI workshop
        registration_date: '2026-09-26T10:15:00.000Z',
        status: 'confirmed',
        calendar_event_id: 'gcal_mock_002_priya_ai',
        created_at: '2026-09-26T10:15:00.000Z',
      },
      {
        registration_id: 'reg_003',
        student_id: 'std_003',
        event_id: 'evt_003', // Rohan registered for Cybersecurity
        registration_date: '2026-09-28T09:00:00.000Z',
        status: 'confirmed',
        calendar_event_id: 'gcal_mock_003_rohan_sec',
        created_at: '2026-09-28T09:00:00.000Z',
      },
    ];
  }

  // --- Students Methods ---
  public getStudents(): Student[] {
    return [...this.data.students];
  }

  public getStudentById(student_id: string): Student | undefined {
    return this.data.students.find((s) => s.student_id === student_id);
  }

  public getStudentByEmail(email: string): Student | undefined {
    return this.data.students.find((s) => s.email.toLowerCase() === email.toLowerCase().trim());
  }

  public createStudent(student: Omit<Student, 'student_id' | 'created_at'>): Student {
    const existing = this.getStudentByEmail(student.email);
    if (existing) {
      throw new Error('A user with this email address already exists.');
    }

    const newStudent: Student = {
      ...student,
      student_id: `std_${crypto.randomBytes(4).toString('hex')}`,
      created_at: new Date().toISOString(),
    };

    this.data.students.push(newStudent);
    this.save();
    return newStudent;
  }

  // --- Events Methods ---
  public getEvents(filters?: {
    search?: string;
    category?: string;
    month?: string;
    date?: string;
    availability?: 'available' | 'full' | 'all';
  }): CollegeEvent[] {
    let result = [...this.data.events];

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      const tokens = q.split(/[\s,&]+/).map(t => t.trim()).filter((t) => t.length > 1 && !['and', 'the', 'for', 'in', 'of', 'at', 'with', 'to'].includes(t));
      result = result.filter((e) => {
        const fullText = `${e.name} ${e.description} ${e.venue} ${e.category} ${e.speaker || ''}`.toLowerCase();
        if (fullText.includes(q)) return true;
        return tokens.length > 0 && tokens.every((tok) => fullText.includes(tok));
      });
    }

    if (filters?.category && filters.category !== 'all') {
      result = result.filter(
        (e) => e.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    if (filters?.month) {
      // filters.month can be "10" or "2026-10" or "October"
      const m = filters.month.toLowerCase();
      result = result.filter((e) => {
        const eventMonthNum = e.date.split('-')[1]; // "10"
        return (
          e.date.startsWith(m) ||
          eventMonthNum === m ||
          new Date(e.date).toLocaleString('default', { month: 'long' }).toLowerCase().includes(m)
        );
      });
    }

    if (filters?.date) {
      result = result.filter((e) => e.date === filters.date);
    }

    if (filters?.availability === 'available') {
      result = result.filter((e) => e.current_registration_count < e.maximum_capacity);
    } else if (filters?.availability === 'full') {
      result = result.filter((e) => e.current_registration_count >= e.maximum_capacity);
    }

    // Sort by date ascending
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  public getEventById(event_id: string): CollegeEvent | undefined {
    return this.data.events.find((e) => e.event_id === event_id);
  }

  public createEvent(
    event: Omit<CollegeEvent, 'event_id' | 'current_registration_count' | 'created_at' | 'updated_at'>
  ): CollegeEvent {
    if (!event.name?.trim()) throw new Error('Event name is required.');
    if (!event.date) throw new Error('Event date is required.');
    if (!event.venue?.trim()) throw new Error('Event venue is required.');
    if (event.maximum_capacity <= 0) throw new Error('Maximum capacity must be greater than 0.');

    const newEvent: CollegeEvent = {
      ...event,
      event_id: `evt_${crypto.randomBytes(4).toString('hex')}`,
      current_registration_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.events.push(newEvent);
    this.save();
    return newEvent;
  }

  public updateEvent(
    event_id: string,
    updates: Partial<Omit<CollegeEvent, 'event_id' | 'created_at' | 'current_registration_count'>>
  ): CollegeEvent {
    const idx = this.data.events.findIndex((e) => e.event_id === event_id);
    if (idx === -1) {
      throw new Error(`Event with ID '${event_id}' not found.`);
    }

    const current = this.data.events[idx];
    if (updates.maximum_capacity !== undefined && updates.maximum_capacity < current.current_registration_count) {
      throw new Error(
        `Cannot reduce maximum capacity below current registrations (${current.current_registration_count}).`
      );
    }

    const updated: CollegeEvent = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.data.events[idx] = updated;
    this.save();
    return updated;
  }

  public deleteEvent(event_id: string): void {
    const idx = this.data.events.findIndex((e) => e.event_id === event_id);
    if (idx === -1) {
      throw new Error(`Event with ID '${event_id}' not found.`);
    }

    // Cascade delete/clean up registrations so no orphaned records
    this.data.registrations = this.data.registrations.filter((r) => r.event_id !== event_id);
    this.data.events.splice(idx, 1);
    this.save();
  }

  // --- Registrations Methods ---
  public getRegistrations(filters?: {
    student_id?: string;
    event_id?: string;
    status?: 'confirmed' | 'cancelled';
  }): Registration[] {
    let result = [...this.data.registrations];

    if (filters?.student_id) {
      result = result.filter((r) => r.student_id === filters.student_id);
    }
    if (filters?.event_id) {
      result = result.filter((r) => r.event_id === filters.event_id);
    }
    if (filters?.status) {
      result = result.filter((r) => r.status === filters.status);
    }

    // Populate relations
    return result.map((r) => {
      const event = this.getEventById(r.event_id);
      const student = this.getStudentById(r.student_id);
      return {
        ...r,
        event,
        student: student
          ? {
              student_id: student.student_id,
              name: student.name,
              email: student.email,
              course: student.course,
            }
          : undefined,
      };
    });
  }

  public getRegistrationById(registration_id: string): Registration | undefined {
    const r = this.data.registrations.find((item) => item.registration_id === registration_id);
    if (!r) return undefined;

    const event = this.getEventById(r.event_id);
    const student = this.getStudentById(r.student_id);
    return {
      ...r,
      event,
      student: student
        ? {
            student_id: student.student_id,
            name: student.name,
            email: student.email,
            course: student.course,
          }
        : undefined,
    };
  }

  /**
   * Strict duplicate-registration and capacity prevention logic (Section 6)
   */
  public registerStudent(student_id: string, event_id: string, calendar_event_id?: string): Registration {
    // 1. Check whether student exists
    const student = this.getStudentById(student_id);
    if (!student) {
      throw new Error(`Invalid student ID '${student_id}'. Student does not exist.`);
    }

    // 2. Check whether event exists
    const event = this.getEventById(event_id);
    if (!event) {
      throw new Error(`Invalid event ID '${event_id}'. Event does not exist.`);
    }

    // 3. Check whether student already has an active registration for this event
    const existing = this.data.registrations.find(
      (r) => r.student_id === student_id && r.event_id === event_id && r.status === 'confirmed'
    );
    if (existing) {
      throw new Error('You are already registered for this event.');
    }

    // 4. Check event capacity
    if (event.current_registration_count >= event.maximum_capacity) {
      throw new Error('Registration is closed because this event has reached maximum capacity.');
    }

    // If there was a previously cancelled registration, reactivate it, otherwise create new
    const cancelledPrev = this.data.registrations.find(
      (r) => r.student_id === student_id && r.event_id === event_id && r.status === 'cancelled'
    );

    let regRecord: Registration;
    if (cancelledPrev) {
      cancelledPrev.status = 'confirmed';
      cancelledPrev.registration_date = new Date().toISOString();
      cancelledPrev.calendar_event_id = calendar_event_id || cancelledPrev.calendar_event_id;
      regRecord = cancelledPrev;
    } else {
      regRecord = {
        registration_id: `reg_${crypto.randomBytes(4).toString('hex')}`,
        student_id,
        event_id,
        registration_date: new Date().toISOString(),
        status: 'confirmed',
        calendar_event_id: calendar_event_id || null,
        created_at: new Date().toISOString(),
      };
      this.data.registrations.push(regRecord);
    }

    // Update event registration count atomically
    event.current_registration_count += 1;
    event.updated_at = new Date().toISOString();

    this.save();

    return {
      ...regRecord,
      event,
      student: {
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        course: student.course,
      },
    };
  }

  public updateRegistrationCalendarId(registration_id: string, calendar_event_id: string): void {
    const reg = this.data.registrations.find((r) => r.registration_id === registration_id);
    if (reg) {
      reg.calendar_event_id = calendar_event_id;
      this.save();
    }
  }

  public cancelRegistration(student_id: string, event_id: string): Registration {
    const reg = this.data.registrations.find(
      (r) => r.student_id === student_id && r.event_id === event_id && r.status === 'confirmed'
    );

    if (!reg) {
      throw new Error('No active registration found for this event.');
    }

    reg.status = 'cancelled';

    const event = this.getEventById(event_id);
    if (event && event.current_registration_count > 0) {
      event.current_registration_count -= 1;
      event.updated_at = new Date().toISOString();
    }

    this.save();
    return reg;
  }

  public cancelRegistrationById(registration_id: string, student_id?: string): Registration {
    const reg = this.data.registrations.find((r) => r.registration_id === registration_id);
    if (!reg) {
      throw new Error(`Registration '${registration_id}' not found.`);
    }

    if (student_id && reg.student_id !== student_id) {
      throw new Error('Unauthorized to cancel this registration.');
    }

    if (reg.status === 'cancelled') {
      return reg;
    }

    reg.status = 'cancelled';
    const event = this.getEventById(reg.event_id);
    if (event && event.current_registration_count > 0) {
      event.current_registration_count -= 1;
      event.updated_at = new Date().toISOString();
    }

    this.save();
    return reg;
  }

  // --- Statistics ---
  public getDashboardStatistics(): any {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    const totalEvents = this.data.events.length;
    const upcomingEvents = this.data.events.filter((e) => e.date >= todayStr).length;
    const totalStudents = this.data.students.filter((s) => s.role === 'student').length;
    const totalRegistrations = this.data.registrations.filter((r) => r.status === 'confirmed').length;
    const eventsThisMonth = this.data.events.filter((e) => e.date.startsWith(currentMonthPrefix)).length;

    // Most popular event
    const sortedByPopularity = [...this.data.events].sort(
      (a, b) => b.current_registration_count - a.current_registration_count
    );
    const mostPopular = sortedByPopularity.length > 0
      ? {
          name: sortedByPopularity[0].name,
          registrations: sortedByPopularity[0].current_registration_count,
        }
      : null;

    // Categories breakdown
    const categoryCountMap: Record<string, number> = {};
    for (const e of this.data.events) {
      categoryCountMap[e.category] = (categoryCountMap[e.category] || 0) + 1;
    }
    const categoryStats = Object.entries(categoryCountMap).map(([category, count]) => ({
      category,
      count,
    }));

    return {
      totalEvents,
      upcomingEvents,
      totalStudents,
      totalRegistrations,
      eventsThisMonth,
      mostPopularEvent: mostPopular,
      categoryStats,
      popularEventsList: sortedByPopularity.slice(0, 5).map((e) => ({
        event_id: e.event_id,
        name: e.name,
        date: e.date,
        venue: e.venue,
        count: e.current_registration_count,
        capacity: e.maximum_capacity,
        percent: Math.round((e.current_registration_count / e.maximum_capacity) * 100),
      })),
    };
  }
}

export const db = new Database();
