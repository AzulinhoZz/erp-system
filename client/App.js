import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation';

/**
 * Single source of truth app: the same tree renders on Android/iOS
 * (React Native) and on the web (React Native Web via Expo).
 */
export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
