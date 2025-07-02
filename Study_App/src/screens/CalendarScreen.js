import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import useCalendar from '../hooks/useCalendar';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

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

  useEffect(() => {
    if (hasPermission) {
      refreshCalendarData();
    }
  }, [hasPermission]);

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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Study Time!',
          body: `It's time to study! Tap to open the Study App and start your session.`,
          data: { type: 'study_reminder', slotStart: pickedTime },
        },
        trigger,
      });
      setShowPicker(false);
      Alert.alert('Study Session Scheduled', `You will be reminded at ${pickedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (e) {
      setShowPicker(false);
      Alert.alert('Error', 'Failed to schedule notification.');
    }
  };

  const renderEvent = ({ item }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title || '(No Title)'}</Text>
      <Text style={styles.eventTime}>
        {new Date(item.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {' - '}
        {new Date(item.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text style={styles.eventCalendar}>{item.calendarId && calendars.find(c => c.id === item.calendarId)?.title}</Text>
    </View>
  );

  const renderFreeSlot = ({ item }) => (
    <View style={styles.freeSlotItem}>
      <View style={styles.freeSlotContent}>
        <Text style={styles.freeSlotTime}>{formatTimeSlot(item)}</Text>
        <TouchableOpacity style={styles.scheduleButton} onPress={() => handlePickTime(item)}>
          <Text style={styles.scheduleButtonText}>Pick Time & Schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
    <View style={styles.container}>
      <Text style={styles.header}>Today's Calendar Events</Text>
      {events.length === 0 ? (
        <Text style={styles.emptyText}>No events found for today.</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={renderEvent}
          style={styles.list}
        />
      )}

      <Text style={styles.header}>Free Time Slots</Text>
      {freeSlots.length === 0 ? (
        <Text style={styles.emptyText}>No free slots available today.</Text>
      ) : (
        <FlatList
          data={freeSlots}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={renderFreeSlot}
          style={styles.list}
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
    </View>
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
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  list: {
    marginBottom: 16,
  },
  eventItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
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
  freeSlotTime: {
    fontSize: 15,
    color: '#212529',
    fontWeight: '500',
    marginBottom: 8,
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
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    minHeight: 300,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#212529',
    textAlign: 'center',
  },
  pickerWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  timePicker: {
    width: 200,
    height: 150,
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scheduleButtonModal: {
    backgroundColor: '#4A90E2',
  },
});