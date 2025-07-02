# App Blocking Feature for Study App

## Overview

The app blocking feature helps users stay focused during study sessions by detecting when they try to switch to other apps and encouraging them to return to their study session.

## Features

### 🔒 App Blocking
- **Detection**: Monitors when users switch away from the study app
- **Notifications**: Sends push notifications to remind users to return
- **Overlay**: Shows a blocking overlay when users try to leave the app
- **Tracking**: Counts app switch attempts for accountability

### 📱 Focus Mode Integration
- **Suggestions**: Prompts users to enable device Focus Mode or Do Not Disturb
- **Settings**: Quick access to device settings for focus features
- **Guidance**: Educates users on best practices for distraction-free studying

### ⚙️ Customizable Settings
- **Enable/Disable**: Users can turn blocking on/off during sessions
- **Advanced Options**: Additional configuration for blocking behavior
- **Statistics**: Track focus attempts and session progress

## How It Works

### 1. App State Monitoring
The app uses React Native's `AppState` API to detect when the app moves between:
- **Active**: User is using the study app
- **Background**: User has switched to another app
- **Inactive**: App is transitioning states

### 2. Notification System
When users switch away during a study session:
- **Immediate Notification**: Shows a notification right away
- **Periodic Reminders**: Schedules follow-up reminders every 30 seconds
- **Custom Messages**: Encouraging messages to return to studying

### 3. Blocking Overlay
When users return to the app after switching away:
- **Modal Display**: Shows an animated overlay
- **Session Info**: Displays current timer and method
- **Action Buttons**: Options to return to study or disable blocking

## Implementation Details

### Files Created/Modified

1. **`src/services/appBlockingService.js`**
   - Core service for app blocking functionality
   - Handles app state changes and notifications
   - Manages blocking lifecycle

2. **`src/components/BlockingOverlay.js`**
   - Modal overlay component
   - Animated entrance/exit effects
   - User interaction handling

3. **`src/hooks/useTimerWithBlocking.js`**
   - Enhanced timer hook with blocking integration
   - Manages blocking state and user interactions
   - Coordinates with blocking service

4. **`src/components/BlockingSettings.js`**
   - Settings interface for blocking configuration
   - Advanced options and user education
   - Focus mode integration

5. **`src/screens/StudyScreen.js`** (Modified)
   - Integrated blocking overlay
   - Updated UI to show blocking status
   - Enhanced user controls

### Permissions Required

```json
{
  "android": {
    "permissions": ["POST_NOTIFICATIONS"]
  }
}
```

## Usage

### Starting a Study Session with Blocking

```javascript
// In StudyScreen.js
const startTimer = () => {
  // Start timer with app blocking enabled
  startTimer(true);
};
```

### Managing Blocking State

```javascript
// Enable blocking for current session
enableBlocking();

// Disable blocking for current session
disableBlocking();

// Check blocking status
const { blockingEnabled, appSwitchAttempts } = useTimerWithBlocking();
```

### Customizing Blocking Behavior

```javascript
// In appBlockingService.js
// Customize notification messages
showBlockingNotification() {
  // Custom notification content
}

// Customize reminder frequency
scheduleReminderNotification() {
  // Adjust timing (currently 30 seconds)
}
```

## User Experience

### First-Time Users
1. **Permission Request**: App requests notification permissions
2. **Focus Mode Suggestion**: Prompts to enable device focus features
3. **Tutorial**: Explains how blocking works

### During Study Sessions
1. **Visual Indicators**: Shows blocking status and attempt count
2. **Gentle Reminders**: Non-intrusive notifications when switching apps
3. **Easy Control**: Simple toggle to enable/disable blocking

### Session Completion
1. **Success Celebration**: Congratulates users on completing sessions
2. **Statistics**: Shows focus attempts and session duration
3. **Progress Tracking**: Records focus metrics for improvement

## Best Practices

### For Users
- **Enable Focus Mode**: Use device-level focus features for best results
- **Start Small**: Begin with shorter sessions to build focus habits
- **Review Stats**: Monitor app switch attempts to improve focus
- **Be Patient**: Focus is a skill that improves with practice

### For Developers
- **Respect User Choice**: Always allow users to disable blocking
- **Clear Communication**: Explain what the app is doing and why
- **Graceful Degradation**: Handle cases where permissions are denied
- **Performance**: Ensure blocking doesn't impact app performance

## Limitations

### Platform Restrictions
- **iOS**: Cannot prevent app switching, only detect and notify
- **Android**: Limited to notification-based reminders
- **Web**: Cannot detect app switching due to browser sandboxing

### User Control
- **Always Optional**: Users can disable blocking at any time
- **No Forced Blocking**: Cannot prevent users from leaving the app
- **Respect Privacy**: Only tracks app state, not specific apps used

## Future Enhancements

### Potential Features
- **Website Blocking**: Block distracting websites on desktop
- **Smart Scheduling**: Suggest optimal study times based on focus patterns
- **Focus Analytics**: Detailed reports on focus improvement over time
- **Social Features**: Share focus achievements with friends
- **Integration**: Connect with calendar and productivity apps

### Technical Improvements
- **Background Processing**: More reliable app state detection
- **Custom Notifications**: Personalized reminder messages
- **Offline Support**: Blocking works without internet connection
- **Cross-Platform**: Consistent experience across all platforms

## Troubleshooting

### Common Issues

**Notifications not showing:**
- Check notification permissions in device settings
- Ensure app is not in battery optimization mode
- Verify notification settings in app preferences

**Blocking not working:**
- Confirm app blocking is enabled in settings
- Check if app has necessary permissions
- Restart the app if issues persist

**Performance issues:**
- Disable blocking temporarily to isolate the issue
- Check for memory leaks in app state listeners
- Monitor battery usage during study sessions

### Support

For technical support or feature requests, please refer to the main project documentation or create an issue in the project repository. 