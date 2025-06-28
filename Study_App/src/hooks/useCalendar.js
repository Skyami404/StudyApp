import { useState, useEffect } from 'react';
import * as Calendar from 'expo-calendar';
import { Alert } from 'react-native';

export const useCalendar = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [freeSlots, setFreeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendars, setCalendars] = useState([]);

  // Request calendar permissions
  const requestPermissions = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      const hasAccess = status === 'granted';
      setHasPermission(hasAccess);
      
      if (!hasAccess) {
        Alert.alert(
          'Calendar Access',
          'We need calendar access to suggest study times based on your free slots.',
          [{ text: 'OK' }]
        );
      }
      
      return hasAccess;
    } catch (error) {
      console.error('Failed to request calendar permissions:', error);
      return false;
    }
  };

  // Get available calendars
  const getCalendars = async () => {
    try {
      if (!hasPermission) return [];
      
      const availableCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      setCalendars(availableCalendars);
      return availableCalendars;
    } catch (error) {
      console.error('Failed to get calendars:', error);
      return [];
    }
  };

  // Get today's events
  const getTodaysEvents = async () => {
    try {
      if (!hasPermission) return [];
      
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      const events = await Calendar.getEventsAsync(
        calendars.map(cal => cal.id),
        startOfDay,
        endOfDay
      );
      
      return events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    } catch (error) {
      console.error('Failed to get today\'s events:', error);
      return [];
    }
  };

  // Find free time slots for studying
  const findFreeSlots = async (minDuration = 25) => {
    try {
      setLoading(true);
      
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return [];
      }
      
      // Get today's events
      const events = await getTodaysEvents();
      
      // Define study hours (9 AM to 10 PM)
      const now = new Date();
      const studyStart = new Date();
      studyStart.setHours(9, 0, 0, 0);
      const studyEnd = new Date();
      studyEnd.setHours(22, 0, 0, 0);
      
      // If it's past study hours, show tomorrow
      const isAfterStudyHours = now > studyEnd;
      if (isAfterStudyHours) {
        studyStart.setDate(studyStart.getDate() + 1);
        studyEnd.setDate(studyEnd.getDate() + 1);
      }
      
      // Start from current time if today, or study start if tomorrow
      const searchStart = isAfterStudyHours ? studyStart : 
        (now > studyStart ? now : studyStart);
      
      // Find gaps between events
      const slots = [];
      let currentTime = new Date(searchStart);
      
      // Add buffer for current time (round up to next 15 minutes)
      currentTime.setMinutes(Math.ceil(currentTime.getMinutes() / 15) * 15, 0, 0);
      
      for (const event of events) {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        // Skip events outside our study window
        if (eventEnd <= searchStart || eventStart >= studyEnd) continue;
        
        // Check gap before this event
        if (eventStart > currentTime) {
          const gapDuration = (eventStart - currentTime) / (1000 * 60); // minutes
          
          if (gapDuration >= minDuration) {
            slots.push({
              id: `slot_${currentTime.getTime()}`,
              startTime: new Date(currentTime),
              endTime: new Date(eventStart),
              duration: Math.floor(gapDuration),
              suggestedStudyType: getSuggestedStudyType(gapDuration)
            });
          }
        }
        
        // Move current time to after this event
        if (eventEnd > currentTime) {
          currentTime = new Date(eventEnd);
        }
      }
      
      // Check for gap after last event until study end time
      if (currentTime < studyEnd) {
        const finalGapDuration = (studyEnd - currentTime) / (1000 * 60);
        
        if (finalGapDuration >= minDuration) {
          slots.push({
            id: `slot_${currentTime.getTime()}`,
            startTime: new Date(currentTime),
            endTime: new Date(studyEnd),
            duration: Math.floor(finalGapDuration),
            suggestedStudyType: getSuggestedStudyType(finalGapDuration)
          });
        }
      }
      
      setFreeSlots(slots);
      return slots;
      
    } catch (error) {
      console.error('Failed to find free slots:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Suggest study method based on available time
  const getSuggestedStudyType = (minutes) => {
    if (minutes >= 90) return 'deep_work'; // 90 min
    if (minutes >= 45) return 'focus_block'; // 45 min
    return 'pomodoro'; // 25 min
  };

  // Format time slot for display
  const formatTimeSlot = (slot) => {
    const startTime = slot.startTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const endTime = slot.endTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return {
      timeRange: `${startTime} - ${endTime}`,
      duration: `${slot.duration} min`,
      suggestion: getStudyTypeLabel(slot.suggestedStudyType)
    };
  };

  const getStudyTypeLabel = (type) => {
    switch (type) {
      case 'deep_work': return 'Deep Work (90 min)';
      case 'focus_block': return 'Focus Block (45 min)';
      case 'pomodoro': return 'Pomodoro (25 min)';
      default: return 'Quick Study';
    }
  };

  // Initialize on mount
  useEffect(() => {
    const initializeCalendar = async () => {
      const granted = await requestPermissions();
      if (granted) {
        await getCalendars();
      }
    };
    
    initializeCalendar();
  }, []);

  // Refresh free slots when calendars change
  useEffect(() => {
    if (calendars.length > 0) {
      findFreeSlots();
    }
  }, [calendars]);

  return {
    hasPermission,
    freeSlots,
    loading,
    requestPermissions,
    findFreeSlots,
    formatTimeSlot,
    getTodaysEvents
  };
};