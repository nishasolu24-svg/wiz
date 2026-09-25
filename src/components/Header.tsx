import React, { useState } from 'react';
import {
  Sparkles,
  Printer,
  Bookmark,
  Share2,
  Bell,
  Search,
  BookOpen,
  FileText,
  Flame,
  LayoutDashboard,
  CheckSquare,
  BarChart2,
  X,
  Check,
  Compass,
} from 'lucide-react';
import { UserMenu } from './UserMenu';
import { authService } from '../services/authService';
import { WebsiteUsageCounter } from './WebsiteUsageCounter';

interface HeaderProps {
  onOpenGenerator: () => void;
  onOpenBookPdf?: (mode?: 'question_paper' | 'book') => void;
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
  theme?: 'light' | 'purple' | 'blue';
  activeNavTab?: string;
  onSelectNavTab?: (tab: string) => void;
  dayStreak?: number;
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
  theme = 'light',
  activeNavTab = 'home',
  onSelectNavTab,
  dayStreak = 9,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [headerSearch, setHeaderSearch] = useState('');

  const tier = authService.getUserTier();
  const isAdmin = authService.isAdmin();
  const isPaid = tier === 'pro' || tier === 'school';
  const broadcastBanner = typeof window !== 'undefined' ? localStorage.getItem('wizsheet_system_broadcast') : null;

  const notifications = [
    {
      id: 'n1',
      title: "Assigned 'Reading Comprehension & Analysis' to Grade 5 Class",
      time: '10 min ago',
      unread: true,
      icon: '📖',
    },
    {
      id: 'n2',
      title: "Alex scored 95% on 'Multiplying Fractions Practice'",
      time: '1 hour ago',
      unread: true,
      icon: '🏆',
    },
    {
      id: 'n3',
      title: 'AI model updated: Enhanced formatting for math and science diagrams',
      time: 'Today',
      unread: true,
      icon: '✨',
    },
  ];

