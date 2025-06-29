import { useState, useEffect } from 'react';
import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CALENDAR_PERMISSIONS: '@StudyApp:calendar_permissions',
  PREFERRED_CALENDARS: '@StudyApp:preferred_calendars'
};

export default function useCalendar() {
  const [hasPermission, setHasPermission] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [freeSlots, setFreeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize calendar permissions on mount
  useEffect(() => {
    initializeCalendar();
  }, []);

  const initializeCalendar = async () => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        await loadCalendars();
      }
    } catch (error) {
      console.error('Failed to initialize calendar:', error);
      setError(error);
    }
  };

  const requestPermissions = async () => {
    try {
      setLoading(true);
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      const granted = status === 'granted';
      
      setHasPermission(granted);
      
      if (granted) {
        await AsyncStorage.setItem(STORAGE_KEYS.CALENDAR_PERMISSIONS, 'granted');
        await loadCalendars();
        return { success: true };
      } else {
        return { success: false, message: 'Calendar permission denied' };
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      setError(error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loadCalendars = async () => {
    try {
      if (!hasPermission) {
        throw new Error('No calendar permission');
      }

      const calendarList = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Filter out calendars that don't allow reading events
      const accessibleCalendars = calendarList.filter(cal => 
        cal.allowsModifications !== false && 
        cal.accessLevel !== Calendar.CalendarAccessLevel.NONE
      );
      
      setCalendars(accessibleCalendars);
      return accessibleCalendars;
    } catch (error) {
      console.error('Failed to load calendars:', error);
      setError(error);
      return [];
    }
  };

  const getTodaysEvents = async () => {
    try {
      if (!hasPermission) {
        console.warn('No calendar permission granted');
        return [];
      }

      // Ensure calendars are loaded first
      let currentCalendars = calendars;
      if (currentCalendars.length === 0) {
        console.log('Loading calendars first...');
        currentCalendars = await loadCalendars();
      }

      if (currentCalendars.length === 0) {
        console.warn('No accessible calendars found');
        return [];
      }

      setLoading(true);
      setError(null);

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Get calendar IDs that we can access
      const calendarIds = currentCalendars.map(cal => cal.id).filter(id => id);
      
      if (calendarIds.length === 0) {
        console.warn('No valid calendar IDs found');
        return [];
      }

      console.log('Using calendar IDs:', calendarIds);

      const todaysEvents = await Calendar.getEventsAsync(
        calendarIds,
        startOfDay,
        endOfDay
      );

      // Sort events by start time
      const sortedEvents = todaysEvents.sort((a, b) => 
        new Date(a.startDate) - new Date(b.startDate)
      );

      setEvents(sortedEvents);
      return sortedEvents;
    } catch (error) {
      console.error('Failed to get today\'s events:', error);
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDateRange = async (startDate, endDate) => {
    try {
      if (!hasPermission || calendars.length === 0) {
        return [];
      }

      const calendarIds = calendars.map(cal => cal.id);
      
      if (calendarIds.length === 0) {
        return [];
      }

      const events = await Calendar.getEventsAsync(calendarIds, startDate, endDate);
      return events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    } catch (error) {
      console.error('Failed to get events for date range:', error);
      throw error;
    }
  };

  const findFreeSlots = async (minDuration = 25) => {
    try {
      const todaysEvents = await getTodaysEvents();
      
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0); // Until 10 PM
      
      // Start from current time or 9 AM, whichever is later
      const startTime = new Date(Math.max(
        now.getTime(),
        new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0).getTime()
      ));

      const freeSlots = [];
      let currentTime = new Date(startTime);

      // Sort events by start time
      const sortedEvents = todaysEvents
        .filter(event => new Date(event.endDate) > now) // Only future events
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      for (let i = 0; i <= sortedEvents.length; i++) {
        let slotEnd;
        
        if (i === sortedEvents.length) {
          // Last slot until end of day
          slotEnd = endOfDay;
        } else {
          slotEnd = new Date(sortedEvents[i].startDate);
        }

        const slotDuration = (slotEnd - currentTime) / (1000 * 60); // Duration in minutes

        if (slotDuration >= minDuration) {
          freeSlots.push({
            startTime: new Date(currentTime),
            endTime: new Date(slotEnd),
            duration: Math.floor(slotDuration),
            suggested: slotDuration >= 45 // Suggest slots 45+ minutes
          });
        }

        if (i < sortedEvents.length) {
          currentTime = new Date(sortedEvents[i].endDate);
        }
      }

      setFreeSlots(freeSlots);
      return freeSlots;
    } catch (error) {
      console.error('Failed to find free slots:', error);
      setError(error);
      return [];
    }
  };

  const getSuggestedStudyTimes = async () => {
    try {
      const freeSlots = await findFreeSlots(25);
      
      // Filter and rank suggestions
      const suggestions = freeSlots
        .filter(slot => slot.duration >= 25)
        .map(slot => ({
          ...slot,
          studyMethods: getRecommendedMethods(slot.duration)
        }))
        .sort((a, b) => b.duration - a.duration) // Longest slots first
        .slice(0, 5); // Top 5 suggestions

      return suggestions;
    } catch (error) {
      console.error('Failed to get study suggestions:', error);
      return [];
    }
  };

  const getRecommendedMethods = (duration) => {
    const methods = [];
    
    if (duration >= 25) methods.push({ name: 'Pomodoro', duration: 25 });
    if (duration >= 45) methods.push({ name: 'Deep Focus', duration: 45 });
    if (duration >= 90) methods.push({ name: 'Deep Work', duration: 90 });
    
    return methods;
  };

  const formatTimeSlot = (slot) => {
    const start = slot.startTime.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    const end = slot.endTime.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    
    return `${start} - ${end} (${slot.duration} min)`;
  };

  const refreshCalendarData = async () => {
    try {
      setLoading(true);
      await loadCalendars();
      await getTodaysEvents();
      await findFreeSlots();
    } catch (error) {
      console.error('Failed to refresh calendar data:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    hasPermission,
    calendars,
    events,
    freeSlots,
    loading,
    error,

    // Actions
    requestPermissions,
    getTodaysEvents,
    getEventsForDateRange,
    findFreeSlots,
    getSuggestedStudyTimes,
    refreshCalendarData,

    // Utilities
    formatTimeSlot,
    
    // Computed values
    hasEvents: events.length > 0,
    hasFreeSlotsToday: freeSlots.length > 0,
    nextFreeSlot: freeSlots.length > 0 ? freeSlots[0] : null
  };
};