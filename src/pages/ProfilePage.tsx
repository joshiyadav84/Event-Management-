import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Registration } from '../types/index.ts';
import {
  User,
  Mail,
  GraduationCap,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Clock,
  KeyRound,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useToast } from '../components/Toast.tsx';

interface ProfilePageProps {
  myRegistrations: Registration[];
  onNavigate: (tab: string) => void;
  openCalendarModal: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ myRegistrations, onNavigate, openCalendarModal }) => {
  const { user, logout, googleCalendarLinked, setGoogleCalendarLinked, googleUser, quickLogin } = useAuth();
  const { success } = useToast();

  const confirmedCount = myRegistrations.filter((r) => r.status === 'confirmed').length;

  const handleToggleCalendar = () => {
    const nextState = !googleCalendarLinked;
    setGoogleCalendarLinked(nextState);
    if (nextState) {
      success('Google Calendar Auto-Sync activated for registrations!');
    } else {
      success('Google Calendar link disabled.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-600/30">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{user?.name}</h1>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    user?.role === 'admin'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  {user?.role === 'admin' ? 'Administrator' : 'Student'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{user?.course}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Details Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              Student Identifier
            </span>
            <p className="font-mono text-sm font-bold text-slate-200 mt-1">{user?.student_id}</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              College Email
            </span>
            <p className="text-sm font-semibold text-slate-200 mt-1 truncate">{user?.email}</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              Active Registrations
            </span>
            <p className="text-sm font-bold text-emerald-400 mt-1">{confirmedCount} confirmed seats</p>
          </div>
        </div>
      </div>

      {/* Google Calendar & Timezone Integration Box (Section 10 & 11) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Google Calendar Integration</h2>
              <p className="text-xs text-slate-400">
                Automated event sync in India Standard Time (Asia/Kolkata +05:30)
              </p>
            </div>
          </div>

          <button
            onClick={openCalendarModal}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              googleUser || googleCalendarLinked
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent'
            }`}
          >
            {googleUser || googleCalendarLinked ? 'Manage Calendar (Connected ✓)' : 'Connect Google Calendar'}
          </button>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <Globe className="w-4 h-4 text-indigo-400" />
              Default College Timezone:
            </span>
            <span className="font-semibold text-slate-100">Asia/Kolkata (IST, UTC+05:30)</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4 text-indigo-400" />
              Calendar Notification:
            </span>
            <span className="font-semibold text-slate-100">24 Hours & 30 Minutes Before Event</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Direct 1-Click Calendar Add:
            </span>
            <span className="font-semibold text-emerald-400">Enabled for all registrations</span>
          </div>
        </div>
      </div>

      {/* Quick Demo Switcher helper */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Switch Test Persona</h2>
        </div>
        <p className="text-xs text-slate-400">
          Seamlessly switch between sample students and administrator to test role-based access.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => quickLogin('student1')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-2xl border border-slate-700 text-left transition-colors"
          >
            <p className="text-xs font-bold text-indigo-300">Aarav Sharma</p>
            <p className="text-[11px] text-slate-400 mt-0.5">B.Tech Computer Science</p>
            <span className="inline-block mt-2 text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
              Student Role
            </span>
          </button>

          <button
            onClick={() => quickLogin('student2')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-2xl border border-slate-700 text-left transition-colors"
          >
            <p className="text-xs font-bold text-emerald-300">Priya Patel</p>
            <p className="text-[11px] text-slate-400 mt-0.5">MBA Business Analytics</p>
            <span className="inline-block mt-2 text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
              Student Role
            </span>
          </button>

          <button
            onClick={() => quickLogin('admin')}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-2xl border border-slate-700 text-left transition-colors"
          >
            <p className="text-xs font-bold text-amber-300">Prof. Rajesh Nair</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Academic Affairs & Dean</p>
            <span className="inline-block mt-2 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
              Admin Console Access
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
