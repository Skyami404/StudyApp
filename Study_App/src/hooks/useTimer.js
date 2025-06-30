// hooks/useTimer.js
import { useState, useEffect, useRef } from 'react';


export const STUDY_METHODS = {
  pomodoro: { name: 'Pomodoro', duration: 25 * 60 }, // 25 minutes in seconds
  focus: { name: 'Focus', duration: 45 * 60 }, // 45 minutes
  deepwork: { name: 'Deep Work', duration: 90 * 60 }, // 90 minutes
};

export const useTimer = (initialMethod = 'pomodoro') => {
  const [selectedMethod, setSelectedMethod] = useState(initialMethod);
  const [timeRemaining, setTimeRemaining] = useState(STUDY_METHODS[initialMethod].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  
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

  // Start timer
  const startTimer = () => {
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
  };

  // Pause timer
  const pauseTimer = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  // Stop timer
  const stopTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(STUDY_METHODS[selectedMethod].duration);
    setSessionStartTime(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Change study method
  const changeMethod = (method) => {
    stopTimer(); // Reset current session
    setSelectedMethod(method);
    setTimeRemaining(STUDY_METHODS[method].duration);
  };

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
          // Timer completed - you can add completion logic here
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, selectedMethod, timeRemaining]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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
    startTimer,
    pauseTimer,
    stopTimer,
    changeMethod,
    isCompleted: timeRemaining === 0,
  };
};