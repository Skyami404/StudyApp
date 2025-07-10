// Updated StudyScreen.js to handle navigation parameters and app blocking
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTimerWithBlocking } from '../hooks/useTimerWithBlocking';
import { STUDY_METHODS } from '../constants/studyMethods';
import MethodSelector from '../components/MethodSelector';
import MusicControls from '../components/MusicControls';
import BlockingOverlay from '../components/BlockingOverlay';
import BlockingSettings from '../components/BlockingSettings';
import { enhancedAppBlockingService } from '../services/enhancedAppBlockingService';

const { width } = Dimensions.get('window');

export default function StudyScreen({ route, navigation }) {
  const [selectedMethod, setSelectedMethod] = useState('pomodoro');
  const [showBlockingSettings, setShowBlockingSettings] = useState(false);
  const [blockingSettings, setBlockingSettings] = useState({
    enableScreenTime: false,
    allowEmergencyCalls: true,
  });

  const {
    timeLeft,
    isRunning,
    isPaused,
    progress,
    currentPhase,
    blockingEnabled,
    blockingLevel,
    appSwitchAttempts,
    showOverlay,
    startTimer,
    pauseTimer,
    stopTimer,
    handleContinue,
    handleDisableBlocking,
    handleToggleBlocking,
    handleBlockingLevelChange,
    handleShowFocusModeSuggestion,
  } = useTimerWithBlocking(selectedMethod);

  // Handle navigation parameters
  useEffect(() => {
    if (route?.params) {
      const { autoStart, method } = route.params;
      
      // Set method if specified and valid
      if (method && STUDY_METHODS[method] && method !== selectedMethod) {
        setSelectedMethod(method);
      }
      
      // Auto-start if requested (only once when component mounts)
      if (autoStart && !isRunning && !isPaused) {
        const timer = setTimeout(() => {
          startTimer(true, blockingLevel);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [route?.params?.autoStart, route?.params?.method]); // Only depend on route params, not functions

  // Initialize enhanced blocking service
  useEffect(() => {
    if (enhancedAppBlockingService) {
      enhancedAppBlockingService.initialize();
      enhancedAppBlockingService.updateBlockingSettings(blockingSettings);
    }
    
    return () => {
      if (enhancedAppBlockingService) {
        enhancedAppBlockingService.cleanup();
      }
    };
  }, [blockingSettings]);

  // Handle back navigation
  const handleBackPress = () => {
    if (isRunning || isPaused) {
      Alert.alert(
        'Stop Study Session?',
        'Are you sure you want to stop your current study session?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Stop', 
            style: 'destructive',
            onPress: () => {
              stopTimer();
              navigation?.goBack();
            }
          },
        ]
      );
    } else {
      navigation?.goBack();
    }
  };

  // Set up navigation focus effect to handle back navigation
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isRunning || isPaused) {
          handleBackPress();
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior
      };

      // Add back handler
      const backHandler = navigation.addListener('beforeRemove', (e) => {
        if (isRunning || isPaused) {
          // Prevent default action
          e.preventDefault();
          handleBackPress();
        }
      });

      return backHandler;
    }, [isRunning, isPaused])
  );

  // Handle method change
  const handleMethodChange = (method) => {
    if (!method || !STUDY_METHODS[method]) {
      console.warn('Invalid method:', method);
      return;
    }
    
    if (isRunning || isPaused) {
      Alert.alert(
        'Timer Running',
        'Please stop the current timer before changing study methods.',
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedMethod(method);
  };

  // Handle blocking settings change
  const handleBlockingSettingsChange = (newSettings) => {
    if (newSettings && typeof newSettings === 'object') {
      setBlockingSettings(newSettings);
    }
  };

  // Handle music change
  const handleMusicChange = (musicType) => {
    console.log('Music changed to:', musicType);
    // Handle music change logic here
  };

  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '00:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (progress || 0) * 100;

  const renderControls = () => (
    <View style={styles.controlsContainer}>
      <View style={styles.mainControls}>
        {!isRunning && !isPaused && (
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={() => startTimer(true, blockingLevel)}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start with Blocking</Text>
          </TouchableOpacity>
        )}

        {isRunning && (
          <View style={styles.runningControls}>
            <TouchableOpacity 
              style={styles.pauseButton} 
              onPress={pauseTimer}
              activeOpacity={0.8}
            >
              <Text style={styles.controlButtonText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.stopButton} 
              onPress={stopTimer}
              activeOpacity={0.8}
            >
              <Text style={styles.controlButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPaused && (
          <View style={styles.pausedControls}>
            <TouchableOpacity 
              style={styles.resumeButton} 
              onPress={() => startTimer(true, blockingLevel)}
              activeOpacity={0.8}
            >
              <Text style={styles.controlButtonText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.stopButton} 
              onPress={stopTimer}
              activeOpacity={0.8}
            >
              <Text style={styles.controlButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Music Controls */}
      <MusicControls 
        studyMethod={selectedMethod}
        onMusicChange={handleMusicChange}
        disabled={isRunning}
      />

      {/* Blocking status indicator */}
      {blockingEnabled && (
        <View style={styles.blockingStatus}>
          <Text style={styles.blockingStatusText}>🔒 App Blocking Active</Text>
          <Text style={styles.blockingLevelText}>Level: {blockingLevel}</Text>
          {appSwitchAttempts > 0 && (
            <Text style={styles.attemptsText}>Attempts: {appSwitchAttempts}</Text>
          )}
        </View>
      )}
    </View>
  );

  const renderBackButton = () => (
    <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
      <Text style={styles.backButtonText}>← Back</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Settings Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerSettingsButton}
          onPress={() => setShowBlockingSettings(true)}
        >
          <Text style={styles.headerSettingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Method Selector */}
      <MethodSelector 
        selectedMethod={selectedMethod}
        onMethodChange={handleMethodChange}
      />

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        <Text style={styles.methodText}>{STUDY_METHODS[selectedMethod]?.name || 'Study Session'}</Text>
        <Text style={styles.phaseText}>{currentPhase}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progressPercentage)}% Complete
        </Text>
      </View>

      {/* Controls */}
      {renderControls()}

      {/* Blocking Overlay */}
      <BlockingOverlay 
        visible={showOverlay}
        onContinue={handleContinue}
        onDisable={handleDisableBlocking}
        appSwitchAttempts={appSwitchAttempts}
        blockingLevel={blockingLevel}
      />

      {/* Blocking Settings Modal */}
      <BlockingSettings
        visible={showBlockingSettings}
        onClose={() => setShowBlockingSettings(false)}
        blockingEnabled={blockingEnabled}
        onToggleBlocking={handleToggleBlocking}
        onShowFocusModeSuggestion={handleShowFocusModeSuggestion}
        appSwitchAttempts={appSwitchAttempts}
        blockingLevel={blockingLevel}
        onBlockingLevelChange={handleBlockingLevelChange}
        blockingSettings={blockingSettings}
        onBlockingSettingsChange={handleBlockingSettingsChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  headerSettingsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  headerSettingsButtonText: {
    color: '#4CAF50',
    fontSize: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 30,
    paddingHorizontal: 20,
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  methodText: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  phaseText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  mainControls: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 200,
    maxWidth: '90%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    width: '100%',
  },
  pausedControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    width: '100%',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 100,
    maxWidth: '45%',
    alignItems: 'center',
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 100,
    maxWidth: '45%',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 100,
    maxWidth: '45%',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  blockingStatus: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  blockingStatusText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  blockingLevelText: {
    color: '#4CAF50',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  attemptsText: {
    color: '#FF9800',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  pausedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pausedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
    textAlign: 'center',
  },
  pausedSubtitle: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  pausedButtons: {
    gap: 16,
    alignItems: 'center',
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});