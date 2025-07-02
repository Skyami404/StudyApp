import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import appBlockingService from '../services/appBlockingService';

export const STUDY_METHODS = {
  pomodoro: { name: 'Pomodoro', duration: 25 * 60 }, // 25 minutes in seconds
  focus: { name: 'Focus', duration: 45 * 60 }, // 45 minutes
  deepwork: { name: 'Deep Work', duration: 90 * 60 }, // 90 minutes
};

export const useTimerWithBlocking = (initialMethod = 'pomodoro') => {
  const [selectedMethod, setSelectedMethod] = useState(initialMethod);
  const [timeRemaining, setTimeRemaining] = useState(STUDY_METHODS[initialMethod].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [blockingEnabled, setBlockingEnabled] = useState(false);
  const [showBlockingOverlay, setShowBlockingOverlay] = useState(false);
  const [appSwitchAttempts, setAppSwitchAttempts] = useState(0);
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Calculate progress percentage
  const progress = 1 - (timeRemaining / STUDY_METHODS[selectedMethod].duration);

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize app blocking service
  useEffect(() => {
    appBlockingService.initialize();
    
    return () => {
      appBlockingService.cleanup();
    };
  }, []);

  // Handle blocking state changes
  const handleBlockingStateChange = useCallback((isEnabled) => {
    setBlockingEnabled(isEnabled);
  }, []);

  // Handle app switch attempts
  const handleAppSwitchAttempt = useCallback(() => {
    setAppSwitchAttempts(prev => prev + 1);
    setShowBlockingOverlay(true);
  }, []);

  // Start timer with optional blocking
  const startTimer = useCallback((enableBlocking = true) => {
    if (!isRunning && !isPaused) {
      // Starting fresh session
      setSessionStartTime(new Date());
      startTimeRef.current = Date.now();
    } else if (isPaused) {
      // Resuming from pause
      startTimeRef.current = Date.now() - ((STUDY_METHODS[selectedMethod].duration - timeRemaining) * 1000);
    }
    
    setIsRunning(true);
    setIsPaused(false);

    // Start app blocking if enabled
    if (enableBlocking) {
      appBlockingService.startBlocking(handleBlockingStateChange, handleAppSwitchAttempt);
      
      // Show focus mode suggestion on first start
      if (!sessionStartTime) {
        setTimeout(() => {
          appBlockingService.showFocusModeSuggestion();
        }, 2000);
      }
    }
  }, [isRunning, isPaused, selectedMethod, timeRemaining, sessionStartTime, handleBlockingStateChange, handleAppSwitchAttempt]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
    
    // Stop app blocking when paused
    if (blockingEnabled) {
      appBlockingService.stopBlocking();
    }
  }, [blockingEnabled]);

  // Stop timer
  const stopTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(STUDY_METHODS[selectedMethod].duration);
    setSessionStartTime(null);
    setShowBlockingOverlay(false);
    setAppSwitchAttempts(0);
    
    // Stop app blocking
    if (blockingEnabled) {
      appBlockingService.stopBlocking();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [selectedMethod, blockingEnabled]);

  // Change study method
  const changeMethod = useCallback((method) => {
    stopTimer(); // Reset current session
    setSelectedMethod(method);
    setTimeRemaining(STUDY_METHODS[method].duration);
  }, [stopTimer]);

  // Handle return to study from blocking overlay
  const handleReturnToStudy = useCallback(() => {
    setShowBlockingOverlay(false);
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
            appBlockingService.stopBlocking();
            setShowBlockingOverlay(false);
          }
        },
      ]
    );
  }, []);

  // Enable blocking for current session
  const enableBlocking = useCallback(() => {
    if (isRunning && !blockingEnabled) {
      appBlockingService.startBlocking(handleBlockingStateChange, handleAppSwitchAttempt);
    }
  }, [isRunning, blockingEnabled, handleBlockingStateChange, handleAppSwitchAttempt]);

  // Disable blocking for current session
  const disableBlocking = useCallback(() => {
    if (blockingEnabled) {
      appBlockingService.stopBlocking();
    }
  }, [blockingEnabled]);

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = STUDY_METHODS[selectedMethod].duration - elapsed;
        
        if (remaining <= 0) {
          setTimeRemaining(0);
          setIsRunning(false);
          setIsPaused(false);
          setShowBlockingOverlay(false);
          
          // Stop app blocking when timer completes
          if (blockingEnabled) {
            appBlockingService.stopBlocking();
          }
          
          // Show completion notification
          Alert.alert(
            'Session Complete! 🎉',
            `Great job completing your ${STUDY_METHODS[selectedMethod].name} session!`,
            [{ text: 'OK' }]
          );
        } else {
          setTimeRemaining(remaining);
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
  }, [isRunning, selectedMethod, blockingEnabled]);

  // Keep timer running when component unmounts/remounts
  useEffect(() => {
    return () => {
      // Don't clear interval on unmount if timer is running
      // This allows timer to continue in background
    };
  }, []);

  return {
    selectedMethod,
    timeRemaining,
    isRunning,
    isPaused,
    progress,
    sessionStartTime,
    formattedTime: formatTime(timeRemaining),
    blockingEnabled,
    showBlockingOverlay,
    appSwitchAttempts,
    startTimer,
    pauseTimer,
    stopTimer,
    changeMethod,
    enableBlocking,
    disableBlocking,
    handleReturnToStudy,
    handleDisableBlocking,
    isCompleted: timeRemaining === 0,
  };
}; 