import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryBackground } from './components/LibraryBackground';
import { ClockNavigation } from './components/ClockNavigation';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { DashboardView } from './components/DashboardView';
import { DocumentLibraryView } from './components/documents/DocumentLibraryView';
import { TimetableView } from './components/timetable/TimetableView';
import { AssignmentsView } from './components/assignments/AssignmentsView';
import { NotesView } from './components/notes/NotesView';
import { RevisionView } from './components/revision/RevisionView';
import { CalendarView } from './components/calendar/CalendarView';
import { ExamsView } from './components/exams/ExamsView';
import { KnowledgeVaultView } from './components/knowledge/KnowledgeVaultView';
import { AIStudyView } from './components/ai/AIStudyView';
import { GoalsView } from './components/goals/GoalsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { FocusModeView } from './components/FocusModeView';
import { fetchUserNotifications } from './services/workplaceService';
import {
  BookOpen,
  LogOut,
  User,
  Search,
  Flame,
  Bell,
  Sparkles,
  Layers,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X,
  GraduationCap,
} from 'lucide-react';

function MainApp() {
  const { currentUser, userProfile, loading, logout } = useAuth();

  // Navigation route state
  const [currentRoute, setCurrentRoute] = useState<string>('/dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password' | 'about'>('login');
  const [regSuccessName, setRegSuccessName] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Sync route with browser hash for reliable navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash.startsWith('/')) {
        setCurrentRoute(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load notification count when authenticated
  useEffect(() => {
    if (!userProfile?.uid) return;
    const loadAlerts = async () => {
      try {
        const notifs = await fetchUserNotifications(userProfile.uid);
        setUnreadCount(notifs.filter((n) => !n.read).length);
      } catch (err) {
        console.error('Error checking notification count:', err);
      }
    };
    loadAlerts();
  }, [userProfile, currentRoute]);

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Loading Screen
  if (loading) {
    return (
      <LibraryBackground>
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="glass-panel rounded-2xl p-8 max-w-sm w-full flex flex-col items-center space-y-4 border border-cyan-500/30 shadow-2xl">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <BookOpen className="w-7 h-7 text-cyan-400 absolute inset-0 m-auto" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Loading your academic workspace...
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Authenticating with Google Firebase credentials
              </p>
            </div>
          </div>
        </div>
      </LibraryBackground>
    );
  }

  // 2. Unauthenticated Flow (Public Area)
  if (!currentUser) {
    return (
      <LibraryBackground>
        {/* Top Minimal Navigation Bar */}
        <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/10 glass-panel">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => {
              setAuthMode('login');
              navigateTo('/');
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white font-heading block">
                My Learning Hub
              </span>
              <span className="text-[10px] text-cyan-400 tracking-wider uppercase font-mono">
                Kenya Methodist University • Academic Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="header-about-btn"
              type="button"
              onClick={() => setAuthMode('about')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                authMode === 'about'
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              About Hub
            </button>
            <button
              id="header-signin-btn"
              type="button"
              onClick={() => setAuthMode('login')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              id="header-register-btn"
              type="button"
              onClick={() => setAuthMode('register')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-950 font-bold shadow-lg'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              }`}
            >
              Create Account
            </button>
          </div>
        </header>

        {/* Public Body */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto max-w-4xl mx-auto w-full">
          {/* Registration Success Notification */}
          {regSuccessName && (
            <div
              id="registration-success-banner"
              className="mb-6 max-w-md w-full p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm text-center animate-in fade-in"
            >
              <p className="font-semibold text-white">
                Account created successfully. Welcome to My Learning Hub, {regSuccessName}.
              </p>
              <p className="text-[11px] text-emerald-300 mt-1">
                Your profile has been created and verified in Cloud Firestore.
              </p>
            </div>
          )}

          {authMode === 'about' && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6 w-full animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Kenya Methodist University (KEMU)</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
                  My Learning Hub Academic Workspace
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                  An integrated digital library and private academic productivity ecosystem designed for KEMU students.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                    <MapPin className="w-4 h-4" />
                    <span>KEMU Timetable Integration</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Enter and track classes exactly as scheduled across KEMU Hub, KEMU Towers, or Online sessions with room numbers and conflict detection.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                    <Layers className="w-4 h-4" />
                    <span>Academic Lifecycle</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Complete assignment tracking, revision cards with confidence ratings, exam readiness countdowns, and Brian's Knowledge Vault.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Real Firebase Cloud Storage</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Every lecture note, uploaded document, timetable class, and goal persists reliably in Cloud Firestore under your verified student profile.
                  </p>
                </div>
              </div>

              <div className="flex justify-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Enter Workspace
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Create Student Account
                </button>
              </div>
            </div>
          )}

          {authMode === 'login' && (
            <LoginForm
              onSuccess={() => {
                navigateTo('/dashboard');
              }}
              onSwitchToRegister={() => {
                setRegSuccessName(null);
                setAuthMode('register');
              }}
              onForgotPassword={() => {
                setRegSuccessName(null);
                setAuthMode('forgot-password');
              }}
            />
          )}

          {authMode === 'register' && (
            <RegisterForm
              onSuccess={(name) => {
                setRegSuccessName(name);
                navigateTo('/dashboard');
              }}
              onSwitchToLogin={() => {
                setRegSuccessName(null);
                setAuthMode('login');
              }}
            />
          )}

          {authMode === 'forgot-password' && (
            <ForgotPasswordForm
              onBackToLogin={() => {
                setRegSuccessName(null);
                setAuthMode('login');
              }}
            />
          )}
        </main>
      </LibraryBackground>
    );
  }

  // 3. Authenticated Workspace Flow
  const effectiveRoute =
    currentRoute === '/' || currentRoute === '/login' || currentRoute === '/register'
      ? '/dashboard'
      : currentRoute;

  return (
    <LibraryBackground>
      {/* Top Header Bar */}
      <header className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/10 glass-panel sticky top-0 z-40">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => navigateTo('/dashboard')}
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white font-heading block">
              My Learning Hub
            </span>
            <span className="text-[9px] text-cyan-400 tracking-wider uppercase font-mono">
              Academic Library & Command Center
            </span>
          </div>
        </div>

        {/* Top Controls: Focus, Search, Notifications, Profile Pill, Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            id="top-focus-btn"
            type="button"
            onClick={() => navigateTo('/focus-mode')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold cursor-pointer transition-all"
            title="Open Focus Sanctuary"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Focus Sanctuary</span>
          </button>

          <button
            id="top-search-btn"
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl glass-input text-xs text-slate-300 hover:text-white hover:border-cyan-400/50 cursor-pointer"
            title="Global Academic Search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Search (Ctrl+K)</span>
          </button>

          <button
            id="top-notifications-btn"
            type="button"
            onClick={() => navigateTo('/notifications')}
            className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
              effectiveRoute === '/notifications'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 font-bold font-mono text-[9px] flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Pill */}
          <div
            id="top-profile-badge"
            onClick={() => navigateTo('/profile')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-cyan-400/40 cursor-pointer transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-[10px] text-cyan-300 font-bold">
              {userProfile?.fullName?.[0] || 'U'}
            </div>
            <span className="text-xs font-medium text-slate-200 hidden md:inline truncate max-w-[120px]">
              {userProfile?.fullName || 'Student'}
            </span>
          </div>

          {/* Logout Button */}
          <button
            id="top-logout-btn"
            type="button"
            onClick={async () => {
              await logout();
              navigateTo('/');
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Clock Command Center + Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Interactive Clock Command Center */}
        <section className="flex flex-col items-center justify-center py-2">
          <ClockNavigation
            currentRoute={effectiveRoute}
            onNavigate={navigateTo}
            onOpenSearch={() => setSearchModalOpen(true)}
          />
        </section>

        {/* Dynamic Page Views */}
        <section className="w-full">
          {effectiveRoute === '/dashboard' && <DashboardView onNavigate={navigateTo} />}
          {effectiveRoute === '/timetable' && <TimetableView onNavigate={navigateTo} />}
          {effectiveRoute === '/assignments' && <AssignmentsView onNavigate={navigateTo} />}
          {effectiveRoute === '/documents' && <DocumentLibraryView />}
          {effectiveRoute === '/notes' && <NotesView onNavigate={navigateTo} />}
          {effectiveRoute === '/revision' && <RevisionView onNavigate={navigateTo} />}
          {effectiveRoute === '/calendar' && <CalendarView onNavigate={navigateTo} />}
          {effectiveRoute === '/exams' && <ExamsView onNavigate={navigateTo} />}
          {effectiveRoute === '/knowledge-vault' && (
            <KnowledgeVaultView onNavigate={navigateTo} />
          )}
          {effectiveRoute === '/ai-study' && <AIStudyView onNavigate={navigateTo} />}
          {effectiveRoute === '/goals' && <GoalsView onNavigate={navigateTo} />}
          {effectiveRoute === '/notifications' && (
            <NotificationsView onNavigate={navigateTo} />
          )}
          {effectiveRoute === '/focus-mode' && <FocusModeView onNavigate={navigateTo} />}
          {effectiveRoute === '/settings' && <SettingsView />}
          {effectiveRoute === '/profile' && <ProfileView />}
        </section>
      </main>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={navigateTo}
      />
    </LibraryBackground>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
