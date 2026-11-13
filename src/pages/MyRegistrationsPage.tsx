import React, { useState } from 'react';
import { Registration } from '../types/index.ts';
import {
  Calendar,
  Clock,
  MapPin,
  CalendarDays,
  ExternalLink,
  Trash2,
  Ticket,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { RegistrationPassModal } from '../components/RegistrationPassModal.tsx';

interface MyRegistrationsPageProps {
  registrations: Registration[];
  onCancelRegistration: (registrationId: string) => Promise<void>;
  onNavigate: (tab: string) => void;
  cancellingId: string | null;
}

export const MyRegistrationsPage: React.FC<MyRegistrationsPageProps> = ({
  registrations,
  onCancelRegistration,
  onNavigate,
  cancellingId,
}) => {
  const [selectedPass, setSelectedPass] = useState<Registration | null>(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState<Registration | null>(null);

  const activeRegistrations = registrations.filter((r) => r.status === 'confirmed');
  const pastOrCancelled = registrations.filter((r) => r.status === 'cancelled');

  const handleConfirmCancel = async () => {
    if (!confirmCancelModal) return;
    await onCancelRegistration(confirmCancelModal.registration_id);
    setConfirmCancelModal(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">My Event Registrations</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track confirmed registrations, view e-tickets, and manage Google Calendar schedules.
          </p>
        </div>
        <button
          onClick={() => onNavigate('events')}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
        >
          <span>Explore More Events</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main List */}
      {registrations.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <Ticket className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white">No Event Registrations Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You haven't registered for any academic workshops or seminars. Check out the schedule to reserve your seat today!
          </p>
          <button
            onClick={() => onNavigate('events')}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all inline-block mt-2"
          >
            Browse Available Events
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Registrations List */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Active Registrations ({activeRegistrations.length})
            </h2>

            {activeRegistrations.length === 0 ? (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                You have no active registrations at this moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRegistrations.map((reg) => {
                  const event = reg.event;
                  const gcalUrl = event
                    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                        '[College Event] ' + event.name
                      )}&details=${encodeURIComponent(event.description + '\n\nVenue: ' + event.venue)}&location=${encodeURIComponent(
                        event.venue
                      )}&ctz=Asia/Kolkata`
                    : '#';

                  return (
                    <div
                      key={reg.registration_id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Confirmed ✓
                          </span>
                          <h3 className="text-base font-bold text-white line-clamp-1">{event?.name}</h3>
                          <span className="text-[11px] text-indigo-400 font-medium">{event?.category}</span>
                        </div>

                        <button
                          onClick={() => setSelectedPass(reg)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
                        >
                          <Ticket className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Pass</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="font-semibold text-slate-200">{event?.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>{event?.time} (IST)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="truncate">{event?.venue}</span>
                        </div>
                      </div>

                      {/* Google Calendar Bar */}
                      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <CalendarDays className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold text-slate-200 truncate">Google Calendar Synced</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              {reg.calendar_event_id || 'Asia/Kolkata (+05:30)'}
                            </p>
                          </div>
                        </div>
                        <a
                          href={gcalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/50 rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                        <span className="text-[11px] text-slate-500 font-mono truncate">
                          ID: {reg.registration_id}
                        </span>

                        <button
                          onClick={() => setConfirmCancelModal(reg)}
                          disabled={cancellingId === reg.registration_id}
                          className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors font-medium p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel Registration</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cancelled Registrations Section if any */}
          {pastOrCancelled.length > 0 && (
            <div className="pt-6 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-slate-500" />
                Cancelled Registrations ({pastOrCancelled.length})
              </h3>

              <div className="space-y-2">
                {pastOrCancelled.map((reg) => (
                  <div
                    key={reg.registration_id}
                    className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs opacity-75"
                  >
                    <div>
                      <p className="font-bold text-slate-300">{reg.event?.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {reg.event?.date} • {reg.event?.venue}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-semibold">
                      Cancelled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Registration Cancellation */}
      {confirmCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Cancel Registration?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel your registration for{' '}
              <strong className="text-white">{confirmCancelModal.event?.name}</strong>? Your reserved seat will be released immediately to other students.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setConfirmCancelModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Keep Seat
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Pass E-Ticket Modal */}
      <RegistrationPassModal
        registration={selectedPass}
        isOpen={!!selectedPass}
        onClose={() => setSelectedPass(null)}
      />
    </div>
  );
};
