// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

// Import your screens
import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import StatsScreen from './src/screens/StatsScreen';
import StudyScreen from './src/screens/StudyScreen';

const Stack = createStackNavigator();

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    // Request notification permissions on app start
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('App notification permission status:', status);
    };
    
    requestPermissions();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'Study Timer',
            headerShown: false, // Hide header on home screen for cleaner look
          }}
        />
        <Stack.Screen 
          name="Study" 
          component={StudyScreen}
          options={{
            title: 'Focus Session',
            headerShown: false, // We have our own back button
          }}
        />
        <Stack.Screen 
          name="Calendar" 
          component={CalendarScreen}
          options={{
            title: 'Calendar',
          }}
        />
        <Stack.Screen 
          name="Stats" 
          component={StatsScreen}
          options={{
            title: 'Statistics',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}