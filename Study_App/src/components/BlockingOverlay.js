import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function BlockingOverlay({ 
  visible, 
  onContinue, 
  onDisable,
  appSwitchAttempts,
  blockingLevel
}) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getBlockingMessage = () => {
    switch (blockingLevel) {
      case 'strict':
        return 'Strict focus mode is active. Please return to your study session immediately!';
      case 'screen-time':
        return 'Screen Time integration is active. Stay focused on your study session!';
      default:
        return 'Stay focused and complete your study session for the best results!';
    }
  };

  const getIcon = () => {
    switch (blockingLevel) {
      case 'strict':
        return '🚫';
      case 'screen-time':
        return '🔒';
      default:
        return '⏰';
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{getIcon()}</Text>
            </View>
            
            <Text style={styles.title}>
              {blockingLevel === 'strict' ? 'Strict Focus Mode' : 'Study Session Active'}
            </Text>
            
            <Text style={styles.subtitle}>
              App blocking is preventing distractions
            </Text>
            
            {appSwitchAttempts > 0 && (
              <View style={styles.attemptsContainer}>
                <Text style={styles.attemptsText}>
                  App switch attempts: {appSwitchAttempts}
                </Text>
              </View>
            )}
            
            <Text style={styles.message}>
              {getBlockingMessage()}
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={onContinue}
              >
                <Text style={styles.primaryButtonText}>Continue Studying</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={onDisable}
              >
                <Text style={styles.secondaryButtonText}>Disable Blocking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  attemptsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  attemptsText: {
    fontSize: 14,
    color: '#888888',
  },
  message: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666666',
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 14,
  },
}); 