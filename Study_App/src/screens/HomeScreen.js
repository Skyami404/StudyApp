import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getData } from '../services/storageService';

const { width, height } = Dimensions.get('window');

import useStats from '../hooks/useStats';
import useCalendar from '../hooks/useCalendar';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { todaysSessions, currentStreak, weeklyMinutes } = useStats();
  const { hasPermission, freeSlots, findFreeSlots, requestPermissions } = useCalendar();

  
  const [greeting, setGreeting] = useState('');
  const [nextSuggestedTime, setNextSuggestedTime] = useState(null);
  const [userName, setUserName] = useState('');

  // Set greeting based on time of day
  // useEffect(() => {
  //   const hour = new Date().getHours();
  //   if (hour < 12) {
  //     setGreeting('Good Morning');
  //   } else if (hour < 17) {
  //     setGreeting('Good Afternoon');
  //   } else {
  //     setGreeting('Good Evening');
  //   }
  // }, []);
  useEffect(() => {
    if (!hasPermission) {
      requestPermissions();
    }
  }, [hasPermission]);


  // Load user preferences and calendar data when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      if (hasPermission) {
        findFreeSlots();
      }
    }, [hasPermission])
  );

  const handleGetFreeTime = async () => {
    if (hasPermission) {
      await findFreeSlots(); // This will update freeSlots state
    }
  };

  const loadUserData = async () => {
    const preferences = await getData('userPreferences');
    if (preferences?.userName) {
      setUserName(preferences.userName);
    }
  };

  // Update next suggested time when free slots change
  useEffect(() => {
    if (freeSlots && freeSlots.length > 0) {
      const now = new Date();
      const upcomingSlot = freeSlots.find(slot => new Date(slot.start) > now);
      setNextSuggestedTime(upcomingSlot);
    }
  }, [freeSlots]);

  const handleQuickStudy = () => {
    navigation.navigate('Study', { 
      method: 'pomodoro',
      autoStart: true
    });
  };

  const handleCheckCalendar = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Calendar Access',
        'We can find perfect study times in your schedule. Allow calendar access?',
        [
          { text: 'Not Now', style: 'cancel' },
          { 
            text: 'Allow', 
            onPress: async () => {
              const granted = await requestPermissions();
              if (granted) {
                navigation.navigate('Calendar');
              }
            }
          }
        ]
      );
    } else {
      navigation.navigate('Calendar');
    }
  };

  const handleSettings = () => {
    // TODO: Implement settings screen
    Alert.alert('Settings', 'Settings screen coming soon!');
  };

  const handleViewStats = () => {
    navigation.navigate('Stats');
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMotivationalMessage = () => {
    if (currentStreak === 0) {
      return "Ready to start your focus journey?";
    } else if (currentStreak < 3) {
      return "You're building momentum!";
    } else if (currentStreak < 7) {
      return "Great consistency!";
    } else {
      return "You're on fire! 🔥";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting}</Text>
          {userName ? (
            <Text style={styles.userName}>{userName}</Text>
          ) : (
            <Text style={styles.userName}>Focus Time</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={handleSettings}
        >
          <Ionicons name="settings-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Study Card */}
        <TouchableOpacity 
          style={styles.quickStudyCard}
          onPress={handleQuickStudy}
          activeOpacity={0.8}
        >
          <View style={styles.quickStudyContent}>
            <View style={styles.quickStudyIcon}>
              <Ionicons name="flash" size={28} color="#fff" />
            </View>
            <View style={styles.quickStudyText}>
              <Text style={styles.quickStudyTitle}>Quick Study</Text>
              <Text style={styles.quickStudySubtitle}>Start 25min Pomodoro now</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Calendar Integration Card */}
        <TouchableOpacity 
          style={styles.calendarCard}
          onPress={handleCheckCalendar}
          activeOpacity={0.8}
        >
          <View style={styles.calendarContent}>
            <View style={styles.calendarIcon}>
              <Ionicons name="calendar-outline" size={24} color="#4A90E2" />
            </View>
            <View style={styles.calendarText}>
              <Text style={styles.calendarTitle}>Check Calendar</Text>
              {nextSuggestedTime ? (
                <Text style={styles.calendarSubtitle}>
                  Next: {formatTime(nextSuggestedTime.start)} 
                  ({nextSuggestedTime.duration}min available)
                </Text>
              ) : (
                <Text style={styles.calendarSubtitle}>
                  Find optimal study times
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4A90E2" />
          </View>
        </TouchableOpacity>

        {/* Today's Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{todaysSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{Math.round(weeklyMinutes / 60)}</Text>
                <Text style={styles.statLabel}>Hours This Week</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.viewStatsButton}
              onPress={handleViewStats}
            >
              <Text style={styles.viewStatsText}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color="#4A90E2" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivation Section */}
        <View style={styles.motivationSection}>
          <View style={styles.motivationCard}>
            <Text style={styles.motivationText}>
              {getMotivationalMessage()}
            </Text>
            {currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={16} color="#FF6B35" />
                <Text style={styles.streakText}>{currentStreak} days</Text>
              </View>
            )}
          </View>
        </View>

        {/* Study Methods Quick Access */}
        <View style={styles.quickMethodsSection}>
          <Text style={styles.sectionTitle}>Study Methods</Text>
          <View style={styles.methodsGrid}>
            <TouchableOpacity 
              style={styles.methodCard}
              onPress={() => navigation.navigate('Study', { method: 'pomodoro' })}
            >
              <Ionicons name="timer-outline" size={20} color="#4A90E2" />
              <Text style={styles.methodTitle}>Pomodoro</Text>
              <Text style={styles.methodDuration}>25 min</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.methodCard}
              onPress={() => navigation.navigate('Study', { method: 'focus' })}
            >
              <Ionicons name="bulb-outline" size={20} color="#7B68EE" />
              <Text style={styles.methodTitle}>Focus</Text>
              <Text style={styles.methodDuration}>45 min</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.methodCard}
              onPress={() => navigation.navigate('Study', { method: 'deepwork' })}
            >
              <Ionicons name="library-outline" size={20} color="#FF6B35" />
              <Text style={styles.methodTitle}>Deep Work</Text>
              <Text style={styles.methodDuration}>90 min</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickStudyCard: {
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickStudyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStudyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickStudyText: {
    flex: 1,
  },
  quickStudyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  quickStudySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  calendarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calendarText: {
    flex: 1,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  calendarSubtitle: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  progressSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 16,
  },
  viewStatsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewStatsText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    marginRight: 4,
  },
  motivationSection: {
    marginTop: 24,
  },
  motivationCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE066',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  motivationText: {
    fontSize: 15,
    color: '#B8860B',
    fontWeight: '600',
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  streakText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 4,
  },
  quickMethodsSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  methodsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginTop: 8,
  },
  methodDuration: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
});