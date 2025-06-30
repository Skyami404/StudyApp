// services/calendarService.js
class CalendarService {
  
    // Study method configurations
    studyMethods = {
      pomodoro: { duration: 25, break: 5, name: 'Pomodoro' },
      focus: { duration: 45, break: 15, name: 'Focus' },
      deepwork: { duration: 90, break: 30, name: 'Deep Work' }
    };
  
    /**
     * Generate free time slots between calendar events
     */
    generateFreeSlots(events, startTime, endTime, minDuration = 25) {
      const slots = [];
      
      // Sort events by start time
      const sortedEvents = events
        .filter(event => event.startDate && event.endDate)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
      let currentTime = new Date(startTime);
      
      // Check for slot before first event
      if (sortedEvents.length > 0) {
        const firstEventStart = new Date(sortedEvents[0].startDate);
        const gapMinutes = (firstEventStart - currentTime) / (1000 * 60);
        
        if (gapMinutes >= minDuration) {
          slots.push(this.createSlot(currentTime, firstEventStart, gapMinutes));
        }
        
        currentTime = new Date(sortedEvents[0].endDate);
      }
  
      // Find gaps between events
      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const currentEventEnd = new Date(sortedEvents[i].endDate);
        const nextEventStart = new Date(sortedEvents[i + 1].startDate);
        
        const gapMinutes = (nextEventStart - currentEventEnd) / (1000 * 60);
        
        if (gapMinutes >= minDuration) {
          slots.push(this.createSlot(currentEventEnd, nextEventStart, gapMinutes));
        }
      }
  
      // Check for slot after last event
      if (sortedEvents.length > 0) {
        const lastEventEnd = new Date(sortedEvents[sortedEvents.length - 1].endDate);
        const finalEndTime = new Date(endTime);
        const gapMinutes = (finalEndTime - lastEventEnd) / (1000 * 60);
        
        if (gapMinutes >= minDuration) {
          slots.push(this.createSlot(lastEventEnd, finalEndTime, gapMinutes));
        }
      } else {
        // No events, entire day is free
        const totalMinutes = (new Date(endTime) - new Date(startTime)) / (1000 * 60);
        if (totalMinutes >= minDuration) {
          slots.push(this.createSlot(startTime, endTime, totalMinutes));
        }
      }
  
