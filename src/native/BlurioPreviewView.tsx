import React from 'react';
import {
  Platform,
  StyleSheet,
  UIManager,
  View,
  type ViewProps,
  requireNativeComponent,
} from 'react-native';
import type { NativeSyntheticEvent } from 'react-native';
import type { BlurioPreviewNativeProps } from '../types';
import { useAppTheme } from '../theme';
import { STRINGS } from '../constants';
import { AppText } from '../components/common/AppText';

interface NativePayload {
  timeMs: number;
  message?: string;
}

interface NativeComponentProps extends ViewProps {
  renderState: string;
  sourceUri: string;
  paused: boolean;
  quality: BlurioPreviewNativeProps['quality'];
  onReady?: () => void;
  onTimeSync?: (event: NativeSyntheticEvent<NativePayload>) => void;
  onPreviewError?: (event: NativeSyntheticEvent<NativePayload>) => void;
}

const COMPONENT_NAME = 'BlurioPreviewView';

const hasNativeComponent =
  Platform.OS === 'ios' &&
  Boolean(UIManager.getViewManagerConfig(COMPONENT_NAME));

const NativeBlurioPreviewView = hasNativeComponent
  ? requireNativeComponent<NativeComponentProps>(COMPONENT_NAME)
  : null;

export const BlurioPreviewView: React.FC<BlurioPreviewNativeProps> = ({
  renderState,
  sourceUri,
  paused,
  quality,
  onReady,
  onTimeSync,
  onPreviewError,
}) => {
  const { colors } = useAppTheme();

  if (!NativeBlurioPreviewView) {
    return (
      <View style={[styles.placeholder, { borderColor: colors.cardBorder }]}> 
        <AppText variant="micro" color={colors.textMuted}>
          {STRINGS.accessibility.previewStubTitle}
        </AppText>
        <AppText variant="micro" color={colors.textMuted}>
          {STRINGS.app.sourceLabel}: {sourceUri.split('/').pop()}
        </AppText>
        <AppText variant="micro" color={colors.textMuted}>
          {STRINGS.app.qualityLabel}: {quality}{' '}
          {paused ? STRINGS.common.disabled : STRINGS.common.enabled}
        </AppText>
      </View>
    );
  }

  return (
    <NativeBlurioPreviewView
      style={StyleSheet.absoluteFill}
      sourceUri={sourceUri}
      paused={paused}
      quality={quality}
      renderState={JSON.stringify(renderState)}
      onReady={onReady}
      onTimeSync={event => onTimeSync?.(event.nativeEvent.timeMs)}
      onPreviewError={event => onPreviewError?.(event.nativeEvent.message ?? 'Preview error')}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
});
