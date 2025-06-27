// hooks/useStats.js
import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';

export const useStats = () => {
  const [stats, setStats] = useState({
    sessionsToday: 0,
    totalWeeklyTime: 0, // in minutes
    currentStreak: 0,
    longestStreak: 0,
    totalSessions: 0,
    loading: true,
    error: null
  });

  const [sessions, setSessions] = useState([]);

  // Load stats on hook initialization
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      const [
        todaySessions,
        weeklySessions,
        streakData,
        allSessions
      ] = await Promise.all([
        storageService.getTodaysSessions(),
        storageService.getWeeklySessions(),
        storageService.getStreakData(),
        storageService.getAllSessions()
      ]);

      const sessionsToday = todaySessions.length;
      const totalWeeklyTime = weeklySessions.reduce((total, session) => 
        total + session.duration, 0
      );

      setStats({
        sessionsToday,
        totalWeeklyTime,
        currentStreak: streakData.current,
        longestStreak: streakData.longest,
        totalSessions: allSessions.length,
        loading: false,
        error: null
      });

      setSessions(allSessions);
    } catch (error) {
      setStats(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to load stats' 
      }));
    }
  };

  const logSession = async (sessionData) => {
    try {
      const session = {
        id: Date.now().toString(),
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        duration: sessionData.duration, // in minutes
        studyMethod: sessionData.studyMethod, // 'pomodoro', 'focus45', 'deepwork90'
        completed: sessionData.completed,
        soundUsed: sessionData.soundUsed,
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      };

      await storageService.saveSession(session);
      await updateStreak(sessionData.completed);
      await loadStats(); // Refresh stats after logging
      
      return session;
    } catch (error) {
      console.error('Failed to log session:', error);
      throw error;
    }
  };

  const updateStreak = async (sessionCompleted) => {
    if (!sessionCompleted) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const streakData = await storageService.getStreakData();
      
      // Check if already studied today
      const todaysSessions = await storageService.getTodaysSessions();
      const completedToday = todaysSessions.some(session => session.completed);
      
      if (!completedToday || streakData.lastStudyDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let newStreak;
        if (streakData.lastStudyDate === yesterdayStr) {
          // Continuing streak
          newStreak = streakData.current + 1;
        } else if (streakData.lastStudyDate === today) {
          // Already studied today, no change
          newStreak = streakData.current;
        } else {
          // Streak broken, restart
          newStreak = 1;
        }
        
        const newStreakData = {
          current: newStreak,
          longest: Math.max(newStreak, streakData.longest),
          lastStudyDate: today
        };
        
        await storageService.saveStreakData(newStreakData);
      }
    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  };

  const getSessionHistory = (days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return sessions.filter(session => 
      new Date(session.startTime) >= cutoffDate
    ).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  };

  const getStudyMethodStats = () => {
    const methodCounts = sessions.reduce((acc, session) => {
      if (session.completed) {
        acc[session.studyMethod] = (acc[session.studyMethod] || 0) + 1;
      }
      return acc;
    }, {});

    return methodCounts;
  };

  const resetStats = async () => {
    try {
      await storageService.clearAllData();
      await loadStats();
    } catch (error) {
      console.error('Failed to reset stats:', error);
      throw error;
    }
  };

  return {
    stats,
    sessions,
    logSession,
    loadStats,
    getSessionHistory,
    getStudyMethodStats,
    resetStats,
    refreshStats: loadStats
  };
};