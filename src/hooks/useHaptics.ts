import { useCallback } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const useHaptics = () => {
  const impact = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactMedium', options);
  }, []);

  const tick = useCallback(() => {
    ReactNativeHapticFeedback.trigger('selection', options);
  }, []);

  const success = useCallback(() => {
    ReactNativeHapticFeedback.trigger('notificationSuccess', options);
  }, []);

  const warning = useCallback(() => {
    ReactNativeHapticFeedback.trigger('notificationWarning', options);
  }, []);

  return {
    impact,
    tick,
    success,
    warning,
  };
};
