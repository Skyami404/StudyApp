// services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  SESSIONS: '@focus_app_sessions',
  USER_PREFERENCES: '@focus_app_preferences',
  STREAK_DATA: '@focus_app_streak',
  CALENDAR_SETTINGS: '@focus_app_calendar',
  FIREBASE_SYNC: '@focus_app_firebase_sync'
};

class StorageService {
  
  // ===== SESSION MANAGEMENT =====
  
  async saveSession(session) {
    try {
      const sessions = await this.getAllSessions();
      sessions.push(session);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      
      // Trigger Firebase sync if enabled
      await this.syncToFirebase('sessions', sessions);
      
      return session;
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  async getAllSessions() {
    try {
      const sessionsJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  async getTodaysSessions() {
    try {
      const sessions = await this.getAllSessions();
      const today = new Date().toISOString().split('T')[0];
      
      return sessions.filter(session => session.date === today);
    } catch (error) {
      console.error('Failed to get today\'s sessions:', error);
      return [];
    }
  }

  async getWeeklySessions() {
    try {
      const sessions = await this.getAllSessions();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      return sessions.filter(session => 
        new Date(session.startTime) >= weekAgo
      );
    } catch (error) {
      console.error('Failed to get weekly sessions:', error);
      return [];
    }
  }

  async deleteSession(sessionId) {
    try {
      const sessions = await this.getAllSessions();
      const filteredSessions = sessions.filter(session => session.id !== sessionId);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filteredSessions));
      
      // Sync to Firebase
      await this.syncToFirebase('sessions', filteredSessions);
      
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  // ===== USER PREFERENCES =====

  async saveUserPreferences(preferences) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      await this.syncToFirebase('preferences', preferences);
      return preferences;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  }

  async getUserPreferences() {
    try {
      const prefsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      const defaultPrefs = {
        soundEnabled: true,
        defaultSound: 'rain',
        volume: 0.7,
        hapticFeedback: true,
        defaultStudyMethod: 'pomodoro',
        reminderEnabled: true,
        reminderTime: '09:00',
        theme: 'light'
      };
      
      return prefsJson ? { ...defaultPrefs, ...JSON.parse(prefsJson) } : defaultPrefs;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  getDefaultPreferences() {
    return {
      soundEnabled: true,
      defaultSound: 'rain',
      volume: 0.7,
      hapticFeedback: true,
      defaultStudyMethod: 'pomodoro',
      reminderEnabled: true,
      reminderTime: '09:00',
      theme: 'light'
    };
  }

  async updatePreference(key, value) {
    try {
      const preferences = await this.getUserPreferences();
      preferences[key] = value;
      await this.saveUserPreferences(preferences);
      return preferences;
    } catch (error) {
      console.error('Failed to update preference:', error);
      throw error;
    }
  }

  // ===== STREAK MANAGEMENT =====

  async saveStreakData(streakData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(streakData));
      await this.syncToFirebase('streak', streakData);
      return streakData;
    } catch (error) {
      console.error('Failed to save streak data:', error);
      throw error;
    }
  }

  async getStreakData() {
    try {
      const streakJson = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
      const defaultStreak = {
        current: 0,
        longest: 0,
        lastStudyDate: null
      };
      
      return streakJson ? JSON.parse(streakJson) : defaultStreak;
    } catch (error) {
      console.error('Failed to get streak data:', error);
      return { current: 0, longest: 0, lastStudyDate: null };
    }
  }

  // ===== CALENDAR SETTINGS =====

  async saveCalendarSettings(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CALENDAR_SETTINGS, JSON.stringify(settings));
      return settings;
    } catch (error) {
      console.error('Failed to save calendar settings:', error);
      throw error;
    }
  }

  async getCalendarSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.CALENDAR_SETTINGS);
      const defaultSettings = {
        selectedCalendars: [],
        studyTimePreferences: {
          earliestTime: '08:00',
          latestTime: '22:00',
          preferredDurations: [25, 45, 90],
          breakTime: 15
        },
        autoCreateEvents: false,
        syncEnabled: false
      };
      
