import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useEditorStore } from '../store';

export const useReducedMotion = (): boolean => {
  const override = useEditorStore(state => state.settings.reduceMotionOverride);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted) {
          setSystemReduceMotion(enabled);
        }
      })
      .catch(() => {
        if (mounted) {
          setSystemReduceMotion(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        setSystemReduceMotion(enabled);
      },
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  if (override === 'on') {
    return true;
  }

  if (override === 'off') {
    return false;
  }

  return systemReduceMotion;
};
