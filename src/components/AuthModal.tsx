import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Lock,
  Mail,
  User,
  School,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { authService } from '../services/authService';
import { TeacherProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (profile: TeacherProfile) => void;
  initialMode?: 'signin' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setUnauthorizedDomain(null);
    setIsLoading(true);

    try {
      let profile: TeacherProfile;
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password.');
        }
        profile = await authService.signInWithEmail(email, password);
      } else {
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password.');
        }
        if (password.length < 6) {
          throw new Error('Password should be at least 6 characters.');
        }
        profile = await authService.registerWithEmail(email, password, name, schoolName);
      }

      onSuccess?.(profile);
      onClose();
    } catch (err: any) {
      if (
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain') ||
        err.message?.includes('Domain Unauthorized')
      ) {
        setUnauthorizedDomain(window.location.hostname);
        setError(null);
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfoMessage(null);
    setUnauthorizedDomain(null);
    setIsLoading(true);
    try {
      const profile = await authService.signInWithGoogle();
      onSuccess?.(profile);
      onClose();
    } catch (err: any) {
      if (
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain') ||
        err.message?.includes('Domain Unauthorized')
      ) {
        setUnauthorizedDomain(window.location.hostname);
        setError(null);
      } else {
        setError(err.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const profile = await authService.signInAsGuest();
      onSuccess?.(profile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to enter as guest.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Gradient */}
        <div className="p-6 bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-800 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-3 text-amber-300 border border-white/20 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-black tracking-tight">
            {mode === 'signin' ? 'Welcome Back to WizSheet AI' : 'Create Your Teacher Account'}
          </h2>
          <p className="text-xs text-indigo-100 mt-1">
            {mode === 'signin'
              ? 'Sign in to access your saved assessments, sync your school tier, and generate differentiated worksheets.'
              : 'Join educators saving 5+ hours weekly creating standards-aligned practice tests & reading quizzes.'}
          </p>

          {/* Mode Switcher Pills */}
          <div className="mt-4 grid grid-cols-2 p-1 bg-black/20 rounded-xl backdrop-blur-xs text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-1.5 rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-violet-900 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-1.5 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-violet-900 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              New Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Unauthorized Domain Resolution Banner */}
          {unauthorizedDomain && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs space-y-3 animate-in fade-in shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">
                    Authorize Cloudflare Domain in Firebase
                  </h4>
                  <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                    Firebase Authentication blocks Google sign-in until your Cloudflare Pages domain is approved in your Firebase project.
                  </p>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Domain to add:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(unauthorizedDomain);
                      setCopiedDomain(true);
                      setTimeout(() => setCopiedDomain(false), 2000);
                    }}
                    className="flex items-center gap-1 text-violet-700 hover:text-violet-900 font-bold"
                  >
                    {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDomain ? 'Copied!' : 'Copy Domain'}</span>
                  </button>
                </div>
                <code className="block bg-slate-100 px-2 py-1 rounded text-violet-950 font-mono text-[11px] font-bold select-all break-all">
                  {unauthorizedDomain}
                </code>
              </div>

              <div className="space-y-1 text-[11px] text-amber-950">
                <p className="font-bold">Quick 30-Second Fix:</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-900 leading-normal">
                  <li>Open <strong>Firebase Console &gt; Authentication &gt; Settings</strong>.</li>
                  <li>Scroll to <strong>Authorized domains</strong> and click <strong>Add domain</strong>.</li>
                  <li>Paste <code>{unauthorizedDomain}</code> and <code>wizsheet-ai.pages.dev</code>.</li>
                  <li>Click <strong>Save</strong> and try signing in again!</li>
                </ol>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row gap-2">
                <a
                  href="https://console.firebase.google.com/project/gen-lang-client-0875315195/authentication/settings"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-center rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>Open Firebase Settings</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl transition-colors"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-2xs transition-all active:scale-98 disabled:opacity-50"
          >
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
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[11px] font-bold text-slate-400 uppercase">or email</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ms. Sarah Jenkins"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    School / Organization (Optional)
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Oakridge Middle School"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="teacher@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() =>
                      setInfoMessage('If you forgot your password, you can sign in directly with Google or use the demo guest account.')
                    }
                    className="text-[10px] text-violet-600 hover:text-violet-800 font-semibold"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-violet-200 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Account' : 'Create Free Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Anonymous / Guest Access */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={isLoading}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors"
            >
              Continue as Guest (No password)
            </button>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Firebase Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
