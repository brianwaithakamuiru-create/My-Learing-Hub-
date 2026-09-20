import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Globe, Shield, Calendar, Award, CheckCircle2 } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-sky-600 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-[0_0_25px_rgba(34,211,238,0.3)]">
            {userProfile?.fullName
              ? userProfile.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'AC'}
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-white font-heading">
                  {userProfile?.fullName || 'Academic Student'}
                </h2>
                <p className="text-xs text-cyan-400 font-mono">
                  @{userProfile?.username || 'scholar'}
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {userProfile?.accountStatus || 'ACTIVE'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">{userProfile?.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{userProfile?.country || 'International'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="capitalize">Role: {userProfile?.role || 'student'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Joined {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : '2026'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-3">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Permanent Firebase Credentials
        </h3>
        <p className="text-xs text-slate-400">
          Your unique academic profile identifier tied to Google Firebase Authentication and Cloud Firestore:
        </p>
        <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 border border-white/10 select-all overflow-x-auto">
          {userProfile?.uid}
        </div>
      </div>
    </div>
  );
};
