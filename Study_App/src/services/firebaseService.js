// services/firebaseService.js
// Note: You'll need to install firebase: npm install firebase

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { storageService } from './storageService';

// Firebase configuration - Replace with your config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.user = null;
    this.listeners = new Map();
    this.syncEnabled = false;
  }

  /**
   * Initialize Firebase services
   */
  async initialize() {
    try {
      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
      
      // Set up auth state listener
      onAuthStateChanged(this.auth, (user) => {
        this.user = user;
        if (user) {
          console.log('Firebase user authenticated:', user.uid);
          this.syncEnabled = true;
          this.syncPendingData();
        } else {
          console.log('Firebase user signed out');
          this.syncEnabled = false;
        }
      });

      return true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      return false;
    }
  }

  /**
   * Sign in user anonymously
   */
  async signInAnonymously() {
    try {
      const result = await signInAnonymously(this.auth);
      console.log('Anonymous sign-in successful:', result.user.uid);
      return result.user;
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Get user document reference
   */
  getUserDocRef(collection) {
    if (!this.user) throw new Error('User not authenticated');
    return doc(this.db, collection, this.user.uid);
  }

  /**
   * Get user subcollection reference
   */
  getUserCollectionRef(collection) {
    if (!this.user) throw new Error('User not authenticated');
    return collection(this.db, 'users', this.user.uid, collection);
  }

  // ===== SYNC OPERATIONS =====

  /**
   * Sync study sessions to Firebase
   */
  async syncSessions(sessions) {
    if (!this.syncEnabled) return false;

    try {
      const userDocRef = this.getUserDocRef('users');
      await setDoc(userDocRef, {
        sessions: sessions,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      }, { merge: true });

      console.log('Sessions synced to Firebase');
      return true;
    } catch (error) {
      console.error('Failed to sync sessions:', error);
      return false;
    }
  }

  /**
   * Sync user preferences to Firebase
   */
  async syncPreferences(preferences) {
    if (!this.syncEnabled) return false;

    try {
      const userDocRef = this.getUserDocRef('users');
      await setDoc(userDocRef, {
        preferences: preferences,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      console.log('Preferences synced to Firebase');
      return true;
    } catch (error) {
      console.error('Failed to sync preferences:', error);
      return false;
    }
  }

  /**
   * Sync streak data to Firebase
   */
  async syncStreakData(streakData) {
    if (!this.syncEnabled) return false;

    try {
      const userDocRef = this.getUserDocRef('users');
      await setDoc(userDocRef, {
        streakData: streakData,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      console.log('Streak data synced to Firebase');
      return true;
    } catch (error) {
      console.error('Failed to sync streak data:', error);
      return false;
    }
  }

  /**
   * Load data from Firebase
   */
  async loadFromFirebase() {
    if (!this.syncEnabled) return null;

    try {
      const userDocRef = this.getUserDocRef('users');
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Data loaded from Firebase');
        return {
          sessions: data.sessions || [],
          preferences: data.preferences || null,
          streakData: data.streakData || null,
          lastUpdated: data.lastUpdated
        };
      } else {
        console.log('No Firebase data found for user');
        return null;
      }
    } catch (error) {
      console.error('Failed to load from Firebase:', error);
      return null;
    }
  }

  /**
   * Sync pending data from storage service
   */
  async syncPendingData() {
    if (!this.syncEnabled) return;

    try {
      const syncStatus = await storageService.getFirebaseSyncStatus();
      
      if (syncStatus.syncQueue.length > 0) {
        console.log(`Syncing ${syncStatus.syncQueue.length} pending items`);
        
        for (const item of syncStatus.syncQueue) {
          switch (item.dataType) {
            case 'sessions':
              await this.syncSessions(item.data);
              break;
            case 'preferences':
              await this.syncPreferences(item.data);
              break;
            case 'streak':
              await this.syncStreakData(item.data);
              break;
          }
        }

        // Clear sync queue after successful sync
        await storageService.saveFirebaseSyncStatus({
          ...syncStatus,
          syncQueue: [],
          lastSync: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to sync pending data:', error);
    }
  }

  /**
   * Set up real-time listeners for data changes
   */
  setupRealtimeSync() {
    if (!this.syncEnabled) return;

    try {
      const userDocRef = this.getUserDocRef('users');
      
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log('Firebase data updated, syncing locally...');
          this.handleRemoteDataUpdate(data);
        }
      });

      this.listeners.set('userData', unsubscribe);
    } catch (error) {
      console.error('Failed to setup realtime sync:', error);
    }
  }

  /**
   * Handle remote data updates
   */
  async handleRemoteDataUpdate(remoteData) {
    try {
      // Get local timestamps
      const localSessions = await storageService.getAllSessions();
      const localPrefs = await storageService.getUserPreferences();
      
      // Simple conflict resolution: use latest timestamp
      const localUpdate = localSessions.length > 0 ? 
        Math.max(...localSessions.map(s => new Date(s.startTime).getTime())) : 0;
      const remoteUpdate = new Date(remoteData.lastUpdated).getTime();
      
      if (remoteUpdate > localUpdate) {
        console.log('Remote data is newer, updating local storage');
        
        if (remoteData.sessions) {
          await this.mergeSessionData(remoteData.sessions);
        }
        
        if (remoteData.preferences) {
          await storageService.saveUserPreferences(remoteData.preferences);
        }
        
        if (remoteData.streakData) {
          await storageService.saveStreakData(remoteData.streakData);
        }
      }
    } catch (error) {
      console.error('Failed to handle remote data update:', error);
    }
  }

  /**
   * Merge session data intelligently
   */
  async mergeSessionData(remoteSessions) {
    try {
      const localSessions = await storageService.getAllSessions();
      const localSessionIds = new Set(localSessions.map(s => s.id));
      
      // Add new remote sessions
      const newSessions = remoteSessions.filter(session => 
        !localSessionIds.has(session.id)
      );
      
      if (newSessions.length > 0) {
        const mergedSessions = [...localSessions, ...newSessions];
        await storageService.saveAllSessions(mergedSessions);
        console.log(`Merged ${newSessions.length} new sessions from remote`);
      }
    } catch (error) {
      console.error('Failed to merge session data:', error);
    }
  }

  /**
   * Enable/disable sync
   */
  async enableSync(enable = true) {
    try {
      if (enable && !this.user) {
        await this.signInAnonymously();
      }
      
      const syncStatus = await storageService.getFirebaseSyncStatus();
      syncStatus.enabled = enable;
      syncStatus.userId = this.user?.uid || null;
      
      await storageService.saveFirebaseSyncStatus(syncStatus);
      
      if (enable) {
        this.setupRealtimeSync();
        await this.syncAllData();
      } else {
        this.removeAllListeners();
      }
      
      this.syncEnabled = enable;
      return true;
    } catch (error) {
      console.error('Failed to toggle sync:', error);
      return false;
    }
  }

  /**
   * Sync all local data to Firebase
   */
  async syncAllData() {
    if (!this.syncEnabled) return false;

    try {
      const [sessions, preferences, streakData] = await Promise.all([
        storageService.getAllSessions(),
        storageService.getUserPreferences(),
        storageService.getStreakData()
      ]);

      await Promise.all([
        this.syncSessions(sessions),
        this.syncPreferences(preferences),
        this.syncStreakData(streakData)
      ]);

      console.log('All data synced to Firebase');
      return true;
    } catch (error) {
      console.error('Failed to sync all data:', error);
      return false;
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      enabled: this.syncEnabled,
      authenticated: !!this.user,
      userId: this.user?.uid || null,
      listeners: this.listeners.size
    };
  }

  /**
   * Cleanup on app close
   */
  cleanup() {
    this.removeAllListeners();
    if (this.auth) {
      this.auth.signOut();
    }
  }
}

export const firebaseService = new FirebaseService();