import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryBackground } from './components/LibraryBackground';
import { ClockNavigation } from './components/ClockNavigation';
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
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { AuthLoadingScreen } from './components/auth/AuthLoadingScreen';
import { HomeView } from './components/public/HomeView';
import { AboutView } from './components/public/AboutView';
import { fetchUserNotifications } from './services/workplaceService';
import {
  BookOpen,
  Search,
  Flame,
  Bell,
  Sparkles,
  LogOut,
  UserPlus,
  LogIn,
  Home,
  Info,
} from 'lucide-react';

const PROTECTED_ROUTES = new Set([
  '/dashboard',
  '/timetable',
  '/classes',
  '/assignments',
  '/documents',
  '/notes',
  '/revision',
  '/calendar',
  '/exams',
  '/knowledge',
  '/knowledge-vault',
  '/ai-study',
  '/goals',
  '/notifications',
  '/focus-mode',
  '/profile',
  '/settings',
]);

function MainApp() {
  const { currentUser, userProfile, loading, logout } = useAuth();

  // Route state
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash && hash.startsWith('/') ? hash : '/';
  });

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [authEmailPrefill, setAuthEmailPrefill] = useState<string>('');

  // Sync route with browser hash for bookmarking & navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash.startsWith('/')) {
        setCurrentRoute(hash);
      } else {
        setCurrentRoute(currentUser ? '/dashboard' : '/');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentUser]);

  // Route Guard & Protection Logic
  useEffect(() => {
    if (loading) return;

    if (currentUser) {
      // Authenticated users should not see auth forms or landing page
      if (
        currentRoute === '/' ||
        currentRoute === '/home' ||
        currentRoute === '/login' ||
        currentRoute === '/register' ||
        currentRoute === '/forgot-password'
      ) {
        setCurrentRoute('/dashboard');
        window.location.hash = '/dashboard';
      }
    } else {
      // Unauthenticated users trying to access protected routes must be redirected to /login
      if (PROTECTED_ROUTES.has(currentRoute)) {
        setCurrentRoute('/login');
        window.location.hash = '/login';
      }
    }
  }, [currentUser, loading, currentRoute]);

  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (currentUser) {
          setSearchModalOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  // Load notification count in background for authenticated users
  useEffect(() => {
    if (!currentUser || !userProfile?.uid) return;
    const loadAlerts = async () => {
      try {
        const notifs = await fetchUserNotifications(userProfile.uid);
        setUnreadCount(notifs.filter((n) => !n.read).length);
      } catch (err) {
        console.error('Error checking notification count:', err);
      }
    };
    loadAlerts();
  }, [currentUser, userProfile, currentRoute]);

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigateTo('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 1. Loading screen while Firebase verifies initial authentication
  if (loading) {
    return (
      <LibraryBackground>
        <AuthLoadingScreen />
      </LibraryBackground>
    );
  }

  // 2. Unauthenticated Layout
  if (!currentUser) {
    return (
      <LibraryBackground>
        {/* Unauthenticated Header Bar */}
        <header className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/10 glass-panel sticky top-0 z-40">
          <div
            id="brand-logo-unauth"
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigateTo('/')}
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white font-heading block">
                My Learning Hub
              </span>
              <span className="text-[9px] text-cyan-400 tracking-wider uppercase font-mono">
                Academic Command Center
              </span>
            </div>
          </div>

          {/* Unauthenticated Navigation Links: Home, About, Login, Create Account */}
          <nav className="flex items-center space-x-1 sm:space-x-3">
            <button
              id="nav-unauth-home"
              type="button"
              onClick={() => navigateTo('/')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentRoute === '/' || currentRoute === '/home'
                  ? 'text-cyan-400 bg-white/5'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </button>

            <button
              id="nav-unauth-about"
              type="button"
              onClick={() => navigateTo('/about')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentRoute === '/about'
                  ? 'text-cyan-400 bg-white/5'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">About</span>
            </button>

            <button
              id="nav-unauth-login"
              type="button"
              onClick={() => navigateTo('/login')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentRoute === '/login'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                  : 'bg-slate-900/80 border border-white/10 text-slate-200 hover:text-white hover:border-white/30'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>

            <button
              id="nav-unauth-register"
              type="button"
              onClick={() => navigateTo('/register')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 text-xs font-bold shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create Account</span>
              <span className="sm:hidden">Sign Up</span>
            </button>
          </nav>
        </header>

        {/* Unauthenticated Pages Content */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          {(currentRoute === '/' || currentRoute === '/home') && (
            <HomeView onNavigate={navigateTo} />
          )}

          {currentRoute === '/about' && (
            <AboutView onNavigate={navigateTo} />
          )}

          {currentRoute === '/login' && (
            <LoginForm
              initialEmail={authEmailPrefill}
              onSuccess={() => navigateTo('/dashboard')}
              onSwitchToRegister={(em) => {
                if (em) setAuthEmailPrefill(em);
                navigateTo('/register');
              }}
              onForgotPassword={(em) => {
                if (em) setAuthEmailPrefill(em);
                navigateTo('/forgot-password');
              }}
            />
          )}

          {currentRoute === '/register' && (
            <RegisterForm
              initialEmail={authEmailPrefill}
              onSuccess={() => navigateTo('/dashboard')}
              onSwitchToLogin={(em) => {
                if (em) setAuthEmailPrefill(em);
                navigateTo('/login');
              }}
              onForgotPassword={(em) => {
                if (em) setAuthEmailPrefill(em);
                navigateTo('/forgot-password');
              }}
            />
          )}

          {currentRoute === '/forgot-password' && (
            <ForgotPasswordForm
              initialEmail={authEmailPrefill}
              onBackToLogin={(em) => {
                if (em) setAuthEmailPrefill(em);
                navigateTo('/login');
              }}
            />
          )}
        </main>
      </LibraryBackground>
    );
  }

  // 3. Authenticated Layout
  return (
    <LibraryBackground>
      {/* Top Header Bar */}
      <header className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/10 glass-panel sticky top-0 z-40">
        <div
          id="brand-logo-auth"
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => navigateTo('/dashboard')}
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
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

        {/* Top Controls: Focus Sanctuary, AI Study, Search, Notifications, Profile Pill, Logout */}
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
            id="top-ai-study-btn"
            type="button"
            onClick={() => navigateTo('/ai-study')}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold cursor-pointer transition-all"
            title="AI Study Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Study</span>
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
              currentRoute === '/notifications'
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
            title="Student Profile Configuration"
          >
            <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-[10px] text-cyan-300 font-bold">
              {userProfile?.fullName?.[0] || 'S'}
            </div>
            <span className="text-xs font-medium text-slate-200 hidden md:inline truncate max-w-[130px]">
              {userProfile?.fullName || 'Scholar'}
            </span>
          </div>

          {/* Prominent Working Logout Button */}
          <button
            id="top-logout-btn"
            type="button"
            onClick={handleLogout}
            className="flex items-center space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-400 text-rose-300 text-xs font-semibold cursor-pointer transition-all"
            title="Sign Out of Academic Workspace"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Clock Command Center + Dynamic Workspace Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Interactive Clock Command Center */}
        <section className="flex flex-col items-center justify-center py-2">
          <ClockNavigation
            currentRoute={currentRoute}
            onNavigate={navigateTo}
            onOpenSearch={() => setSearchModalOpen(true)}
          />
        </section>

        {/* Dynamic Page Views */}
        <section className="w-full">
          {currentRoute === '/dashboard' && <DashboardView onNavigate={navigateTo} />}
          {currentRoute === '/timetable' && <TimetableView onNavigate={navigateTo} />}
          {currentRoute === '/classes' && <TimetableView onNavigate={navigateTo} />}
          {currentRoute === '/assignments' && <AssignmentsView onNavigate={navigateTo} />}
          {currentRoute === '/documents' && <DocumentLibraryView />}
          {currentRoute === '/notes' && <NotesView onNavigate={navigateTo} />}
          {currentRoute === '/revision' && <RevisionView onNavigate={navigateTo} />}
          {currentRoute === '/calendar' && <CalendarView onNavigate={navigateTo} />}
          {currentRoute === '/exams' && <ExamsView onNavigate={navigateTo} />}
          {(currentRoute === '/knowledge' || currentRoute === '/knowledge-vault') && (
            <KnowledgeVaultView onNavigate={navigateTo} />
          )}
          {currentRoute === '/ai-study' && <AIStudyView onNavigate={navigateTo} />}
          {currentRoute === '/goals' && <GoalsView onNavigate={navigateTo} />}
          {currentRoute === '/notifications' && (
            <NotificationsView onNavigate={navigateTo} />
          )}
          {currentRoute === '/focus-mode' && <FocusModeView onNavigate={navigateTo} />}
          {currentRoute === '/settings' && <SettingsView />}
          {currentRoute === '/profile' && <ProfileView />}
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
