import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { RootNavigator } from './navigation/RootNavigator';
import { AppProviders } from './providers/AppProviders';
import { useAppBootstrap } from './hooks';
import { useAppTheme } from './theme';

enableScreens(true);

const BootLoader: React.FC = () => {
  const ready = useAppBootstrap();
  const { colors } = useAppTheme();

  if (ready) {
    return <RootNavigator />;
  }

  return (
    <View style={[styles.loaderWrap, { backgroundColor: colors.backgroundBottom }]}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
};

export const AppRoot: React.FC = () => (
  <AppProviders>
    <BootLoader />
  </AppProviders>
);

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
