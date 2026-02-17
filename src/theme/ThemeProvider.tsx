import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DARK_THEME, LIGHT_THEME } from '../constants';
import { useEditorStore } from '../store';
import type { ThemeColors } from '../constants';

interface AppTheme {
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<AppTheme>({
  isDark: true,
  colors: DARK_THEME,
});

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();
  const settings = useEditorStore(state => state.settings);

  const theme = useMemo<AppTheme>(() => {
    const mode =
      settings.appearance === 'system'
        ? systemScheme === 'light'
          ? 'light'
          : 'dark'
        : settings.appearance;

    const base = mode === 'dark' ? DARK_THEME : LIGHT_THEME;

    return {
      isDark: mode === 'dark',
      colors: {
        ...base,
        accent: settings.accentColor,
      },
    };
  }, [settings, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = (): AppTheme => useContext(ThemeContext);
