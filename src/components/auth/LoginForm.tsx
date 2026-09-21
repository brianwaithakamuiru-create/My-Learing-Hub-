import React, { useState, useEffect } from 'react';
import { useAuth, mapFirebaseAuthError } from '../../context/AuthContext';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  BookOpen,
  AlertCircle,
  Check,
  KeyRound,
  UserPlus,
} from 'lucide-react';

interface LoginFormProps {
  initialEmail?: string;
  onSuccess: () => void;
  onSwitchToRegister: (email?: string) => void;
  onForgotPassword: (email?: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  initialEmail = '',
  onSuccess,
  onSwitchToRegister,
  onForgotPassword,
}) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorCode('validation/missing-email');
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorCode('validation/invalid-email');
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorCode('validation/missing-password');
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage(null);
    setErrorCode(null);
    setIsSubmitting(true);

    try {
      // Execute REAL Firebase Authentication
      await signIn(cleanEmail, password, rememberMe);
      onSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      setErrorCode(code);
      const friendly = mapFirebaseAuthError(err);
      setErrorMessage(friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCredentialError =
    errorCode === 'auth/invalid-credential' ||
    errorCode === 'auth/wrong-password' ||
    errorCode === 'auth/user-not-found';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl">
        {/* Subtle ambient light aura */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header matching exact layout specification */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 mb-3 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block font-mono">
            MY LEARNING HUB
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading mt-1">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-300 mt-1.5">
            Sign in to access your personal academic workspace
          </p>
        </div>

        {/* Error Alert with Friendly Clear Text & Recovery Actions */}
        {errorMessage && (
          <div
            id="login-error-alert"
            className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs animate-in fade-in duration-200"
          >
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <p className="font-semibold text-red-200">{errorMessage}</p>
                {isCredentialError && (
                  <div className="mt-2.5 pt-2 border-t border-red-500/25 flex flex-col sm:flex-row sm:items-center gap-2">
                    <button
                      id="login-error-reset-link"
                      type="button"
                      onClick={() => onForgotPassword(email.trim())}
                      className="text-[11px] text-cyan-300 hover:text-cyan-200 font-semibold underline underline-offset-2 cursor-pointer inline-flex items-center space-x-1"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Reset password</span>
                    </button>
                    <span className="hidden sm:inline text-red-400/50">•</span>
                    <button
                      id="login-error-register-link"
                      type="button"
                      onClick={() => onSwitchToRegister(email.trim())}
                      className="text-[11px] text-cyan-300 hover:text-cyan-200 font-semibold underline underline-offset-2 cursor-pointer inline-flex items-center space-x-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Create new account</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label
              htmlFor="signin-email"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="signin-email"
                type="email"
                required
                autoComplete="email"
                disabled={isSubmitting}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="name@university.edu"
                className="w-full glass-input text-white text-sm rounded-xl pl-10 pr-4 py-2.5 placeholder:text-slate-500 disabled:opacity-50 transition-all border border-white/10 focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signin-password"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                disabled={isSubmitting}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••"
                className="w-full glass-input text-white text-sm rounded-xl pl-10 pr-11 py-2.5 placeholder:text-slate-500 disabled:opacity-50 transition-all border border-white/10 focus:border-cyan-400"
              />
              <button
                type="button"
                id="signin-toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label
              htmlFor="remember-me-checkbox"
              className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none"
            >
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  rememberMe
                    ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                    : 'border-white/20 bg-slate-900/60 hover:border-white/40'
                }`}
              >
                {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span onClick={() => setRememberMe(!rememberMe)}>Remember me</span>
            </label>

            <button
              type="button"
              id="signin-forgot-password-btn"
              onClick={() => onForgotPassword(email.trim())}
              disabled={isSubmitting}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            id="signin-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch to registration */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center relative z-10">
          <p className="text-xs text-slate-300">
            Don't have an account?{' '}
            <button
              id="signin-switch-to-register-btn"
              type="button"
              onClick={() => onSwitchToRegister(email.trim())}
              disabled={isSubmitting}
              className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer ml-1 hover:underline inline-flex items-center space-x-0.5"
            >
              <span>Create Account</span>
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
