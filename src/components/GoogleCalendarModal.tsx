import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { listPrimaryCalendarEvents } from '../services/googleCalendarAuth.ts';
import {
  X,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';
import { useToast } from './Toast.tsx';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({ isOpen, onClose }) => {
  const { googleUser, googleCalendarLinked, connectGoogleAccount, disconnectGoogleAccount } = useAuth();
  const { success, error: toastError } = useToast();

  const [connecting, setConnecting] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchCalendarEvents = async () => {
    if (!googleUser) return;
    setLoadingEvents(true);
    try {
      const items = await listPrimaryCalendarEvents(4);
      setUpcomingEvents(items);
    } catch {
      // ignore
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (isOpen && googleUser) {
      fetchCalendarEvents();
    }
  }, [isOpen, googleUser]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectGoogleAccount();
      success('Connected to Google Calendar successfully!');
      fetchCalendarEvents();
    } catch (err: any) {
      toastError(err.message || 'Failed to connect Google Calendar.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm('Are you sure you want to disconnect Google Calendar? Automatic sync will pause.');
    if (!confirmed) return;

    try {
      await disconnectGoogleAccount();
      setUpcomingEvents([]);
      success('Disconnected Google Calendar.');
    } catch (err: any) {
      toastError(err.message || 'Failed to disconnect Google Calendar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Google Calendar Integration</h3>
              <p className="text-xs text-slate-400">Directly sync college workshops & academic reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Connection Status Box */}
          {googleUser ? (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google User'}
                      className="w-11 h-11 rounded-full border border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {googleUser.displayName?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{googleUser.displayName || 'Connected Account'}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{googleUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleDisconnect}
                  title="Disconnect account"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-emerald-200/90 leading-relaxed pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                <span>All event registrations automatically add to your primary Google Calendar in IST.</span>
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Open Calendar</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <CalendarDays className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Connect Your Google Account</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Authorize Google Calendar with permission so registrations automatically appear on your mobile and desktop calendar.
                </p>
              </div>

              {/* Official Google Material Style Button */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="cursor-pointer inline-flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] border border-slate-200 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{connecting ? 'Connecting with Google...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Upcoming Synced Events Preview if Connected */}
          {googleUser && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Upcoming Events on Your Google Calendar
                </h4>
                <button
                  onClick={fetchCalendarEvents}
                  disabled={loadingEvents}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingEvents ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingEvents ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-800/40 rounded-2xl">
                  Fetching calendar items...
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingEvents.map((evt: any) => {
                    const dateStr = evt.start?.dateTime || evt.start?.date || '';
                    const timeStr = dateStr ? new Date(dateStr).toLocaleString() : '';

                    return (
                      <div
                        key={evt.id}
                        className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-100">{evt.summary || 'College Appointment'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{timeStr}</p>
                        </div>
                        {evt.htmlLink && (
                          <a
                            href={evt.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-indigo-400 hover:text-indigo-300"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-800/40 rounded-2xl">
                  No events found on this calendar. When you register for an event, it will sync here automatically!
                </div>
              )}
            </div>
          )}

          {/* Timezone and Privacy Notice */}
          <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Permission & Privacy Protection</span>
            </div>
            <p>
              Your token is stored safely in memory during your active session. The system accesses your calendar solely to add confirmed college academic events with your consent.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
