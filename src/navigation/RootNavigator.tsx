import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import {
  EditorScreen,
  ExportScreen,
  HomeScreen,
  ImportScreen,
  SettingsScreen,
  SplashScreen,
} from '../screens';
import { useAppTheme } from '../theme';
import { STRINGS } from '../constants';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isDark, colors } = useAppTheme();

  return (
    <NavigationContainer
      theme={
        isDark
          ? {
              ...DarkTheme,
              colors: {
                ...DarkTheme.colors,
                background: colors.backgroundBottom,
                text: colors.textPrimary,
                card: colors.sheet,
                border: colors.cardBorder,
                primary: colors.accent,
              },
            }
          : {
              ...DefaultTheme,
              colors: {
                ...DefaultTheme.colors,
                background: colors.backgroundBottom,
                text: colors.textPrimary,
                card: colors.sheet,
                border: colors.cardBorder,
                primary: colors.accent,
              },
            }
      }>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShadowVisible: false,
          headerTransparent: true,
          animation: 'ios_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}>
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: STRINGS.navigation.homeTitle,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Import"
          component={ImportScreen}
          options={{
            title: STRINGS.navigation.importTitle,
          }}
        />
        <Stack.Screen
          name="Editor"
          component={EditorScreen}
          options={{
            title: STRINGS.navigation.editorTitle,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Export"
          component={ExportScreen}
          options={{
            title: STRINGS.navigation.exportTitle,
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: STRINGS.navigation.settingsTitle,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
