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
const ICON_SIZE = Math.min(width * 0.48, 214);
const PARTICLE_GRID = 9;
const PARTICLE_COUNT = PARTICLE_GRID * PARTICLE_GRID;
const ICON_PALETTE = [
  '#3B1CA8',
  '#4D21C2',
  '#7E2BE2',
  '#B93ED8',
  '#E254BF',
  '#FF6C95',
  '#53B8FF',
  '#2568D6',
  '#EDEFF7',
] as const;

interface SplashShardModel {
  id: string;
  tx: number;
  ty: number;
  orbitX: number;
  orbitY: number;
  size: number;
  rotate: number;
  color: string;
}

const shards: SplashShardModel[] = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
  const angle = (Math.PI * 2 * index) / PARTICLE_COUNT;
  const radius = 82 + (index % 5) * 10;
  const col = index % PARTICLE_GRID;
  const row = Math.floor(index / PARTICLE_GRID);
  const step = ICON_SIZE / (PARTICLE_GRID - 1);
  const tx = -ICON_SIZE / 2 + col * step;
  const ty = -ICON_SIZE / 2 + row * step;
  const normalizedX = col / (PARTICLE_GRID - 1);
  const normalizedY = row / (PARTICLE_GRID - 1);
  const paletteIndex = Math.min(
    ICON_PALETTE.length - 1,
    Math.floor((normalizedX * 0.6 + normalizedY * 0.4) * ICON_PALETTE.length),
  );
  const centerDist = Math.hypot(normalizedX - 0.5, normalizedY - 0.5);
  const color = centerDist < 0.2 ? '#F4F6FC' : ICON_PALETTE[paletteIndex];

  return {
    id: `shard-${index}`,
    tx,
    ty,
    orbitX: Math.cos(angle) * radius,
    orbitY: Math.sin(angle) * radius,
    size: 5.6 + (index % 3),
    rotate: -36 + (index % 9) * 9,
    color,
  };
});

const SplashShard: React.FC<{
  shard: SplashShardModel;
  scatter: SharedValue<number>;
  opacity: SharedValue<number>;
}> = ({ shard, scatter, opacity }) => {
  const shardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          shard.tx * (1 - scatter.value) +
          shard.orbitX * scatter.value +
          (-shard.ty * 0.15) * scatter.value,
      },
      {
        translateY:
          shard.ty * (1 - scatter.value) +
          shard.orbitY * scatter.value +
          (shard.tx * 0.15) * scatter.value,
      },
      {
        rotate: `${shard.rotate * scatter.value}deg`,
      },
      {
        scale: 0.72 + (1 - scatter.value) * 0.34,
      },
    ],
    opacity: (0.24 + (1 - scatter.value) * 0.76) * opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.shard,
        {
          width: shard.size,
          height: shard.size * 1.7,
          borderRadius: shard.size / 2,
          backgroundColor: shard.color,
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

  const scatter = useSharedValue(1);
  const particleOpacity = useSharedValue(1);
  const iconOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      scatter.value = 0;
      particleOpacity.value = 0;
      iconOpacity.value = 1;
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
      withTiming(1.02, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      }),
      withDelay(
        60,
        withSpring(
          0,
          {
            damping: 16,
            stiffness: 185,
            mass: 0.76,
          },
          finished => {
            if (finished) {
              runOnJS(impact)();
            }
          },
        ),
      ),
    );

    iconOpacity.value = withDelay(
      420,
      withTiming(1, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      }),
    );

    particleOpacity.value = withDelay(
      460,
      withTiming(0, {
        duration: 260,
        easing: Easing.inOut(Easing.quad),
      }),
    );

    logoOpacity.value = withDelay(
      520,
      withTiming(1, {
        duration: 280,
      }),
    );

    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 1650);

    return () => clearTimeout(timer);
  }, [
    iconOpacity,
    impact,
    logoOpacity,
    navigation,
    particleOpacity,
    reduceMotion,
    scatter,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: 0.96 + iconOpacity.value * 0.04 }],
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
              opacity={particleOpacity}
            />
          ))}

          <Animated.Image
            source={require('../assets/appIcon.png')}
            style={[styles.iconImage, iconStyle]}
            resizeMode="contain"
          />

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
    position: 'absolute',
    bottom: -74,
    alignItems: 'center',
    gap: 8,
  },
  iconImage: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE * 0.22,
  },
  title: {
    letterSpacing: 0.4,
  },
  shard: {
    position: 'absolute',
  },
});
