import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  GraduationCap,
  Calendar,
  Sparkles,
  BookmarkCheck,
  LayoutDashboard,
  LogOut,
  User,
  ShieldAlert,
  ChevronDown,
  CalendarDays,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
  openCalendarModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openAuthModal, openCalendarModal }) => {
  const { user, logout, quickLogin, googleCalendarLinked } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    ...(user?.role === 'student'
      ? [{ id: 'my-registrations', label: 'My Registrations', icon: BookmarkCheck }]
      : []),
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, badge: 'Gemini' },
    ...(user?.role === 'admin'
      ? [{ id: 'admin', label: 'Admin Console', icon: ShieldAlert }]
      : []),
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & College Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">CampusEvents</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded uppercase tracking-wider">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Academic Event Management System</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Controls & Quick Role Switcher */}
          <div className="hidden md:flex items-center gap-3">
            {/* Google Calendar Sync Indicator */}
            <button
              onClick={openCalendarModal}
              title="Manage Google Calendar Sync"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                googleCalendarLinked
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className={`w-3.5 h-3.5 ${googleCalendarLinked ? 'text-emerald-400' : ''}`} />
              <span className="hidden lg:inline">Google Calendar:</span>
              <span className="font-semibold">{googleCalendarLinked ? 'Connected ✓' : 'Connect'}</span>
            </button>

            {/* Switch Demo Persona Menu */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <span>Demo Switcher</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {demoMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in-50"
                  onClick={() => setDemoMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                    Switch Active Persona
                  </div>
                  <button
                    onClick={() => quickLogin('student1')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700/80 text-slate-200 flex flex-col"
                  >
                    <span className="font-medium text-indigo-300">Aarav Sharma (Student)</span>
                    <span className="text-[11px] text-slate-400">B.Tech Computer Science</span>
                  </button>
                  <button
                    onClick={() => quickLogin('student2')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700/80 text-slate-200 flex flex-col"
                  >
                    <span className="font-medium text-emerald-300">Priya Patel (Student)</span>
                    <span className="text-[11px] text-slate-400">MBA Business Analytics</span>
                  </button>
                  <button
                    onClick={() => quickLogin('admin')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700/80 text-slate-200 flex flex-col border-t border-slate-700/50"
                  >
                    <span className="font-medium text-amber-300">Prof. Rajesh Nair (Admin)</span>
                    <span className="text-[11px] text-slate-400">Academic Affairs & Event Admin</span>
                  </button>
                </div>
              )}
            </div>

            {/* Current Account / Sign In */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div
                  onClick={() => setCurrentTab('profile')}
                  className="cursor-pointer text-right hidden lg:block"
                >
                  <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{user.name}</p>
                  <span className="text-[10px] text-indigo-400 uppercase font-medium">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] bg-amber-400 text-slate-950 font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <div className="text-xs text-slate-400 font-semibold px-2">Quick Demo Accounts:</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  quickLogin('student1');
                  setMobileMenuOpen(false);
                }}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-xs text-indigo-300 font-medium"
              >
                Aarav (CS)
              </button>
              <button
                onClick={() => {
                  quickLogin('student2');
                  setMobileMenuOpen(false);
                }}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-xs text-emerald-300 font-medium"
              >
                Priya (MBA)
              </button>
              <button
                onClick={() => {
                  quickLogin('admin');
                  setMobileMenuOpen(false);
                }}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-xs text-amber-300 font-medium"
              >
                Admin (Dean)
              </button>
            </div>

            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out ({user.name})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  openAuthModal();
                  setMobileMenuOpen(false);
                }}
                className="mt-2 w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
