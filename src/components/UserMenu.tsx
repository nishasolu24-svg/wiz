import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Zap,
  CreditCard,
  Building2,
  Sliders,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { authService } from '../services/authService';
import { analyticsService } from '../services/analyticsService';
import { TeacherProfile, UserTier } from '../types';

interface UserMenuProps {
  onOpenAuth: (mode?: 'signin' | 'register') => void;
  onOpenPricing: () => void;
  onOpenSettings: () => void;
  onOpenAdmin?: () => void;
  remainingQuota: number | string;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onOpenAuth,
  onOpenPricing,
  onOpenSettings,
  onOpenAdmin,
  remainingQuota,
}) => {
  const [profile, setProfile] = useState<TeacherProfile>(authService.getProfile());
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = authService.onProfileChange((updated) => {
      setProfile(updated);
    });
    return unsub;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tier = authService.getUserTier();
  const isAdmin = authService.isAdmin();
  const isPaid = tier === 'pro' || tier === 'school' || isAdmin;

  const getTierBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-gradient-to-r from-amber-100 via-violet-100 to-purple-100 text-purple-900 border border-amber-300 shadow-2xs">
          <ShieldCheck className="w-3 h-3 text-amber-600" />
          Master Admin
        </span>
      );
    }
    if (tier === 'school') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border border-indigo-200">
          <Building2 className="w-3 h-3 text-indigo-600" />
          School Team
        </span>
      );
    }
    if (tier === 'pro') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-gradient-to-r from-amber-100 to-violet-100 text-violet-900 border border-amber-300 shadow-2xs">
          <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
          Pro Educator
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        Free Plan
      </span>
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'T';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await authService.signOut();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* If Not Logged In */}
      {!profile.isLoggedIn ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Upgrade Pill */}
          <button
            type="button"
            onClick={onOpenPricing}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 via-violet-500 to-indigo-600 text-white shadow-xs hover:opacity-95 transition-opacity"
            title="View Pro & School Tiers"
          >
            <Sparkles className="w-3 h-3 fill-white" />
            <span>Upgrade</span>
          </button>

          {/* Sign In Button */}
          <button
            type="button"
            onClick={() => onOpenAuth('signin')}
            id="btn-sign-in-nav"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-full text-xs font-bold border border-violet-200 shadow-2xs transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      ) : (
        /* Logged In User Pill */
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAdmin && onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 hover:from-indigo-700 hover:to-purple-800 shadow-xs transition-transform active:scale-95"
              title="Open Admin Management Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Admin Portal</span>
            </button>
          )}

          {!isPaid && (
            <button
              type="button"
              onClick={onOpenPricing}
              className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-full text-[11px] font-black shadow-xs transition-transform active:scale-95"
            >
              <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>Upgrade</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            id="btn-user-profile-menu"
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-left shadow-2xs"
          >
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-violet-400"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-black text-xs flex items-center justify-center shadow-inner">
                {getInitials(profile.name)}
              </div>
            )}

            <div className="hidden sm:block leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                  {profile.name}
                </span>
                {getTierBadge()}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Info Header */}
          <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-400 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white font-black text-sm flex items-center justify-center shadow-sm shadow-violet-200">
                  {getInitials(profile.name)}
                </div>
              )}
              <div className="overflow-hidden">
                <h4 className="text-xs font-black text-slate-900 truncate">{profile.name}</h4>
                <p className="text-[11px] text-slate-500 truncate">{profile.email || 'Guest Account'}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {getTierBadge()}
                  {profile.schoolName && (
                    <span className="text-[10px] text-slate-500 truncate">
                      • {profile.schoolName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tier Status & Entitlements Section */}
          <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Tier Entitlements
              </span>
              <span className="text-[11px] font-bold text-violet-700">
                {isPaid ? 'Unlimited Generations' : `${remainingQuota} left today`}
              </span>
            </div>

            {isPaid ? (
              <div className="p-2.5 bg-violet-100/60 rounded-xl border border-violet-200 text-violet-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight font-medium">
                  {tier === 'school'
                    ? 'School Team license active with shared district repository & multi-seat access.'
                    : 'Pro Educator tier active with unlimited book uploads, differentiation, & clean exports.'}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-violet-600 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, ((profile.dailyUsageCount || 0) / 5) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Daily Quota (5/day)</span>
                  <span className="font-bold">{profile.dailyUsageCount || 0} used</span>
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="p-2 space-y-1">
            {isAdmin && onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAdmin();
                }}
                className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 hover:opacity-95 flex items-center justify-between shadow-xs transition-transform active:scale-98 mb-1.5"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Admin Management Portal</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  Master
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenPricing();
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:text-violet-900 hover:bg-violet-50 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-violet-600" />
                <span>{isPaid ? 'Manage Subscription & Invoices' : 'Upgrade to Pro / School Tier'}</span>
              </div>
              {!isPaid && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900">
                  20% Off
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Free Tier & API Key Settings</span>
            </button>

            {/* Live Platform Usage & Analytics - Accessible ONLY to administrators */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  analyticsService.openModal();
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Live Platform Usage & Stats</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </button>
            )}

            <div className="h-px bg-slate-100 my-1" />

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
