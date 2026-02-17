import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'react-native-blur';
import { RADIUS } from '../../constants';
import { useAppTheme } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  padding = 16,
}) => {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          padding,
        },
        style,
      ]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurAmount={isDark ? 18 : 12}
        blurType={isDark ? 'dark' : 'light'}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    zIndex: 1,
  },
});
