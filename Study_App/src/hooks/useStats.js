import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SESSIONS: 'study_sessions',
  USER_PREFERENCES: 'user_preferences',
  STREAK_DATA: 'streak_data'
};

export const useStats = () => {
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Get today's date string
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get start of current week
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    return new Date(now.setDate(diff));
  };

  // Load all stats data
  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Load sessions
      const sessionsJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      const allSessions = sessionsJson ? JSON.parse(sessionsJson) : [];
      
      // Filter today's sessions
      const today = getTodayString();
      const todaysSessions = allSessions.filter(session => 
        session.date === today
      );
      
      // Calculate weekly minutes
      const weekStart = getWeekStart();
      const weeklyTotal = allSessions
        .filter(session => new Date(session.date) >= weekStart)
        .reduce((total, session) => total + session.duration, 0);
      
      // Load streak data
      const streakJson = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
      const streakData = streakJson ? JSON.parse(streakJson) : { current: 0, lastDate: null };
      
      setTodaysSessions(todaysSessions);
      setWeeklyMinutes(weeklyTotal);
      setCurrentStreak(streakData.current);
      
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Return empty state on error
      setTodaysSessions([]);
      setWeeklyMinutes(0);
      setCurrentStreak(0);
    } finally {
      setLoading(false);
    }
  };

  // Add a completed study session
  const addSession = async (duration, method = 'pomodoro') => {
    try {
      const session = {
        id: Date.now().toString(),
        date: getTodayString(),
        duration: duration, // in minutes
        method: method,
        completedAt: new Date().toISOString()
      };

      // Load existing sessions
      const sessionsJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      const existingSessions = sessionsJson ? JSON.parse(sessionsJson) : [];
      
      // Add new session
      const updatedSessions = [...existingSessions, session];
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updatedSessions));
      
      // Update streak
      await updateStreak();
      
      // Reload stats
      await loadStats();
      
      return true;
    } catch (error) {
      console.error('Failed to add session:', error);
      return false;
    }
  };

  // Update streak counter
  const updateStreak = async () => {
    try {
      const today = getTodayString();
      const streakJson = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
      let streakData = streakJson ? JSON.parse(streakJson) : { current: 0, lastDate: null };
      
      if (streakData.lastDate === today) {
        // Already counted today
        return;
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      if (streakData.lastDate === yesterdayString) {
        // Continue streak
        streakData.current += 1;
      } else if (streakData.lastDate !== today) {
        // Streak broken or first time
        streakData.current = 1;
      }
      
      streakData.lastDate = today;
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(streakData));
      
    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  };

  // Clear all data (for testing)
  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSIONS,
        STORAGE_KEYS.STREAK_DATA
      ]);
      await loadStats();
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadStats();
  }, []);

  return {
    todaysSessions,
    currentStreak,
    weeklyMinutes,
    loading,
    addSession,
    clearAllData,
    refreshStats: loadStats
  };
};