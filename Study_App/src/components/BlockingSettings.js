import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';

export default function BlockingSettings({ 
  blockingEnabled, 
  onToggleBlocking, 
  onShowFocusModeSuggestion,
  appSwitchAttempts 
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleBlocking = () => {
    if (blockingEnabled) {
      Alert.alert(
        'Disable App Blocking',
        'Are you sure you want to disable app blocking? This will allow you to switch to other apps during your study session.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disable', 
            style: 'destructive',
            onPress: onToggleBlocking
          },
        ]
      );
    } else {
      onToggleBlocking();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>App Blocking Settings</Text>
        <Text style={styles.subtitle}>
          Control how the app prevents distractions during study sessions
        </Text>
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>App Blocking</Text>
          <Text style={styles.settingDescription}>
            Prevents switching to other apps during study sessions
          </Text>
        </View>
        <Switch
          value={blockingEnabled}
          onValueChange={handleToggleBlocking}
          trackColor={{ false: '#767577', true: '#4CAF50' }}
          thumbColor={blockingEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      {blockingEnabled && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>🔒 Blocking Active</Text>
          {appSwitchAttempts > 0 && (
            <Text style={styles.attemptsText}>
              App switch attempts: {appSwitchAttempts}
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity 
        style={styles.settingItem}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Advanced Settings</Text>
          <Text style={styles.settingDescription}>
            Additional blocking and focus options
          </Text>
        </View>
        <Text style={styles.expandIcon}>{showAdvanced ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {showAdvanced && (
        <View style={styles.advancedContainer}>
          <TouchableOpacity 
            style={styles.advancedItem}
            onPress={onShowFocusModeSuggestion}
          >
            <Text style={styles.advancedTitle}>📱 Enable Focus Mode</Text>
            <Text style={styles.advancedDescription}>
              Open device settings to enable Focus Mode or Do Not Disturb
            </Text>
          </TouchableOpacity>

          <View style={styles.advancedItem}>
            <Text style={styles.advancedTitle}>🔔 Notification Settings</Text>
            <Text style={styles.advancedDescription}>
              Configure study session notifications and reminders
            </Text>
          </View>

          <View style={styles.advancedItem}>
            <Text style={styles.advancedTitle}>⚙️ Blocking Behavior</Text>
            <Text style={styles.advancedDescription}>
              Customize how app switching is detected and handled
            </Text>
          </View>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How App Blocking Works</Text>
        <Text style={styles.infoText}>
          • Detects when you switch to other apps during study sessions{'\n'}
          • Shows notifications to remind you to return to studying{'\n'}
          • Displays an overlay when you try to leave the app{'\n'}
          • Tracks your focus attempts and progress{'\n'}
          • Can be disabled at any time during a session
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#999999',
    lineHeight: 18,
  },
  expandIcon: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  attemptsText: {
    color: '#FF9800',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  advancedContainer: {
    marginTop: 16,
    paddingLeft: 16,
  },
  advancedItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  advancedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  advancedDescription: {
    fontSize: 14,
    color: '#999999',
    lineHeight: 18,
  },
  infoContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
}); 