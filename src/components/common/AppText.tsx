import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { TYPOGRAPHY } from '../../constants';
import { useAppTheme } from '../../theme';

type Variant = keyof typeof TYPOGRAPHY;

interface AppTextProps extends TextProps {
  variant?: Variant;
  style?: TextStyle | TextStyle[];
  muted?: boolean;
  color?: string;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  style,
  children,
  muted,
  color,
  ...rest
}) => {
  const { colors } = useAppTheme();

  return (
    <Text
      {...rest}
      style={[
        TYPOGRAPHY[variant],
        { color: color ?? (muted ? colors.textMuted : colors.textPrimary) },
        style,
      ]}>
      {children}
    </Text>
  );
};
