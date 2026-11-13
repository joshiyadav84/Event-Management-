import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client.ts';
import { CollegeEvent, Registration, DashboardStatistics } from '../types/index.ts';
import {
  Calendar,
  Users,
  CheckCircle2,
  CalendarDays,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Download,
  Filter,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { EventFormModal } from '../components/EventFormModal.tsx';
import { useToast } from '../components/Toast.tsx';

interface AdminDashboardProps {
  events: CollegeEvent[];
  onRefreshEvents: () => void;
  onViewEvent: (event: CollegeEvent) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  events,
  onRefreshEvents,
  onViewEvent,
}) => {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'registrations' | 'participants'>('overview');
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [adminRegistrations, setAdminRegistrations] = useState<Registration[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters for registrations table
  const [regSearch, setRegSearch] = useState('');
  const [regEventFilter, setRegEventFilter] = useState('all');
  const [regCourseFilter, setRegCourseFilter] = useState('all');
  const [regStatusFilter, setRegStatusFilter] = useState('all');

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEventToEdit, setSelectedEventToEdit] = useState<CollegeEvent | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<CollegeEvent | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, regRes, partRes] = await Promise.all([
        api.admin.getDashboard(),
        api.admin.getRegistrations(),
        api.admin.getParticipants(),
      ]);
      setStats(dashRes.stats);
      setAdminRegistrations(regRes.registrations);
      setParticipants(partRes.participants);
    } catch (err: any) {
      toastError(err.message || 'Failed to load administrator metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Handle Event Creation / Edit
  const handleSaveEvent = async (eventData: Partial<CollegeEvent>) => {
    if (modalMode === 'create') {
      await api.events.create(eventData);
      success('College event published successfully!');
    } else if (selectedEventToEdit) {
      await api.events.update(selectedEventToEdit.event_id, eventData);
      success('College event updated successfully!');
    }
    onRefreshEvents();
    fetchAdminData();
  };

  // Handle Event Deletion
  const handleDeleteEvent = async () => {
    if (!deleteConfirmEvent) return;
    try {
      await api.events.delete(deleteConfirmEvent.event_id);
      success('Event deleted and associated registrations cleaned up safely.');
      setDeleteConfirmEvent(null);
      onRefreshEvents();
      fetchAdminData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete event.');
    }
  };

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return adminRegistrations.filter((r) => {
      if (regEventFilter !== 'all' && r.event_id !== regEventFilter) return false;
      if (regStatusFilter !== 'all' && r.status !== regStatusFilter) return false;
      if (regCourseFilter !== 'all' && (!r.student?.course.toLowerCase().includes(regCourseFilter.toLowerCase())))
        return false;

      if (regSearch.trim()) {
        const q = regSearch.toLowerCase();
        const matches =
          r.student?.name.toLowerCase().includes(q) ||
          r.student?.email.toLowerCase().includes(q) ||
          r.student_id.toLowerCase().includes(q) ||
          r.registration_id.toLowerCase().includes(q) ||
          r.event?.name.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [adminRegistrations, regEventFilter, regCourseFilter, regStatusFilter, regSearch]);

  // Export registrations CSV
  const handleExportCSV = () => {
    const headers = [
      'Registration ID',
      'Student ID',
      'Student Name',
      'Email',
      'Course',
      'Event Name',
      'Event Date',
      'Registration Date',
      'Status',
      'Google Calendar Event ID',
    ];

    const rows = filteredRegistrations.map((r) => [
      r.registration_id,
      r.student_id,
      `"${r.student?.name || ''}"`,
      r.student?.email || '',
      `"${r.student?.course || ''}"`,
      `"${r.event?.name || ''}"`,
      r.event?.date || '',
      r.registration_date,
      r.status,
      r.calendar_event_id || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `college_registrations_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Roster CSV downloaded successfully!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Admin Event Console</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
              Dean & Faculty View
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time enrollment metrics, event curriculum planning, and participant audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setModalMode('create');
              setSelectedEventToEdit(null);
              setIsEventModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Event</span>
          </button>
          <button
            onClick={fetchAdminData}
            title="Refresh statistics"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6 High-Level Dashboard Statistics (Section 4) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Events</p>
          <p className="text-2xl font-extrabold text-white mt-1.5">{stats?.totalEvents ?? events.length}</p>
          <span className="text-[10px] text-slate-500">All registered</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Upcoming</p>
          <p className="text-2xl font-extrabold text-indigo-400 mt-1.5">{stats?.upcomingEvents ?? 0}</p>
          <span className="text-[10px] text-slate-500">Scheduled ahead</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
          <p className="text-2xl font-extrabold text-white mt-1.5">{stats?.totalStudents ?? participants.length}</p>
          <span className="text-[10px] text-slate-500">Enrolled accounts</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Registrations</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1.5">{stats?.totalRegistrations ?? 0}</p>
          <span className="text-[10px] text-slate-500">Confirmed seats</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">This Month</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1.5">{stats?.eventsThisMonth ?? 0}</p>
          <span className="text-[10px] text-slate-500">October 2026</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Most Popular</p>
          <p className="text-xs font-bold text-slate-200 mt-2 truncate">
            {stats?.mostPopularEvent ? stats.mostPopularEvent.name : 'AI Workshop'}
          </p>
          <span className="text-[10px] text-indigo-400 font-semibold">
            {stats?.mostPopularEvent ? `${stats.mostPopularEvent.registrations} sign-ups` : ''}
          </span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-4 text-xs font-semibold rounded-t-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-indigo-300 border-t-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Visual Analytics & Capacity
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`py-2.5 px-4 text-xs font-semibold rounded-t-xl transition-all ${
            activeTab === 'events'
              ? 'bg-slate-800 text-indigo-300 border-t-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Event Management ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`py-2.5 px-4 text-xs font-semibold rounded-t-xl transition-all ${
            activeTab === 'registrations'
              ? 'bg-slate-800 text-indigo-300 border-t-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Registration Audit Table ({adminRegistrations.length})
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`py-2.5 px-4 text-xs font-semibold rounded-t-xl transition-all ${
            activeTab === 'participants'
              ? 'bg-slate-800 text-indigo-300 border-t-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Student Roster ({participants.length})
        </button>
      </div>

      {/* TAB 1: Visual Analytics */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Popular Events Capacity Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Top Events Enrollment & Remaining Capacity</span>
              </h3>
              <span className="text-xs text-slate-400">Live seat gauges</span>
            </div>

            <div className="space-y-4">
              {events.slice(0, 5).map((e) => {
                const percent = Math.min(
                  100,
                  Math.round((e.current_registration_count / e.maximum_capacity) * 100)
                );
                return (
                  <div key={e.event_id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate max-w-[240px]">{e.name}</span>
                      <span className="text-slate-400">
                        {e.current_registration_count} / {e.maximum_capacity} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent >= 100 ? 'bg-rose-500' : percent > 75 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Academic Categories Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Category Breakdown</span>
              </h3>
              <span className="text-xs text-slate-400">Department curriculum</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(stats?.categoryStats || []).map((cat, idx) => (
                <div key={idx} className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase truncate">{cat.category}</p>
                  <p className="text-xl font-bold text-white mt-1">{cat.count} Events</p>
                </div>
              ))}
            </div>

            <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-2xl text-xs text-indigo-300 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 shrink-0 text-indigo-400" />
              <span>
                All registrations are backed by atomic constraints ensuring no double-booking and automatic seat release on cancellation.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Event Management Table & Controls */}
      {activeTab === 'events' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Manage College Events</h3>
            <span className="text-xs text-slate-400">Total {events.length} listed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Event Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Schedule (IST)</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Registrations</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {events.map((e) => {
                  const percent = Math.round((e.current_registration_count / e.maximum_capacity) * 100);
                  return (
                    <tr key={e.event_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">{e.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>{e.date}</div>
                        <div className="text-[10px] text-slate-500">{e.time}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[140px] truncate">{e.venue}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200">
                          {e.current_registration_count} / {e.maximum_capacity}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">({percent}%)</span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => onViewEvent(e)}
                          title="Preview Details"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEventToEdit(e);
                            setModalMode('edit');
                            setIsEventModalOpen(true);
                          }}
                          title="Edit Event"
                          className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmEvent(e)}
                          title="Delete Event"
                          className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Registration Audit Management Table (Section 4) */}
      {activeTab === 'registrations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-4 p-4 sm:p-5">
          {/* Table Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder="Search attendee, email, reg ID..."
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={regEventFilter}
                onChange={(e) => setRegEventFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Events</option>
                {events.map((e) => (
                  <option key={e.event_id} value={e.event_id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={regStatusFilter}
                onChange={(e) => setRegStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={handleExportCSV}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Registrations Data Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Registration ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Student ID / Email</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRegistrations.length > 0 ? (
                  filteredRegistrations.map((r) => (
                    <tr key={r.registration_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{r.registration_id}</td>
                      <td className="py-3 px-4 font-bold text-white">{r.student?.name || 'Student'}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-300">{r.student_id}</div>
                        <div className="text-[10px] text-slate-500">{r.student?.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{r.student?.course}</td>
                      <td className="py-3 px-4 font-medium text-slate-200 max-w-xs truncate">{r.event?.name}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(r.registration_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            r.status === 'confirmed'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No registrations match your search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Participants Roster (Section 4) */}
      {activeTab === 'participants' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Registered Student Roster</h3>
            <span className="text-xs text-slate-400">{participants.length} Active students</span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">College Email</th>
                  <th className="py-3 px-4">Enrolled Course</th>
                  <th className="py-3 px-4">Registered Workshops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {participants.map((p) => (
                  <tr key={p.student_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-indigo-400">{p.student_id}</td>
                    <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-4 text-slate-400">{p.email}</td>
                    <td className="py-3 px-4 text-slate-300">{p.course}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                        {p.registered_events_count} Events
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Form Modal (Create / Edit) */}
      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSubmit={handleSaveEvent}
        initialData={selectedEventToEdit}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete College Event?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{deleteConfirmEvent.name}</strong>?
              This action will remove the event and cascade-clean all associated registrations.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirmEvent(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
