import React, { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  FileText,
  Sparkles,
  TrendingUp,
  Clock,
  RefreshCw,
  ChevronUp,
  X,
  ShieldCheck,
} from 'lucide-react';
import { analyticsService, SiteAnalyticsStats } from '../services/analyticsService';
import { authService } from '../services/authService';

interface WebsiteUsageCounterProps {
  className?: string;
  variant?: 'pill' | 'badge' | 'card';
}

export const WebsiteUsageCounter: React.FC<WebsiteUsageCounterProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => authService.isAdmin());
  const [stats, setStats] = useState<SiteAnalyticsStats>(analyticsService.getStats());
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = authService.onProfileChange(() => {
      setIsAdmin(authService.isAdmin());
    });

    const unsubscribeStats = analyticsService.subscribe((updated) => {
      setStats(updated);
    });

    const unsubscribeModal = analyticsService.subscribeModal((open) => {
      setIsDetailsOpen(open);
    });

    // Background refresh poll
    const interval = setInterval(() => {
      analyticsService.fetchLiveStats();
    }, 30000);

    return () => {
      unsubscribeAuth();
      unsubscribeStats();
      unsubscribeModal();
      clearInterval(interval);
    };
  }, []);

  // Only show to admin users; hide completely from public and regular teachers
  if (!isAdmin) {
    return null;
  }

  const handleManualRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await analyticsService.fetchLiveStats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleOpenDetails = () => {
    setIsDetailsOpen(true);
    analyticsService.openModal();
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    analyticsService.closeModal();
  };

  return (
    <>
      {variant === 'badge' ? (
        <button
          type="button"
          onClick={handleOpenDetails}
          id="btn-website-usage-counter-badge"
          className={`inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-white/90 hover:bg-white backdrop-blur-md rounded-full border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700 cursor-pointer transition-all hover:border-violet-300 hover:shadow-xs active:scale-98 ${className}`}
          title="Live Platform Stats: Click to view breakdown"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">
            <strong className="text-violet-700 font-bold">{stats.totalVisits.toLocaleString()}</strong> visits
          </span>
          <span className="sm:hidden text-[11px]">
            <strong className="text-violet-700 font-bold">{stats.totalVisits > 999 ? `${(stats.totalVisits / 1000).toFixed(1)}k` : stats.totalVisits}</strong> visits
          </span>
          <span className="text-slate-300">•</span>
          <span className="hidden sm:inline">
            <strong className="text-emerald-700 font-bold">{stats.worksheetsGenerated.toLocaleString()}</strong> worksheets
          </span>
          <span className="sm:hidden text-[11px]">
            <strong className="text-emerald-700 font-bold">{stats.worksheetsGenerated > 999 ? `${(stats.worksheetsGenerated / 1000).toFixed(1)}k` : stats.worksheetsGenerated}</strong> sheets
          </span>
        </button>
      ) : (
        /* Subtle Floating Bottom Activity Indicator */
        <button
          type="button"
          onClick={handleOpenDetails}
          id="btn-website-usage-counter-pill"
          className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white/95 hover:bg-white text-slate-700 rounded-full border border-slate-200/80 shadow-xs hover:shadow-sm backdrop-blur-md text-xs font-medium cursor-pointer transition-all hover:border-violet-300 group active:scale-98 ${className}`}
          title="Click to view live platform metrics"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Live Activity:</span>
            <span className="font-bold text-violet-900">{stats.todayVisits} visits today</span>
          </span>

          <span className="text-slate-300">|</span>

          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <FileText className="w-3.5 h-3.5 text-violet-600" />
            <strong className="font-bold text-slate-900">{stats.worksheetsGenerated.toLocaleString()}</strong> created
          </span>

          <span className="ml-1 text-[10px] font-bold text-violet-600 group-hover:translate-x-0.5 transition-transform">
            Stats ↗
          </span>
        </button>
      )}

      {/* Live Activity Modal */}
      {isDetailsOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={handleCloseDetails}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-amber-300">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                    Platform Usage Analytics
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/30 text-emerald-200 rounded border border-emerald-400/40">
                      Live
                    </span>
                  </h3>
                  <p className="text-[11px] text-violet-100">Live platform metrics & teacher engagement</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className={`p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                  title="Refresh live metrics"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Total Visits */}
                <div className="p-3.5 bg-violet-50/60 rounded-2xl border border-violet-100">
                  <div className="flex items-center justify-between text-violet-700 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Total Visits</span>
                    <Users className="w-4 h-4 text-violet-500" />
                  </div>
                  <span className="text-2xl font-black text-violet-950 block">
                    {stats.totalVisits.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-violet-600 font-semibold">
                    +{stats.todayVisits} new visits today
                  </span>
                </div>

                {/* Worksheets Created */}
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <div className="flex items-center justify-between text-emerald-700 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Worksheets</span>
                    <FileText className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-2xl font-black text-emerald-950 block">
                    {stats.worksheetsGenerated.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    +{stats.worksheetsGeneratedToday} generated today
                  </span>
                </div>

                {/* Unique Visitors */}
                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <div className="flex items-center justify-between text-blue-700 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Educators</span>
                    <Activity className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-2xl font-black text-blue-950 block">
                    {stats.uniqueVisitors.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    Verified unique browsers
                  </span>
                </div>

                {/* Active Sessions */}
                <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100">
                  <div className="flex items-center justify-between text-amber-700 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Active Now</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  </div>
                  <span className="text-2xl font-black text-amber-950 block">
                    {stats.activeSessions}
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold">
                    Teachers online now
                  </span>
                </div>
              </div>

              {/* Efficiency Stat */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Estimated Teacher Time Saved:</span>
                </div>
                <strong className="text-slate-900 font-bold">
                  {Math.round((stats.worksheetsGenerated * 42) / 60)} hours
                </strong>
              </div>

              {/* Cloud Sync Status */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Cloud Database: <strong>Firestore (GCP)</strong></span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Updated: {new Date(stats.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Free Teacher Launch Banner */}
              <div className="p-3 bg-violet-50/60 rounded-xl border border-violet-100 text-[11px] text-violet-800 text-center">
                🚀 <strong>Open Educator Access:</strong> All features are free. 5 worksheets per day per teacher, or connect your own API key for unlimited generations.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
