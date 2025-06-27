// hooks/useCalendar.js
import { useState, useEffect } from 'react';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { calendarService } from '../services/calendarService';

export const useCalendar = () => {
  const [calendarPermission, setCalendarPermission] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [freeSlots, setFreeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCalendars, setSelectedCalendars] = useState([]);

  // Initialize calendar permissions and data
  useEffect(() => {
    initializeCalendar();
  }, []);

  const initializeCalendar = async () => {
    try {
      await requestCalendarPermission();
      if (calendarPermission === 'granted') {
        await loadCalendars();
      }
    } catch (error) {
      setError('Failed to initialize calendar');
      console.error('Calendar initialization error:', error);
    }
  };

  const requestCalendarPermission = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      setCalendarPermission(status);
      
      if (status !== 'granted') {
        setError('Calendar permission is required to suggest study times');
      }
      
      return status;
    } catch (error) {
      setError('Failed to request calendar permission');
      console.error('Permission error:', error);
      return 'denied';
    }
  };

  const loadCalendars = async () => {
    try {
      setLoading(true);
      const deviceCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Filter to only show calendars we can read from
      const readableCalendars = deviceCalendars.filter(cal => 
        cal.allowsModifications !== false && cal.source.name !== 'Local'
      );
      
      setCalendars(readableCalendars);
      
      // Auto-select primary calendars
      const primaryCalendars = readableCalendars.filter(cal => 
        cal.isPrimary || cal.title.toLowerCase().includes('personal') ||
        cal.title.toLowerCase().includes('work')
      );
      
      setSelectedCalendars(primaryCalendars.map(cal => cal.id));
      
    } catch (error) {
      setError('Failed to load calendars');
      console.error('Load calendars error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (startDate, endDate) => {
    if (!selectedCalendars.length) return [];

    try {
      setLoading(true);
      const eventsPromises = selectedCalendars.map(calendarId =>
        Calendar.getEventsAsync([calendarId], startDate, endDate)
      );
      
      const eventsArrays = await Promise.all(eventsPromises);
      const allEvents = eventsArrays.flat();
      
      // Filter out all-day events and focus on time-specific events
      const timeEvents = allEvents.filter(event => 
        !event.allDay && event.startDate && event.endDate
      );
      
      setEvents(timeEvents);
      return timeEvents;
    } catch (error) {
      setError('Failed to load calendar events');
      console.error('Load events error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const findFreeSlots = async (date = new Date(), minDuration = 25) => {
    try {
      setLoading(true);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(8, 0, 0, 0); // Start at 8 AM
      
      const endOfDay = new Date(date);
      endOfDay.setHours(22, 0, 0, 0); // End at 10 PM
      
      const dayEvents = await loadEvents(startOfDay, endOfDay);
      
      // Generate free slots using the calendar service algorithm
      const slots = calendarService.generateFreeSlots(
        dayEvents, 
        startOfDay, 
        endOfDay, 
        minDuration
      );
      
      // Add suggested study method for each slot
      const slotsWithSuggestions = slots.map(slot => ({
        ...slot,
        suggestedMethod: calendarService.suggestStudyMethod(slot.duration),
        quality: calendarService.assessSlotQuality(slot, dayEvents)
      }));
      
      // Sort by quality and time
      const sortedSlots = slotsWithSuggestions.sort((a, b) => {
        if (a.quality !== b.quality) return b.quality - a.quality;
        return new Date(a.startTime) - new Date(b.startTime);
      });
      
      setFreeSlots(sortedSlots);
      return sortedSlots;
      
    } catch (error) {
      setError('Failed to find free time slots');
      console.error('Find free slots error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getTodaysFreeSlots = async () => {
    const today = new Date();
    return await findFreeSlots(today);
  };

  const getUpcomingFreeSlots = async (days = 3) => {
    const slots = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const daySlots = await findFreeSlots(date);
      slots.push({
        date: date.toISOString().split('T')[0],
        slots: daySlots.slice(0, 3) // Top 3 slots per day
      });
    }
    
    return slots;
  };

  const toggleCalendarSelection = (calendarId) => {
    setSelectedCalendars(prev => {
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId);
      } else {
        return [...prev, calendarId];
      }
    });
  };

  const createStudyEvent = async (slot, studyMethod, duration) => {
    try {
      const eventDetails = {
        title: `📚 Study Session - ${studyMethod}`,
        startDate: new Date(slot.startTime),
        endDate: new Date(slot.startTime + duration * 60 * 1000),
        notes: `Study session created by Focus Time app\nMethod: ${studyMethod}\nDuration: ${duration} minutes`,
        timeZone: 'default'
      };

      // Use the first selected calendar or primary calendar
      const targetCalendar = calendars.find(cal => 
        selectedCalendars.includes(cal.id) && cal.allowsModifications
      );

      if (!targetCalendar) {
        throw new Error('No writable calendar available');
      }

      const eventId = await Calendar.createEventAsync(targetCalendar.id, eventDetails);
      
      // Refresh events after creating
      await findFreeSlots();
      
      return eventId;
    } catch (error) {
      console.error('Failed to create study event:', error);
      throw error;
    }
  };

  const refreshCalendarData = async () => {
    await loadCalendars();
    await getTodaysFreeSlots();
  };

  return {
    // State
    calendarPermission,
    calendars,
    events,
    freeSlots,
    loading,
    error,
    selectedCalendars,
    
    // Actions
    requestCalendarPermission,
    loadCalendars,
    loadEvents,
    findFreeSlots,
    getTodaysFreeSlots,
    getUpcomingFreeSlots,
    toggleCalendarSelection,
    createStudyEvent,
    refreshCalendarData,
    
    // Utilities
    hasPermission: calendarPermission === 'granted',
    hasCalendars: calendars.length > 0,
    hasSelectedCalendars: selectedCalendars.length > 0
  };
};