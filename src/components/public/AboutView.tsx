import React from 'react';
import { BookOpen, ShieldCheck, GraduationCap, ArrowRight, Library, CheckCircle } from 'lucide-react';

interface AboutViewProps {
  onNavigate: (route: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">
              ACADEMIC ECOSYSTEM
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">
              About My Learning Hub
            </h1>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            <strong className="text-white">My Learning Hub</strong> is a personal academic productivity and knowledge management workspace designed specifically for higher education coursework. It combines an immersive library aesthetic with real-time academic schedule tracking.
          </p>
          <p>
            Engineered with a real Firebase cloud backend, each registered student receives their own private cloud partition where coursework, personal revision notes, lecture schedules, and examination countdowns are persisted safely.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <h2 className="text-sm font-bold text-white font-heading mb-4">Core Academic Capabilities:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              '12-Hour Orbit Clock Navigation Hub',
              'Lecture Timetable Matrix & Countdown Alerts',
              'Coursework Deliverables & Milestone Tracking',
              'Document Vault with PDF & Resource Storage',
              'Revision Flashcards & Knowledge Vault',
              'Distraction-Free Focus Sanctuary Timer',
              'AI Study Assistant Grounded in Course Content',
              'Real-Time Firebase Authentication & Security',
            ].map((cap, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            Ready to organize your trimester?
          </span>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              id="about-create-account-btn"
              type="button"
              onClick={() => onNavigate('/register')}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="about-login-btn"
              type="button"
              onClick={() => onNavigate('/login')}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-white/20 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
