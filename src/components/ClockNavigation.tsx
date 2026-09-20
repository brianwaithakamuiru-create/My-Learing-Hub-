import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  FolderArchive,
  FileText,
  BookmarkCheck,
  Calendar,
  GraduationCap,
  Library,
  Sparkles,
  Target,
  User,
  Settings,
  Search,
  Bell,
  LogOut,
  Clock,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface ClockNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenSearch?: () => void;
}

interface NavItem {
  id: string;
  title: string;
  route: string;
  angle: number; // in degrees (0 = 12 o'clock, 90 = 3 o'clock, etc.)
  icon: React.ElementType;
  badge?: string;
}

export const ClockNavigation: React.FC<ClockNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenSearch,
}) => {
  const { userProfile, logout } = useAuth();
  const [centerOpen, setCenterOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Clock hands live update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => {
      clearInterval(timer);
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  // Calculate clock hand angles (0 deg = 12 o'clock)
  const seconds = currentTime.getSeconds();
  const minutes = currentTime.getMinutes();
  const hours = currentTime.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  // Orbit navigation items arranged around the 12-hour clock face:
  // 12 — Dashboard
  // 1 — Timetable
  // 2 — Assignments
  // 3 — Documents
  // 4 — Notes
  // 5 — Revision
  // 6 — Calendar
  // 7 — Exams
  // 8 — Knowledge Vault
  // 9 — AI Study
  // 10 — Goals
  // 11 — Profile
  const navItems: NavItem[] = [
    { id: 'dashboard', title: 'Dashboard', route: '/dashboard', angle: 0, icon: LayoutDashboard },
    { id: 'timetable', title: 'Timetable', route: '/timetable', angle: 30, icon: CalendarDays },
    { id: 'assignments', title: 'Assignments', route: '/assignments', angle: 60, icon: ClipboardCheck },
    { id: 'documents', title: 'Documents', route: '/documents', angle: 90, icon: FolderArchive },
    { id: 'notes', title: 'Notes', route: '/notes', angle: 120, icon: FileText },
    { id: 'revision', title: 'Revision', route: '/revision', angle: 150, icon: BookmarkCheck },
    { id: 'calendar', title: 'Calendar', route: '/calendar', angle: 180, icon: Calendar },
    { id: 'exams', title: 'Exams', route: '/exams', angle: 210, icon: GraduationCap },
    { id: 'knowledge', title: 'Knowledge Vault', route: '/knowledge', angle: 240, icon: Library },
    { id: 'ai-study', title: 'AI Study', route: '/ai-study', angle: 270, icon: Sparkles },
    { id: 'goals', title: 'Goals', route: '/goals', angle: 300, icon: Target },
    { id: 'profile', title: 'Profile', route: '/profile', angle: 330, icon: User },
  ];

  // Orbit radius
  const orbitRadius = 180; // px for desktop clock orbit
  const centerSize = 130; // px diameter

  const handleCenterClick = () => {
    setCenterOpen(!centerOpen);
  };

  const handleLogout = async () => {
    try {
      setCenterOpen(false);
      await logout();
      onNavigate('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <div
      id="clock-navigation-container"
      className="relative flex items-center justify-center p-4 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Desktop & Tablet Circular Clock Layout */}
      <div className="relative hidden md:flex items-center justify-center w-[440px] h-[440px] lg:w-[470px] lg:h-[470px]">
        {/* Subtle Outer Orbit Rings */}
        <div
          className="absolute inset-0 rounded-full border border-white/10 pointer-events-none transition-all duration-700"
          style={{
            borderColor: isHovered ? 'rgba(34, 211, 238, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            boxShadow: isHovered ? '0 0 35px rgba(34, 211, 238, 0.12)' : 'none',
          }}
        />
        <div className="absolute w-[360px] h-[360px] lg:w-[380px] lg:h-[380px] rounded-full border border-dashed border-white/10 pointer-events-none" />

        {/* Clock Hands Layer (placed behind navigation controls) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          {/* Hour Hand */}
          <div
            className="absolute w-[3px] h-[65px] bg-slate-400/70 rounded-full origin-bottom"
            style={{
              transform: `translateY(-32.5px) rotate(${hourDeg}deg)`,
              transition: 'transform 0.5s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
            }}
          />
          {/* Minute Hand */}
          <div
            className="absolute w-[2px] h-[95px] bg-cyan-400/80 rounded-full origin-bottom"
            style={{
              transform: `translateY(-47.5px) rotate(${minuteDeg}deg)`,
              transition: 'transform 0.5s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
            }}
          />
          {/* Second Hand */}
          <div
            className="absolute w-[1px] h-[110px] bg-sky-300/60 rounded-full origin-bottom"
            style={{
              transform: `translateY(-55px) rotate(${secondDeg}deg)`,
              transition: 'transform 0.2s linear',
            }}
          />
          {/* Center Pivot Pin */}
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-950/80 shadow-md" />
        </div>

        {/* Orbiting Nav Items */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
            !prefersReducedMotion && !isHovered ? 'animate-[spin_160s_linear_infinite]' : ''
          }`}
        >
          {navItems.map((item) => {
            const rad = (item.angle - 90) * (Math.PI / 180);
            const x = Math.cos(rad) * orbitRadius;
            const y = Math.sin(rad) * orbitRadius;
            const isActive = currentRoute === item.route;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="absolute flex flex-col items-center justify-center group pointer-events-auto"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                {/* Counter-rotation container so icons & labels ALWAYS stay completely upright */}
                <div
                  className={`flex flex-col items-center justify-center ${
                    !prefersReducedMotion && !isHovered ? 'animate-[spin_160s_linear_infinite_reverse]' : ''
                  }`}
                >
                  <button
                    id={`clock-nav-${item.id}`}
                    type="button"
                    onClick={() => {
                      onNavigate(item.route);
                      setCenterOpen(false);
                    }}
                    title={item.title}
                    className={`relative flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'w-12 h-12 bg-cyan-500/25 border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.45)] text-cyan-300 scale-110'
                        : 'w-10 h-10 bg-slate-900/80 hover:bg-slate-800/90 border border-white/15 hover:border-cyan-400/60 text-slate-300 hover:text-cyan-300 hover:scale-110 shadow-lg'
                    }`}
                  >
                    <Icon className={isActive ? 'w-5 h-5' : 'w-4 h-4'} />
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
                    )}
                  </button>

                  {/* Label - Counter-rotated and always upright */}
                  <span
                    className={`mt-1.5 px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap rounded-md pointer-events-none transition-all duration-200 ${
                      isActive
                        ? 'text-cyan-300 font-semibold bg-slate-950/80 border border-cyan-500/30'
                        : 'text-slate-300 group-hover:text-cyan-200 bg-slate-950/60 border border-white/5 opacity-85 group-hover:opacity-100'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Stationary Hub */}
        <div
          className="relative z-20 flex flex-col items-center justify-center cursor-pointer group"
          onClick={handleCenterClick}
        >
          <div
            id="clock-hub-center"
            className={`flex flex-col items-center justify-center rounded-full text-center p-3 transition-all duration-300 backdrop-blur-xl ${
              centerOpen
                ? 'bg-slate-900/95 border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.35)]'
                : 'bg-slate-950/85 hover:bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 shadow-2xl'
            }`}
            style={{ width: `${centerSize}px`, height: `${centerSize}px` }}
          >
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs mb-1">
              {userProfile?.fullName
                ? userProfile.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'LH'}
            </div>
            <span className="text-[11px] font-bold tracking-wider text-slate-100 uppercase font-heading">
              My Learning Hub
            </span>
            <span className="text-[9px] text-cyan-400 font-medium tracking-wide mt-0.5">
              {centerOpen ? 'Close Menu' : 'Command Hub'}
            </span>
          </div>

          {/* Center Command Popup Menu */}
          {centerOpen && (
            <div
              id="clock-hub-menu"
              className="absolute top-[140px] w-56 glass-panel rounded-xl p-2 z-50 shadow-2xl border border-cyan-500/30 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {userProfile?.fullName || 'Academic Student'}
                </p>
                <p className="text-[10px] text-cyan-400 font-mono truncate">
                  @{userProfile?.username || 'user'} • {userProfile?.role || 'student'}
                </p>
              </div>

              <div className="space-y-1">
                <button
                  id="hub-menu-search"
                  onClick={() => {
                    setCenterOpen(false);
                    onOpenSearch?.();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Search Knowledge</span>
                </button>

                <button
                  id="hub-menu-notifications"
                  onClick={() => {
                    setCenterOpen(false);
                    onNavigate('/notifications');
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-rose-400" />
                  <span>Notifications & Alerts</span>
                </button>

                <button
                  id="hub-menu-focus"
                  onClick={() => {
                    setCenterOpen(false);
                    onNavigate('/focus-mode');
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-amber-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Focus Sanctuary</span>
                </button>

                <button
                  id="hub-menu-profile"
                  onClick={() => {
                    setCenterOpen(false);
                    onNavigate('/profile');
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>Academic Profile</span>
                </button>

                <button
                  id="hub-menu-settings"
                  onClick={() => {
                    setCenterOpen(false);
                    onNavigate('/settings');
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Library & Wallpaper Settings</span>
                </button>

                <div className="border-t border-white/10 my-1" />

                <button
                  id="hub-menu-logout"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Radial / Grid Alternative */}
      <div className="flex md:hidden flex-col items-center w-full max-w-sm">
        {/* Central Hub Button */}
        <div
          onClick={handleCenterClick}
          className="flex items-center justify-between w-full px-4 py-3 glass-panel rounded-xl mb-3 cursor-pointer border border-cyan-500/30 shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 font-bold text-xs">
              {userProfile?.fullName?.[0] || 'L'}
            </div>
            <div className="text-left">
              <span className="block text-xs font-bold font-heading text-slate-100">
                My Learning Hub
              </span>
              <span className="text-[10px] text-cyan-400">Command Center</span>
            </div>
          </div>
          <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
        </div>

        {/* Mobile Grid Menu with upright labels */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {navItems.map((item) => {
            const isActive = currentRoute === item.route;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => onNavigate(item.route)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'bg-slate-900/70 border-white/10 text-slate-300 hover:bg-slate-800/80 hover:text-cyan-300'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium tracking-tight truncate w-full text-center">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
