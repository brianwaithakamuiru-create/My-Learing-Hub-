import React, { useState } from 'react';
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
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface LoginModalProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginModalProps> = ({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword,
}) => {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);

  const handleGoogleAuth = async () => {
    if (isGoogleSubmitting || isSubmitting) return;
    setIsGoogleSubmitting(true);
    setErrorMessage(null);
    setIsOperationNotAllowed(false);

    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      const friendly = mapFirebaseAuthError(err);
      setErrorMessage(friendly);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isGoogleSubmitting) return;

    // Field validations
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage(null);
    setIsOperationNotAllowed(false);
    setIsSubmitting(true);

    try {
      // Execute REAL Firebase Authentication
      const profile = await signIn(cleanEmail, password);
      console.log('Firebase authentication successful for:', profile.email);
      onSuccess();
    } catch (err: any) {
      console.error('Firebase sign in failure:', err);
      if (err?.code === 'auth/operation-not-allowed' || String(err?.message).includes('operation-not-allowed')) {
        setIsOperationNotAllowed(true);
      }
      const friendly = mapFirebaseAuthError(err);
      setErrorMessage(friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 mb-3 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            Sign In to Learning Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Access your courses, documents, and academic space
          </p>
        </div>

        {/* 1-Click Google Sign In */}
        <div className="mb-5">
          <button
            id="login-google-btn"
            type="button"
            disabled={isGoogleSubmitting || isSubmitting}
            onClick={handleGoogleAuth}
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-cyan-400/40 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isGoogleSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                {/* Official Google 'G' Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-400 uppercase tracking-wider shrink-0">
              or sign in with email
            </span>
          </div>
        </div>

        {/* Error Alert with Contextual Guidance */}
        {errorMessage && (
          <div
            id="login-error-alert"
            className="mb-5 p-4 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs animate-in fade-in duration-200 space-y-3"
          >
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>

            {isOperationNotAllowed && (
              <div className="p-3 bg-slate-950/80 rounded-lg border border-cyan-500/30 text-slate-300 space-y-2">
                <p className="text-[11px] text-cyan-300 font-medium">
                  Instant Access Option:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isGoogleSubmitting}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sign in with Google</span>
                  </button>
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0631618971/authentication/providers"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-white/10 flex items-center justify-center space-x-1.5"
                  >
                    <span>Enable Email/Password in Console</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="signin-email"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Email Address
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
                disabled={isSubmitting || isGoogleSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full glass-input text-white text-sm rounded-xl pl-10 pr-4 py-2.5 placeholder:text-slate-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="signin-password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
              >
                Password
              </label>
              <button
                type="button"
                id="signin-forgot-password-btn"
                onClick={onForgotPassword}
                disabled={isSubmitting || isGoogleSubmitting}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                disabled={isSubmitting || isGoogleSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input text-white text-sm rounded-xl pl-10 pr-11 py-2.5 placeholder:text-slate-500 disabled:opacity-50"
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

          {/* Submit Button */}
          <button
            id="signin-submit-btn"
            type="submit"
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-semibold text-sm rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In with Email</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch to registration */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-slate-300">
            Don't have an account?{' '}
            <button
              id="signin-switch-to-register-btn"
              type="button"
              onClick={onSwitchToRegister}
              disabled={isSubmitting || isGoogleSubmitting}
              className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer ml-1 hover:underline"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
