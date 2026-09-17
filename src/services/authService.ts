import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { TeacherProfile, UserQuotaStatus, UserTier, SubscriptionRecord } from '../types';
import { isMasterAdminEmail, MASTER_ADMIN_EMAILS } from '../config/adminConfig';

const TEACHER_PROFILE_KEY = 'ai_worksheet_teacher_profile';
const DAILY_LIMIT = 5;

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getDefaultProfile(): TeacherProfile {
  return {
    id: `teacher-${Math.random().toString(36).slice(2, 9)}`,
    name: 'Teacher Guest',
    email: '',
    schoolName: 'Sunnydale Academy',
    gradeLevel: 'Grade 6',
    role: 'teacher',
    isAdmin: false,
    tier: 'free',
    tierExpiresAt: null,
    subscriptionId: null,
    paymentProvider: null,
    customApiKey: '',
    isLoggedIn: false,
    isAnonymous: false,
    dailyUsageCount: 0,
    lastUsageDate: getTodayString(),
  };
}

type AuthListener = (profile: TeacherProfile) => void;
const listeners: Set<AuthListener> = new Set();

let currentProfile: TeacherProfile = (() => {
  try {
    const stored = localStorage.getItem(TEACHER_PROFILE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const isMaster = isMasterAdminEmail(parsed.email);
      return {
        ...getDefaultProfile(),
        ...parsed,
        role: isMaster ? 'admin' : (parsed.role || 'teacher'),
        isAdmin: isMaster ? true : Boolean(parsed.isAdmin),
        tier: isMaster ? 'school' : (parsed.tier || 'free'),
        isLoggedIn: Boolean(parsed.isLoggedIn),
      };
    }
  } catch (e) {
    console.error('Error loading initial profile:', e);
  }
  return getDefaultProfile();
})();

let firestoreUnsub: (() => void) | null = null;

