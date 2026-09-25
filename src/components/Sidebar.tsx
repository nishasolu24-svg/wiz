import React, { useState } from 'react';
import {
  LayoutGrid,
  BarChart2,
  CheckSquare,
  Users,
  Bell,
  Settings,
  Flag,
  HelpCircle,
  Search,
  Sun,
  Moon,
  LogOut,
  LogIn,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Palette,
  X,
  FileQuestion,
  BookOpen,
  SlidersHorizontal,
  FolderArchive,
  Compass,
  Trophy,
  Flame,
} from 'lucide-react';

export type SidebarTheme = 'purple' | 'blue' | 'light';

export interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  savedCount?: number;
  notificationCount?: number;
  teacherName?: string;
  teacherEmail?: string;
  isLoggedIn?: boolean;
  theme?: SidebarTheme;
  onThemeChange?: (theme: SidebarTheme) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSaved?: () => void;
  onOpenSettings?: () => void;
  onOpenReport?: () => void;
  onOpenSupport?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  onSelectSubjectGroup?: (subject: string) => void;
  onSearch?: (query: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenQuestionPaperModal?: () => void;
  onOpenBookPdfModal?: () => void;
  onToggleDirectives?: () => void;
  showDirectives?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
  onClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  savedCount = 0,
  notificationCount = 2,
  teacherName = 'Teacher',
  teacherEmail = 'teacher@school.edu',
  isLoggedIn = false,
  theme = 'purple',
  onThemeChange,
  isCollapsed = false,
  onToggleCollapse,
  onOpenSaved,
  onOpenSettings,
  onOpenReport,
  onOpenSupport,
  onOpenAuth,
  onSelectSubjectGroup,
  onSearch,
  isOpenMobile = false,
  onCloseMobile,
  onOpenQuestionPaperModal,
  onOpenBookPdfModal,
  onToggleDirectives,
  showDirectives = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    onSearch?.(val);
  };

  const primaryMenuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: LayoutGrid,
      onClick: () => onSelectTab('home'),
    },
    {
      id: 'prompt_topic',
      label: 'AI Generator',
      icon: Sparkles,
      onClick: () => onSelectTab('prompt_topic'),
    },
    {
      id: 'student_analyze',
      label: 'Student Analytics',
      icon: BarChart2,
      badge: '63%',
      badgeColor: 'bg-emerald-500 text-white',
      onClick: () => onSelectTab('student_analyze'),
    },
    {
      id: 'interactive',
      label: 'Quiz Center',
      icon: CheckSquare,
      onClick: () => onSelectTab('interactive'),
    },
    {
      id: 'saved_questionnaires',
      label: 'Saved Worksheets',
      icon: FolderArchive,
      badge: savedCount,
      badgeColor: 'bg-amber-400 text-slate-950 font-bold',
      onClick: () => {
        onSelectTab('saved_questionnaires');
        onOpenSaved?.();
      },
    },
  ];

  const themeStyles = {
    purple: {
      container: 'bg-[#5335D6] text-white border-r border-[#4326C5]',
      divider: 'border-white/15',
      searchBg: 'bg-white/12 border-white/15 text-white placeholder:text-white/60 focus:bg-white/20',
      closeBtn: 'text-white/70 hover:text-white hover:bg-white/10',
      activeHomeItem: 'bg-[#a3e635] text-slate-950 font-black shadow-md', // Vibrant lime green active pill from Image 2!
      activeNormalItem: 'bg-white/25 text-white font-bold shadow-xs',
      hoverItem: 'hover:bg-white/10 text-white/85 hover:text-white',
      sectionLabel: 'text-white/60',
      themeToggleContainer: 'bg-white/15 border-white/10',
      themeToggleActive: 'bg-white text-[#5335D6] shadow-xs font-bold',
      themeToggleInactive: 'text-white/70 hover:text-white',
      userCardBg: 'bg-white/10 border-white/10 hover:bg-white/15 text-white',
      userSubtext: 'text-white/70',
      progressCardBg: 'bg-white/10 border-white/15 text-white',
      childTabActive: 'bg-white text-[#5335D6] font-bold shadow-xs',
      childTabInactive: 'text-white/70 hover:text-white',
    },
    blue: {
      container: 'bg-[#1565EE] text-white border-r border-[#0D52CB]',
      divider: 'border-white/15',
      searchBg: 'bg-white/12 border-white/15 text-white placeholder:text-white/60 focus:bg-white/20',
      closeBtn: 'text-white/70 hover:text-white hover:bg-white/10',
      activeHomeItem: 'bg-[#00f2fe] text-slate-950 font-black shadow-md',
      activeNormalItem: 'bg-white/25 text-white font-bold shadow-xs',
      hoverItem: 'hover:bg-white/10 text-white/85 hover:text-white',
      sectionLabel: 'text-white/60',
      themeToggleContainer: 'bg-white/15 border-white/10',
      themeToggleActive: 'bg-white text-[#1565EE] shadow-xs font-bold',
      themeToggleInactive: 'text-white/70 hover:text-white',
      userCardBg: 'bg-white/10 border-white/10 hover:bg-white/15 text-white',
      userSubtext: 'text-white/70',
      progressCardBg: 'bg-white/10 border-white/15 text-white',
      childTabActive: 'bg-white text-[#1565EE] font-bold shadow-xs',
      childTabInactive: 'text-white/70 hover:text-white',
    },
    light: {
      container: 'bg-[#F8FAFC] text-slate-900 border-r border-slate-200',
      divider: 'border-slate-200',
      searchBg: 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500',
      closeBtn: 'text-slate-600 hover:text-slate-900 hover:bg-slate-200',
      activeHomeItem: 'bg-indigo-600 text-white font-black shadow-md',
      activeNormalItem: 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-2xs',
      hoverItem: 'hover:bg-slate-200/70 text-slate-700 hover:text-slate-950 font-medium',
      sectionLabel: 'text-slate-500 font-bold',
      themeToggleContainer: 'bg-slate-200 border-slate-300',
      themeToggleActive: 'bg-white text-slate-950 shadow-xs font-bold',
      themeToggleInactive: 'text-slate-600 hover:text-slate-900',
      userCardBg: 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900 shadow-xs',
      userSubtext: 'text-slate-600',
      progressCardBg: 'bg-white border-slate-200 text-slate-900 shadow-xs',
      childTabActive: 'bg-indigo-600 text-white font-bold shadow-xs',
      childTabInactive: 'text-slate-600 hover:text-slate-900',
    },
  };

  const currentTheme = themeStyles[theme] || themeStyles.purple;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col justify-between shrink-0 select-none
          w-[290px] xl:w-[305px]
          ${currentTheme.container}
          transition-transform duration-200 ease-in-out
          ${isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top Scrollable Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 scrollbar-thin">
          {/* Header Brand Lockup */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-white text-[#5335D6] flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <span className="text-lg font-black tracking-tight block leading-tight">
                  WizSheet
                </span>
                <span className={`text-[11px] font-semibold opacity-70 block`}>
                  AI Worksheet Studio
                </span>
              </div>
            </button>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className={`lg:hidden p-1.5 rounded-lg transition-colors cursor-pointer ${currentTheme.closeBtn}`}
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search or jump to..."
              className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs border outline-none transition-all ${currentTheme.searchBg}`}
            />
          </div>

          {/* Primary Navigation Menu */}
          <div className="space-y-1">
            <div className={`px-1 text-[10px] font-bold uppercase tracking-wider mb-1 ${currentTheme.sectionLabel}`}>
              Menu
            </div>

            {primaryMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isHomeActive = isActive && item.id === 'home';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={`
                    w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all cursor-pointer text-left
                    ${
                      isHomeActive
                        ? currentTheme.activeHomeItem
                        : isActive
                        ? currentTheme.activeNormalItem
                        : currentTheme.hoverItem
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold leading-none">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.badgeColor || 'bg-white/20 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Additional Pathways: Twin Exam & Textbook PDF */}
          <div className={`pt-3 border-t ${currentTheme.divider} space-y-2`}>
            <div className={`px-1 text-[10px] font-bold uppercase tracking-wider ${currentTheme.sectionLabel}`}>
              Smart Ingestion
            </div>

            <button
              type="button"
              onClick={() => {
                onSelectTab('upload_exam');
                onOpenQuestionPaperModal?.();
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  : 'bg-white/10 border-white/15 hover:bg-white/20 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-500 text-white">
                  <FileQuestion className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="text-xs font-bold">Twin Exam PDF</div>
                  <div className="text-[10px] opacity-70">Parallel Set B questions</div>
                </div>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500 text-white">
                Set B
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTab('upload_book');
                onOpenBookPdfModal?.();
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  : 'bg-white/10 border-white/15 hover:bg-white/20 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-500 text-white">
                  <BookOpen className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="text-xs font-bold">Textbook / Notes PDF</div>
                  <div className="text-[10px] opacity-70">Direct chapter extraction</div>
                </div>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                Direct
              </span>
            </button>
          </div>




                  <path
                    className="opacity-20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path

                    strokeDasharray="67, 100"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
          </div>
        </div>

        {/* Bottom Dock: Theme Switcher & User Profile */}
        <div className={`p-4 border-t ${currentTheme.divider} space-y-3 shrink-0`}>
          {/* Theme Selector: Purple, Blue, Light */}
          <div className={`p-1 rounded-xl flex items-center gap-1 ${currentTheme.themeToggleContainer}`}>
            <button
              type="button"
              onClick={() => onThemeChange?.('purple')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                theme === 'purple'
                  ? currentTheme.themeToggleActive
                  : currentTheme.themeToggleInactive
              }`}
              title="Purple theme"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Purple</span>
            </button>

            <button
              type="button"
              onClick={() => onThemeChange?.('blue')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                theme === 'blue'
                  ? currentTheme.themeToggleActive
                  : currentTheme.themeToggleInactive
              }`}
              title="Blue theme"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Blue</span>
            </button>

            <button
              type="button"
              onClick={() => onThemeChange?.('light')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                theme === 'light'
                  ? currentTheme.themeToggleActive
                  : currentTheme.themeToggleInactive
              }`}
              title="Light theme"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
          </div>

          {/* User Profile Card */}
          <div
            className={`rounded-2xl border p-2.5 flex items-center justify-between gap-2.5 transition-all ${currentTheme.userCardBg}`}
          >
            <div
              onClick={() => onOpenAuth?.(isLoggedIn ? undefined : 'signin')}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                {teacherName ? teacherName.charAt(0).toUpperCase() : 'D'}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold leading-tight truncate">
                  {teacherName || 'Teacher'}
                </div>
                <div className={`text-[10px] leading-tight ${currentTheme.userSubtext} truncate`}>
                  {teacherEmail || 'teacher@school.edu'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenAuth?.('signin')}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              title="Switch Account / Sign In"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
