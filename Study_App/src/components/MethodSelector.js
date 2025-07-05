import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.entries(STUDY_METHODS).map(([key, method]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.methodButton,
              selectedMethod === key && styles.methodButtonActive,
            ]}
            onPress={() => onMethodChange(key)}
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
            <Text style={[
              styles.methodDescription,
              selectedMethod === key && styles.methodDescriptionActive,
            ]}>
              {method.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  methodButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  methodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  methodNameActive: {
    color: '#ffffff',
  },
  methodDuration: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  methodDurationActive: {
    color: '#ffffff',
  },
  methodDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  methodDescriptionActive: {
    color: '#ffffff',
  },
});
