import React from 'react';
import { CollegeEvent } from '../types/index.ts';
import { Calendar, Clock, MapPin, Users, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface EventCardProps {
  event: CollegeEvent;
  isRegistered?: boolean;
  onViewDetails: (event: CollegeEvent) => void;
  onRegister: (event: CollegeEvent) => void;
  isRegistering?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isRegistered = false,
  onViewDetails,
  onRegister,
  isRegistering = false,
}) => {
  const availableSeats = Math.max(0, event.maximum_capacity - event.current_registration_count);
  const isFull = event.current_registration_count >= event.maximum_capacity;
  const isPast = new Date(event.date) < new Date(new Date().toISOString().split('T')[0]);
  const isFillingFast = !isFull && availableSeats <= 10;

  // Format date nicely: e.g. "Sat, 10 Oct 2026"
  const formattedDate = (() => {
    try {
      const d = new Date(event.date + 'T00:00:00');
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return event.date;
    }
  })();

  // Calculate capacity percentage
  const fillPercent = Math.min(100, Math.round((event.current_registration_count / event.maximum_capacity) * 100));

  return (
    <div className="group relative flex flex-col justify-between bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-950/20 transition-all duration-300">
      {/* Top Meta: Category & Availability Pill */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {event.category}
          </span>

          {isRegistered ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Registered ✓
            </span>
          ) : isPast ? (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Registration Closed
            </span>
          ) : isFull ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Registration Full
            </span>
          ) : isFillingFast ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Only {availableSeats} seats left!
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {availableSeats} seats available
            </span>
          )}
        </div>

        {/* Event Name */}
        <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
          {event.name}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {event.description}
        </p>

        {/* Date, Time, Venue Specs */}
        <div className="mt-4 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-medium">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{event.time}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>

          {event.speaker && (
            <div className="text-[11px] text-slate-400 italic pt-1 truncate">
              Speaker: {event.speaker}
            </div>
          )}
        </div>

        {/* Capacity Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Seats Filled
            </span>
            <span className="font-medium text-slate-300">
              {event.current_registration_count} / {event.maximum_capacity} ({fillPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull
                  ? 'bg-rose-500'
                  : fillPercent > 80
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3 flex items-center gap-2">
        <button
          onClick={() => onViewDetails(event)}
          className="flex-1 py-2 px-3 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-center"
        >
          View Details
        </button>

        {isRegistered ? (
          <button
            onClick={() => onViewDetails(event)}
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Registered
          </button>
        ) : isPast ? (
          <button
            disabled
            className="flex-1 py-2 px-3 text-xs font-medium rounded-xl bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed"
          >
            Closed
          </button>
        ) : isFull ? (
          <button
            disabled
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-rose-950/40 text-rose-400 border border-rose-500/20 cursor-not-allowed"
          >
            Full
          </button>
        ) : (
          <button
            onClick={() => onRegister(event)}
            disabled={isRegistering}
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
          >
            <span>{isRegistering ? 'Registering...' : 'Register'}</span>
            {!isRegistering && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};
