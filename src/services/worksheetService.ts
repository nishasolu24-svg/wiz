import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Worksheet, TeacherProfile } from '../types';

export function getUserStorageKey(profile?: TeacherProfile | null): string {
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  if (profile?.uid) return profile.uid;
  if (profile?.isLoggedIn && profile.email) {
    return profile.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  if (profile?.id) return profile.id;
  return 'guest';
}

function getLocalKey(userKey: string): string {
  return `wizsheet_user_${userKey}_worksheets`;
}

export const worksheetService = {
  /**
   * Fetch all worksheets owned by the specified user.
   * Prioritizes Firestore for authenticated users, with fallback to user-scoped localStorage.
   */
  async getUserWorksheets(userKey: string): Promise<Worksheet[]> {
    const localKey = getLocalKey(userKey);

    // If user is authenticated in Firebase, attempt Firestore query
    if (auth.currentUser && auth.currentUser.uid === userKey) {
      try {
        const q = query(
          collection(db, 'worksheets'),
          where('userId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const list: Worksheet[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.data) {
            try {
              const parsed = JSON.parse(data.data);
              list.push(parsed);
            } catch {
              list.push(data as unknown as Worksheet);
            }
          } else if (data.title && Array.isArray(data.questions)) {
            list.push(data as unknown as Worksheet);
          }
        });

        // Sync fresh list from Firestore to user's local storage
        try {
          localStorage.setItem(localKey, JSON.stringify(list));
        } catch (storageErr) {
          console.warn('Could not cache worksheets to localStorage:', storageErr);
        }

        return list;
      } catch (firestoreErr) {
        console.warn('Firestore fetch failed, falling back to local storage:', firestoreErr);
      }
    }

    // Fallback: read from user-scoped localStorage
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading worksheets from local storage:', e);
    }

    // New users or empty accounts start completely empty
    return [];
  },

  /**
   * Save or update a worksheet for the specific user.
   * Writes to user-scoped localStorage and Firestore (if authenticated).
   */
  async saveUserWorksheet(worksheet: Worksheet, userKey: string): Promise<void> {
    const localKey = getLocalKey(userKey);
    const stampedWorksheet: Worksheet = {
      ...worksheet,
      userId: userKey,
    };

    // 1. Update user-scoped localStorage
    try {
      const stored = localStorage.getItem(localKey);
      let list: Worksheet[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      const existsIndex = list.findIndex((w) => w.id === stampedWorksheet.id);
      if (existsIndex >= 0) {
        list[existsIndex] = stampedWorksheet;
      } else {
        list = [stampedWorksheet, ...list];
      }
      localStorage.setItem(localKey, JSON.stringify(list));
    } catch (storageErr) {
      console.error('Error saving worksheet to local storage:', storageErr);
    }

    // 2. If authenticated in Firebase, save directly to Firestore
    if (auth.currentUser && (auth.currentUser.uid === userKey || userKey === 'guest')) {
      try {
        const docRef = doc(db, 'worksheets', stampedWorksheet.id);
        await setDoc(docRef, {
          id: stampedWorksheet.id,
          userId: auth.currentUser.uid,
          title: stampedWorksheet.title || 'Untitled Questionnaire',
          subject: stampedWorksheet.subject || 'General',
          gradeLevel: stampedWorksheet.gradeLevel || 'Standard',
          topic: stampedWorksheet.title || '',
          data: JSON.stringify(stampedWorksheet),
          createdAt: stampedWorksheet.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (firestoreErr) {
        console.warn('Could not sync worksheet to Firestore:', firestoreErr);
      }
    }
  },

  /**
   * Delete a worksheet from user's storage and Firestore.
   */
  async deleteUserWorksheet(worksheetId: string, userKey: string): Promise<void> {
    const localKey = getLocalKey(userKey);

    // 1. Remove from user-scoped localStorage
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const list: Worksheet[] = JSON.parse(stored);
        if (Array.isArray(list)) {
          const updated = list.filter((w) => w.id !== worksheetId);
          localStorage.setItem(localKey, JSON.stringify(updated));
        }
      }
    } catch (storageErr) {
      console.error('Error deleting worksheet from local storage:', storageErr);
    }

    // 2. If authenticated in Firebase, remove from Firestore
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'worksheets', worksheetId));
      } catch (firestoreErr) {
        console.warn('Could not delete worksheet from Firestore:', firestoreErr);
      }
    }
  },
};
