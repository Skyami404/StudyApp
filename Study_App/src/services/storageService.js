import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  SESSIONS: 'study_sessions',
  USER_PREFERENCES: 'user_preferences',
  STREAK_DATA: 'streak_data',
  CALENDAR_SETTINGS: 'calendar_settings'
};

class StorageService {
  // Generic storage methods
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (error.code === 512) {
        // Storage permission issue, try alternative approach
        console.warn('Storage permission issue, falling back to memory storage');
        return false;
      }
      throw error;
    }
  }

  async getItem(key, defaultValue = null) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : defaultValue;
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      return defaultValue;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
      return false;
    }
  }

  // Session-specific methods
  async getAllSessions() {
    try {
      const sessions = await this.getItem(STORAGE_KEYS.SESSIONS, []);
      return sessions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  async addSession(sessionData) {
    try {
      const sessions = await this.getAllSessions();
      const newSession = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        completedAt: new Date().toISOString(),
        ...sessionData
      };
      
      const updatedSessions = [newSession, ...sessions];
      await this.setItem(STORAGE_KEYS.SESSIONS, updatedSessions);
      return newSession;
    } catch (error) {
      console.error('Failed to add session:', error);
      return null;
    }
  }

  async getSessionsByDate(date) {
    try {
      const sessions = await this.getAllSessions();
      return sessions.filter(session => session.date === date);
    } catch (error) {
      console.error('Failed to get sessions by date:', error);
      return [];
    }
  }

  async getTodaysSessions() {
    const today = new Date().toISOString().split('T')[0];
    return this.getSessionsByDate(today);
  }

  async getWeeklySessions() {
    try {
      const sessions = await this.getAllSessions();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      return sessions.filter(session => 
        new Date(session.date) >= weekAgo
      );
    } catch (error) {
      console.error('Failed to get weekly sessions:', error);
      return [];
    }
  }

  // Streak-specific methods
  async getStreakData() {
    return this.getItem(STORAGE_KEYS.STREAK_DATA, {
      current: 0,
      longest: 0,
      lastStudyDate: null
    });
  }

  async updateStreak() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const streakData = await this.getStreakData();
      
      // Don't update if already studied today
      if (streakData.lastStudyDate === today) {
        return streakData;
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      if (streakData.lastStudyDate === yesterdayString) {
        // Continue streak
        streakData.current += 1;
      } else {
        // Start new streak
        streakData.current = 1;
      }
      
      // Update longest streak if necessary
      if (streakData.current > streakData.longest) {
        streakData.longest = streakData.current;
      }
      
      streakData.lastStudyDate = today;
      await this.setItem(STORAGE_KEYS.STREAK_DATA, streakData);
      
      return streakData;
    } catch (error) {
      console.error('Failed to update streak:', error);
      return { current: 0, longest: 0, lastStudyDate: null };
    }
  }

  // User preferences methods
  async getUserPreferences() {
    return this.getItem(STORAGE_KEYS.USER_PREFERENCES, {
      soundEnabled: true,
      selectedSound: 'rain',
      volume: 0.7,
      hapticFeedback: true,
      defaultStudyMethod: 'pomodoro',
      notifications: true
    });
  }

  async saveUserPreferences(preferences) {
    const currentPrefs = await this.getUserPreferences();
    const updatedPrefs = { ...currentPrefs, ...preferences };
    return this.setItem(STORAGE_KEYS.USER_PREFERENCES, updatedPrefs);
  }

  // Calendar settings methods
  async getCalendarSettings() {
    return this.getItem(STORAGE_KEYS.CALENDAR_SETTINGS, {
      enableCalendarIntegration: true,
      studyHoursStart: '09:00',
      studyHoursEnd: '22:00',
      minimumSlotDuration: 25,
      bufferTime: 15 // minutes before/after events
    });
  }

  async saveCalendarSettings(settings) {
    const currentSettings = await this.getCalendarSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    return this.setItem(STORAGE_KEYS.CALENDAR_SETTINGS, updatedSettings);
  }

  // Statistics methods
  async getStatistics() {
    try {
      const sessions = await this.getAllSessions();
      const streakData = await this.getStreakData();
      const today = new Date().toISOString().split('T')[0];
      
      // Today's stats
      const todaysSessions = sessions.filter(s => s.date === today);
      const todaysMinutes = todaysSessions.reduce((total, s) => total + (s.duration || 0), 0);
      
      // This week's stats
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartString = weekStart.toISOString().split('T')[0];
      
      const weekSessions = sessions.filter(s => s.date >= weekStartString);
      const weeklyMinutes = weekSessions.reduce((total, s) => total + (s.duration || 0), 0);
      
      // All time stats
      const totalMinutes = sessions.reduce((total, s) => total + (s.duration || 0), 0);
      const totalSessions = sessions.length;
      
      // Method breakdown
      const methodStats = sessions.reduce((acc, session) => {
        const method = session.method || 'unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});
      
      return {
        today: {
          sessions: todaysSessions.length,
          minutes: todaysMinutes
        },
        week: {
          sessions: weekSessions.length,
          minutes: weeklyMinutes
        },
        allTime: {
          sessions: totalSessions,
          minutes: totalMinutes,
          hours: Math.round(totalMinutes / 60 * 10) / 10
        },
        streak: streakData,
        methods: methodStats
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return null;
    }
  }

  // Utility methods
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }

  async exportData() {
    try {
      const sessions = await this.getAllSessions();
      const preferences = await this.getUserPreferences();
      const streakData = await this.getStreakData();
      
      return {
        sessions,
        preferences,
        streakData,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const storageService = new StorageService();
export default storageService;