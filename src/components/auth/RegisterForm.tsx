import React, { useState, useEffect } from 'react';
import { useAuth, mapFirebaseAuthError } from '../../context/AuthContext';
import {
  User,
  Mail,
  AtSign,
  Globe,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  LogIn,
} from 'lucide-react';

interface RegisterFormProps {
  initialEmail?: string;
  onSuccess: (fullName: string) => void;
  onSwitchToLogin: (email?: string) => void;
  onForgotPassword?: (email?: string) => void;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  country?: string;
  academicYear?: string;
  semester?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  initialEmail = '',
  onSuccess,
  onSwitchToLogin,
  onForgotPassword,
}) => {
  const { registerUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [country, setCountry] = useState('Kenya');
  const [academicYear, setAcademicYear] = useState('Year 3 (2026/2027)');
  const [semester, setSemester] = useState('Trimester 2 - 2026');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdName, setCreatedName] = useState('');

  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let strengthScore = 0;
  if (password.length >= 6) strengthScore++;
  if (hasMinLength) strengthScore++;
  if (hasUppercase && hasLowercase) strengthScore++;
  if (hasNumber) strengthScore++;
  if (hasSpecial) strengthScore++;

  const getStrengthLabel = () => {
    if (!password) return { text: '', color: 'bg-transparent', textColor: 'text-slate-500' };
    if (strengthScore <= 2) return { text: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-400' };
    if (strengthScore <= 3) return { text: 'Moderate', color: 'bg-amber-500', textColor: 'text-amber-400' };
    return { text: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
  };

  const strength = getStrengthLabel();

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Full name
    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter a valid full name.';
    }

    // Username
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      newErrors.username = 'Username is required.';
    } else if (cleanUsername.length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores.';
    }

    // Email
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Country
    if (!country.trim()) {
      newErrors.country = 'Country is required.';
    }

    // Academic Year
    if (!academicYear.trim()) {
      newErrors.academicYear = 'Current academic year is required.';
    }

    // Semester
    if (!semester.trim()) {
      newErrors.semester = 'Current semester is required.';
    }

    // Password
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const cleanEmail = email.trim().toLowerCase();

    try {
      // Execute REAL Firebase Registration + Firestore creation + Transactional Username Claim
      const profile = await registerUser({
        fullName: fullName.trim(),
        username: username.trim(),
        email: cleanEmail,
        password,
        country: country.trim(),
        academicYear: academicYear.trim(),
        semester: semester.trim(),
      });

      setCreatedName(profile.fullName);
      setIsSuccess(true);
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';

      const fieldErrors: FormErrors = {};

      if (code === 'auth/email-already-in-use') {
        fieldErrors.email = 'An account with this email already exists.';
        fieldErrors.general = 'An account with this email address is already registered in My Learning Hub. Would you like to sign in instead or reset your password?';
      } else if (code === 'auth/weak-password') {
        fieldErrors.password = 'Please choose a stronger password (at least 8 characters).';
      } else if (code === 'auth/invalid-email') {
        fieldErrors.email = 'Please enter a valid email address.';
      } else if (
        msg.includes('Username already taken') ||
        msg === 'USERNAME_TAKEN'
      ) {
        fieldErrors.username = 'Username already taken. Please choose another username.';
      } else {
        fieldErrors.general = mapFirebaseAuthError(err);
      }

      setErrors(fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If registration succeeded, show polished success state before entering dashboard
  if (isSuccess) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 text-center border border-emerald-500/40 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-in zoom-in-90 duration-300">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block font-mono">
            VERIFIED REGISTRATION
          </span>

          <h2 className="text-2xl font-bold tracking-tight text-white font-heading mt-1">
            Account Created Successfully
          </h2>

          <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
            Welcome, <span className="font-semibold text-white">{createdName}</span>! Your personal academic workspace is active and your username has been secured in the database.
          </p>

          <div className="my-5 p-4 rounded-xl bg-slate-900/80 border border-white/10 text-left text-xs text-slate-300 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Email Verification Notice</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              A verification link has been sent to <span className="text-slate-200 font-medium">{email}</span>. You can access your workspace immediately, and verify your email at any time from your profile.
            </p>
          </div>

          <button
            id="register-continue-dashboard-btn"
            type="button"
            onClick={() => onSuccess(createdName)}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Enter Academic Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl">
        {/* Subtle ambient light aura */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 mb-3 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <UserPlus className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block font-mono">
            MY LEARNING HUB
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading mt-1">
            Create Your Account
          </h1>
          <p className="text-xs text-slate-300 mt-1.5">
            Join the academic workspace to synchronize timetables, deliverables, and revision notes
          </p>
        </div>

        {/* General Error Banner */}
        {errors.general && (
          <div
            id="register-general-error"
            className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs animate-in fade-in duration-200"
          >
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <p className="font-semibold text-red-200">{errors.general}</p>
                {errors.general.includes('already') && (
                  <div className="mt-2.5 pt-2 border-t border-red-500/25 flex flex-wrap items-center gap-3">
                    <button
                      id="register-error-login-btn"
                      type="button"
                      onClick={() => onSwitchToLogin(email.trim().toLowerCase())}
                      className="text-[11px] text-cyan-300 hover:text-cyan-200 font-semibold underline underline-offset-2 cursor-pointer inline-flex items-center space-x-1"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Log in to this account</span>
                    </button>
                    {onForgotPassword && (
                      <>
                        <span className="text-red-400/50">•</span>
                        <button
                          id="register-error-reset-btn"
                          type="button"
                          onClick={() => onForgotPassword(email.trim().toLowerCase())}
                          className="text-[11px] text-cyan-300 hover:text-cyan-200 font-semibold underline underline-offset-2 cursor-pointer inline-flex items-center space-x-1"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Reset password</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="register-fullname"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="register-fullname"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                  }}
                  placeholder="e.g. Brian Waithaka Muiru"
                  className={`w-full glass-input text-white text-sm rounded-xl pl-10 pr-4 py-2.5 placeholder:text-slate-500 disabled:opacity-50 transition-all border ${
                    errors.fullName ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 inline shrink-0" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            {/* Unique Username */}
            <div>
              <label
                htmlFor="register-username"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <AtSign className="w-4 h-4" />
                </div>
                <input
                  id="register-username"
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  disabled={isSubmitting}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    if (errors.username) setErrors({ ...errors, username: undefined });
                  }}
                  placeholder="e.g. brian_muiru"
                  className={`w-full glass-input text-white text-sm rounded-xl pl-10 pr-4 py-2.5 placeholder:text-slate-500 disabled:opacity-50 transition-all border ${
                    errors.username ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400'
                  }`}
                />
              </div>
              {errors.username ? (
                <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 inline shrink-0" />
                  <span>{errors.username}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Unique handle (letters, numbers, underscore)
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                disabled={isSubmitting}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="name@university.edu"
                className={`w-full glass-input text-white text-sm rounded-xl pl-10 pr-4 py-2.5 placeholder:text-slate-500 disabled:opacity-50 transition-all border ${
                  errors.email ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400'
                }`}
              />
            </div>
            {errors.email && (
              <div className="text-[11px] text-red-400 mt-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <span className="flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 inline shrink-0" />
                  <span>{errors.email}</span>
                </span>
                {errors.email.includes('already') && (
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSwitchToLogin(email.trim().toLowerCase())}
                      className="text-cyan-300 hover:text-cyan-200 underline font-semibold cursor-pointer"
                    >
                      Log In →
                    </button>
                    {onForgotPassword && (
                      <>
                        <span className="text-red-400/50">•</span>
                        <button
                          type="button"
                          onClick={() => onForgotPassword(email.trim().toLowerCase())}
                          className="text-slate-300 hover:text-white underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Country */}
            <div>
              <label
                htmlFor="register-country"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Country *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <input
                  id="register-country"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    if (errors.country) setErrors({ ...errors, country: undefined });
                  }}
                  placeholder="e.g. Kenya"
                  className="w-full glass-input text-white text-xs rounded-xl pl-9 pr-3 py-2.5 border border-white/10 focus:border-cyan-400 placeholder:text-slate-500"
                />
              </div>
              {errors.country && (
                <p className="text-[10px] text-red-400 mt-1">{errors.country}</p>
              )}
            </div>

            {/* Academic Year */}
            <div>
              <label
                htmlFor="register-academic-year"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Academic Year *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <input
                  id="register-academic-year"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={academicYear}
                  onChange={(e) => {
                    setAcademicYear(e.target.value);
                    if (errors.academicYear) setErrors({ ...errors, academicYear: undefined });
                  }}
                  placeholder="Year 3 (2026/2027)"
                  className="w-full glass-input text-white text-xs rounded-xl pl-9 pr-3 py-2.5 border border-white/10 focus:border-cyan-400 placeholder:text-slate-500"
                />
              </div>
              {errors.academicYear && (
                <p className="text-[10px] text-red-400 mt-1">{errors.academicYear}</p>
              )}
            </div>

            {/* Semester */}
            <div>
              <label
                htmlFor="register-semester"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Current Semester *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  id="register-semester"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={semester}
                  onChange={(e) => {
                    setSemester(e.target.value);
                    if (errors.semester) setErrors({ ...errors, semester: undefined });
                  }}
                  placeholder="Trimester 2 - 2026"
                  className="w-full glass-input text-white text-xs rounded-xl pl-9 pr-3 py-2.5 border border-white/10 focus:border-cyan-400 placeholder:text-slate-500"
                />
              </div>
              {errors.semester && (
                <p className="text-[10px] text-red-400 mt-1">{errors.semester}</p>
              )}
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="register-password"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                >
                  Password *
                </label>
                {password && (
                  <span className={`text-[10px] font-semibold ${strength.textColor}`}>
                    {strength.text}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="••••••••"
                  className={`w-full glass-input text-white text-sm rounded-xl pl-10 pr-11 py-2.5 placeholder:text-slate-500 disabled:opacity-50 transition-all border ${
                    errors.password ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400'
                  }`}
                />
                <button
                  type="button"
                  id="register-toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Indicator Bar */}
              {password && (
                <div className="mt-2 flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        lvl <= strengthScore ? strength.color : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              )}

              {errors.password && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 inline shrink-0" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  placeholder="••••••••"
                  className={`w-full glass-input text-white text-sm rounded-xl pl-10 pr-11 py-2.5 placeholder:text-slate-500 disabled:opacity-50 transition-all border ${
                    errors.confirmPassword ? 'border-red-500/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400'
                  }`}
                />
                <button
                  type="button"
                  id="register-toggle-confirm-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 inline shrink-0" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="register-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Creating Account in Firebase...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch to login */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center relative z-10">
          <p className="text-xs text-slate-300">
            Already have an account?{' '}
            <button
              id="register-switch-to-login-btn"
              type="button"
              onClick={() => onSwitchToLogin(email.trim().toLowerCase())}
              disabled={isSubmitting}
              className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer ml-1 hover:underline"
            >
              Sign In Instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
