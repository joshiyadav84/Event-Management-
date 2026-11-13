import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider, useToast } from './components/Toast.tsx';
import { Navbar } from './components/Navbar.tsx';
import { StudentDashboard } from './pages/StudentDashboard.tsx';
import { EventsPage } from './pages/EventsPage.tsx';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage.tsx';
import { AiAssistantPage } from './pages/AiAssistantPage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { EventDetailsModal } from './components/EventDetailsModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { GoogleCalendarModal } from './components/GoogleCalendarModal.tsx';
import { api } from './api/client.ts';
import { CollegeEvent, Registration } from './types/index.ts';
import confetti from 'canvas-confetti';

function AppContent() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<CollegeEvent | null>(null);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [cancellingRegistrationId, setCancellingRegistrationId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  // AI initial prompt bridge
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const eventsRes = await api.events.getAll();
      setEvents(eventsRes.events);

      if (user) {
        const regsRes = await api.registrations.getMyRegistrations();
        setMyRegistrations(regsRes.registrations);
      } else {
        setMyRegistrations([]);
      }
    } catch (err: any) {
      console.warn('Error loading events:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Event Registration
  const handleRegister = async (event: CollegeEvent) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setRegisteringEventId(event.event_id);
    try {
      const res = await api.registrations.register(event.event_id);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      success(
        res.message || 'Registration successful! The event has been added to your Google Calendar.',
        `Calendar Sync: ${res.calendar?.calendar_event_id || 'Active'}`
      );

      // Reload fresh data to update capacity count and registration list
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Registration failed.');
    } finally {
      setRegisteringEventId(null);
    }
  };

  // Handle Cancellation
  const handleCancelRegistration = async (registrationId: string) => {
    setCancellingRegistrationId(registrationId);
    try {
      const res = await api.registrations.cancel(registrationId);
      success(res.message || 'Registration cancelled. Seat released.');
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to cancel registration.');
    } finally {
      setCancellingRegistrationId(null);
    }
  };

  // AI prompt bridge from dashboard
  const handleAskAiPrompt = (prompt: string) => {
    setAiInitialPrompt(prompt);
    setCurrentTab('ai-assistant');
  };

  const isEventRegistered = (eventId: string) => {
    return myRegistrations.some((r) => r.event_id === eventId && r.status === 'confirmed');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAuthModal={() => setAuthModalOpen(true)}
        openCalendarModal={() => setCalendarModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loadingEvents && events.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading College Academic Events Portal...</p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <StudentDashboard
                events={events}
                myRegistrations={myRegistrations}
                onViewEvent={(e) => setSelectedEvent(e)}
                onRegisterEvent={handleRegister}
                registeringEventId={registeringEventId}
                onNavigate={setCurrentTab}
                onAskAiPrompt={handleAskAiPrompt}
              />
            )}

            {currentTab === 'events' && (
              <EventsPage
                events={events}
                myRegistrations={myRegistrations}
                onViewEvent={(e) => setSelectedEvent(e)}
                onRegisterEvent={handleRegister}
                registeringEventId={registeringEventId}
                onRefresh={loadData}
              />
            )}

            {currentTab === 'my-registrations' && (
              <MyRegistrationsPage
                registrations={myRegistrations}
                onCancelRegistration={handleCancelRegistration}
                onNavigate={setCurrentTab}
                cancellingId={cancellingRegistrationId}
              />
            )}

            {currentTab === 'ai-assistant' && (
              <AiAssistantPage
                onEventRegistered={loadData}
                initialPrompt={aiInitialPrompt}
                onClearInitialPrompt={() => setAiInitialPrompt('')}
              />
            )}

            {currentTab === 'admin' && (
              <AdminDashboard
                events={events}
                onRefreshEvents={loadData}
                onViewEvent={(e) => setSelectedEvent(e)}
              />
            )}

            {currentTab === 'profile' && (
              <ProfilePage
                myRegistrations={myRegistrations}
                onNavigate={setCurrentTab}
                openCalendarModal={() => setCalendarModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isRegistered={selectedEvent ? isEventRegistered(selectedEvent.event_id) : false}
        onRegister={handleRegister}
        isRegistering={selectedEvent ? registeringEventId === selectedEvent.event_id : false}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Google Calendar OAuth & Sync Modal */}
      <GoogleCalendarModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 AI-Powered College Event Management System. All academic rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Asia/Kolkata (IST)</span>
            <span>•</span>
            <span>Gemini Function Calling Agent</span>
            <span>•</span>
            <span>Google Calendar API Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
