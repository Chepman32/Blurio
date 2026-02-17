import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppTheme, AppThemeProvider } from '../theme';

const StatusBarController: React.FC = () => {
  const { isDark } = useAppTheme();
  return <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />;
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <AppThemeProvider>
        <StatusBarController />
        {children}
      </AppThemeProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);
