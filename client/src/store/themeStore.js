import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme/colors';

const THEME_KEY = 'erp.theme.darkMode';

/**
 * Global Theme Store (Zustand) for Light / Dark mode.
 */
export const useThemeStore = create((set, get) => ({
  isDarkMode: false,
  colors: lightColors,

  toggleDarkMode: () => {
    const next = !get().isDarkMode;
    set({ isDarkMode: next, colors: next ? darkColors : lightColors });
    AsyncStorage.setItem(THEME_KEY, JSON.stringify(next)).catch(() => {});
  },

  hydrateTheme: async () => {
    try {
      const raw = await AsyncStorage.getItem(THEME_KEY);
      if (raw !== null) {
        const isDark = JSON.parse(raw);
        set({ isDarkMode: isDark, colors: isDark ? darkColors : lightColors });
      }
    } catch {
      /* fallback to light theme */
    }
  },
}));

export default useThemeStore;
