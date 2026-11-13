import React from 'react';
import { Registration } from '../types/index.ts';
import { X, Calendar, Clock, MapPin, CheckCircle2, CalendarDays, ExternalLink, Printer, GraduationCap, QrCode } from 'lucide-react';

interface RegistrationPassModalProps {
  registration: Registration | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationPassModal: React.FC<RegistrationPassModalProps> = ({
  registration,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !registration) return null;

  const event = registration.event;
  const student = registration.student;

  const gcalUrl = event
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        '[College Event] ' + event.name
      )}&details=${encodeURIComponent(
        `${event.description}\n\nAttendee: ${student?.name || 'Student'}\nReg ID: ${registration.registration_id}`
      )}&location=${encodeURIComponent(event.venue)}&ctz=Asia/Kolkata`
    : '#';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pass Top Bar */}
        <div className="px-6 py-4 bg-indigo-950/60 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Official Academic Event Pass
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pass Ticket Body */}
        <div className="p-6 space-y-6">
          {/* Header & Status */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Confirmed Registration
              </span>
              <h3 className="text-xl font-bold text-white leading-snug">
                {event?.name || 'College Academic Event'}
              </h3>
            </div>
            <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
              <QrCode className="w-12 h-12 text-slate-900" />
            </div>
          </div>

          {/* Student Info Box */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Attendee Name</p>
              <p className="font-bold text-slate-100 mt-0.5">{student?.name || 'Student'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Student ID</p>
              <p className="font-mono text-indigo-300 font-semibold mt-0.5">{registration.student_id}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Course / Dept</p>
              <p className="text-slate-300 font-medium mt-0.5 truncate">{student?.course || 'Academic'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Pass Number</p>
              <p className="font-mono text-slate-300 mt-0.5 truncate">{registration.registration_id}</p>
            </div>
          </div>

          {/* Event Schedule & Location */}
          <div className="space-y-2.5 text-xs text-slate-300 bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-semibold text-slate-200">{event?.date}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{event?.time} (Asia/Kolkata IST)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{event?.venue}</span>
            </div>
          </div>

          {/* Google Calendar ID info */}
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="font-medium text-slate-200">Google Calendar Synced</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  ID: {registration.calendar_event_id || 'gcal_auto_synced'}
                </p>
              </div>
            </div>
            <a
              href={gcalUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/50 rounded-lg flex items-center gap-1 transition-colors"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
