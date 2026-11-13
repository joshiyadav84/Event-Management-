import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { CollegeEvent, Registration } from '../types/index.ts';
import { EventCard } from '../components/EventCard.tsx';
import {
  Calendar,
  BookmarkCheck,
  CalendarDays,
  Users,
  Sparkles,
  ArrowRight,
  GraduationCap,
  CalendarCheck2
} from 'lucide-react';

interface StudentDashboardProps {
  events: CollegeEvent[];
  myRegistrations: Registration[];
  onViewEvent: (event: CollegeEvent) => void;
  onRegisterEvent: (event: CollegeEvent) => void;
  registeringEventId: string | null;
  onNavigate: (tab: string) => void;
  onAskAiPrompt: (prompt: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  events,
  myRegistrations,
  onViewEvent,
  onRegisterEvent,
  registeringEventId,
  onNavigate,
  onAskAiPrompt,
}) => {
  const { user } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter((e) => e.date >= todayStr);

  const now = new Date();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
  const eventsThisMonth = events.filter((e) => e.date.split('-')[1] === currentMonthNum);

  const totalAvailableSeats = events.reduce(
    (sum, e) => sum + Math.max(0, e.maximum_capacity - e.current_registration_count),
    0
  );

  const registeredEventIds = new Set(
    myRegistrations.filter((r) => r.status === 'confirmed').map((r) => r.event_id)
  );

  const sampleAiQuestions = [
    'Which AI workshops are happening this month?',
    'Am I registered for the business analytics workshop?',
    'How many seats are left for cybersecurity seminar?',
    'Register me for the AI workshop',
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Academic Events & Workshop Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Student'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            {user?.course ? `${user.course} • ` : ''}Explore upcoming workshops, track your registrations, and sync your schedule with Google Calendar.
          </p>
        </div>

        {/* Decorative ambient orb */}
        <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Dashboard Metric Cards (Section 3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Upcoming Events */}
        <div
          onClick={() => onNavigate('events')}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-2xl shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Events</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{upcomingEvents.length}</span>
            <span className="text-xs text-indigo-400">Scheduled</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Workshops & seminars this term</p>
        </div>

        {/* Card 2: My Registrations */}
        <div
          onClick={() => onNavigate('my-registrations')}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-5 rounded-2xl shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Registrations</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <BookmarkCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {myRegistrations.filter((r) => r.status === 'confirmed').length}
            </span>
            <span className="text-xs text-emerald-400">Confirmed ✓</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Google Calendar synced</p>
        </div>

        {/* Card 3: Events This Month */}
        <div
          onClick={() => onNavigate('events')}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-5 rounded-2xl shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Events This Month</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{eventsThisMonth.length}</span>
            <span className="text-xs text-amber-400">Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">October 2026 Academic Series</p>
        </div>

        {/* Card 4: Available Seats */}
        <div
          onClick={() => onNavigate('events')}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 p-5 rounded-2xl shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Seats</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalAvailableSeats}</span>
            <span className="text-xs text-cyan-400">Open seats</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all open events</p>
        </div>
      </div>

      {/* AI Assistant Spotlight Panel (Section 17) */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-3xl p-6 sm:p-7 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-white">Gemini Event Assistant</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              “Ask me about events, registrations, availability, or registration for an event.”
            </p>
          </div>

          <button
            onClick={() => onNavigate('ai-assistant')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 shrink-0"
          >
            <span>Open AI Chat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
          {sampleAiQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onAskAiPrompt(q)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/20 text-slate-200 hover:text-indigo-300 border border-slate-700/80 hover:border-indigo-500/40 transition-all text-left"
            >
              💬 "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Events Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Upcoming Events</h2>
            <p className="text-xs text-slate-400">Discover and secure your seat for academic sessions</p>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Browse All ({events.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.slice(0, 3).map((event) => (
            <EventCard
              key={event.event_id}
              event={event}
              isRegistered={registeredEventIds.has(event.event_id)}
              onViewDetails={onViewEvent}
              onRegister={onRegisterEvent}
              isRegistering={registeringEventId === event.event_id}
            />
          ))}
        </div>
      </div>

      {/* My Active Registrations Preview */}
      {myRegistrations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-emerald-400" />
              <span>My Active Registrations</span>
            </h2>
            <button
              onClick={() => onNavigate('my-registrations')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Manage ({myRegistrations.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myRegistrations.slice(0, 2).map((reg) => (
              <div
                key={reg.registration_id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                    Confirmed Registration ✓
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{reg.event?.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {reg.event?.date} • {reg.event?.venue}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('my-registrations')}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl shrink-0"
                >
                  View Pass
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
