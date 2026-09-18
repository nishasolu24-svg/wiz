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
    <nav className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/80 shrink-0 z-30 sticky top-0 shadow-xs">
      {/* Optional Broadcast Announcement Banner */}
      {broadcastBanner && (
        <div className="bg-indigo-600 text-white px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
          <span>{broadcastBanner}</span>
        </div>
      )}
      
      <div className="h-16 flex items-center px-4 sm:px-6 lg:px-8 justify-between max-w-7xl mx-auto w-full">
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
            className="flex items-center gap-2.5 text-left focus:outline-hidden group"
            title="Go to Home / My Questionnaires"
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 group-hover:bg-indigo-700 transition-colors">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  WizSheet <span className="text-indigo-600">AI</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Assessment Studio
                </span>
              </div>
            </div>
          </button>

          {/* Live Platform Counter - Visible ONLY to administrators */}
          {isAdmin && (
            <div className="flex items-center ml-2">
              <WebsiteUsageCounter variant="badge" />
            </div>
          )}
        </div>

        {/* Right Navigation & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Active Worksheet Primary Actions */}
          {hasWorksheet && (
            <>
              <button
                onClick={onOpenExport}
                id="btn-export-share"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-xs"
                title="Export or copy worksheet"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </button>

              <button
                onClick={onPrint}
                id="btn-print-action"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-98"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            </>
          )}

          {/* Book / PDF Upload CTA (shown on home) */}
          {!hasWorksheet && onOpenBookPdf && (
            <button
              type="button"
              onClick={onOpenBookPdf}
              id="btn-header-book-pdf"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100/70 text-indigo-700 rounded-xl text-xs font-semibold transition-all"
              title="Upload a Book / PDF and generate questions directly from it"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Ask from Book / PDF</span>
              <span className="sm:hidden">Book PDF</span>
            </button>
          )}

          {/* Saved Worksheets Library */}
          <button
            onClick={onOpenSaved}
            id="btn-saved-library"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-xs"
            title="View saved worksheets"
          >
            <Bookmark className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Library</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                {savedCount}
              </span>
            )}
          </button>

          {/* Interactive Tier Status / Free Tier Quota Pill */}
          {isPaid ? (
            <button
              type="button"
              onClick={onOpenPricing}
              id="btn-paid-tier-status"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100/70 transition-all"
              title="Active Paid Tier - Click to manage subscription"
            >
              <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
              <span className="hidden md:inline">
                {tier === 'school' ? 'Team' : 'Pro'}:
              </span>
              <span className="font-bold text-amber-800">Unlimited</span>
            </button>
          ) : onOpenFreeTierSettings ? (
            <button
              type="button"
              onClick={onOpenFreeTierSettings}
              id="btn-free-tier-status"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                hasCustomKey
                  ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100/70'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Click to view daily allowance or add personal API key"
            >
              {hasCustomKey ? (
                <>
                  <Key className="w-3 h-3 text-amber-600" />
                  <span className="hidden md:inline">Custom Key</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] text-amber-800 font-bold bg-amber-100">
                    Active
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span className="hidden md:inline text-slate-500">Daily:</span>
                  <span className="font-semibold text-slate-800">
                    {remainingQuota !== undefined ? `${remainingQuota} left` : '5/5'}
                  </span>
                </>
              )}
            </button>
          ) : null}

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
