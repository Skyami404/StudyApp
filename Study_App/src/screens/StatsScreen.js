import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useStats from '../hooks/useStats';

const StatsScreen = () => {
  const {
    todaysSessions,
    weeklyMinutes,
    currentStreak,
    todaysMinutes,
    loading,
    error,
    loadStats,
    clearAllData,
    getSessionHistory
  } = useStats();

  const [sessionHistory, setSessionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadSessionHistory();
  }, []);

  const loadSessionHistory = async () => {
    try {
      const history = await getSessionHistory(7); // Last 7 days
      setSessionHistory(history);
    } catch (error) {
      console.error('Error loading session history:', error);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all study data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              await loadSessionHistory();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          }
        },
      ]
    );
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getMethodIcon = (method) => {
    const icons = {
      pomodoro: 'timer',
      focus: 'eye',
      deepwork: 'brain',
      default: 'school'
    };
    return icons[method] || icons.default;
  };

  const getMethodColor = (method) => {
    const colors = {
      pomodoro: '#FF6B6B',
      focus: '#4ECDC4',
      deepwork: '#45B7D1',
      default: '#96CEB4'
    };
    return colors[method] || colors.default;
  };

  const renderStatCard = (title, value, subtitle, icon, color = '#4A90E2') => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderTodaySession = ({ item }) => (
    <View style={styles.sessionItem}>
      <View style={styles.sessionHeader}>
        <View style={[styles.methodIcon, { backgroundColor: getMethodColor(item.method) }]}>
          <Ionicons name={getMethodIcon(item.method)} size={16} color="#fff" />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionMethod}>
            {item.method.charAt(0).toUpperCase() + item.method.slice(1)} Session
          </Text>
          <Text style={styles.sessionTime}>
            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.sessionDuration}>{formatDuration(item.duration)}</Text>
      </View>
    </View>
  );

  const renderHistorySession = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={[styles.methodIcon, { backgroundColor: getMethodColor(item.method) }]}>
          <Ionicons name={getMethodIcon(item.method)} size={14} color="#fff" />
        </View>
        <View style={styles.historyInfo}>
          <Text style={styles.historyMethod}>
            {item.method.charAt(0).toUpperCase() + item.method.slice(1)}
          </Text>
          <Text style={styles.historyDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.historyDuration}>{formatDuration(item.duration)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color="#f44336" />
        <Text style={styles.errorText}>Error loading statistics</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Statistics</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadStats}>
          <Ionicons name="refresh" size={20} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        {renderStatCard(
          'Today\'s Study Time',
          formatDuration(todaysMinutes),
          `${todaysSessions.length} sessions`,
          'today',
          '#4CAF50'
        )}
        {renderStatCard(
          'Weekly Progress',
          formatDuration(weeklyMinutes),
          'Last 7 days',
          'calendar',
          '#2196F3'
        )}
        {renderStatCard(
          'Current Streak',
          `${currentStreak} days`,
          'Keep it up!',
          'flame',
          '#FF9800'
        )}
      </View>

      {/* Today's Sessions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Sessions</Text>
          <Text style={styles.sessionCount}>{todaysSessions.length} sessions</Text>
        </View>
        
        {todaysSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No study sessions today</Text>
            <Text style={styles.emptySubtext}>Start your first session to see stats here</Text>
          </View>
        ) : (
          <FlatList
            data={todaysSessions}
            renderItem={renderTodaySession}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Session History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
            <Ionicons 
              name={showHistory ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#4A90E2" 
            />
          </TouchableOpacity>
        </View>
        
        {showHistory && (
          sessionHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No recent sessions</Text>
            </View>
          ) : (
            <FlatList
              data={sessionHistory}
              renderItem={renderHistorySession}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
          <Ionicons name="trash-outline" size={16} color="#f44336" />
          <Text style={styles.clearButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  refreshButton: {
    padding: 8,
  },
  statsGrid: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  sessionCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
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
  sessionItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  sessionTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  historyItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyInfo: {
    flex: 1,
  },
  historyMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  actions: {
    padding: 16,
    alignItems: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  clearButtonText: {
    color: '#f44336',
    fontWeight: '600',
  },
});

export default StatsScreen;