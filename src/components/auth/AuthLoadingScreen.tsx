import React from 'react';
import { BookOpen, Loader2 } from 'lucide-react';

export const AuthLoadingScreen: React.FC = () => {
  return (
    <div
      id="auth-loading-screen"
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm w-full backdrop-blur-2xl relative overflow-hidden animate-in fade-in duration-300">
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-5 shadow-[0_0_25px_rgba(34,211,238,0.3)] relative">
          <BookOpen className="w-8 h-8 text-cyan-400" />
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
        </div>

        {/* Typography */}
        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block font-mono">
          MY LEARNING HUB
        </span>
        <h2 className="text-xl font-bold tracking-tight text-white font-heading mt-1">
          Loading your workspace...
        </h2>
        <p className="text-xs text-slate-400 mt-2">
          Verifying security credentials and synchronizing records
        </p>

        {/* Spinner */}
        <div className="mt-6 flex items-center space-x-2 text-cyan-400 text-xs font-mono">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Synchronizing...</span>
        </div>
      </div>
    </div>
  );
};
