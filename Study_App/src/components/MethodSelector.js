import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { STUDY_METHODS } from '../constants/studyMethods';

export default function MethodSelector({ selectedMethod, onMethodChange }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Study Method</Text>
      <View style={styles.methodsContainer}>
        {Object.entries(STUDY_METHODS).map(([key, method]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.methodButton,
              selectedMethod === key && styles.methodButtonActive,
            ]}
            onPress={() => onMethodChange(key)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.methodName,
              selectedMethod === key && styles.methodNameActive,
            ]}>
              {method.name}
            </Text>
            <Text style={[
              styles.methodDuration,
              selectedMethod === key && styles.methodDurationActive,
            ]}>
              {formatDuration(method.duration)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  methodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  methodButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 80,
    justifyContent: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  methodName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  methodNameActive: {
    color: '#ffffff',
  },
  methodDuration: {
    fontSize: 12,
    color: '#999999',
  },
  methodDurationActive: {
    color: '#ffffff',
  },
});
