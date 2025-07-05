import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { enhancedAppBlockingService } from '../services/enhancedAppBlockingService';
import { STUDY_METHODS } from '../constants/studyMethods';

export const useTimerWithBlocking = (initialMethod = 'pomodoro') => {
  const [timeLeft, setTimeLeft] = useState(STUDY_METHODS[initialMethod].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('Ready to start');
  const [blockingEnabled, setBlockingEnabled] = useState(false);
  const [blockingLevel, setBlockingLevel] = useState('standard');
  const [appSwitchAttempts, setAppSwitchAttempts] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Initialize enhanced app blocking service
  useEffect(() => {
    enhancedAppBlockingService.initialize();
    
    return () => {
      enhancedAppBlockingService.cleanup();
    };
  }, []);

  // Handle blocking state changes
  const handleBlockingStateChange = useCallback((isEnabled) => {
    setBlockingEnabled(isEnabled);
  }, []);

  // Handle app switch attempts
  const handleAppSwitchAttempt = useCallback(() => {
    setAppSwitchAttempts(prev => prev + 1);
    setShowOverlay(true);
  }, []);

  // Start timer with blocking
  const startTimer = useCallback((enableBlocking = true, level = 'standard') => {
    if (!isRunning && !isPaused) {
      // Starting fresh session
      startTimeRef.current = Date.now();
      setCurrentPhase('Focus Time');
    } else if (isPaused) {
      // Resuming from pause
      const elapsed = STUDY_METHODS[initialMethod].duration - timeLeft;
      startTimeRef.current = Date.now() - (elapsed * 1000);
      setCurrentPhase('Focus Time');
    }
    
    setIsRunning(true);
    setIsPaused(false);
    setBlockingLevel(level);

    // Start enhanced app blocking if enabled
    if (enableBlocking) {
      enhancedAppBlockingService.startBlocking(handleBlockingStateChange, handleAppSwitchAttempt, level);
    }
  }, [isRunning, isPaused, initialMethod, timeLeft, handleBlockingStateChange, handleAppSwitchAttempt]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    console.log('Pausing timer...');
    setIsRunning(false);
    setIsPaused(true);
    setCurrentPhase('Paused');
    
    // Stop app blocking when paused
    if (blockingEnabled) {
      enhancedAppBlockingService.stopBlocking();
    }
    
    // Clear the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [blockingEnabled]);

  // Stop timer
  const stopTimer = useCallback(() => {
    console.log('Stopping timer...');
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(STUDY_METHODS[initialMethod].duration);
    setProgress(0);
    setCurrentPhase('Ready to start');
    setShowOverlay(false);
    setAppSwitchAttempts(0);
    
    // Stop app blocking
    if (blockingEnabled) {
      enhancedAppBlockingService.stopBlocking();
    }
    
    // Clear the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Reset start time
    startTimeRef.current = null;
  }, [initialMethod, blockingEnabled]);

  // Handle continue from overlay
  const handleContinue = useCallback(() => {
    setShowOverlay(false);
  }, []);

  // Handle disable blocking from overlay
  const handleDisableBlocking = useCallback(() => {
    Alert.alert(
      'Disable App Blocking',
      'Are you sure you want to disable app blocking? This will allow you to switch to other apps during your study session.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disable', 
          style: 'destructive',
          onPress: () => {
            enhancedAppBlockingService.stopBlocking();
            setShowOverlay(false);
          }
        },
      ]
    );
  }, []);

  // Toggle blocking
  const handleToggleBlocking = useCallback(() => {
    if (blockingEnabled) {
      enhancedAppBlockingService.stopBlocking();
    } else if (isRunning) {
      enhancedAppBlockingService.startBlocking(handleBlockingStateChange, handleAppSwitchAttempt, blockingLevel);
    }
  }, [blockingEnabled, isRunning, blockingLevel, handleBlockingStateChange, handleAppSwitchAttempt]);

  // Change blocking level
  const handleBlockingLevelChange = useCallback((level) => {
    setBlockingLevel(level);
    if (isRunning && blockingEnabled) {
      enhancedAppBlockingService.stopBlocking();
      enhancedAppBlockingService.startBlocking(handleBlockingStateChange, handleAppSwitchAttempt, level);
    }
  }, [isRunning, blockingEnabled, handleBlockingStateChange, handleAppSwitchAttempt]);

  // Show focus mode suggestion
  const handleShowFocusModeSuggestion = useCallback(() => {
    enhancedAppBlockingService.showFocusModeSuggestion();
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = STUDY_METHODS[initialMethod].duration - elapsed;
        
        if (remaining <= 0) {
          setTimeLeft(0);
          setProgress(1);
          setIsRunning(false);
          setIsPaused(false);
          setShowOverlay(false);
          setCurrentPhase('Complete!');
          
          // Stop app blocking when timer completes
          if (blockingEnabled) {
            enhancedAppBlockingService.stopBlocking();
          }
          
          // Show completion notification
          Alert.alert(
            'Session Complete! 🎉',
            `Great job completing your ${STUDY_METHODS[initialMethod].name} session!`,
            [{ text: 'OK' }]
          );
        } else {
          setTimeLeft(remaining);
          setProgress(1 - (remaining / STUDY_METHODS[initialMethod].duration));
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, initialMethod, blockingEnabled]);

  // Keep timer running when component unmounts/remounts
  useEffect(() => {
    return () => {
      // Don't clear interval on unmount if timer is running
      // This allows timer to continue in background
    };
  }, []);

  return {
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
  };
}; 