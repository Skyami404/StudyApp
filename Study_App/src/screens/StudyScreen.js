// Updated StudyScreen.js to handle navigation parameters and app blocking
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTimerWithBlocking, STUDY_METHODS } from '../hooks/useTimerWithBlocking';
import BlockingOverlay from '../components/BlockingOverlay';

const { width } = Dimensions.get('window');

export default function StudyScreen({ route, navigation }) {
  const {
    selectedMethod,
    formattedTime,
    isRunning,
    isPaused,
    progress,
    startTimer,
    pauseTimer,
    stopTimer,
    changeMethod,
    isCompleted,
    blockingEnabled,
    showBlockingOverlay,
    appSwitchAttempts,
    handleReturnToStudy,
    handleDisableBlocking,
  } = useTimerWithBlocking();

  // Handle navigation parameters
  useEffect(() => {
    if (route.params) {
      const { autoStart, method } = route.params;
      
      // Set method if specified and valid
      if (method && STUDY_METHODS[method] && method !== selectedMethod) {
        changeMethod(method);
      }
      
      // Auto-start if requested (with a small delay to ensure method is set)
      if (autoStart) {
        const timer = setTimeout(() => {
          startTimer();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [route.params]);

  // Handle back navigation
  const handleBackPress = () => {
    if (isRunning || isPaused) {
      // Maybe show a confirmation dialog here
      stopTimer();
    }
    navigation.goBack();
  };

  const renderMethodSelector = () => (
    <View style={styles.methodSelector}>
      {Object.entries(STUDY_METHODS).map(([key, method]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.methodButton,
            selectedMethod === key && styles.methodButtonActive,
          ]}
          onPress={() => changeMethod(key)}
          disabled={isRunning}
        >
          <Text
            style={[
              styles.methodText,
              selectedMethod === key && styles.methodTextActive,
            ]}
          >
            {method.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTimer = () => (
    <View style={styles.timerContainer}>
      {/* Circular Progress Indicator */}
      <View style={styles.progressCircle}>
        <View
          style={[
            styles.progressFill,
            {
              transform: [{ rotate: `${progress * 360}deg` }],
            },
          ]}
        />
        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>{formattedTime}</Text>
          <Text style={styles.methodLabel}>
            {STUDY_METHODS[selectedMethod]?.name || 'Study Session'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderControls = () => (
    <View style={styles.controlsContainer}>
      {!isRunning && !isPaused && (
        <TouchableOpacity style={styles.startButton} onPress={() => startTimer(true)}>
          <Text style={styles.startButtonText}>Start with Blocking</Text>
        </TouchableOpacity>
      )}

      {isRunning && (
        <TouchableOpacity style={styles.pauseButton} onPress={pauseTimer}>
          <Text style={styles.controlButtonText}>Pause</Text>
        </TouchableOpacity>
      )}

      {isPaused && (
        <TouchableOpacity style={styles.resumeButton} onPress={() => startTimer(true)}>
          <Text style={styles.controlButtonText}>Resume</Text>
        </TouchableOpacity>
      )}

      {(isRunning || isPaused) && (
        <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
          <Text style={styles.controlButtonText}>Stop</Text>
        </TouchableOpacity>
      )}

      {/* Blocking status indicator */}
      {blockingEnabled && (
        <View style={styles.blockingStatus}>
          <Text style={styles.blockingStatusText}>🔒 App Blocking Active</Text>
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

  if (isCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedTitle}>Session Complete!</Text>
          <Text style={styles.completedSubtitle}>
            Great job on your {STUDY_METHODS[selectedMethod]?.name || 'Study'} session
          </Text>
          <View style={styles.completedButtons}>
            <TouchableOpacity style={styles.startButton} onPress={stopTimer}>
              <Text style={styles.startButtonText}>Start New Session</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.homeButton} onPress={handleBackPress}>
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderBackButton()}
      {renderMethodSelector()}
      {renderTimer()}
      {renderControls()}
      
      {/* Blocking Overlay */}
      <BlockingOverlay
        visible={showBlockingOverlay}
        onReturnToStudy={handleReturnToStudy}
        onDisableBlocking={handleDisableBlocking}
        timeRemaining={formattedTime}
        methodName={STUDY_METHODS[selectedMethod]?.name || 'Study'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 40,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  methodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  methodText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#fff',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  progressCircle: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: (width * 0.6) / 2,
    opacity: 0.3,
  },
  timerDisplay: {
    alignItems: 'center',
    zIndex: 1,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  methodLabel: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  controlsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 200,
    maxWidth: '90%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 100,
    maxWidth: '80%',
    alignItems: 'center',
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 100,
    maxWidth: '80%',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 100,
    maxWidth: '80%',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  completedSubtitle: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  completedButtons: {
    gap: 16,
    alignItems: 'center',
  },
  homeButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  },
  blockingStatusText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  attemptsText: {
    color: '#FF9800',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});