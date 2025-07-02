import { AppState, Alert, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

class AppBlockingService {
  constructor() {
    this.isBlockingEnabled = false;
    this.blockingStartTime = null;
    this.appStateListener = null;
    this.overlayVisible = false;
    this.onBlockingStateChange = null;
    this.onAppSwitchAttempt = null;
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
      console.log('App blocking service initialized');
    } catch (error) {
      console.error('Failed to initialize app blocking service:', error);
    }
  }

  // Start app blocking
  startBlocking(onStateChange, onSwitchAttempt) {
    this.isBlockingEnabled = true;
    this.blockingStartTime = Date.now();
    this.onBlockingStateChange = onStateChange;
    this.onAppSwitchAttempt = onSwitchAttempt;
    
    // Notify state change
    if (this.onBlockingStateChange) {
      this.onBlockingStateChange(true);
    }

    // Show blocking notification
    this.showBlockingNotification();
    
    console.log('App blocking started');
  }

  // Stop app blocking
  stopBlocking() {
    this.isBlockingEnabled = false;
    this.blockingStartTime = null;
    
    // Notify state change
    if (this.onBlockingStateChange) {
      this.onBlockingStateChange(false);
    }

    // Clear notification
    this.clearBlockingNotification();
    
    console.log('App blocking stopped');
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
    }
  }

  // Handle when user switches away from app
  handleAppSwitch() {
    console.log('User switched away from app - showing notification');
    
    // Show blocking notification
    this.showBlockingNotification();
    
    // Schedule repeated reminder notification
    this.scheduleReminderNotification();
  }

  // Handle when user returns to app
  handleReturnToApp() {
    // Clear any scheduled notifications
    this.clearScheduledNotifications();
  }

  // Show blocking notification (persistent)
  async showBlockingNotification() {
    try {
      console.log('Attempting to show blocking notification');
      const content = {
        title: '⏰ Stay Focused!',
        body: 'Your study timer is running. Please return to the Study App.',
        data: { type: 'study_blocking' },
      };
      if (Platform.OS === 'android') {
        content.sticky = true;
        content.priority = Notifications.AndroidNotificationPriority.HIGH;
      }
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: null, // Show immediately
      });
      console.log('Blocking notification scheduled with ID:', notificationId);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  // Schedule repeated reminder notification
  async scheduleReminderNotification() {
    try {
      console.log('Scheduling reminder notification');
      const content = {
        title: '⏰ Still Studying?',
        body: 'Return to the Study App to keep your focus! (Blocking is active)',
        data: { type: 'study_reminder' },
      };
      if (Platform.OS === 'android') {
        content.sticky = true;
        content.priority = Notifications.AndroidNotificationPriority.HIGH;
      }
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: { seconds: 30, repeats: true }, // Remind every 30 seconds
      });
      console.log('Reminder notification scheduled with ID:', notificationId);
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
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
      'Enable Focus Mode',
      'For the best study experience, consider enabling your device\'s Focus Mode or Do Not Disturb.',
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
      startTime: this.blockingStartTime,
      duration: this.blockingStartTime ? Date.now() - this.blockingStartTime : 0,
    };
  }

  // Cleanup
  cleanup() {
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
    this.clearScheduledNotifications();
    this.clearBlockingNotification();
  }
}

// Create singleton instance
const appBlockingService = new AppBlockingService();

export default appBlockingService; 