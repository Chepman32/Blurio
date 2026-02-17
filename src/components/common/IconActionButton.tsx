import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { RADIUS } from '../../constants';
import { useAppTheme } from '../../theme';
import { AppText } from './AppText';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IconActionButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  selected?: boolean;
  accessibilityLabel: string;
}

export const IconActionButton: React.FC<IconActionButtonProps> = ({
  icon: Icon,
  label,
  onPress,
  selected,
  accessibilityLabel,
}) => {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 14, stiffness: 240 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 220 });
      }}
      onPress={onPress}
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor: selected ? `${colors.accent}22` : 'transparent',
          borderColor: selected ? `${colors.accent}66` : colors.cardBorder,
        },
      ]}>
      <View style={styles.iconWrap}>
        <Icon size={18} color={selected ? colors.accent : colors.textSecondary} />
      </View>
      <AppText variant="micro" color={selected ? colors.accent : colors.textMuted}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    minWidth: 56,
    gap: 4,
  },
  iconWrap: {
    height: 22,
    justifyContent: 'center',
  },
});