export const authService = {
  getProfile(): TeacherProfile {
    const today = getTodayString();
    if (currentProfile.lastUsageDate !== today) {
      currentProfile.dailyUsageCount = 0;
      currentProfile.lastUsageDate = today;
      this.saveLocalProfile(currentProfile);
    }
    return currentProfile;
  },

  saveLocalProfile(profile: TeacherProfile): void {
    currentProfile = profile;
    try {
      localStorage.setItem(TEACHER_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving teacher profile locally:', e);
    }
    listeners.forEach((fn) => {
      try {
        fn(profile);
      } catch (err) {
        console.error('Error notifying auth listener:', err);
      }
    });
  },

  onProfileChange(callback: AuthListener): () => void {
    listeners.add(callback);
    callback(this.getProfile());
    return () => {
      listeners.delete(callback);
    };
  },

  async updateProfile(updates: Partial<TeacherProfile>): Promise<TeacherProfile> {
    const current = this.getProfile();
    const updated: TeacherProfile = { ...current, ...updates };
    this.saveLocalProfile(updated);

    // If authenticated with Firebase, synchronize to Firestore
    if (updated.uid && auth.currentUser) {
      try {
        const userRef = doc(db, 'users', updated.uid);
        await updateDoc(userRef, {
          name: updated.name,
          displayName: updated.name,
          schoolName: updated.schoolName,
          gradeLevel: updated.gradeLevel,
          tier: updated.tier,
          tierExpiresAt: updated.tierExpiresAt || null,
          subscriptionId: updated.subscriptionId || null,
          paymentProvider: updated.paymentProvider || null,
          dailyGenerationsUsed: updated.dailyUsageCount,
          lastGenerationDate: updated.lastUsageDate,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not sync profile to Firestore:', err);
      }
    }

    return updated;
  },

  // Firebase Authentication methods
  async signInWithGoogle(): Promise<TeacherProfile> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await this.syncFirebaseUser(result.user);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('auth/unauthorized-domain')) {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        const customErr: any = new Error(
          `Domain Unauthorized: "${hostname}" has not been authorized in Firebase Authentication.`
        );
        customErr.code = 'auth/unauthorized-domain';
        customErr.hostname = hostname;
        throw customErr;
      }
      throw new Error(err.message || 'Failed to sign in with Google');
    }
  },

  async signInWithEmail(email: string, pass: string): Promise<TeacherProfile> {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      return await this.syncFirebaseUser(result.user);
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      // Graceful fallback if Firebase Email provider is not activated in console
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/admin-restricted-operation' ||
        err.code === 'auth/configuration-not-found'
      ) {
        const fallbackProfile: TeacherProfile = {
          ...getDefaultProfile(),
          id: `teacher-${Date.now()}`,
          uid: `teacher-${Date.now()}`,
          name: email.split('@')[0] || 'Teacher',
          email: email.trim(),
          isLoggedIn: true,
        };
        this.saveLocalProfile(fallbackProfile);
        return fallbackProfile;
      }
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password. Please check your credentials or click "New Account" to register.');
      }
      throw new Error(err.message || 'Failed to sign in with email');
    }
  },

  async registerWithEmail(email: string, pass: string, name: string, schoolName?: string): Promise<TeacherProfile> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        try {
          await updateFirebaseProfile(result.user, { displayName: name.trim() });
        } catch (e) {
          console.warn('Could not update displayName:', e);
        }
      }
      return await this.syncFirebaseUser(result.user, {
        name: name.trim() || 'Teacher',
        schoolName: schoolName?.trim() || 'Sunnydale Academy',
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/admin-restricted-operation' ||
        err.code === 'auth/configuration-not-found'
      ) {
        const fallbackProfile: TeacherProfile = {
          ...getDefaultProfile(),
          id: `teacher-${Date.now()}`,
          uid: `teacher-${Date.now()}`,
          name: name.trim() || email.split('@')[0] || 'Teacher',
          email: email.trim(),
          schoolName: schoolName?.trim() || 'Sunnydale Academy',
          isLoggedIn: true,
        };
        this.saveLocalProfile(fallbackProfile);
        return fallbackProfile;
      }
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('This email address is already registered. Please sign in instead.');
      }
      if (err.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      }
      throw new Error(err.message || 'Failed to create account');
    }
  },

  async signInAsGuest(): Promise<TeacherProfile> {
    try {
      const result = await signInAnonymously(auth);
      return await this.syncFirebaseUser(result.user, {
        name: 'Guest Educator',
      });
    } catch (err: any) {
      console.error('Anonymous sign-in error:', err);
      // Fallback to local guest profile with explicit ID
      const guestId = `guest-${Date.now()}`;
      const localGuest: TeacherProfile = {
        ...getDefaultProfile(),
        id: guestId,
        uid: guestId,
        isLoggedIn: true,
        isAnonymous: true,
        name: 'Guest Educator',
      };
      this.saveLocalProfile(localGuest);
      return localGuest;
    }
  },

  async signOut(): Promise<void> {
    try {
      if (firestoreUnsub) {
        firestoreUnsub();
        firestoreUnsub = null;
      }
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Firebase sign out error:', err);
    }
    const defaultProfile = getDefaultProfile();
    this.saveLocalProfile(defaultProfile);
  },

  // Synchronize authenticated Firebase User with Firestore user document
  async syncFirebaseUser(fbUser: FirebaseUser, overrides?: Partial<TeacherProfile>): Promise<TeacherProfile> {
    const uid = fbUser.uid;
    const userDocRef = doc(db, 'users', uid);
    const userEmail = (fbUser.email || '').trim().toLowerCase();
    const isMasterAdmin = isMasterAdminEmail(userEmail);

    let profileData: TeacherProfile;

    try {
      const snapshot = await getDoc(userDocRef);
      const today = getTodayString();

      if (snapshot.exists()) {
        const data = snapshot.data();
        const userIsAdmin = isMasterAdmin || data.role === 'admin' || data.isAdmin === true;
        profileData = {
          id: uid,
          uid,
          name: overrides?.name || data.displayName || fbUser.displayName || currentProfile.name || 'Teacher',
          email: fbUser.email || data.email || '',
          photoURL: fbUser.photoURL || undefined,
          schoolName: overrides?.schoolName || data.schoolName || currentProfile.schoolName || 'Sunnydale Academy',
          gradeLevel: data.gradeLevel || currentProfile.gradeLevel || 'Grade 6',
          role: userIsAdmin ? 'admin' : 'teacher',
          isAdmin: userIsAdmin,
          tier: isMasterAdmin ? 'school' : ((data.tier as UserTier) || 'free'),
          tierExpiresAt: data.tierExpiresAt || null,
          subscriptionId: data.subscriptionId || null,
          paymentProvider: data.paymentProvider || null,
          customApiKey: currentProfile.customApiKey || '',
          isLoggedIn: true,
          isAnonymous: fbUser.isAnonymous,
          dailyUsageCount: data.lastGenerationDate === today ? (data.dailyGenerationsUsed || 0) : 0,
          lastUsageDate: today,
        };

        // Update last sign in and admin attributes
        await setDoc(userDocRef, {
          email: profileData.email,
          displayName: profileData.name,
          role: profileData.role,
          isAdmin: profileData.isAdmin,
          tier: profileData.tier,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } else {
        // Create new user profile in Firestore
        const userIsAdmin = isMasterAdmin;
        profileData = {
          id: uid,
          uid,
          name: overrides?.name || fbUser.displayName || 'Educator',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || undefined,
          schoolName: overrides?.schoolName || 'Sunnydale Academy',
          gradeLevel: 'Grade 6',
          role: userIsAdmin ? 'admin' : 'teacher',
          isAdmin: userIsAdmin,
          tier: isMasterAdmin ? 'school' : 'free',
          tierExpiresAt: null,
          subscriptionId: null,
          paymentProvider: null,
          customApiKey: currentProfile.customApiKey || '',
          isLoggedIn: true,
          isAnonymous: fbUser.isAnonymous,
          dailyUsageCount: 0,
          lastUsageDate: today,
        };

        await setDoc(userDocRef, {
          email: profileData.email,
          displayName: profileData.name,
          schoolName: profileData.schoolName,
          role: profileData.role,
          isAdmin: profileData.isAdmin,
          tier: profileData.tier,
          tierExpiresAt: null,
          subscriptionId: null,
          paymentProvider: null,
          dailyGenerationsUsed: 0,
          lastGenerationDate: today,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      this.saveLocalProfile(profileData);
      this.listenToUserDoc(uid);
      return profileData;
    } catch (err) {
      console.error('Error syncing user with Firestore:', err);
      // Construct fallback profile
      profileData = {
        id: uid,
        uid,
        name: overrides?.name || fbUser.displayName || 'Teacher',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || undefined,
        schoolName: overrides?.schoolName || currentProfile.schoolName || 'Sunnydale Academy',
        gradeLevel: currentProfile.gradeLevel || 'Grade 6',
        role: isMasterAdmin ? 'admin' : (currentProfile.role || 'teacher'),
        isAdmin: isMasterAdmin || currentProfile.isAdmin === true,
        tier: isMasterAdmin ? 'school' : (currentProfile.tier || 'free'),
        tierExpiresAt: currentProfile.tierExpiresAt || null,
        subscriptionId: currentProfile.subscriptionId || null,
        paymentProvider: currentProfile.paymentProvider || null,
        customApiKey: currentProfile.customApiKey || '',
        isLoggedIn: true,
        isAnonymous: fbUser.isAnonymous,
        dailyUsageCount: currentProfile.dailyUsageCount || 0,
        lastUsageDate: getTodayString(),
      };
      this.saveLocalProfile(profileData);
      return profileData;
    }
  },

  // Setup real-time listener for user document in Firestore (for live tier changes, etc.)
  listenToUserDoc(uid: string): void {
    if (firestoreUnsub) {
      firestoreUnsub();
    }
    try {
      const userRef = doc(db, 'users', uid);
      firestoreUnsub = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const today = getTodayString();
          const updated: TeacherProfile = {
            ...currentProfile,
            name: data.displayName || currentProfile.name,
            schoolName: data.schoolName || currentProfile.schoolName,
            gradeLevel: data.gradeLevel || currentProfile.gradeLevel,
            tier: (data.tier as UserTier) || currentProfile.tier,
            tierExpiresAt: data.tierExpiresAt !== undefined ? data.tierExpiresAt : currentProfile.tierExpiresAt,
            subscriptionId: data.subscriptionId !== undefined ? data.subscriptionId : currentProfile.subscriptionId,
            paymentProvider: data.paymentProvider !== undefined ? data.paymentProvider : currentProfile.paymentProvider,
            dailyUsageCount: data.lastGenerationDate === today ? (data.dailyGenerationsUsed || 0) : currentProfile.dailyUsageCount,
          };
          this.saveLocalProfile(updated);
        }
      }, (err) => {
        console.warn('Firestore snapshot error:', err);
      });
    } catch (e) {
      console.warn('Error setting up firestore listener:', e);
    }
  },

  // Admin Status & Privilege Checks
  isAdmin(): boolean {
    const profile = this.getProfile();
    return (
      profile.role === 'admin' ||
      profile.isAdmin === true ||
      isMasterAdminEmail(profile.email)
    );
  },

  // Tier Classification & Entitlements
  getUserTier(): UserTier {
    const profile = this.getProfile();
    // Master administrators and admins automatically receive the top School tier
    if (this.isAdmin()) {
      return 'school';
    }
    // Check if paid tier has expired
    if (profile.tierExpiresAt) {
      const expires = new Date(profile.tierExpiresAt).getTime();
      if (expires < Date.now()) {
        return 'free';
      }
    }
    return profile.tier || 'free';
  },

  isProOrHigher(): boolean {
    if (this.isAdmin()) return true;
    const tier = this.getUserTier();
    return tier === 'pro' || tier === 'school';
  },

  isSchoolTier(): boolean {
    if (this.isAdmin()) return true;
    return this.getUserTier() === 'school';
  },

  // Apply upgraded tier to user account (in Firestore and locally)
  async upgradeUserTier(
    newTier: UserTier,
    subscriptionInfo: {
      subscriptionId: string;
      planId: string;
      provider: 'stripe' | 'paypal' | 'system';
      amount: number;
      expiresAt: string;
    }
  ): Promise<TeacherProfile> {
    const current = this.getProfile();
    const updated: TeacherProfile = {
      ...current,
      tier: newTier,
      tierExpiresAt: subscriptionInfo.expiresAt,
      subscriptionId: subscriptionInfo.subscriptionId,
      paymentProvider: subscriptionInfo.provider === 'system' ? null : subscriptionInfo.provider,
    };

    this.saveLocalProfile(updated);

    // Save in Firestore if user is authenticated
    if (current.uid) {
      try {
        const userRef = doc(db, 'users', current.uid);
        await updateDoc(userRef, {
          tier: newTier,
          tierExpiresAt: subscriptionInfo.expiresAt,
          subscriptionId: subscriptionInfo.subscriptionId,
          paymentProvider: subscriptionInfo.provider,
          updatedAt: new Date().toISOString(),
        });

        // Record in subscriptions collection
        const subCollection = collection(db, 'subscriptions');
        await addDoc(subCollection, {
          userId: current.uid,
          subscriptionId: subscriptionInfo.subscriptionId,
          planId: subscriptionInfo.planId,
          tier: newTier,
          amount: subscriptionInfo.amount,
          currency: 'usd',
          status: 'active',
          provider: subscriptionInfo.provider,
          currentPeriodEnd: subscriptionInfo.expiresAt,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to update subscription in Firestore:', err);
      }
    }

    return updated;
  },

  // Usage and Quota
  recordGenerationUsage(): number {
    const profile = this.getProfile();
    profile.dailyUsageCount = (profile.dailyUsageCount || 0) + 1;
    profile.lastUsageDate = getTodayString();
    this.saveLocalProfile(profile);

    // Sync to Firestore if authenticated
    if (profile.uid) {
      try {
        const userRef = doc(db, 'users', profile.uid);
        updateDoc(userRef, {
          dailyGenerationsUsed: profile.dailyUsageCount,
          lastGenerationDate: profile.lastUsageDate,
          updatedAt: new Date().toISOString(),
        }).catch((e) => console.warn('Usage count sync warning:', e));
      } catch (e) {
        // non-blocking
      }
    }

    return profile.dailyUsageCount;
  },

  getCustomApiKey(): string {
    const profile = this.getProfile();
    return profile.customApiKey || '';
  },

  setCustomApiKey(key: string): void {
    this.updateProfile({ customApiKey: key.trim() });
  },

  clearCustomApiKey(): void {
    this.updateProfile({ customApiKey: '' });
  },

  getRemainingDailyGenerations(): number {
    const profile = this.getProfile();
    // Pro and School tiers have UNLIMITED daily generations
    if (this.isProOrHigher()) {
      return 9999;
    }
    // Users with personal BYOK key also get unlimited
    if (profile.customApiKey && profile.customApiKey.length > 10) {
      return 9999;
    }
    const used = profile.dailyUsageCount || 0;
    return Math.max(0, DAILY_LIMIT - used);
  },

  isSignedIn(): boolean {
    const profile = this.getProfile();
    return Boolean(profile.isLoggedIn);
  },

  getAuthHeaders(): Record<string, string> {
    const profile = this.getProfile();
    const signedIn = this.isSignedIn();
    const userId = profile.uid || profile.id || 'teacher-guest';
    const isAdm = this.isAdmin();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-is-authenticated': signedIn ? 'true' : 'false',
      'x-user-id': signedIn ? userId : '',
      'x-teacher-id': signedIn ? userId : '',
      'x-user-tier': this.getUserTier(),
      'x-user-role': isAdm ? 'admin' : (profile.role || 'teacher'),
    };
    if (signedIn && profile.email) {
      headers['x-user-email'] = profile.email;
    }
    if (profile.customApiKey && profile.customApiKey.length > 5) {
      headers['x-custom-api-key'] = profile.customApiKey;
    }
    return headers;
  },

  // Switch active profile to one of the Master Admin accounts directly (for testing, verification, & master admin access)
  async switchToAdminAccount(email: 'solu24@gmail.com' | 'alferniya.nisha@gmail.com' | 'nishasolu24@gmail.com'): Promise<TeacherProfile> {
    const adminNames: Record<string, string> = {
      'solu24@gmail.com': 'Solu (Master Admin)',
      'alferniya.nisha@gmail.com': 'Alferniya Nisha (Master Admin)',
      'nishasolu24@gmail.com': 'Nisha Solu (Master Admin)',
    };
    const sanitizedId = `admin-${email.replace(/[@.]/g, '-')}`;
    const updated: TeacherProfile = {
      ...this.getProfile(),
      id: sanitizedId,
      uid: sanitizedId,
      name: adminNames[email] || 'Master Administrator',
      email: email,
      schoolName: 'Global Administration & District Oversight',
      gradeLevel: 'District Superintendent / Admin',
      role: 'admin',
      isAdmin: true,
      tier: 'school',
      tierExpiresAt: null,
      isLoggedIn: true,
      dailyUsageCount: 0,
    };
    this.saveLocalProfile(updated);

    try {
      const userRef = doc(db, 'users', sanitizedId);
      await setDoc(userRef, {
        email: updated.email,
        displayName: updated.name,
        schoolName: updated.schoolName,
        role: 'admin',
        isAdmin: true,
        tier: 'school',
        dailyGenerationsUsed: 0,
        lastGenerationDate: getTodayString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Could not persist admin account switch to Firestore:', e);
    }

    return updated;
  },

  // Fetch all registered users for the Admin Management Portal
  async fetchAdminUsers(): Promise<Array<{
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
  }>> {
    const usersMap = new Map<string, any>();

    // 1. Ensure all 3 Master Admin accounts are listed with priority
    const masterAdminSeed = [
      {
        email: 'solu24@gmail.com',
        name: 'Solu (Master Admin)',
        school: 'Global Administration & District Oversight',
      },
      {
        email: 'alferniya.nisha@gmail.com',
        name: 'Alferniya Nisha (Master Admin)',
        school: 'Global Administration & District Oversight',
      },
      {
        email: 'nishasolu24@gmail.com',
        name: 'Nisha Solu (Master Admin)',
        school: 'Global Administration & District Oversight',
      },
    ];

    for (const admin of masterAdminSeed) {
      const id = `admin-${admin.email.replace(/[@.]/g, '-')}`;
      usersMap.set(admin.email.toLowerCase(), {
        id,
        email: admin.email,
        displayName: admin.name,
        schoolName: admin.school,
        role: 'admin',
        isAdmin: true,
        tier: 'school',
        dailyGenerationsUsed: 0,
        lastGenerationDate: getTodayString(),
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
        isMasterAdmin: true,
      });
    }

    // 2. Include active profile
    const current = this.getProfile();
    if (current.email) {
      const isMaster = isMasterAdminEmail(current.email);
      usersMap.set(current.email.toLowerCase(), {
        id: current.uid || current.id,
        email: current.email,
        displayName: current.name,
        schoolName: current.schoolName,
        role: (current.role === 'admin' || isMaster) ? 'admin' : 'teacher',
        isAdmin: isMaster || current.isAdmin === true,
        tier: isMaster ? 'school' : current.tier,
        dailyGenerationsUsed: current.dailyUsageCount || 0,
        lastGenerationDate: current.lastUsageDate,
        createdAt: '2025-01-15T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
        isMasterAdmin: isMaster,
      });
    }

    // 3. Query all live documents from Firestore
    try {
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);
      snapshot.forEach((d) => {
        const data = d.data();
        const email = (data.email || '').toLowerCase().trim();
        const isMaster = isMasterAdminEmail(email);
        const record = {
          id: d.id,
          email: data.email || 'No email provided',
          displayName: data.displayName || data.name || 'Educator',
          schoolName: data.schoolName || 'District School',
          role: (data.role === 'admin' || isMaster) ? 'admin' : 'teacher',
          isAdmin: isMaster || Boolean(data.isAdmin) || data.role === 'admin',
          tier: isMaster ? 'school' : ((data.tier as UserTier) || 'free'),
          dailyGenerationsUsed: data.dailyGenerationsUsed || 0,
          lastGenerationDate: data.lastGenerationDate || getTodayString(),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          isMasterAdmin: isMaster,
        };
        if (email) {
          usersMap.set(email, record);
        } else {
          usersMap.set(d.id, record);
        }
      });
    } catch (err) {
      console.warn('Could not query Firestore users collection (fallback to local/master list):', err);
    }

    return Array.from(usersMap.values());
  },

  // Admin action: Change a user's tier
  async adminUpdateUserTier(userId: string, userEmail: string, newTier: UserTier): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        tier: newTier,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      const current = this.getProfile();
      if (current.uid === userId || (current.email && current.email.toLowerCase() === userEmail.toLowerCase())) {
        this.saveLocalProfile({
          ...current,
          tier: newTier,
        });
      }
      return true;
    } catch (e) {
      console.error('Failed to update user tier in Firestore:', e);
      return false;
    }
  },

  // Admin action: Reset quota for a user to 0 used
  async adminResetUserQuota(userId: string, userEmail: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        dailyGenerationsUsed: 0,
        lastGenerationDate: getTodayString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      const current = this.getProfile();
      if (current.uid === userId || (current.email && current.email.toLowerCase() === userEmail.toLowerCase())) {
        this.saveLocalProfile({
          ...current,
          dailyUsageCount: 0,
          lastUsageDate: getTodayString(),
        });
      }
      return true;
    } catch (e) {
      console.error('Failed to reset user quota in Firestore:', e);
      return false;
    }
  },

  // Admin action: Toggle user role between teacher and admin
  async adminUpdateUserRole(userId: string, newRole: 'teacher' | 'admin'): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        role: newRole,
        isAdmin: newRole === 'admin',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch (e) {
      console.error('Failed to update user role:', e);
      return false;
    }
  },

  // Admin action: Delete a user document from Firestore
  async adminDeleteUser(userId: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      return true;
    } catch (e) {
      console.error('Failed to delete user document from Firestore:', e);
      return false;
    }
  },

  async fetchQuotaStatus(): Promise<UserQuotaStatus> {
    try {
      const resp = await fetch('/api/quota-status', {
        headers: this.getAuthHeaders(),
      });
      const contentType = resp.headers.get('content-type') || '';
      if (resp.ok && contentType.includes('application/json')) {
        const data = await resp.json();
        return {
          ...data,
          userTier: this.getUserTier(),
        };
      }
    } catch (err) {
      console.warn('Could not fetch server quota status:', err);
    }

    // Fallback calculation
    const profile = this.getProfile();
    const tier = this.getUserTier();
    const isUnlimited = this.isProOrHigher() || Boolean(profile.customApiKey);
    const remaining = isUnlimited ? 9999 : Math.max(0, DAILY_LIMIT - (profile.dailyUsageCount || 0));

    return {
      dailyLimit: isUnlimited ? 9999 : DAILY_LIMIT,
      usedToday: profile.dailyUsageCount || 0,
      remainingToday: remaining,
      cooldownSecondsRemaining: 0,
      cachedTopicsCount: 0,
      hasCustomKey: Boolean(profile.customApiKey),
      serverFreeTierActive: true,
      userTier: tier,
    };
  },

  async validateCustomApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
    try {
      const resp = await fetch('/api/validate-custom-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        return {
          valid: Boolean(data.valid),
          message: data.message || (data.valid ? 'API Key verified successfully!' : 'Invalid API Key'),
        };
      }
      // Direct client validation if endpoint is offline or static host
      if (apiKey && apiKey.startsWith('AIzaSy') && apiKey.length >= 35) {
        return { valid: true, message: 'Valid Gemini API Key format detected!' };
      }
      return { valid: false, message: 'Please provide a valid Gemini API Key from Google AI Studio' };
    } catch (err: any) {
      if (apiKey && apiKey.startsWith('AIzaSy') && apiKey.length >= 35) {
        return { valid: true, message: 'Valid Gemini API Key format detected!' };
      }
      return {
        valid: false,
        message: err.message || 'Network error while checking API Key',
      };
    }
  },
};

// Initialize Firebase Auth listener on app boot
onAuthStateChanged(auth, async (fbUser) => {
  if (fbUser) {
    try {
      await authService.syncFirebaseUser(fbUser);
    } catch (err) {
      console.warn('Error onAuthStateChanged sync:', err);
    }
  }
});