      return slots.filter(slot => slot.duration >= minDuration);
    }
  
    /**
     * Create a time slot object
     */
    createSlot(startTime, endTime, duration) {
      return {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: Math.floor(duration),
        formattedTime: this.formatTimeRange(startTime, endTime),
        isToday: this.isToday(startTime),
        timeOfDay: this.getTimeOfDay(startTime)
      };
    }
  
    /**
     * Suggest the best study method based on available time
     */
    suggestStudyMethod(duration) {
      if (duration >= 90) {
        return 'deepwork';
      } else if (duration >= 45) {
        return 'focus';
      } else if (duration >= 25) {
        return 'pomodoro';
      } else {
        return null; // Too short for any method
      }
    }
  
    /**
     * Assess the quality of a time slot for studying
     */
    assessSlotQuality(slot, allEvents) {
      let quality = 50; // Base quality score
  
      // Time of day preferences
      const hour = slot.startTime.getHours();
      if (hour >= 9 && hour <= 11) quality += 20; // Morning focus time
      else if (hour >= 14 && hour <= 16) quality += 15; // Afternoon focus
      else if (hour >= 19 && hour <= 21) quality += 10; // Evening study
      else if (hour < 8 || hour > 22) quality -= 20; // Too early/late
  
      // Duration bonus
      if (slot.duration >= 90) quality += 15;
      else if (slot.duration >= 45) quality += 10;
      else if (slot.duration >= 25) quality += 5;
  
      // Buffer time before/after events
      const bufferBefore = this.getBufferTime(slot.startTime, allEvents, 'before');
      const bufferAfter = this.getBufferTime(slot.endTime, allEvents, 'after');
      
      if (bufferBefore >= 15) quality += 5;
      if (bufferAfter >= 15) quality += 5;
      if (bufferBefore < 5) quality -= 10;
      if (bufferAfter < 5) quality -= 10;
  
      // Proximity to meals (assume lunch 12-1, dinner 6-7)
      if ((hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 19)) {
        quality -= 5; // Slight penalty for meal times
      }
  
      // Weekend vs weekday
      const isWeekend = slot.startTime.getDay() === 0 || slot.startTime.getDay() === 6;
      if (isWeekend) quality += 5;
  
      return Math.max(0, Math.min(100, quality));
    }
  
    /**
     * Get buffer time before/after a time slot
     */
    getBufferTime(time, events, direction) {
      const targetTime = new Date(time);
      
      if (direction === 'before') {
        const previousEvents = events.filter(event => 
          new Date(event.endDate) <= targetTime
        ).sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
        
        if (previousEvents.length > 0) {
          return (targetTime - new Date(previousEvents[0].endDate)) / (1000 * 60);
        }
      } else {
        const nextEvents = events.filter(event => 
          new Date(event.startDate) >= targetTime
        ).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        if (nextEvents.length > 0) {
          return (new Date(nextEvents[0].startDate) - targetTime) / (1000 * 60);
        }
      }
      
      return 60; // Default buffer if no adjacent events
    }
  
    /**
     * Format time range for display
     */
    formatTimeRange(startTime, endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      };
      
      return `${formatTime(start)} - ${formatTime(end)}`;
    }
  
    /**
     * Check if date is today
     */
    isToday(date) {
      const today = new Date();
      const checkDate = new Date(date);
      
      return today.toDateString() === checkDate.toDateString();
    }
  
    /**
     * Get time of day category
     */
    getTimeOfDay(date) {
      const hour = new Date(date).getHours();
      
      if (hour >= 6 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 21) return 'evening';
      return 'night';
    }
  
    /**
     * Filter slots by study preferences
     */
    filterSlotsByPreferences(slots, preferences) {
      return slots.filter(slot => {
        const hour = slot.startTime.getHours();
        const minute = slot.startTime.getMinutes();
        const timeInMinutes = hour * 60 + minute;
        
        // Parse preference times
        const [earliestHour, earliestMin] = preferences.earliestTime.split(':').map(Number);
        const [latestHour, latestMin] = preferences.latestTime.split(':').map(Number);
        const earliestInMinutes = earliestHour * 60 + earliestMin;
        const latestInMinutes = latestHour * 60 + latestMin;
        
        // Check if slot falls within preferred time range
        const withinTimeRange = timeInMinutes >= earliestInMinutes && 
                               timeInMinutes <= latestInMinutes;
        
        // Check if duration matches preferred durations
        const matchesDuration = preferences.preferredDurations.some(duration => 
          slot.duration >= duration
        );
        
        return withinTimeRange && matchesDuration;
      });
    }
  
    /**
     * Get optimal study slots for a day
     */
    getOptimalSlots(slots, maxSlots = 3) {
      // Sort by quality score and time
      const sortedSlots = slots
        .sort((a, b) => {
          // Primary sort by quality
          if (a.quality !== b.quality) return b.quality - a.quality;
          // Secondary sort by time (earlier first)
          return new Date(a.startTime) - new Date(b.startTime);
        })
        .slice(0, maxSlots);
  
      return sortedSlots.map(slot => ({
        ...slot,
        recommendedMethod: this.suggestStudyMethod(slot.duration),
        methodDetails: this.studyMethods[this.suggestStudyMethod(slot.duration)]
      }));
    }
  
    /**
     * Calculate study statistics for a time period
     */
    calculateStudyStats(sessions, days = 7) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentSessions = sessions.filter(session => 
        new Date(session.startTime) >= cutoffDate && session.completed
      );
  
      const stats = {
        totalSessions: recentSessions.length,
        totalMinutes: recentSessions.reduce((sum, session) => sum + session.duration, 0),
        averageSession: 0,
        methodBreakdown: {},
        bestTimeOfDay: null,
        consistency: 0
      };
  
      if (recentSessions.length > 0) {
        stats.averageSession = Math.round(stats.totalMinutes / recentSessions.length);
        
        // Method breakdown
        recentSessions.forEach(session => {
          stats.methodBreakdown[session.studyMethod] = 
            (stats.methodBreakdown[session.studyMethod] || 0) + 1;
        });
  
        // Best time of day
        const timeOfDayStats = {};
        recentSessions.forEach(session => {
          const timeOfDay = this.getTimeOfDay(session.startTime);
          timeOfDayStats[timeOfDay] = (timeOfDayStats[timeOfDay] || 0) + 1;
        });
        
        stats.bestTimeOfDay = Object.keys(timeOfDayStats)
          .reduce((a, b) => timeOfDayStats[a] > timeOfDayStats[b] ? a : b);
  
        // Consistency (sessions per day)
        const uniqueDays = new Set(recentSessions.map(session => 
          new Date(session.startTime).toDateString()
        ));
        stats.consistency = Math.round((uniqueDays.size / days) * 100);
      }
  
      return stats;
    }
  
    /**
     * Generate study recommendations based on calendar and history
     */
    generateRecommendations(freeSlots, studyHistory, preferences) {
      const recommendations = [];
  
      // Get optimal slots
      const optimalSlots = this.getOptimalSlots(freeSlots, 5);
  
      // Analyze study patterns
      const stats = this.calculateStudyStats(studyHistory);
      
      optimalSlots.forEach((slot, index) => {
        const recommendation = {
          slot,
          priority: index + 1,
          reason: this.getRecommendationReason(slot, stats, preferences),
          confidence: this.calculateConfidence(slot, stats)
        };
        
        recommendations.push(recommendation);
      });
  
      return recommendations;
    }
  
    /**
     * Get reason for recommendation
     */
    getRecommendationReason(slot, stats, preferences) {
      const reasons = [];
      
      if (slot.quality >= 80) reasons.push('High-quality time slot');
      if (slot.duration >= 90) reasons.push('Perfect for deep work');
      if (slot.timeOfDay === stats.bestTimeOfDay) reasons.push('Matches your productive hours');
      if (slot.timeOfDay === 'morning') reasons.push('Morning focus time');
      
      return reasons.length > 0 ? reasons[0] : 'Available study time';
    }
  
    /**
     * Calculate confidence score for recommendation
     */
    calculateConfidence(slot, stats) {
      let confidence = slot.quality;
      
      // Boost if matches historical patterns
      if (slot.timeOfDay === stats.bestTimeOfDay) confidence += 10;
      if (stats.consistency > 70) confidence += 5;
      
      return Math.min(100, confidence);
    }
  }
  
  export const calendarService = new CalendarService();