      return settingsJson ? { ...defaultSettings, ...JSON.parse(settingsJson) } : defaultSettings;
    } catch (error) {
      console.error('Failed to get calendar settings:', error);
      return this.getDefaultCalendarSettings();
    }
  }

  getDefaultCalendarSettings() {
    return {
      selectedCalendars: [],
      studyTimePreferences: {
        earliestTime: '08:00',
        latestTime: '22:00',
        preferredDurations: [25, 45, 90],
        breakTime: 15
      },
      autoCreateEvents: false,
      syncEnabled: false
    };
  }

  // ===== FIREBASE SYNC =====

  async syncToFirebase(dataType, data) {
    try {
      const preferences = await this.getUserPreferences();
      if (!preferences.firebaseSync) return;

      // Get Firebase sync status
      const syncStatus = await this.getFirebaseSyncStatus();
      if (!syncStatus.enabled) return;

      // Implementation would connect to Firebase
      // This is a placeholder for the actual Firebase integration
      const syncData = {
        userId: syncStatus.userId,
        dataType,
        data,
        timestamp: new Date().toISOString(),
        deviceId: syncStatus.deviceId
      };

      // Store sync queue for when Firebase is implemented
      await this.addToSyncQueue(syncData);
      
      console.log(`Queued ${dataType} for Firebase sync`);
    } catch (error) {
      console.error('Firebase sync failed:', error);
    }
  }

  async getFirebaseSyncStatus() {
    try {
      const syncJson = await AsyncStorage.getItem(STORAGE_KEYS.FIREBASE_SYNC);
      const defaultSync = {
        enabled: false,
        userId: null,
        deviceId: null,
        lastSync: null,
        syncQueue: []
      };
      
      return syncJson ? JSON.parse(syncJson) : defaultSync;
    } catch (error) {
      console.error('Failed to get Firebase sync status:', error);
      return { enabled: false, userId: null, deviceId: null, lastSync: null, syncQueue: [] };
    }
  }

  async addToSyncQueue(syncData) {
    try {
      const syncStatus = await this.getFirebaseSyncStatus();
      syncStatus.syncQueue.push(syncData);
      
      // Keep only last 100 items in queue
      if (syncStatus.syncQueue.length > 100) {
        syncStatus.syncQueue = syncStatus.syncQueue.slice(-100);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.FIREBASE_SYNC, JSON.stringify(syncStatus));
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  // ===== DATA MANAGEMENT =====

  async exportData() {
    try {
      const [sessions, preferences, streakData, calendarSettings] = await Promise.all([
        this.getAllSessions(),
        this.getUserPreferences(),
        this.getStreakData(),
        this.getCalendarSettings()
      ]);

      return {
        sessions,
        preferences,
        streakData,
        calendarSettings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async importData(data) {
    try {
      const { sessions, preferences, streakData, calendarSettings } = data;

      await Promise.all([
        sessions && AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions)),
        preferences && AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences)),
        streakData && AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(streakData)),
        calendarSettings && AsyncStorage.setItem(STORAGE_KEYS.CALENDAR_SETTINGS, JSON.stringify(calendarSettings))
      ]);

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  async clearAllData() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES),
        AsyncStorage.removeItem(STORAGE_KEYS.STREAK_DATA),
        AsyncStorage.removeItem(STORAGE_KEYS.CALENDAR_SETTINGS),
        AsyncStorage.removeItem(STORAGE_KEYS.FIREBASE_SYNC)
      ]);
      
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }

  async getStorageSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith('@focus_app_'));
      
      let totalSize = 0;
      for (const key of appKeys) {
        const value = await AsyncStorage.getItem(key);
        totalSize += value ? value.length : 0;
      }
      
      return {
        totalKeys: appKeys.length,
        totalSize: totalSize,
        sizeInKB: Math.round(totalSize / 1024 * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return { totalKeys: 0, totalSize: 0, sizeInKB: 0 };
    }
  }
}

export const storageService = new StorageService();