import { AppState, Alert, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

class EnhancedAppBlockingService {
  constructor() {
    this.isBlockingEnabled = false;
    this.blockingStartTime = null;
    this.appStateListener = null;
    this.onBlockingStateChange = null;
    this.onAppSwitchAttempt = null;
    this.blockingLevel = 'standard'; // 'standard', 'strict', 'screen-time'
    this.allowedApps = ['StudyApp', 'Settings', 'Phone']; // Apps that are always allowed
    this.blockingSettings = {
      enableScreenTime: false,
      enableStrictMode: false,
      allowEmergencyCalls: true,
      allowSystemApps: true,
    };
  }

  // Initialize the service
  async initialize() {
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted:', status);
      } else {
        console.log('Notification permissions granted');
      }

      // Set up app state listener
      this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
      console.log('Enhanced app blocking service initialized');
    } catch (error) {
      console.error('Failed to initialize enhanced app blocking service:', error);
    }
  }

  // Start enhanced app blocking
  startBlocking(onStateChange, onSwitchAttempt, level = 'standard') {
    this.isBlockingEnabled = true;
    this.blockingLevel = level;
    this.blockingStartTime = Date.now();
    this.onBlockingStateChange = onStateChange;
    this.onAppSwitchAttempt = onSwitchAttempt;
    
    // Notify state change
    if (this.onBlockingStateChange) {
      this.onBlockingStateChange(true);
    }

    // Show blocking notification
    this.showBlockingNotification();
    
    // Enable screen time if requested
    if (this.blockingSettings.enableScreenTime && level === 'screen-time') {
      this.enableScreenTime();
    }
    
    console.log(`Enhanced app blocking started with level: ${level}`);
  }

  // Stop enhanced app blocking
  stopBlocking() {
    this.isBlockingEnabled = false;
    this.blockingStartTime = null;
    
    // Notify state change
    if (this.onBlockingStateChange) {
      this.onBlockingStateChange(false);
    }

    // Clear notification
    this.clearBlockingNotification();
    
    // Clear blocking interval
    if (this.blockingInterval) {
      clearInterval(this.blockingInterval);
      this.blockingInterval = null;
    }
    
    // Disable screen time if it was enabled
    if (this.blockingSettings.enableScreenTime) {
      this.disableScreenTime();
    }
    
    console.log('Enhanced app blocking stopped');
  }

  // Handle app state changes
  handleAppStateChange(nextAppState) {
    if (this.isBlockingEnabled && nextAppState === 'active') {
      // User returned to our app
      this.handleReturnToApp();
      // Show overlay via callback
      if (this.onAppSwitchAttempt) {
        this.onAppSwitchAttempt();
      }
    } else if (this.isBlockingEnabled && nextAppState === 'background') {
      // User switched away from our app
      this.handleAppSwitch();
      
      // For screen-time mode, show stronger blocking
      if (this.blockingLevel === 'screen-time') {
        this.handleScreenTimeBlocking();
      }
    }
  }

  // Handle when user returns to app
  handleReturnToApp() {
    // Clear any scheduled notifications
    this.clearScheduledNotifications();
    console.log('User returned to app');
  }

  // Handle when user switches away from app
  handleAppSwitch() {
    console.log('User switched away from app - enhanced blocking active');
    
    // Show blocking notification
    this.showBlockingNotification();
    
    // Schedule repeated reminder notification
    this.scheduleReminderNotification();
    
    // If in strict mode, show stronger warning
    if (this.blockingLevel === 'strict') {
      this.showStrictModeWarning();
    }
  }

  // Show strict mode warning
  showStrictModeWarning() {
    Alert.alert(
      '⚠️ Strict Mode Active',
      'You\'re in strict focus mode. Please return to your study session immediately.',
      [
        { text: 'Return to Study', onPress: () => this.handleReturnToApp() },
        { text: 'Disable Strict Mode', style: 'destructive', onPress: () => this.disableStrictMode() }
      ]
    );
  }

  // Enable screen time integration
  async enableScreenTime() {
    try {
      if (Platform.OS === 'ios') {
        // On iOS, guide user to enable Screen Time and Focus Mode
        Alert.alert(
          'Enable Enhanced Focus Mode',
          'For maximum focus, please enable:\n\n1. Screen Time in Settings > Screen Time\n2. Focus Mode in Settings > Focus\n3. App Limits for distracting apps\n\nThis will help block other apps during study sessions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => this.openDeviceSettings() },
            { 
              text: 'Enable Focus Mode', 
              onPress: () => this.enableFocusMode() 
            }
          ]
        );
      } else if (Platform.OS === 'android') {
        // On Android, guide user to Digital Wellbeing and Focus Mode
        Alert.alert(
          'Enable Enhanced Focus Mode',
          'For maximum focus, please enable:\n\n1. Digital Wellbeing in Settings\n2. Focus Mode or Do Not Disturb\n3. App timers for distracting apps\n\nThis will help block other apps during study sessions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => this.openDeviceSettings() },
            { 
              text: 'Enable Focus Mode', 
              onPress: () => this.enableFocusMode() 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error enabling screen time:', error);
    }
  }

  // Enable focus mode
  async enableFocusMode() {
    try {
      if (Platform.OS === 'ios') {
        // Try to open Focus Mode settings
        const focusUrl = 'App-Prefs:Focus';
        const canOpen = await Linking.canOpenURL(focusUrl);
        if (canOpen) {
          await Linking.openURL(focusUrl);
        } else {
          // Fallback to general settings
          await Linking.openSettings();
        }
      } else if (Platform.OS === 'android') {
        // Try to open Digital Wellbeing settings
        const wellbeingUrl = 'android-app://com.google.android.apps.wellbeing';
        const canOpen = await Linking.canOpenURL(wellbeingUrl);
        if (canOpen) {
          await Linking.openURL(wellbeingUrl);
        } else {
          // Fallback to general settings
          await Linking.openSettings();
        }
      }
    } catch (error) {
      console.error('Error enabling focus mode:', error);
      // Fallback to general settings
      await Linking.openSettings();
    }
  }

  // Disable screen time integration
  async disableScreenTime() {
    try {
      console.log('Screen time integration disabled');
    } catch (error) {
      console.error('Error disabling screen time:', error);
    }
  }

  // Disable strict mode
  disableStrictMode() {
    this.blockingLevel = 'standard';
    console.log('Strict mode disabled');
  }

  // Show blocking notification (enhanced)
  async showBlockingNotification() {
    try {
      console.log('Attempting to show enhanced blocking notification');
      const content = {
        title: this.blockingLevel === 'strict' ? '🚫 Strict Focus Mode' : '⏰ Stay Focused!',
        body: this.blockingLevel === 'strict' 
          ? 'Strict mode active. Return to study immediately!' 
          : 'Your study timer is running. Please return to the Study App.',
        data: { type: 'study_blocking', level: this.blockingLevel },
      };
      
      if (Platform.OS === 'android') {
        content.sticky = true;
        content.priority = Notifications.AndroidNotificationPriority.HIGH;
        content.ongoing = true; // Make it persistent
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: null, // Show immediately
      });
      console.log('Enhanced blocking notification scheduled with ID:', notificationId);
    } catch (error) {
      console.error('Failed to show enhanced notification:', error);
    }
  }

  // Schedule repeated reminder notification (enhanced)
  async scheduleReminderNotification() {
    try {
      console.log('Scheduling enhanced reminder notification');
      const content = {
        title: this.blockingLevel === 'strict' ? '🚫 Return to Study!' : '⏰ Still Studying?',
        body: this.blockingLevel === 'strict'
          ? 'Strict mode: Return to your study session now!'
          : 'Return to the Study App to keep your focus! (Blocking is active)',
        data: { type: 'study_reminder', level: this.blockingLevel },
      };
      
      if (Platform.OS === 'android') {
        content.sticky = true;
        content.priority = Notifications.AndroidNotificationPriority.HIGH;
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: { seconds: this.blockingLevel === 'strict' ? 15 : 30, repeats: true },
      });
      console.log('Enhanced reminder notification scheduled with ID:', notificationId);
    } catch (error) {
      console.error('Failed to schedule enhanced reminder:', error);
    }
  }

  // Clear blocking notification
  async clearBlockingNotification() {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.log('Failed to clear notifications:', error);
    }
  }

  // Clear scheduled notifications
  async clearScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.log('Failed to clear scheduled notifications:', error);
    }
  }

  // Show focus mode suggestion
  showFocusModeSuggestion() {
    Alert.alert(
      'Enable Enhanced Focus Mode',
      'For the strongest focus experience, consider enabling Screen Time (iOS) or Focus Mode (Android).',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Settings', 
          onPress: () => this.openDeviceSettings() 
        },
      ]
    );
  }

  // Open device settings
  openDeviceSettings() {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:General&path=Focus');
    } else {
      Linking.openSettings();
    }
  }

  // Get blocking status
  getBlockingStatus() {
    return {
      isEnabled: this.isBlockingEnabled,
      level: this.blockingLevel,
      startTime: this.blockingStartTime,
      duration: this.blockingStartTime ? Date.now() - this.blockingStartTime : 0,
      settings: this.blockingSettings,
    };
  }

  // Update blocking settings
  updateBlockingSettings(settings) {
    this.blockingSettings = { ...this.blockingSettings, ...settings };
    console.log('Blocking settings updated:', this.blockingSettings);
  }

  // Cleanup
  cleanup() {
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
    this.clearScheduledNotifications();
    this.clearBlockingNotification();
    
    // Clear blocking interval
    if (this.blockingInterval) {
      clearInterval(this.blockingInterval);
      this.blockingInterval = null;
    }
  }

  // Handle screen time blocking
  handleScreenTimeBlocking() {
    console.log('Screen time blocking active - preventing app switching');
    
    // Show persistent notification
    this.showPersistentNotification();
    
    // Schedule immediate return notification
    setTimeout(() => {
      this.showReturnNotification();
    }, 2000);
    
    // Schedule repeated blocking notifications
    this.scheduleBlockingNotifications();
  }

  // Show persistent blocking notification
  async showPersistentNotification() {
    try {
      const content = {
        title: '🔒 Focus Mode Active',
        body: 'Return to Study App to continue your session',
        data: { type: 'focus_blocking', level: 'screen-time' },
        sticky: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      };
      
      if (Platform.OS === 'android') {
        content.ongoing = true;
        content.autoDismiss = false;
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: null,
      });
      
      console.log('Persistent blocking notification shown:', notificationId);
    } catch (error) {
      console.error('Failed to show persistent notification:', error);
    }
  }

  // Show return notification
  async showReturnNotification() {
    try {
      const content = {
        title: '⏰ Study Session Active',
        body: 'Your timer is still running. Please return to the Study App.',
        data: { type: 'return_reminder', level: 'screen-time' },
      };
      
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show return notification:', error);
    }
  }

  // Schedule blocking notifications
  scheduleBlockingNotifications() {
    // Schedule notifications every 30 seconds for screen-time mode
    const interval = setInterval(async () => {
      if (!this.isBlockingEnabled) {
        clearInterval(interval);
        return;
      }
      
      try {
        const content = {
          title: '🔒 Focus Mode',
          body: 'Stay focused! Return to your study session.',
          data: { type: 'blocking_reminder', level: 'screen-time' },
        };
        
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: null,
        });
      } catch (error) {
        console.error('Failed to schedule blocking notification:', error);
      }
    }, 30000); // Every 30 seconds
    
    // Store interval reference for cleanup
    this.blockingInterval = interval;
  }
}

// Create singleton instance
const enhancedAppBlockingService = new EnhancedAppBlockingService();

export { enhancedAppBlockingService };
export default enhancedAppBlockingService; 