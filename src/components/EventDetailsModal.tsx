import React from 'react';
import { CollegeEvent } from '../types/index.ts';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  CalendarDays,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface EventDetailsModalProps {
  event: CollegeEvent | null;
  isOpen: boolean;
  onClose: () => void;
  isRegistered: boolean;
  onRegister: (event: CollegeEvent) => void;
  isRegistering: boolean;
  onOpenCalendarLink?: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  isRegistered,
  onRegister,
  isRegistering,
}) => {
  const { user } = useAuth();
  if (!isOpen || !event) return null;

  const availableSeats = Math.max(0, event.maximum_capacity - event.current_registration_count);
  const isFull = event.current_registration_count >= event.maximum_capacity;

  const formattedDate = (() => {
    try {
      const d = new Date(event.date + 'T00:00:00');
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return event.date;
    }
  })();

  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    '[College Event] ' + event.name
  )}&details=${encodeURIComponent(event.description + '\n\nVenue: ' + event.venue)}&location=${encodeURIComponent(
    event.venue
  )}&ctz=Asia/Kolkata`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {event.category}
              </span>
              {isRegistered && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  You Are Registered
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{event.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Quick Info Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Date</p>
                <p className="text-xs font-semibold text-slate-200 truncate">{formattedDate}</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Time (IST)</p>
                <p className="text-xs font-semibold text-slate-200 truncate">{event.time}</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Venue</p>
                <p className="text-xs font-semibold text-slate-200 truncate">{event.venue}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">About This Event</h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-4 rounded-2xl border border-slate-800 whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Speaker Info if present */}
          {event.speaker && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Featured Keynote Speaker</p>
                <p className="text-sm font-semibold text-slate-200">{event.speaker}</p>
              </div>
            </div>
          )}

          {/* Capacity and Seat Statistics */}
          <div className="bg-slate-800/30 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Users className="w-4 h-4 text-indigo-400" />
                Live Seat Availability
              </span>
              <span className="font-semibold text-indigo-300">
                {availableSeats} of {event.maximum_capacity} seats open
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? 'bg-rose-500' : availableSeats <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (event.current_registration_count / event.maximum_capacity) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-2">
              <span>Confirmed Attendees: {event.current_registration_count}</span>
              <span>Max Room Capacity: {event.maximum_capacity}</span>
            </div>
          </div>

          {/* Google Calendar Sync Details */}
          <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
            <CalendarDays className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <p className="font-semibold text-indigo-200">Google Calendar Integration Ready</p>
              <p className="text-slate-400 mt-0.5">
                Registering automatically schedules this event in your Google Calendar in Asia/Kolkata (IST). You can also add it manually right now:
              </p>
              <a
                href={gcalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
              >
                <span>Add to Google Calendar directly</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 w-full sm:w-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict duplicate prevention & capacity safe</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>

            {isRegistered ? (
              <button
                disabled
                className="py-2.5 px-6 rounded-xl text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 cursor-default"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Already Registered</span>
              </button>
            ) : isFull ? (
              <button
                disabled
                className="py-2.5 px-6 rounded-xl text-xs font-bold bg-rose-950/40 text-rose-300 border border-rose-500/20 cursor-not-allowed"
              >
                Registration Full
              </button>
            ) : (
              <button
                onClick={() => onRegister(event)}
                disabled={isRegistering}
                className="py-2.5 px-6 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {isRegistering ? (
                  <span>Securing Seat...</span>
                ) : (
                  <>
                    <span>Register Now</span>
                    <span className="text-[10px] bg-indigo-700 px-1.5 py-0.5 rounded">Free</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
