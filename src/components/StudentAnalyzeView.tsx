import React from 'react';
import {
  Users,
  Award,
  BookOpen,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface StudentAnalyzeViewProps {
  onSelectWorksheet?: (worksheetId: string) => void;
  onOpenGenerator?: () => void;
  theme?: 'light' | 'purple' | 'blue';
}

export const StudentAnalyzeView: React.FC<StudentAnalyzeViewProps> = ({
  onOpenGenerator,
  theme = 'light',
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">👋</span>
              <span className="text-sm font-bold uppercase tracking-wider text-blue-200">
                Welcome, Educators & Tutors
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Class Performance & Learning Analytics
            </h1>
            <p className="text-sm text-blue-100/90 leading-relaxed font-normal">
              Track student engagement trends, monitor retention rates, and discover targeted practice areas to elevate classroom mastery.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenGenerator}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-800 hover:bg-blue-50 font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Create New Worksheet</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-sky-300" />
                <span className="text-xs font-semibold text-blue-200">Completed</span>
              </div>
              <div className="text-xl font-black tabular-nums">155+</div>
              <div className="text-[10px] text-blue-200/80">Completed Worksheets</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-semibold text-emerald-200">Certificates</span>
              </div>
              <div className="text-xl font-black tabular-nums">40+</div>
              <div className="text-[10px] text-blue-200/80">Mastery Badges</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-purple-300" />
                <span className="text-xs font-semibold text-purple-200">In Progress</span>
              </div>
              <div className="text-xl font-black tabular-nums">27+</div>
              <div className="text-[10px] text-blue-200/80">Active Sets</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-semibold text-amber-200">Community</span>
              </div>
              <div className="text-xl font-black tabular-nums">19k+</div>
              <div className="text-[10px] text-blue-200/80">Student Answers</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Analytics Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Total Students (Segmented breakdown) */}
        <div className="rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Learners</h2>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              +15% Growth
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">3,500</span>
              <span className="text-xs text-slate-500">enrolled participants</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Comprehensive classroom distribution</div>
          </div>

          {/* Segmented bar graph representation */}
          <div className="space-y-3 pt-2">
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div className="bg-blue-600 h-full w-[63%]" title="Retention (63%)" />
              <div className="bg-sky-400 h-full w-[25%]" title="Regular Practice (25%)" />
              <div className="bg-amber-400 h-full w-[12%]" title="Need Support (12%)" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                  <span>High Retention Cohort (63%)</span>
                </span>
                <span className="font-bold tabular-nums">2,200</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                  <span>Regular Practice Cohort (25%)</span>
                </span>
                <span className="font-bold tabular-nums">850</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                  <span>Targeted Intervention Cohort (12%)</span>
                </span>
                <span className="font-bold tabular-nums">450</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Student Retention Gauge (Semicircular Arc) */}
        <div className="rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Knowledge Retention Rate</h2>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Monthly Benchmark</span>
          </div>

          {/* Semicircular SVG Gauge */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative w-48 h-28 flex items-end justify-center">
              <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 80">
                {/* Background track */}
                <path
                  d="M 10 80 A 70 70 0 0 1 150 80"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Active gradient arc (63%) */}
                <path
                  d="M 10 80 A 70 70 0 0 1 150 80"
                  fill="none"
                  stroke="url(#retentionGradientClean)"
                  strokeWidth="16"
                  strokeDasharray="220"
                  strokeDashoffset="80"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="retentionGradientClean" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute bottom-0 flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                  63%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Classroom Retention
                </span>
              </div>
            </div>

            <p className="text-xs text-center text-slate-500 mt-4 leading-snug max-w-xs">
              Frequent interactive quizzes and structured twin-paper tests improved student retention by +14% this period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
