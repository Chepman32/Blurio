import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { RADIUS, SPACING } from '../../constants';
import { useAppTheme } from '../../theme';
import { AppText } from './AppText';

interface BlurButtonProps {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const BlurButton: React.FC<BlurButtonProps> = ({
  label,
  onPress,
  style,
  accessibilityLabel,
  variant = 'primary',
  disabled,
}) => {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundColor =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
      ? colors.destructive
      : colors.card;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.96, {
          damping: 15,
          stiffness: 250,
        });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, {
          damping: 16,
          stiffness: 210,
        });
      }}
      onPress={onPress}
      style={[
        styles.button,
        animatedStyle,
        {
          backgroundColor: disabled ? `${backgroundColor}66` : backgroundColor,
        },
        style,
      ]}>
      <AppText
        variant="section"
        style={styles.label}
        color={variant === 'secondary' ? colors.textPrimary : '#FFFFFF'}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.control,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  label: {
    textAlign: 'center',
  },
});
