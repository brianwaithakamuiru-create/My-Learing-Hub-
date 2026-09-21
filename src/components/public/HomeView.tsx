import React from 'react';
import {
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  GraduationCap,
  Layers,
  Clock,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (route: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col items-center text-center">
      {/* Hero Badge */}
      <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-6 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Academic Command Center & Study Library</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight max-w-2xl leading-tight">
        Master Your Academic Journey with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300">My Learning Hub</span>
      </h1>

      <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
        A personal study environment designed for students. Organize course timetables, deliverables, revision notes, and exam schedules with real-time Firebase synchronization.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
        <button
          id="home-create-account-btn"
          type="button"
          onClick={() => onNavigate('/register')}
          className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(34,211,238,0.35)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <span>Create Student Account</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          id="home-login-btn"
          type="button"
          onClick={() => onNavigate('/login')}
          className="w-full sm:w-auto px-7 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/20 text-white font-semibold text-sm transition-all flex items-center justify-center cursor-pointer"
        >
          <span>Sign In to Workspace</span>
        </button>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-cyan-400/40 transition-all">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white font-heading">Interactive Timetable & Hub</h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Orbit navigation clock, weekly schedule matrix, and countdowns to upcoming university lectures.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-indigo-400/40 transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white font-heading">Academic Deliverables</h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Track coursework deadlines, examination milestones, past revision papers, and study goals.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-400/40 transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white font-heading">Secure Cloud Sync</h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Integrated Firebase Authentication and encrypted private document storage scoped to your unique UID.
          </p>
        </div>
      </div>
    </div>
  );
};
