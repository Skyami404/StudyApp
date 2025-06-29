import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SESSIONS: '@StudyApp:study_sessions',
  PREFERENCES: '@StudyApp:user_preferences',
  STREAK_DATA: '@StudyApp:streak_data'
};

export default function useStats() {
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize stats on hook mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTodaysSessions(),
        loadWeeklyMinutes(),
        loadCurrentStreak()
      ]);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysSessions = async () => {
    try {
      const sessionsData = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!sessionsData) {
        setTodaysSessions([]);
        return [];
      }
      
      const allSessions = JSON.parse(sessionsData);
      const today = new Date().toDateString();
      const todaySessions = allSessions.filter(session => 
        new Date(session.date).toDateString() === today
      );
      
      setTodaysSessions(todaySessions);
      return todaySessions;
    } catch (error) {
      console.error('Failed to load today\'s sessions:', error);
      setTodaysSessions([]);
      return [];
    }
  };

  const loadWeeklyMinutes = async () => {
    try {
      const sessionsData = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!sessionsData) {
        setWeeklyMinutes(0);
        return 0;
      }
      
      const allSessions = JSON.parse(sessionsData);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weekSessions = allSessions.filter(session => 
        new Date(session.date) >= oneWeekAgo
      );
      
      const totalMinutes = weekSessions.reduce((total, session) => 
        total + (session.duration || 0), 0
      );
      
      setWeeklyMinutes(totalMinutes);
      return totalMinutes;
    } catch (error) {
      console.error('Failed to load weekly minutes:', error);
      setWeeklyMinutes(0);
      return 0;
    }
  };

  const loadCurrentStreak = async () => {
    try {
      const streakData = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
      if (!streakData) {
        setCurrentStreak(0);
        return 0;
      }
      
      const streak = JSON.parse(streakData);
      
      // Check if streak is still valid (studied yesterday or today)
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastStudyDate = streak.lastDate ? new Date(streak.lastDate) : null;
      
      if (!lastStudyDate || 
          (lastStudyDate.toDateString() !== today.toDateString() && 
           lastStudyDate.toDateString() !== yesterday.toDateString())) {
        // Streak broken if last study was more than 1 day ago
        const brokenStreak = { count: 0, lastDate: null };
        await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(brokenStreak));
        setCurrentStreak(0);
        return 0;
      }
      
      setCurrentStreak(streak.count);
      return streak.count;
    } catch (error) {
      console.error('Failed to load streak:', error);
      setCurrentStreak(0);
      return 0;
    }
  };

  const addSession = async (duration, method = 'pomodoro') => {
    try {
      const newSession = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: duration, // in minutes
        method: method,
        completedAt: new Date().toISOString()
      };

      // Add to sessions
      const sessionsData = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      const allSessions = sessionsData ? JSON.parse(sessionsData) : [];
      allSessions.push(newSession);
      
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));

      // Update streak
      await updateStreak();

      // Refresh stats
      await loadStats();

      return newSession;
    } catch (error) {
      console.error('Failed to add session:', error);
      throw error;
    }
  };

  const updateStreak = async () => {
    try {
      const today = new Date();
      const todayString = today.toDateString();
      
      const streakData = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
      const currentStreakData = streakData ? JSON.parse(streakData) : { count: 0, lastDate: null };
      
      const lastStudyDate = currentStreakData.lastDate ? new Date(currentStreakData.lastDate) : null;
      const lastStudyDateString = lastStudyDate ? lastStudyDate.toDateString() : null;
      
      let newStreakData;
      
      if (!lastStudyDate) {
        // First session ever
        newStreakData = { count: 1, lastDate: today.toISOString() };
      } else if (lastStudyDateString === todayString) {
        // Already studied today, don't increment
        newStreakData = currentStreakData;
      } else {
        // Check if yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastStudyDateString === yesterday.toDateString()) {
          // Continuing streak
          newStreakData = { 
            count: currentStreakData.count + 1, 
            lastDate: today.toISOString() 
          };
        } else {
          // Streak broken, start new
          newStreakData = { count: 1, lastDate: today.toISOString() };
        }
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(newStreakData));
      setCurrentStreak(newStreakData.count);
      
    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSIONS,
        STORAGE_KEYS.STREAK_DATA,
        STORAGE_KEYS.PREFERENCES
      ]);
      
      setTodaysSessions([]);
      setWeeklyMinutes(0);
      setCurrentStreak(0);
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  };

  const getSessionHistory = async (days = 7) => {
    try {
      const sessionsData = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      const allSessions = sessionsData ? JSON.parse(sessionsData) : [];
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return allSessions
        .filter(session => new Date(session.date) >= cutoffDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Failed to get session history:', error);
      return [];
    }
  };

  // Calculate today's total study time
  const todaysMinutes = todaysSessions.reduce((total, session) => 
    total + (session.duration || 0), 0
  );

  return {
    // State
    todaysSessions,
    weeklyMinutes,
    currentStreak,
    todaysMinutes,
    loading,
    error,
    
    // Actions
    addSession,
    loadStats,
    clearAllData,
    getSessionHistory,
    
    // Computed values
    todaysSessionCount: todaysSessions.length,
    weeklySessionCount: Math.floor(weeklyMinutes / 25) // Rough estimate assuming 25min average
  };
};