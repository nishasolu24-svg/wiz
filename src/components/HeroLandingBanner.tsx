import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';

interface HeroLandingBannerProps {
  onCreateFromScratch: () => void;
  onGenerateByAI: () => void;
  theme?: 'light' | 'purple' | 'blue';
}

export const HeroLandingBanner: React.FC<HeroLandingBannerProps> = ({
  onCreateFromScratch,
  onGenerateByAI,
  theme = 'light',
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/60 dark:from-slate-900 dark:via-indigo-950/40 dark:to-purple-950/60 border border-indigo-100 dark:border-indigo-900/50 p-6 sm:p-8 lg:p-10 shadow-sm transition-all">
      {/* Decorative background glows */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wide border border-indigo-200/60 dark:border-indigo-700/50">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>Next-Gen Worksheet Engine</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            AI Worksheet Generator — <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Create Custom Worksheets In Seconds
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
            Let AI handle the heavy lifting — Create smarter, faster, and more fun worksheets in a few clicks!
          </p>
        </div>

        {/* Bullet Value Props */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium text-slate-700 dark:text-slate-300 pt-1">
          <li className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
            <span>Super fast with Gemini AI worksheet generator</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
            <span>1M+ customizable, printable & free educational templates</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
            <span>Trusted by 100K+ regular educators, tutors & parents</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
            <span>Diverse layout with 10+ question types (MCQ, Matching, Blanks)</span>
          </li>
          <li className="flex items-center gap-2.5 sm:col-span-2">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
            <span>Works on any device — instant print, PDF export & interactive quiz</span>
          </li>
        </ul>

        {/* Dual Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onCreateFromScratch}
            id="hero-btn-create-scratch"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm border-2 border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer group"
          >
            <span className="text-lg">✏️</span>
            <span>Create From Scratch</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
          </button>

          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">or</span>

          <button
            type="button"
            onClick={onGenerateByAI}
            id="hero-btn-generate-ai"
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-md hover:shadow-indigo-500/25 transition-all active:scale-98 cursor-pointer group"
          >
            <span className="text-lg">🤖</span>
            <span>Generate Worksheet</span>
            <ArrowRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Bottom Social Proof Metrics */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-6 sm:gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
              📄
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                1M+
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Resources created
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
              👥
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                100k
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Regular users
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              🧩
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                10+
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Questions Types
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
