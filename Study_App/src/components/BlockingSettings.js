import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BlockingSettings({ 
  visible,
  onClose,
  blockingEnabled, 
  onToggleBlocking, 
  onShowFocusModeSuggestion,
  appSwitchAttempts,
  blockingLevel = 'standard',
  onBlockingLevelChange,
  blockingSettings = {},
  onBlockingSettingsChange,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const blockingLevels = [
    { key: 'standard', name: 'Standard', description: 'Gentle reminders and notifications', icon: '🔔' },
    { key: 'strict', name: 'Strict', description: 'Stronger warnings and frequent reminders', icon: '⚠️' },
    { key: 'screen-time', name: 'Screen Time', description: 'Integrate with device focus modes', icon: '🔒' },
  ];

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

  const handleLevelChange = (level) => {
    if (level === 'screen-time') {
      Alert.alert(
        'Screen Time Integration',
        'This will guide you to enable Screen Time (iOS) or Focus Mode (Android) for maximum focus. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => onBlockingLevelChange(level) }
        ]
      );
    } else {
      onBlockingLevelChange(level);
    }
  };

  const handleSettingChange = (key, value) => {
    onBlockingSettingsChange({ ...blockingSettings, [key]: value });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Blocking Settings</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              <>
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>🔒 Blocking Active</Text>
                  <Text style={styles.levelText}>Level: {blockingLevels.find(l => l.key === blockingLevel)?.name}</Text>
                  {appSwitchAttempts > 0 && (
                    <Text style={styles.attemptsText}>
                      App switch attempts: {appSwitchAttempts}
                    </Text>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Blocking Level</Text>
                  {blockingLevels.map((level) => (
                    <TouchableOpacity
                      key={level.key}
                      style={[
                        styles.levelItem,
                        blockingLevel === level.key && styles.levelItemActive
                      ]}
                      onPress={() => handleLevelChange(level.key)}
                    >
                      <Text style={styles.levelIcon}>{level.icon}</Text>
                      <View style={styles.levelInfo}>
                        <Text style={styles.levelName}>{level.name}</Text>
                        <Text style={styles.levelDescription}>{level.description}</Text>
                      </View>
                      {blockingLevel === level.key && (
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
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
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Enable Screen Time Integration</Text>
                    <Text style={styles.settingDescription}>
                      Guide users to enable device-level focus features
                    </Text>
                  </View>
                  <Switch
                    value={blockingSettings.enableScreenTime || false}
                    onValueChange={(value) => handleSettingChange('enableScreenTime', value)}
                    trackColor={{ false: '#767577', true: '#4CAF50' }}
                    thumbColor={(blockingSettings.enableScreenTime || false) ? '#fff' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Allow Emergency Calls</Text>
                    <Text style={styles.settingDescription}>
                      Always allow access to phone app for emergencies
                    </Text>
                  </View>
                  <Switch
                    value={blockingSettings.allowEmergencyCalls !== false}
                    onValueChange={(value) => handleSettingChange('allowEmergencyCalls', value)}
                    trackColor={{ false: '#767577', true: '#4CAF50' }}
                    thumbColor={(blockingSettings.allowEmergencyCalls !== false) ? '#fff' : '#f4f3f4'}
                  />
                </View>

                <TouchableOpacity 
                  style={styles.advancedItem}
                  onPress={onShowFocusModeSuggestion}
                >
                  <Text style={styles.advancedTitle}>📱 Enable Focus Mode</Text>
                  <Text style={styles.advancedDescription}>
                    Open device settings to enable Focus Mode or Do Not Disturb
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>How Enhanced App Blocking Works</Text>
              <Text style={styles.infoText}>
                • <Text style={styles.bold}>Standard Mode:</Text> Gentle reminders and notifications{'\n'}
                • <Text style={styles.bold}>Strict Mode:</Text> Stronger warnings and frequent reminders{'\n'}
                • <Text style={styles.bold}>Screen Time Mode:</Text> Integrates with device focus features{'\n'}
                • Detects when you switch to other apps during study sessions{'\n'}
                • Shows notifications to remind you to return to studying{'\n'}
                • Displays an overlay when you try to leave the app{'\n'}
                • Tracks your focus attempts and progress{'\n'}
                • Can be disabled at any time during a session
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
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
  levelText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  attemptsText: {
    color: '#FF9800',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 8,
  },
  levelItemActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  levelIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  levelDescription: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 2,
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
  bold: {
    fontWeight: 'bold',
  },
}); 