import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Globe,
  GraduationCap,
  Calendar,
  Sparkles,
  CheckCircle2,
  Save,
  Clock,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { userProfile, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    username: userProfile?.username || '',
    country: userProfile?.country || 'Kenya',
    academicYear: userProfile?.academicYear || 'Year 3 (2026/2027)',
    currentSemester: userProfile?.currentSemester || 'Trimester 2 - 2026',
    avatarUrl: userProfile?.avatarUrl || '',
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || '',
        username: userProfile.username || '',
        country: userProfile.country || 'Kenya',
        academicYear: userProfile.academicYear || 'Year 3 (2026/2027)',
        currentSemester: userProfile.currentSemester || 'Trimester 2 - 2026',
        avatarUrl: userProfile.avatarUrl || '',
      });
    }
  }, [userProfile]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await updateProfile({
        fullName: formData.fullName.trim(),
        username: formData.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        country: formData.country.trim(),
        academicYear: formData.academicYear.trim(),
        currentSemester: formData.currentSemester.trim(),
        avatarUrl: formData.avatarUrl.trim(),
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update student profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Profile Overview Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
          {/* Avatar / Profile Initial */}
          <div className="relative group">
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.fullName}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.3)]"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-indigo-600 flex items-center justify-center text-slate-950 font-bold text-3xl shadow-[0_0_30px_rgba(34,211,238,0.35)] border border-cyan-400/50">
                {userProfile?.fullName
                  ? userProfile.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'BM'}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-slate-900 border border-cyan-400/60 flex items-center justify-center text-cyan-400 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Core Student Info */}
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white font-heading tracking-tight">
                  {userProfile?.fullName || 'Brian Waithaka Muiru'}
                </h2>
                <div className="flex items-center justify-center sm:justify-start space-x-2 mt-0.5">
                  <span className="text-xs text-cyan-400 font-mono">
                    @{userProfile?.username || 'brian_muiru'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-slate-400">Personal Student Workspace</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 justify-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Active Scholar
                </span>
                <button
                  id="profile-edit-toggle-btn"
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 transition-all cursor-pointer"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>

            {/* Student Attributes Grid */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-3 text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-white/5">
                <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Academic Year</span>
                  <span className="font-medium text-slate-200">{userProfile?.academicYear || 'Year 3 (2026/2027)'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-white/5">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Current Semester</span>
                  <span className="font-medium text-slate-200">{userProfile?.currentSemester || 'Trimester 2 - 2026'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-white/5">
                <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Country / Region</span>
                  <span className="font-medium text-slate-200">{userProfile?.country || 'Kenya'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-white/5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Student Email</span>
                  <span className="font-medium text-slate-200 truncate block max-w-[180px]">{userProfile?.email || 'brianwaithakamuiru@gmail.com'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Profile settings updated and stored successfully!</span>
          </div>
        )}
      </div>

      {/* Profile Edit Form */}
      {isEditing && (
        <form
          id="student-profile-form"
          onSubmit={handleSave}
          className="glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl space-y-5 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <User className="w-5 h-5" />
              <h3 className="text-base font-bold text-white font-heading">
                Configure Student Profile
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Changes save instantly to your personal workspace
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Full Name <span className="text-cyan-400">*</span>
              </label>
              <input
                id="profile-fullname-input"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
                placeholder="e.g. Brian Waithaka Muiru"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Username <span className="text-cyan-400">*</span>
              </label>
              <input
                id="profile-username-input"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                placeholder="e.g. brian_muiru"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Country / Academic Location
              </label>
              <input
                id="profile-country-input"
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
                placeholder="e.g. Kenya"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Academic Year
              </label>
              <input
                id="profile-academic-year-input"
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
                placeholder="e.g. Year 3 (2026/2027)"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Current Semester / Trimester
              </label>
              <input
                id="profile-semester-input"
                type="text"
                value={formData.currentSemester}
                onChange={(e) => setFormData({ ...formData, currentSemester: e.target.value })}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
                placeholder="e.g. Trimester 2 - 2026"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Profile Avatar URL (Optional)
              </label>
              <div className="relative">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  id="profile-avatar-input"
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full glass-input pl-9 pr-3.5 py-2.5 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
            <button
              id="profile-cancel-btn"
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="profile-save-btn"
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:opacity-95 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Academic Workspace Architecture Card */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center space-x-2.5 text-slate-200">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">
            Academic Workspace System Details
          </h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          My Learning Hub operates as your personal desktop-style academic system. Your timetable,
          course units, documents, assignments, notes, flashcards, exams, and knowledge archives are
          all directly mapped to your active academic profile.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Workspace ID</span>
            <span className="text-xs text-cyan-300 font-mono font-medium truncate block mt-0.5">
              {userProfile?.uid || 'brian_academic_hub'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Access Mode</span>
            <span className="text-xs text-emerald-400 font-medium block mt-0.5 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Direct Personal Access
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Institution Hub</span>
            <span className="text-xs text-slate-300 font-medium block mt-0.5">
              KEMU Towers & Campus
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
