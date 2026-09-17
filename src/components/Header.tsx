import React from 'react';
import { Sparkles, Printer, Bookmark, PlusCircle, Share2, HelpCircle, Lightbulb, Zap, Key, BookOpen } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { authService } from '../services/authService';
import { WebsiteUsageCounter } from './WebsiteUsageCounter';

interface HeaderProps {
  onOpenGenerator: () => void;
  onOpenBookPdf?: () => void;
  onOpenSaved: () => void;
  onPrint: () => void;
  onOpenExport: () => void;
  onOpenFreeTierSettings?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  onOpenPricing?: () => void;
  onOpenAdmin?: () => void;
  onNavigateHome?: () => void;
  savedCount: number;
  hasWorksheet: boolean;
  onToggleSidebar?: () => void;
  remainingQuota?: number | string;
  hasCustomKey?: boolean;
  teacherName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGenerator,
  onOpenBookPdf,
  onOpenSaved,
  onPrint,
  onOpenExport,
  onOpenFreeTierSettings,
  onOpenAuth,
  onOpenPricing,
  onOpenAdmin,
  onNavigateHome,
  savedCount,
  hasWorksheet,
  onToggleSidebar,
  remainingQuota,
  hasCustomKey,
  teacherName = 'Teacher',
}) => {
  const tier = authService.getUserTier();
  const isAdmin = authService.isAdmin();
  const isPaid = tier === 'pro' || tier === 'school';
  const broadcastBanner = typeof window !== 'undefined' ? localStorage.getItem('wizsheet_system_broadcast') : null;

  return (
    <nav className="no-print bg-white/90 backdrop-blur-md border-b border-indigo-100/80 flex flex-col justify-between shrink-0 z-30 sticky top-0 shadow-xs">
      {/* Top Rainbow Accent Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 via-indigo-500 via-cyan-400 via-emerald-400 to-amber-400" />

      {/* Optional Broadcast Announcement Banner */}
      {broadcastBanner && (
        <div className="bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200 shrink-0" />
          <span>{broadcastBanner}</span>
        </div>
      )}
      
      <div className="h-15 flex items-center px-4 sm:px-8 justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Toggle Controls Sidebar"
              aria-label="Toggle Controls Sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-3 text-left focus:outline-hidden group"
            title="Go to Home / My Questionnaires"
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-amber-400 rounded-xl flex items-center justify-center text-white shadow-md shadow-fuchsia-200 shrink-0 transform group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-700 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent group-hover:opacity-90">
                  WizSheet AI
                </h1>
                <span className="hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                  ✨ Worksheet Studio
                </span>
              </div>
            </div>
          </button>

          {/* Live Platform Counter - Visible ONLY to administrators */}
          {isAdmin && (
            <div className="flex items-center">
              <WebsiteUsageCounter variant="badge" />
            </div>
          )}
        </div>

        {/* Center / Right Status & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Interactive Tier Status / Free Tier Quota Pill */}
          {isPaid ? (
            <button
              type="button"
              onClick={onOpenPricing}
              id="btn-paid-tier-status"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-xs border border-amber-300 bg-gradient-to-r from-amber-50 via-violet-50 to-purple-50 text-violet-900 hover:shadow-sm"
              title="Active Paid Tier - Click to manage subscription"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span className="hidden md:inline">
                {tier === 'school' ? 'School Team' : 'Pro Tier'}:
              </span>
              <span className="text-amber-700 uppercase tracking-wide">Unlimited</span>
            </button>
          ) : onOpenFreeTierSettings ? (
            <button
              type="button"
              onClick={onOpenFreeTierSettings}
              id="btn-free-tier-status"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs border ${
                hasCustomKey
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Click to view daily allowance, cache benefits, or add personal API key"
            >
              {hasCustomKey ? (
                <>
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden md:inline">Personal Key</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-200/60 text-[10px] text-amber-900 font-extrabold">
                    Unlimited
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">Free Tier:</span>
                  <span>{remainingQuota !== undefined ? `${remainingQuota} left` : '5/5 Daily'}</span>
                </>
              )}
            </button>
          ) : null}

          {/* Saved Worksheets */}
          <button
            onClick={onOpenSaved}
            id="btn-saved-library"
            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl text-xs sm:text-sm font-bold text-indigo-700 hover:from-indigo-100 hover:to-violet-100 transition-all shadow-2xs"
            title="View saved worksheets"
          >
            <Bookmark className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Library</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-2xs">
                {savedCount}
              </span>
            )}
          </button>

          {hasWorksheet && (
            <>
              <button
                onClick={onOpenExport}
                id="btn-export-share"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 rounded-xl text-xs sm:text-sm font-bold text-cyan-800 shadow-2xs hover:from-cyan-100 hover:to-sky-100 transition-all"
                title="Export or copy worksheet"
              >
                <Share2 className="w-4 h-4 text-cyan-600" />
                <span>Export</span>
              </button>

              <button
                onClick={onPrint}
                id="btn-print-action"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-fuchsia-200 hover:from-violet-700 hover:to-fuchsia-700 transition-all active:scale-98"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Print / PDF</span>
              </button>
            </>
          )}

          {onOpenBookPdf && (
            <button
              type="button"
              onClick={onOpenBookPdf}
              id="btn-header-book-pdf"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200 transition-all active:scale-98"
              title="Upload a Book / PDF and generate questions directly from it"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span className="hidden md:inline">Ask from Book</span>
              <span className="md:hidden">Book PDF</span>
            </button>
          )}

          <button
            onClick={onOpenGenerator}
            id="btn-create-worksheet-modal"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-200 transition-all active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Prompt</span>
          </button>

          {/* User Account & Classification Menu */}
          {onOpenAuth && onOpenPricing && onOpenFreeTierSettings && (
            <UserMenu
              onOpenAuth={onOpenAuth}
              onOpenPricing={onOpenPricing}
              onOpenSettings={onOpenFreeTierSettings}
              onOpenAdmin={onOpenAdmin}
              remainingQuota={remainingQuota || 5}
            />
          )}
        </div>
      </div>
    </nav>
  );
};
