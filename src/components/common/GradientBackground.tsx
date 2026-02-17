import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '../../theme';

const DOT_COUNT = 120;

const seeded = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const GradientBackground: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colors } = useAppTheme();

  const dots = useMemo(
    () =>
      Array.from({ length: DOT_COUNT }, (_, index) => {
        const x = seeded(index * 13.37) * 400;
        const y = seeded(index * 17.71) * 900;
        const r = seeded(index * 23.11) * 1.25 + 0.25;

        return {
          id: `${index}`,
          x,
          y,
          r,
        };
      }),
    [],
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        style={StyleSheet.absoluteFill}
        colors={[colors.backgroundTop, colors.backgroundBottom]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
        {dots.map(dot => (
          <Circle
            key={dot.id}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={colors.noise}
          />
        ))}
      </Svg>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
