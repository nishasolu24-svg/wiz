import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Users,
  Database,
  Sliders,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  UserCheck,
  UserPlus,
  Zap,
  Building2,
  Key,
  X,
  ChevronRight,
  Activity,
  Send,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { authService } from '../services/authService';
import { analyticsService, SiteAnalyticsStats } from '../services/analyticsService';
import { MASTER_ADMIN_EMAILS, isMasterAdminEmail } from '../config/adminConfig';
import { TeacherProfile, UserTier } from '../types';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: TeacherProfile) => void;
}

interface ManagedUser {
  id: string;
  email: string;
  displayName: string;
  schoolName: string;
  role: 'teacher' | 'admin';
  isAdmin: boolean;
  tier: UserTier;
  dailyGenerationsUsed: number;
  lastGenerationDate: string;
  createdAt?: string;
  updatedAt?: string;
  isMasterAdmin: boolean;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'whitelist' | 'database' | 'system'>('users');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | UserTier | 'admin'>('all');
  const [currentProfile, setCurrentProfile] = useState<TeacherProfile>(authService.getProfile());
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // New user pre-provisioning form
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newSchool, setNewSchool] = useState('');
  const [newTier, setNewTier] = useState<UserTier>('pro');
  const [newRole, setNewRole] = useState<'teacher' | 'admin'>('teacher');

  // Database ping & server stats
  const [serverStats, setServerStats] = useState<any>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);

  // System Broadcast Banner
  const [bannerText, setBannerText] = useState(() => {
    return localStorage.getItem('wizsheet_system_broadcast') || '';
  });

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      fetchServerOverview();
    }
  }, [isOpen]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionErrorMessage(msg);
      setTimeout(() => setActionErrorMessage(null), 4000);
    } else {
      setActionSuccessMessage(msg);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const fetched = await authService.fetchAdminUsers();
      setUsers(fetched);
    } catch (err: any) {
      console.error('Error fetching admin users:', err);
      showNotification('Failed to load user records', true);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchServerOverview = async () => {
    try {
      const resp = await fetch('/api/admin/overview', {
        headers: authService.getAuthHeaders(),
      });
      const contentType = resp.headers.get('content-type') || '';
      if (resp.ok && contentType.includes('application/json')) {
        const data = await resp.json();
        setServerStats(data);
      }
    } catch (e) {
      console.warn('Could not fetch server admin overview:', e);
    }
  };

  const handlePingDatabase = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      await fetch('/api/health');
      const elapsed = Math.round(performance.now() - start);
      setPingLatency(elapsed);
      showNotification(`Firestore & Server connection healthy (${elapsed}ms latency)`);
    } catch (e) {
      showNotification('Connection check failed', true);
    } finally {
      setPinging(false);
    }
  };

  const handleUpdateTier = async (userId: string, userEmail: string, newTierValue: UserTier) => {
    const success = await authService.adminUpdateUserTier(userId, userEmail, newTierValue);
    if (success) {
      showNotification(`Successfully updated tier for ${userEmail} to ${newTierValue.toUpperCase()}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, tier: newTierValue } : u))
      );
      if (onProfileUpdated) {
        onProfileUpdated(authService.getProfile());
      }
    } else {
      showNotification('Failed to update tier in Firestore', true);
    }
  };

  const handleResetQuota = async (userId: string, userEmail: string) => {
    const success = await authService.adminResetUserQuota(userId, userEmail);
    if (success) {
      showNotification(`Reset daily quota to 0/5 for ${userEmail}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, dailyGenerationsUsed: 0 } : u))
      );
      if (onProfileUpdated) {
        onProfileUpdated(authService.getProfile());
      }
    } else {
      showNotification('Failed to reset quota', true);
    }
  };

  const handleToggleAdmin = async (user: ManagedUser) => {
    if (user.isMasterAdmin) {
      showNotification('Master Administrators cannot be demoted.', true);
      return;
    }
    const newRoleValue = user.role === 'admin' ? 'teacher' : 'admin';
    const success = await authService.adminUpdateUserRole(user.id, newRoleValue);
    if (success) {
      showNotification(`Role changed to ${newRoleValue.toUpperCase()} for ${user.email}`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, role: newRoleValue, isAdmin: newRoleValue === 'admin' } : u
        )
      );
    } else {
      showNotification('Failed to update admin role in Firestore', true);
    }
  };

  const handleDeleteUser = async (user: ManagedUser) => {
    if (user.isMasterAdmin) {
      showNotification('Cannot delete a Master Administrator account.', true);
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${user.displayName} (${user.email})?`)) {
      return;
    }
    const success = await authService.adminDeleteUser(user.id);
    if (success) {
      showNotification(`Account ${user.email} removed from system.`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      showNotification('Failed to delete account', true);
    }
  };

  const handleSwitchToMasterAdmin = async (
    email: 'solu24@gmail.com' | 'alferniya.nisha@gmail.com' | 'nishasolu24@gmail.com'
  ) => {
    const updated = await authService.switchToAdminAccount(email);
    setCurrentProfile(updated);
    if (onProfileUpdated) {
      onProfileUpdated(updated);
    }
    showNotification(`Active session switched to Master Admin: ${email}`);
    loadUsers();
  };

  const handleSaveBroadcastBanner = () => {
    localStorage.setItem('wizsheet_system_broadcast', bannerText.trim());
    showNotification('System announcement banner updated across the app!');
  };

  const handleClearBroadcastBanner = () => {
    localStorage.removeItem('wizsheet_system_broadcast');
    setBannerText('');
    showNotification('System broadcast banner removed.');
  };

  if (!isOpen) return null;

  // Filtered user list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedTierFilter === 'all') return true;
    if (selectedTierFilter === 'admin') return u.isAdmin || u.role === 'admin';
    return u.tier === selectedTierFilter;
  });

  const totalUsersCount = users.length;
  const freeUsersCount = users.filter((u) => u.tier === 'free').length;
  const proUsersCount = users.filter((u) => u.tier === 'pro').length;
  const schoolUsersCount = users.filter((u) => u.tier === 'school').length;
  const adminUsersCount = users.filter((u) => u.isAdmin || u.role === 'admin').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Master Admin Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-violet-500 to-indigo-500 p-0.5 shadow-lg shadow-indigo-900/50">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-amber-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Admin Management Portal
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Master Authority
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Google Cloud Firestore User Tiering & Master Platform Controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Master Admin Account Selector */}
            <div className="bg-indigo-900/50 border border-indigo-700/60 rounded-2xl px-3 py-1.5 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <div className="text-left leading-tight">
                <div className="text-[10px] text-indigo-300 font-medium">Current Session:</div>
                <div className="text-xs font-black text-amber-200 truncate max-w-[170px] sm:max-w-[210px]">
                  {currentProfile.email || 'Admin Console'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Close Portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification Banners */}
        {actionSuccessMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
        {actionErrorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 text-xs text-rose-800 font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionErrorMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 px-5 pt-3 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 ${
              activeTab === 'users'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User & Tier Control ({totalUsersCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whitelist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 ${
              activeTab === 'whitelist'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Master Admin Whitelist (3)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 ${
              activeTab === 'database'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4 text-violet-600" />
            <span>Firestore Health & Costs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 ${
              activeTab === 'system'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Broadcasts & Settings</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/40">
          {/* TAB 1: USERS & TIER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Total Users
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{totalUsersCount}</div>
                  <div className="text-[11px] text-slate-500 font-medium">In Cloud Database</div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Free Starter
                  </div>
                  <div className="text-xl font-black text-slate-700 mt-0.5">{freeUsersCount}</div>
                  <div className="text-[11px] text-slate-500 font-medium">5 generations/day</div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/50 shadow-2xs">
                  <div className="text-[10px] font-black uppercase text-amber-700 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Pro Educators
                  </div>
                  <div className="text-xl font-black text-amber-900 mt-0.5">{proUsersCount}</div>
                  <div className="text-[11px] text-amber-700/80 font-medium">Unlimited Quota</div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-indigo-200 bg-gradient-to-br from-white to-indigo-50/50 shadow-2xs">
                  <div className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-indigo-600" />
                    School Teams
                  </div>
                  <div className="text-xl font-black text-indigo-900 mt-0.5">{schoolUsersCount}</div>
                  <div className="text-[11px] text-indigo-700/80 font-medium">Multi-Seat Licenses</div>
                </div>
              </div>

              {/* Action Bar & Filters */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, school, or UID..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-medium focus:outline-hidden transition-colors"
                  />
                </div>

                {/* Tier Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                  {(['all', 'free', 'pro', 'school', 'admin'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTierFilter(t)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                        selectedTierFilter === t
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t === 'all' ? 'All' : t === 'admin' ? 'Admins' : t}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={loadUsers}
                    disabled={loadingUsers}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ml-1"
                    title="Refresh user list from Firestore"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* User List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">User & Contact</th>
                        <th className="py-3 px-4">Role & Status</th>
                        <th className="py-3 px-4">Assigned Tier</th>
                        <th className="py-3 px-4">Daily Usage</th>
                        <th className="py-3 px-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                            No users match your current search or filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isMaster = u.isMasterAdmin;
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* User & Contact */}
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{u.displayName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                                <div className="text-[10px] text-slate-400">{u.schoolName}</div>
                              </td>

                              {/* Role & Status */}
                              <td className="py-3.5 px-4">
                                {isMaster ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-gradient-to-r from-amber-100 to-purple-100 text-purple-900 border border-amber-300">
                                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                                    Master Admin
                                  </span>
                                ) : u.isAdmin || u.role === 'admin' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-purple-100 text-purple-800 border border-purple-200">
                                    <Shield className="w-3 h-3 text-purple-600" />
                                    Admin
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                                    Teacher
                                  </span>
                                )}
                              </td>

                              {/* Assigned Tier with Quick-Select Dropdown */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={u.tier}
                                    onChange={(e) =>
                                      handleUpdateTier(u.id, u.email, e.target.value as UserTier)
                                    }
                                    className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                      u.tier === 'school'
                                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                        : u.tier === 'pro'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    <option value="free">Free Starter (5/day)</option>
                                    <option value="pro">Pro Educator (Unlimited)</option>
                                    <option value="school">School Team (Full Multi-Seat)</option>
                                  </select>
                                </div>
                              </td>

                              {/* Daily Usage */}
                              <td className="py-3.5 px-4">
                                {u.tier === 'pro' || u.tier === 'school' || isMaster ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    Unlimited
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800">
                                      {u.dailyGenerationsUsed} / 5
                                    </span>
                                    {u.dailyGenerationsUsed > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleResetQuota(u.id, u.email)}
                                        className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-violet-100 hover:bg-violet-200 text-violet-800 transition-colors"
                                        title="Reset used quota to 0/5 immediately"
                                      >
                                        Reset
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!isMaster && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAdmin(u)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                        u.role === 'admin'
                                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                          : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                                      }`}
                                      title={u.role === 'admin' ? 'Demote to Teacher' : 'Promote to Admin'}
                                    >
                                      {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                                    </button>
                                  )}

                                  {!isMaster && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(u)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Delete user profile"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER ADMIN WHITELIST */}
          {activeTab === 'whitelist' && (
            <div className="space-y-5">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-violet-50 rounded-2xl border border-amber-200/80">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Master Administrator Authority Whitelist
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      The three email addresses specified below are recognized by both the
                      Firestore Security Rules (`firestore.rules`) and the application backend as Master
                      Administrators. They receive permanent School Team licenses, bypass all generation
                      rate limits, and have root control over all user accounts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MASTER_ADMIN_EMAILS.map((email, idx) => {
                  const isCurrent = currentProfile.email.toLowerCase() === email.toLowerCase();
                  return (
                    <div
                      key={email}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                          Master #{idx + 1}
                        </span>
                        {isCurrent ? (
                          <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                            Active Session
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>

                      <div className="font-mono text-xs font-black text-slate-900 break-all">
                        {email}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Unrestricted Firestore DB & System Control
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[10px] font-bold text-slate-400">
                          Role: Master Admin
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSwitchToMasterAdmin(email as any)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          {isCurrent ? 'Current' : 'Switch Session'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security Details */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Configured Privileges
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Bypass Generation Limits:</strong> Master admins never hit the 5/day limit or cooldowns.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Tier Modification:</strong> Can change any user between Free, Pro, and School.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Firestore Rule Auth:</strong> Security rules evaluate master emails at the database layer.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Quota Resets:</strong> Reset teacher limits on demand if someone needs urgent worksheets.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATABASE HEALTH & COSTS */}
          {activeTab === 'database' && (
            <div className="space-y-5">
              {/* Firestore Cloud Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Firestore Target
                    </span>
                    <Database className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1">GCP Cloud Firestore</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    ai-studio-aiworksheetgener
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Database Latency
                    </span>
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-lg font-black text-emerald-700 mt-1">
                    {pingLatency ? `${pingLatency} ms` : 'Ready'}
                  </div>
                  <button
                    type="button"
                    onClick={handlePingDatabase}
                    disabled={pinging}
                    className="text-[11px] font-bold text-indigo-600 hover:underline mt-0.5"
                  >
                    {pinging ? 'Testing ping...' : 'Test Connection Ping'}
                  </button>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Server Cache
                    </span>
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {serverStats?.cachedWorksheetsCount ?? 0} Worksheets
                  </div>
                  <div className="text-[11px] text-slate-500">Instant 0-cost retrieval</div>
                </div>
              </div>

              {/* Free Tier Allowance Tracker */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Google Cloud Firestore Daily Free Quota
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Standard Google Cloud Firestore Free Tier allowance (resets daily at 00:00 UTC)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    100% Free Tier Range
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500">Document Reads</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">50,000 / day</div>
                    <div className="text-[10px] text-emerald-600 font-medium">$0.00 (Included)</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500">Document Writes</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">20,000 / day</div>
                    <div className="text-[10px] text-emerald-600 font-medium">$0.00 (Included)</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500">Cloud Storage</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">1 GiB Data</div>
                    <div className="text-[10px] text-emerald-600 font-medium">$0.00 (Included)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM BROADCAST & CONTROLS */}
          {activeTab === 'system' && (
            <div className="space-y-5">
              {/* Broadcast Announcement Banner */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Teacher Announcement Banner
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Display a global notification header banner for all visiting teachers.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Live Sync</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    placeholder="e.g. Welcome teachers! School Team licenses are now active with textbook uploads."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveBroadcastBanner}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Publish
                  </button>
                  {bannerText && (
                    <button
                      type="button"
                      onClick={handleClearBroadcastBanner}
                      className="px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {bannerText && (
                  <div className="mt-2 p-2.5 bg-gradient-to-r from-amber-100 to-indigo-100 rounded-xl border border-indigo-200 text-xs text-indigo-900 font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Preview: {bannerText}</span>
                  </div>
                )}
              </div>

              {/* Live Website Traffic & Usage Analytics */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Live Traffic & Usage Analytics
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Counter
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-violet-50/70 rounded-xl border border-violet-100">
                    <span className="text-[10px] font-bold text-violet-700 uppercase">Total Visits</span>
                    <div className="text-xl font-black text-violet-950 mt-0.5">
                      {Math.max(analyticsService.getStats().totalVisits, serverStats?.analytics?.totalVisits ?? 0).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-violet-600 font-semibold">
                      +{Math.max(analyticsService.getStats().todayVisits, serverStats?.analytics?.todayVisits ?? 0)} today
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Worksheets Generated</span>
                    <div className="text-xl font-black text-emerald-950 mt-0.5">
                      {Math.max(analyticsService.getStats().worksheetsGenerated, serverStats?.analytics?.worksheetsGenerated ?? 0).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      +{Math.max(analyticsService.getStats().worksheetsGeneratedToday, serverStats?.analytics?.worksheetsGeneratedToday ?? 0)} today
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Paid Launch Waitlist</span>
                    <div className="text-xl font-black text-amber-950 mt-0.5">
                      {serverStats?.analytics?.waitlistCount ?? 0}
                    </div>
                    <span className="text-[10px] text-amber-700 font-semibold">
                      Pre-registered educators
                    </span>
                  </div>
                </div>
              </div>

              {/* Global Server Actions */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Platform Operations
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch('/api/admin/reset-client-quota', {
                          method: 'POST',
                          headers: authService.getAuthHeaders(),
                          body: JSON.stringify({}),
                        });
                        showNotification('Reset all server-side in-memory limits and cooldowns.');
                      } catch (e) {
                        showNotification('Failed to clear client sessions', true);
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                  >
                    Clear In-Memory Rate Limit Caches
                  </button>

                  <button
                    type="button"
                    onClick={loadUsers}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Firestore Users Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Master Administrator Console Active</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
