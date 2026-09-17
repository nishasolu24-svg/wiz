import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Key,
  ShieldCheck,
  User,
  School,
  Clock,
  Zap,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  Layers,
} from 'lucide-react';
import { authService } from '../services/authService';
import { TeacherProfile, UserQuotaStatus } from '../types';

interface FreeTierSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: TeacherProfile) => void;
  isFirstEntryPrompt?: boolean;
  onOpenPricing?: () => void;
  onOpenAuth?: () => void;
}

export const FreeTierSettingsModal: React.FC<FreeTierSettingsModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  isFirstEntryPrompt = false,
  onOpenPricing,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'quota' | 'teacher' | 'byok'>('quota');
  const [profile, setProfile] = useState<TeacherProfile>(() => authService.getProfile());
  const [quotaStatus, setQuotaStatus] = useState<UserQuotaStatus | null>(null);

  // Form states for Teacher Profile
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [schoolName, setSchoolName] = useState(profile.schoolName);
  const [gradeLevel, setGradeLevel] = useState(profile.gradeLevel);

  // Form states for BYOK
  const [customKeyInput, setCustomKeyInput] = useState(profile.customApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  useEffect(() => {
    if (isOpen) {
      const p = authService.getProfile();
      setProfile(p);
      setName(p.name);
      setEmail(p.email);
      setSchoolName(p.schoolName);
      setGradeLevel(p.gradeLevel);
      setCustomKeyInput(p.customApiKey || '');
      setKeyFeedback({ status: 'idle', message: '' });

      authService.fetchQuotaStatus().then((qs) => {
        setQuotaStatus(qs);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = authService.updateProfile({
      name: name.trim() || 'Teacher',
      email: email.trim(),
      schoolName: schoolName.trim() || 'School',
      gradeLevel: gradeLevel.trim() || 'Grade 6',
      isLoggedIn: Boolean(email.trim()),
    });
    setProfile(updated);
    onProfileUpdated?.(updated);
    onClose();
  };

  const handleTestAndSaveKey = async () => {
    const trimmed = customKeyInput.trim();
    if (!trimmed) {
      authService.clearCustomApiKey();
      const updated = authService.getProfile();
      setProfile(updated);
      onProfileUpdated?.(updated);
      setKeyFeedback({
        status: 'success',
        message: 'Personal key removed. Reverted to shared public free tier pool.',
      });
      return;
    }

    setIsVerifyingKey(true);
    setKeyFeedback({ status: 'idle', message: '' });

    const result = await authService.validateCustomApiKey(trimmed);
    setIsVerifyingKey(false);

    if (result.valid) {
      authService.setCustomApiKey(trimmed);
      const updated = authService.getProfile();
      setProfile(updated);
      onProfileUpdated?.(updated);
      setKeyFeedback({
        status: 'success',
        message: 'Key validated successfully! You now have unlimited worksheet generations on your personal free tier.',
      });
    } else {
      setKeyFeedback({
        status: 'error',
        message: result.message || 'Key validation failed. Please check the key and try again.',
      });
    }
  };

  const hasCustomKey = Boolean(profile.customApiKey && profile.customApiKey.length > 5);
  const remaining = hasCustomKey ? 'Unlimited' : Math.max(0, 5 - (profile.dailyUsageCount || 0));
  const used = profile.dailyUsageCount || 0;
  const percentage = hasCustomKey ? 100 : Math.min(100, Math.round((used / 5) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-violet-700 via-indigo-600 to-purple-700 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Free Tier & Quota Control</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  Free Forever
                </span>
              </h2>
              <p className="text-xs text-indigo-100/90 font-medium">
                Manage multi-user allowances, curriculum cache, and teacher credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('quota')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all ${
              activeTab === 'quota'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Daily Allowance & Cache</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all ${
              activeTab === 'teacher'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-violet-600" />
            <span>Teacher Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('byok')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all ${
              activeTab === 'byok'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>Power User Key (BYOK)</span>
            {hasCustomKey && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* First Entry Tier Prompt or Welcome Prompt */}
          {isFirstEntryPrompt && (
            <div className="p-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 text-white rounded-2xl shadow-md border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-wider">Welcome! Choose Your Access Mode</h3>
              </div>
              <p className="text-xs text-indigo-100">
                Would you like to start on the standard <strong>Free Tier</strong> (5 free AI worksheets/day + instant cache), or connect a free key for <strong>Unlimited</strong> worksheets?
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-3 bg-white text-slate-800 hover:bg-violet-50 rounded-xl text-left border border-white/40 shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-violet-700 group-hover:text-violet-900">
                        1. Standard Free Tier
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                        Zero Setup
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Includes 5 free AI generations daily, unlimited cache queries, PDF uploads, and PDF printouts.
                    </p>
                  </div>
                  <div className="mt-2 text-xs font-bold text-violet-700 flex items-center gap-1">
                    <span>Use Free Tier Now</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('byok')}
                  className="p-3 bg-white/15 hover:bg-white/25 text-white rounded-xl text-left border border-white/30 shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-300 group-hover:text-amber-200">
                        2. Unlimited Tier (BYOK)
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400/30 text-amber-200">
                        Unlimited
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-100 mt-1">
                      Connect your own free Gemini API key from Google AI Studio. No daily rate limits or wait times.
                    </p>
                  </div>
                  <div className="mt-2 text-xs font-bold text-amber-300 flex items-center gap-1">
                    <span>Set Up Free Key</span>
                    <Key className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: DAILY ALLOWANCE & CACHE */}
          {activeTab === 'quota' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Allowance Status Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-white border border-indigo-100 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>Today's Free AI Generations</span>
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {hasCustomKey
                        ? 'Unlimited AI generations enabled via your personal key'
                        : '5 free AI generations granted every day per teacher account'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-indigo-700">
                      {hasCustomKey ? '∞' : `${remaining} left`}
                    </span>
                    {!hasCustomKey && (
                      <p className="text-[11px] font-semibold text-slate-500">of 5 daily</p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {!hasCustomKey && (
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          used >= 5
                            ? 'bg-rose-500'
                            : used >= 3
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-violet-500 to-indigo-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>{used} used today</span>
                      <span>Resets nightly at 00:00 UTC</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instant 0-Cost Cache Explainer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      ⚡ Instant 0-Cost Curriculum Cache
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Whenever you or another teacher generates standard curriculum topics (such as{' '}
                      <em>Digestive System, Photosynthesis, Fractions, Solar System</em>), the result is
                      permanently saved in the server's local curriculum cache.
                    </p>
                    <div className="pt-1 flex flex-wrap gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Consumes 0 API Units
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-100/80 text-cyan-800 font-bold">
                        <Zap className="w-3 h-3" />
                        Sub-second Instant Delivery
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-800 font-bold">
                        <ShieldCheck className="w-3 h-3" />
                        Exempt from 5/day Quota
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upgrade / Tier Classification Card */}
              {onOpenPricing && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 text-white shadow-md flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        Upgrade to Pro or School Team
                      </h4>
                    </div>
                    <p className="text-xs text-indigo-100">
                      Unlock unlimited daily worksheets, unlimited textbook PDF uploads, and multi-seat department sharing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPricing();
                    }}
                    className="shrink-0 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    View Pricing
                  </button>
                </div>
              )}

              {/* Rate Governor & 429 Fallback Engine Notice */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Always-On Intelligent Fallback Protection</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Even if Google's shared public free tier experiences a temporary traffic spike or reaches
                  rate limits, our built-in curriculum synthesis engine seamlessly builds your worksheets
                  with free educational diagrams so your classroom preparation is never delayed.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TEACHER PROFILE */}
          {activeTab === 'teacher' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-violet-50/70 rounded-xl border border-violet-100 text-xs text-violet-800">
                Personalize your teacher signature, school watermark, and preserve your free daily generations across sessions.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teacher Name / Title
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ms. Johnson, Dr. Carter"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teacher Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.edu"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    School / Organization
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. Lincoln Middle School"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Default Grade Level
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  >
                    {['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'High School (9-12)'].map(
                      (g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:from-violet-700 hover:to-indigo-700 transition-all"
                >
                  Save Profile Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: POWER USER KEY (BYOK) */}
          {activeTab === 'byok' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span>Bring Your Own Free Google AI Key</span>
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free Key at AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Anyone with a standard Google account can get a <strong>100% free Gemini API key</strong> in
                  under 60 seconds with <strong>zero credit card required</strong>. When you add your personal
                  key, your requests use your own dedicated 1,500 requests/day quota with zero limits from the public pool.
                </p>
              </div>

              {/* Key Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Google AI Studio Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={customKeyInput}
                    onChange={(e) => {
                      setCustomKeyInput(e.target.value);
                      setKeyFeedback({ status: 'idle', message: '' });
                    }}
                    placeholder="AIzaSy..."
                    className="w-full pl-3 pr-20 py-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-2 px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 rounded bg-slate-100"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Your key is stored only inside your browser's local encrypted storage and passed via SSL to your session.
                </p>
              </div>

              {/* Feedback Alert */}
              {keyFeedback.message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    keyFeedback.status === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {keyFeedback.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{keyFeedback.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                {hasCustomKey ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomKeyInput('');
                      authService.clearCustomApiKey();
                      const updated = authService.getProfile();
                      setProfile(updated);
                      onProfileUpdated?.(updated);
                      setKeyFeedback({
                        status: 'success',
                        message: 'Key removed. Reverted to shared public pool.',
                      });
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
                  >
                    Remove Personal Key
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={handleTestAndSaveKey}
                  disabled={isVerifyingKey}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:from-amber-600 hover:to-indigo-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isVerifyingKey ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Verifying Key...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>{customKeyInput.trim() ? 'Test & Save Key' : 'Reset to Shared Free Tier'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Zero Cost Architecture Active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
