import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal, ScrollView, RefreshControl } from 'react-native';
import useCalendar from '../hooks/useCalendar';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen() {
  const {
    hasPermission,
    calendars,
    events,
    freeSlots,
    loading,
    error,
    formatTimeSlot,
    refreshCalendarData
  } = useCalendar();

  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pickedTime, setPickedTime] = useState(null);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);

  useEffect(() => {
    if (hasPermission) {
      refreshCalendarData();
    }
    loadScheduledNotifications();
  }, [hasPermission]);

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const studyNotifications = notifications.filter(notification => 
        notification.content.data?.type === 'study_reminder'
      );
      setScheduledNotifications(studyNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshCalendarData(),
        loadScheduledNotifications()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Show time picker for slot
  const handlePickTime = (slot) => {
    setSelectedSlot(slot);
    setPickedTime(new Date(slot.startTime));
    setShowPicker(true);
  };

  // Schedule notification for picked time
  const handleScheduleStudy = async () => {
    if (!pickedTime || pickedTime < new Date()) {
      Alert.alert('Invalid Time', 'Please pick a future time.');
      return;
    }
    try {
      let trigger;
      if (Platform.OS === 'ios') {
        // iOS: use timestamp
        trigger = pickedTime;
      } else {
        // Android: use hour/minute
        trigger = {
          hour: pickedTime.getHours(),
          minute: pickedTime.getMinutes(),
          repeats: false,
        };
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Study Time!',
          body: `It's time to study! Tap to open the Study App and start your session.`,
          data: { 
            type: 'study_reminder', 
            slotStart: pickedTime.toISOString(),
            method: 'pomodoro' // Default method
          },
        },
        trigger,
      });
      
      setShowPicker(false);
      Alert.alert(
        'Study Session Scheduled', 
        `You will be reminded at ${pickedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      );
      
      // Refresh notifications list
      await loadScheduledNotifications();
    } catch (e) {
      setShowPicker(false);
      Alert.alert('Error', 'Failed to schedule notification.');
    }
  };

  const cancelScheduledStudy = async (notificationId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await loadScheduledNotifications();
      Alert.alert('Cancelled', 'Study session reminder has been cancelled.');
    } catch (error) {
      console.error('Error cancelling notification:', error);
      Alert.alert('Error', 'Failed to cancel reminder.');
    }
  };

  const renderEvent = ({ item }) => (
    <View style={styles.eventItem}>
      <View style={styles.eventHeader}>
        <Ionicons name="calendar" size={16} color="#4A90E2" />
        <Text style={styles.eventTitle}>{item.title || '(No Title)'}</Text>
      </View>
      <Text style={styles.eventTime}>
        {new Date(item.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {' - '}
        {new Date(item.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text style={styles.eventCalendar}>
        {item.calendarId && calendars.find(c => c.id === item.calendarId)?.title}
      </Text>
    </View>
  );

  const renderFreeSlot = ({ item }) => (
    <View style={styles.freeSlotItem}>
      <View style={styles.freeSlotContent}>
        <View style={styles.freeSlotHeader}>
          <Ionicons name="time" size={16} color="#28a745" />
          <Text style={styles.freeSlotTime}>{formatTimeSlot(item)}</Text>
        </View>
        <TouchableOpacity style={styles.scheduleButton} onPress={() => handlePickTime(item)}>
          <Text style={styles.scheduleButtonText}>Schedule Study Time</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderScheduledStudy = ({ item }) => {
    const scheduledTime = new Date(item.trigger.date || item.trigger.hour * 3600000 + item.trigger.minute * 60000);
    return (
      <View style={styles.scheduledStudyItem}>
        <View style={styles.scheduledStudyHeader}>
          <Ionicons name="school" size={16} color="#ff6b35" />
          <Text style={styles.scheduledStudyTitle}>Scheduled Study Session</Text>
        </View>
        <Text style={styles.scheduledStudyTime}>
          {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {' - '}
          {scheduledTime.toLocaleDateString()}
        </Text>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => cancelScheduledStudy(item.identifier)}
        >
          <Text style={styles.cancelButtonText}>Cancel Reminder</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading || refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ color: '#666', marginTop: 12 }}>Loading calendar...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#666', textAlign: 'center' }}>
          Calendar access is required to show your events and schedule study sessions.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
      }
    >
      {/* Scheduled Study Sessions */}
      <Text style={styles.header}>📚 Scheduled Study Sessions</Text>
      {scheduledNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="school-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No study sessions scheduled</Text>
          <Text style={styles.emptySubtext}>Schedule a study time from the free slots below</Text>
        </View>
      ) : (
        <FlatList
          data={scheduledNotifications}
          keyExtractor={item => item.identifier}
          renderItem={renderScheduledStudy}
          style={styles.list}
          scrollEnabled={false}
        />
      )}

      {/* Today's Calendar Events */}
      <Text style={styles.header}>📅 Today's Calendar Events</Text>
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No events found for today</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={renderEvent}
          style={styles.list}
          scrollEnabled={false}
        />
      )}

      {/* Free Time Slots */}
      <Text style={styles.header}>⏰ Available Study Times</Text>
      {freeSlots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No free slots available today</Text>
          <Text style={styles.emptySubtext}>Try checking tomorrow or adjust your schedule</Text>
        </View>
      ) : (
        <FlatList
          data={freeSlots}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={renderFreeSlot}
          style={styles.list}
          scrollEnabled={false}
        />
      )}

      {/* Time Picker Modal */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Pick Study Start Time</Text>
            {pickedTime && (
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={pickedTime}
                  mode="time"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setPickedTime(date);
                  }}
                  style={styles.timePicker}
                  textColor="#000000"
                />
              </View>
            )}
            <View style={styles.pickerButtons}>
              <TouchableOpacity style={[styles.pickerButton, styles.cancelButton]} onPress={() => setShowPicker(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerButton, styles.scheduleButtonModal]} onPress={handleScheduleStudy}>
                <Text style={styles.scheduleButtonText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  list: {
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  eventItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  eventTime: {
    fontSize: 14,
    color: '#4A90E2',
    marginTop: 2,
  },
  eventCalendar: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  freeSlotItem: {
    backgroundColor: '#E3F6FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  freeSlotContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  freeSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  freeSlotTime: {
    fontSize: 15,
    color: '#212529',
    fontWeight: '500',
  },
  scheduleButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scheduledStudyItem: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  scheduledStudyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scheduledStudyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    flex: 1,
  },
  scheduledStudyTime: {
    fontSize: 14,
    color: '#FF6B35',
    marginTop: 2,
    marginBottom: 8,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#212529',
  },
  pickerWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timePicker: {
    width: 200,
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleButtonModal: {
    backgroundColor: '#4A90E2',
  },
});