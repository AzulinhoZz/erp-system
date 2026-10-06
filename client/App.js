import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation';
import { useThemeStore } from './src/store/themeStore';

/**
 * Single source of truth app: the same tree renders on Android/iOS
 * (React Native) and on the web (React Native Web via Expo).
 */
export default function App() {
  const hydrateTheme = useThemeStore((s) => s.hydrateTheme);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
