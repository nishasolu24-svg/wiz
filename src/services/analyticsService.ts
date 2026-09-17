import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  increment,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeFetchJson } from '../utils/apiHelper';

export interface SiteAnalyticsStats {
  totalVisits: number;
  todayVisits: number;
  uniqueVisitors: number;
  worksheetsGenerated: number;
  worksheetsGeneratedToday: number;
  activeSessions: number;
  lastUpdated: string;
}

const DEFAULT_STATS: SiteAnalyticsStats = {
  totalVisits: 0,
  todayVisits: 0,
  uniqueVisitors: 0,
  worksheetsGenerated: 0,
  worksheetsGeneratedToday: 0,
  activeSessions: 1,
  lastUpdated: new Date().toISOString(),
};

class AnalyticsService {
  private stats: SiteAnalyticsStats = DEFAULT_STATS;
  private listeners: Set<(stats: SiteAnalyticsStats) => void> = new Set();
  private modalListeners: Set<(isOpen: boolean) => void> = new Set();
  private isModalOpen = false;
  private hasTrackedThisSession = false;
  private firestoreUnsubscribe: Unsubscribe | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wizsheet_site_stats');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.totalVisits === 'number') {
            this.stats = {
              totalVisits: Math.max(0, parsed.totalVisits || 0),
              todayVisits: Math.max(0, parsed.todayVisits || 0),
              uniqueVisitors: Math.max(0, parsed.uniqueVisitors || 0),
              worksheetsGenerated: Math.max(0, parsed.worksheetsGenerated || 0),
              worksheetsGeneratedToday: Math.max(0, parsed.worksheetsGeneratedToday || 0),
              activeSessions: Math.max(1, parsed.activeSessions || 1),
              lastUpdated: parsed.lastUpdated || new Date().toISOString(),
            };
          }
        }
      } catch {
        // ignore
      }
      this.initFirestoreListener();
      this.initSessionTracking();
    }
  }

  /**
   * Listen in real-time to Google Cloud Firestore analytics document.
   * Ensures all teachers and visitors across all browsers and devices see live synchronized numbers.
   */
  private initFirestoreListener() {
    if (!db) return;
    try {
      const platformDocRef = doc(db, 'analytics', 'platform');
      this.firestoreUnsubscribe = onSnapshot(
        platformDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const todayStr = new Date().toISOString().slice(0, 10);
            const isDifferentDay = data.currentDay && data.currentDay !== todayStr;

            this.stats = {
              totalVisits: Math.max(this.stats.totalVisits, Number(data.totalVisits) || 0),
              todayVisits: isDifferentDay ? 1 : Math.max(0, Number(data.todayVisits) || 0),
              uniqueVisitors: Math.max(this.stats.uniqueVisitors, Number(data.uniqueVisitors) || 0),
              worksheetsGenerated: Math.max(this.stats.worksheetsGenerated, Number(data.worksheetsGenerated) || 0),
              worksheetsGeneratedToday: isDifferentDay ? 0 : Math.max(0, Number(data.worksheetsGeneratedToday) || 0),
              activeSessions: Math.max(1, Number(data.activeSessions) || 1),
              lastUpdated: data.lastUpdated || new Date().toISOString(),
            };
            this.saveLocalStats();
            this.notifyListeners();
          } else {
            // First time bootstrapping Firestore analytics document
            this.bootstrapFirestoreDoc();
          }
        },
        (error) => {
          console.warn('Firestore analytics subscription notice:', error.message);
          // Non-blocking fallback to HTTP API
          this.fetchLiveStats();
        }
      );
    } catch (err) {
      console.warn('Could not initialize Firestore listener:', err);
    }
  }

  private async bootstrapFirestoreDoc() {
    if (!db) return;
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      await setDoc(
        doc(db, 'analytics', 'platform'),
        {
          totalVisits: Math.max(1, this.stats.totalVisits),
          todayVisits: Math.max(1, this.stats.todayVisits),
          worksheetsGenerated: this.stats.worksheetsGenerated,
          worksheetsGeneratedToday: this.stats.worksheetsGeneratedToday,
          uniqueVisitors: Math.max(1, this.stats.uniqueVisitors),
          activeSessions: 1,
          currentDay: todayStr,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      // ignore
    }
  }

  private saveLocalStats() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('wizsheet_site_stats', JSON.stringify(this.stats));
    } catch {
      // ignore
    }
  }

  private async initSessionTracking() {
    if (typeof window === 'undefined') return;

    // Check unique visitor UUID in localStorage (persists across sessions)
    let visitorUuid = localStorage.getItem('wizsheet_visitor_uuid');
    const isNewUniqueVisitor = !visitorUuid;
    if (isNewUniqueVisitor) {
      visitorUuid = `vis-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      try {
        localStorage.setItem('wizsheet_visitor_uuid', visitorUuid);
      } catch {
        // ignore
      }
    }

    // Check session token in sessionStorage (expires when tab/browser closes)
    const sessionToken = sessionStorage.getItem('wizsheet_session_id');
    const isNewSession = !sessionToken;
    const currentToken = sessionToken || `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (isNewSession) {
      try {
        sessionStorage.setItem('wizsheet_session_id', currentToken);
      } catch {
        // ignore
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    // Only record visit increment once per browser session
    if (isNewSession && !this.hasTrackedThisSession) {
      this.hasTrackedThisSession = true;

      // 1. Atomically record visit in Google Cloud Firestore
      if (db) {
        try {
          const platformDocRef = doc(db, 'analytics', 'platform');
          const snap = await getDoc(platformDocRef);
          const data = snap.exists() ? snap.data() : null;
          const isNewDay = !data || data.currentDay !== todayStr;

          await setDoc(
            platformDocRef,
            {
              totalVisits: increment(1),
              todayVisits: isNewDay ? 1 : increment(1),
              worksheetsGeneratedToday: isNewDay ? 0 : (data?.worksheetsGeneratedToday ?? 0),
              uniqueVisitors: isNewUniqueVisitor ? increment(1) : (data?.uniqueVisitors ?? increment(0)),
              currentDay: todayStr,
              lastUpdated: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (firestoreErr) {
          console.warn('Firestore visit tracking non-blocking warning:', firestoreErr);
        }
      }

      // 2. Optimistic local increment
      this.stats = {
        ...this.stats,
        totalVisits: (this.stats.totalVisits || 0) + 1,
        todayVisits: (this.stats.todayVisits || 0) + 1,
        uniqueVisitors: isNewUniqueVisitor ? (this.stats.uniqueVisitors || 0) + 1 : this.stats.uniqueVisitors,
        lastUpdated: new Date().toISOString(),
      };
      this.saveLocalStats();
      this.notifyListeners();

      // 3. Ping backend analytics API for server-side cache & logging
      try {
        const resp = await safeFetchJson<{ success?: boolean; stats?: SiteAnalyticsStats }>('/api/analytics/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentToken }),
        });
        if (resp.isJson && resp.data?.stats) {
          // Merge whichever has the higher count to ensure accuracy
          this.stats = {
            totalVisits: Math.max(this.stats.totalVisits, resp.data.stats.totalVisits || 0),
            todayVisits: Math.max(this.stats.todayVisits, resp.data.stats.todayVisits || 0),
            uniqueVisitors: Math.max(this.stats.uniqueVisitors, resp.data.stats.uniqueVisitors || 0),
            worksheetsGenerated: Math.max(this.stats.worksheetsGenerated, resp.data.stats.worksheetsGenerated || 0),
            worksheetsGeneratedToday: Math.max(this.stats.worksheetsGeneratedToday, resp.data.stats.worksheetsGeneratedToday || 0),
            activeSessions: Math.max(1, resp.data.stats.activeSessions || 1),
            lastUpdated: resp.data.stats.lastUpdated || new Date().toISOString(),
          };
          this.saveLocalStats();
          this.notifyListeners();
        }
      } catch (err) {
        // non-blocking
      }
    }
  }

  public async fetchLiveStats(): Promise<SiteAnalyticsStats> {
    // 1. Try Firestore first
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'analytics', 'platform'));
        if (snap.exists()) {
          const data = snap.data();
          this.stats = {
            totalVisits: Math.max(this.stats.totalVisits, Number(data.totalVisits) || 0),
            todayVisits: Math.max(0, Number(data.todayVisits) || 0),
            uniqueVisitors: Math.max(this.stats.uniqueVisitors, Number(data.uniqueVisitors) || 0),
            worksheetsGenerated: Math.max(this.stats.worksheetsGenerated, Number(data.worksheetsGenerated) || 0),
            worksheetsGeneratedToday: Math.max(0, Number(data.worksheetsGeneratedToday) || 0),
            activeSessions: Math.max(1, Number(data.activeSessions) || 1),
            lastUpdated: data.lastUpdated || new Date().toISOString(),
          };
          this.saveLocalStats();
          this.notifyListeners();
          return this.stats;
        }
      } catch (e) {
        // ignore
      }
    }

    // 2. Try Backend API
    try {
      const resp = await safeFetchJson<SiteAnalyticsStats>('/api/analytics/stats');
      if (resp.isJson && resp.data) {
        this.stats = {
          totalVisits: typeof resp.data.totalVisits === 'number' ? Math.max(this.stats.totalVisits, resp.data.totalVisits) : this.stats.totalVisits,
          todayVisits: typeof resp.data.todayVisits === 'number' ? Math.max(this.stats.todayVisits, resp.data.todayVisits) : this.stats.todayVisits,
          uniqueVisitors: typeof resp.data.uniqueVisitors === 'number' ? Math.max(this.stats.uniqueVisitors, resp.data.uniqueVisitors) : this.stats.uniqueVisitors,
          worksheetsGenerated: typeof resp.data.worksheetsGenerated === 'number' ? Math.max(this.stats.worksheetsGenerated, resp.data.worksheetsGenerated) : this.stats.worksheetsGenerated,
          worksheetsGeneratedToday: typeof resp.data.worksheetsGeneratedToday === 'number' ? Math.max(this.stats.worksheetsGeneratedToday, resp.data.worksheetsGeneratedToday) : this.stats.worksheetsGeneratedToday,
          activeSessions: typeof resp.data.activeSessions === 'number' ? resp.data.activeSessions : this.stats.activeSessions,
          lastUpdated: resp.data.lastUpdated || new Date().toISOString(),
        };
        this.saveLocalStats();
        this.notifyListeners();
        return this.stats;
      }
    } catch (e) {
      // ignore
    }
    return this.stats;
  }

  /**
   * Called whenever a questionnaire/worksheet is created or differentiated.
   * Atomically increments Firestore counters and notifies backend & UI listeners.
   */
  public async recordWorksheetCreated() {
    // 1. Optimistic instant local update
    this.stats = {
      ...this.stats,
      worksheetsGenerated: (this.stats.worksheetsGenerated || 0) + 1,
      worksheetsGeneratedToday: (this.stats.worksheetsGeneratedToday || 0) + 1,
      lastUpdated: new Date().toISOString(),
    };
    this.saveLocalStats();
    this.notifyListeners();

    const todayStr = new Date().toISOString().slice(0, 10);

    // 2. Atomically persist to Firestore
    if (db) {
      try {
        await setDoc(
          doc(db, 'analytics', 'platform'),
          {
            worksheetsGenerated: increment(1),
            worksheetsGeneratedToday: increment(1),
            currentDay: todayStr,
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore worksheet count increment warning:', err);
      }
    }

    // 3. Notify backend API
    try {
      const resp = await safeFetchJson<{ success?: boolean; stats?: SiteAnalyticsStats }>('/api/analytics/track-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (resp.isJson && resp.data?.stats) {
        this.stats = {
          totalVisits: Math.max(this.stats.totalVisits, resp.data.stats.totalVisits || 0),
          todayVisits: Math.max(this.stats.todayVisits, resp.data.stats.todayVisits || 0),
          uniqueVisitors: Math.max(this.stats.uniqueVisitors, resp.data.stats.uniqueVisitors || 0),
          worksheetsGenerated: Math.max(this.stats.worksheetsGenerated, resp.data.stats.worksheetsGenerated || 0),
          worksheetsGeneratedToday: Math.max(this.stats.worksheetsGeneratedToday, resp.data.stats.worksheetsGeneratedToday || 0),
          activeSessions: Math.max(1, resp.data.stats.activeSessions || 1),
          lastUpdated: resp.data.stats.lastUpdated || new Date().toISOString(),
        };
        this.saveLocalStats();
        this.notifyListeners();
      }
    } catch {
      // non-blocking
    }
  }

  public getStats(): SiteAnalyticsStats {
    return this.stats;
  }

  public subscribe(listener: (stats: SiteAnalyticsStats) => void): () => void {
    this.listeners.add(listener);
    listener(this.stats);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn(this.stats));
  }

  // Global Analytics Modal Controls (allows any button anywhere in the app to open the live usage modal)
  public openModal() {
    this.isModalOpen = true;
    this.notifyModalListeners();
  }

  public closeModal() {
    this.isModalOpen = false;
    this.notifyModalListeners();
  }

  public getIsModalOpen(): boolean {
    return this.isModalOpen;
  }

  public subscribeModal(listener: (isOpen: boolean) => void): () => void {
    this.modalListeners.add(listener);
    listener(this.isModalOpen);
    return () => {
      this.modalListeners.delete(listener);
    };
  }

  private notifyModalListeners() {
    this.modalListeners.forEach((fn) => fn(this.isModalOpen));
  }

  // Join Paid Tiers Launch Waitlist
  public async joinWaitlist(email: string, planInterest: 'pro' | 'school' = 'pro'): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    // 1. Send to server
    try {
      await safeFetchJson('/api/analytics/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, planInterest }),
      });
    } catch (e) {
      // non-blocking
    }

    // 2. Persist to Firestore if available
    try {
      if (db) {
        await addDoc(collection(db, 'waitlist'), {
          email: cleanEmail,
          planInterest,
          createdAt: new Date().toISOString(),
          source: 'web_pricing_modal',
        });
      }
    } catch (err) {
      console.warn('Firestore waitlist save error:', err);
    }

    // 3. Save locally in localStorage for persistent client state
    try {
      const waitlist = JSON.parse(localStorage.getItem('wizsheet_waitlist_registered') || '[]');
      if (!waitlist.includes(cleanEmail)) {
        waitlist.push(cleanEmail);
        localStorage.setItem('wizsheet_waitlist_registered', JSON.stringify(waitlist));
      }
    } catch (e) {
      // ignore
    }

    return {
      success: true,
      message: "You're on the early bird waitlist! We'll email you the moment paid tiers launch with an exclusive 20% discount.",
    };
  }

  public isEmailOnWaitlist(email: string): boolean {
    if (!email) return false;
    try {
      const waitlist = JSON.parse(localStorage.getItem('wizsheet_waitlist_registered') || '[]');
      return waitlist.includes(email.trim().toLowerCase());
    } catch {
      return false;
    }
  }
}

export const analyticsService = new AnalyticsService();

