import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student } from '../types/index.ts';
import { api, getStoredToken, setStoredToken } from '../api/client.ts';
import {
  connectGoogleCalendar as connectGoogleOauth,
  disconnectGoogleCalendar as disconnectGoogleOauth,
  initGoogleAuth,
} from '../services/googleCalendarAuth.ts';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: Student | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; course: string; password: string; role?: string }) => Promise<void>;
  logout: () => void;
  quickLogin: (account: 'student1' | 'student2' | 'admin') => Promise<void>;
  googleCalendarLinked: boolean;
  setGoogleCalendarLinked: (linked: boolean) => void;
  googleUser: FirebaseUser | null;
  connectGoogleAccount: () => Promise<void>;
  disconnectGoogleAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleCalendarLinked, setGoogleCalendarLinkedState] = useState<boolean>(() => {
    return localStorage.getItem('gcal_linked') === 'true';
  });

  const setGoogleCalendarLinked = (linked: boolean) => {
    setGoogleCalendarLinkedState(linked);
    localStorage.setItem('gcal_linked', linked ? 'true' : 'false');
  };

  useEffect(() => {
    // Listen for Firebase Google Auth state
    const unsubscribe = initGoogleAuth(
      (fbUser) => {
        setGoogleUser(fbUser);
        setGoogleCalendarLinkedState(true);
      },
      () => {
        setGoogleUser(null);
      }
    );

    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        // Auto-login with default student Aarav for effortless first experience if no session
        try {
          const res = await api.auth.login({
            email: 'aarav.sharma@college.edu',
            password: 'student123',
          });
          setStoredToken(res.token);
          setUser(res.user);
        } catch {
          // ignore
        }
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.profile();
        setUser(res.user);
      } catch (err) {
        console.warn('Token validation failed, clearing token');
        setStoredToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    setStoredToken(res.token);
    setUser(res.user);
  };

  const register = async (data: { name: string; email: string; course: string; password: string; role?: string }) => {
    const res = await api.auth.register(data);
    setStoredToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  const quickLogin = async (account: 'student1' | 'student2' | 'admin') => {
    setLoading(true);
    try {
      if (account === 'student1') {
        await login('aarav.sharma@college.edu', 'student123');
      } else if (account === 'student2') {
        await login('priya.patel@college.edu', 'student123');
      } else if (account === 'admin') {
        await login('admin@college.edu', 'admin123');
      }
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleAccount = async () => {
    const result = await connectGoogleOauth();
    setGoogleUser(result.user);
    setGoogleCalendarLinked(true);
  };

  const disconnectGoogleAccount = async () => {
    await disconnectGoogleOauth();
    setGoogleUser(null);
    setGoogleCalendarLinked(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        quickLogin,
        googleCalendarLinked,
        setGoogleCalendarLinked,
        googleUser,
        connectGoogleAccount,
        disconnectGoogleAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
