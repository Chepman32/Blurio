import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GradientBackground, AppText } from '../components/common';
import type { RootStackParamList } from '../types';
import { SPACING, STRINGS } from '../constants';
import { useAppTheme } from '../theme';
import { useHaptics, useReducedMotion } from '../hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const { width } = Dimensions.get('window');

const SHARD_COUNT = 42;

interface SplashShardModel {
  id: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
}

const shards: SplashShardModel[] = Array.from({ length: SHARD_COUNT }, (_, index) => {
  const angle = (Math.PI * 2 * index) / SHARD_COUNT;
  const radius = 28 + (index % 6) * 8;

  return {
    id: `shard-${index}`,
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    size: 6 + (index % 4) * 3,
    rotate: -28 + (index % 11) * 9,
  };
});

const SplashShard: React.FC<{
  shard: SplashShardModel;
  scatter: SharedValue<number>;
  accentColor: string;
}> = ({ shard, scatter, accentColor }) => {
  const shardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          shard.x * scatter.value + (1 - scatter.value) * (shard.x * 0.05),
      },
      {
        translateY:
          shard.y * scatter.value + (1 - scatter.value) * (shard.y * 0.05),
      },
      {
        rotate: `${shard.rotate * scatter.value}deg`,
      },
      {
        scale: 0.78 + (1 - scatter.value) * 0.22,
      },
    ],
    opacity: 0.5 + (1 - scatter.value) * 0.5,
  }));

  return (
    <Animated.View
      style={[
        styles.shard,
        {
          width: shard.size,
          height: shard.size * 1.7,
          borderRadius: shard.size / 2,
          backgroundColor: accentColor,
        },
        shardStyle,
      ]}
    />
  );
};

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const { impact } = useHaptics();
  const reduceMotion = useReducedMotion();

  const scatter = useSharedValue(0);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      logoOpacity.value = withTiming(1, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });

      const timer = setTimeout(() => {
        navigation.replace('Home');
      }, 1100);

      return () => clearTimeout(timer);
    }

    scatter.value = withSequence(
      withTiming(1, {
        duration: 430,
        easing: Easing.out(Easing.quad),
      }),
      withDelay(
        120,
        withSpring(
          0,
          {
            damping: 12,
            stiffness: 170,
            mass: 0.8,
          },
          finished => {
            if (finished) {
              runOnJS(impact)();
            }
          },
        ),
      ),
    );

    logoOpacity.value = withDelay(
      260,
      withTiming(1, {
        duration: 360,
      }),
    );

    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 2200);

    return () => clearTimeout(timer);
  }, [impact, logoOpacity, navigation, reduceMotion, scatter]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  return (
    <GradientBackground>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.container}>
        <View style={styles.logoWrap}>
          {shards.map(shard => (
            <SplashShard
              key={shard.id}
              shard={shard}
              scatter={scatter}
              accentColor={colors.accent}
            />
          ))}

          <Animated.View style={[styles.logoTextWrap, logoStyle]}>
            <AppText variant="title" style={styles.title}>
              {STRINGS.app.name}
            </AppText>
            <AppText variant="micro" color={colors.textSecondary}>
              {STRINGS.app.splashTagline}
            </AppText>
          </Animated.View>
        </View>
      </Animated.View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  logoWrap: {
    width: width * 0.68,
    height: width * 0.68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextWrap: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    letterSpacing: 0.4,
  },
  shard: {
    position: 'absolute',
  },
});