  const headerTheme = {
    purple: {
      nav: 'bg-[#20104A]/95 backdrop-blur-md border-b border-purple-500/25 text-white shadow-sm',
      tabActive: 'bg-white/20 text-white font-bold shadow-xs',
      tabInactive: 'text-purple-200/80 hover:text-white hover:bg-white/10',
      searchBg: 'bg-white/10 border-white/20 text-white placeholder:text-purple-200/60 focus:bg-white/20',
      counterBg: 'bg-white/10 border-white/15 text-white',
      buttonSecondary: 'bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-xs',
      buttonIcon: 'text-white/80',
      mobileToggle: 'text-white/80 hover:bg-white/10 hover:text-white',
      badge: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
      notificationPanel: 'bg-[#1C0D42] border-purple-500/30 text-white',
    },
    blue: {
      nav: 'bg-[#092244]/95 backdrop-blur-md border-b border-blue-400/25 text-white shadow-sm',
      tabActive: 'bg-white/20 text-white font-bold shadow-xs',
      tabInactive: 'text-blue-200/80 hover:text-white hover:bg-white/10',
      searchBg: 'bg-white/10 border-white/20 text-white placeholder:text-blue-200/60 focus:bg-white/20',
      counterBg: 'bg-white/10 border-white/15 text-white',
      buttonSecondary: 'bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-xs',
      buttonIcon: 'text-white/80',
      mobileToggle: 'text-white/80 hover:bg-white/10 hover:text-white',
      badge: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
      notificationPanel: 'bg-[#071D3A] border-blue-400/30 text-white',
    },
    light: {
      nav: 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-800 shadow-xs',
      tabActive: 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60 shadow-2xs',
      tabInactive: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70',
      searchBg: 'bg-slate-100 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500',
      counterBg: 'bg-slate-50 border-slate-200 text-slate-700',
      buttonSecondary: 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs',
      buttonIcon: 'text-slate-500',
      mobileToggle: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      notificationPanel: 'bg-white border-slate-200 text-slate-900',
    },
  }[theme] || {
    nav: 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-800 shadow-xs',
    tabActive: 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60 shadow-2xs',
    tabInactive: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70',
    searchBg: 'bg-slate-100 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white',
    counterBg: 'bg-slate-50 border-slate-200 text-slate-700',
    buttonSecondary: 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs',
    buttonIcon: 'text-slate-500',
    mobileToggle: 'text-slate-500 hover:bg-slate-100',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    notificationPanel: 'bg-white border-slate-200 text-slate-900',
  };

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prompt_topic', label: 'AI Generator', icon: Sparkles },
    { id: 'student_analyze', label: 'Student Analytics', icon: BarChart2 },
    { id: 'interactive', label: 'Quiz Center', icon: CheckSquare },
  ];

  return (
    <nav className={`no-print shrink-0 z-30 sticky top-0 ${headerTheme.nav}`}>
      {/* Optional Broadcast Announcement Banner */}
      {broadcastBanner && (
        <div className="bg-indigo-600 text-white px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
          <span>{broadcastBanner}</span>
        </div>
      )}

      <div className="h-16 flex items-center px-4 sm:px-6 lg:px-8 justify-between max-w-7xl mx-auto w-full gap-3 sm:gap-4">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`lg:hidden p-2 rounded-xl transition-colors ${headerTheme.mobileToggle}`}
              title="Toggle Sidebar Navigation"
              aria-label="Toggle Sidebar Navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Brand Logo (WizSheet AI) */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
            title="Go to Home"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <span className="font-black text-base">✨</span>
            </div>
            <div className="hidden sm:block">
              <span className={`text-base font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                WizSheet <span className="text-amber-400 font-extrabold text-xs ml-0.5 px-1.5 py-0.5 rounded-full bg-amber-400/20">AI</span>
              </span>
            </div>
          </button>
        </div>

        {/* Horizontal Navigation Tabs matching Image 3 ("Dashboard", "Student Analyze", etc.) */}
        <div className="hidden xl:flex items-center gap-1.5">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeNavTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectNavTab?.(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive ? headerTheme.tabActive : headerTheme.tabInactive
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Search Bar (Image 3 & 4) */}
        <div className="hidden md:flex items-center flex-1 max-w-xs relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            placeholder="Search worksheets, topics... [Cmd+K]"
            className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none transition-all ${headerTheme.searchBg}`}
          />
        </div>

        {/* Right Utility Widgets (Diamonds, Coins, Streak, Notifications, Profile) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Active Worksheet Action Buttons */}
          {hasWorksheet && (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenExport}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-all ${headerTheme.buttonSecondary}`}
                title="Export or copy worksheet"
              >
                <Share2 className={`w-3.5 h-3.5 ${headerTheme.buttonIcon}`} />
                <span>Export</span>
              </button>

              <button
                onClick={onPrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          )}

          {/* Notification Bell with Dropdown Popover (Image 3 & 4) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen((prev) => !prev);
                if (unreadCount > 0) setUnreadCount(0);
              }}
              className={`p-2 rounded-xl border relative transition-colors cursor-pointer ${headerTheme.buttonSecondary}`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Menu */}
            {isNotificationsOpen && (
              <div
                className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl p-4 z-50 animate-fadeIn ${headerTheme.notificationPanel}`}
              >
                <div className="flex items-center justify-between border-b border-current/10 pb-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Notifications
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1 rounded-md opacity-60 hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-current/5 hover:bg-current/10 transition-colors flex items-start gap-2.5"
                    >
                      <span className="text-base">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-snug">{n.title}</p>
                        <span className="text-[10px] opacity-60">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Menu & Avatar dropdown */}
          <UserMenu
            teacherName={teacherName}
            onOpenFreeTierSettings={onOpenFreeTierSettings}
            onOpenAuth={onOpenAuth}
            onOpenPricing={onOpenPricing}
            onOpenAdmin={onOpenAdmin}
            remainingQuota={remainingQuota}
            hasCustomKey={hasCustomKey}
            theme={theme}
          />
        </div>
      </div>
    </nav>
  );
};
