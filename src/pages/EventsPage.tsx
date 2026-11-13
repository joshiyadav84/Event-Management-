import React, { useState, useMemo } from 'react';
import { CollegeEvent, Registration } from '../types/index.ts';
import { EventCard } from '../components/EventCard.tsx';
import { Search, Filter, Calendar as CalendarIcon, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface EventsPageProps {
  events: CollegeEvent[];
  myRegistrations: Registration[];
  onViewEvent: (event: CollegeEvent) => void;
  onRegisterEvent: (event: CollegeEvent) => void;
  registeringEventId: string | null;
  onRefresh: () => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
  myRegistrations,
  onViewEvent,
  onRegisterEvent,
  registeringEventId,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'full'>('all');
  const [selectedDate, setSelectedDate] = useState('');

  const registeredEventIds = useMemo(() => {
    return new Set(
      myRegistrations.filter((r) => r.status === 'confirmed').map((r) => r.event_id)
    );
  }, [myRegistrations]);

  // Extract unique categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(events.map((e) => e.category)));
    return ['All', ...list];
  }, [events]);

  // Apply Client Filters
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          (e.speaker && e.speaker.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Category
      if (selectedCategory !== 'All' && e.category !== selectedCategory) {
        return false;
      }

      // Availability
      if (availabilityFilter === 'available') {
        if (e.current_registration_count >= e.maximum_capacity) return false;
      } else if (availabilityFilter === 'full') {
        if (e.current_registration_count < e.maximum_capacity) return false;
      }

      // Date
      if (selectedDate && e.date !== selectedDate) {
        return false;
      }

      return true;
    });
  }, [events, search, selectedCategory, availabilityFilter, selectedDate]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setAvailabilityFilter('all');
    setSelectedDate('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Academic Events Directory</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, filter, and register for workshops, technical seminars, and college symposiums.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, topic, or keynote speaker..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="md:col-span-2">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Seats</option>
              <option value="available">Available Only</option>
              <option value="full">Full Only</option>
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Filter Badges & Quick Reset */}
        {(search || selectedCategory !== 'All' || availabilityFilter !== 'all' || selectedDate) && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-400">
              <span>Showing {filteredEvents.length} of {events.length} events</span>
            </div>
            <button
              onClick={resetFilters}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => (
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
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Matching Events Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            We couldn't find any events matching your selected criteria. Try adjusting your search term, category, or date filter.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors inline-block mt-2"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
