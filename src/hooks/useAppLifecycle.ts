import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

interface UseAppLifecycleOptions {
  onBackground?: () => void;
  onForeground?: () => void;
}

export const useAppLifecycle = ({
  onBackground,
  onForeground,
}: UseAppLifecycleOptions): void => {
  useEffect(() => {
    let previous: AppStateStatus = AppState.currentState;

    const subscription = AppState.addEventListener('change', nextState => {
      const wasActive = previous === 'active';
      const nowActive = nextState === 'active';

      if (wasActive && !nowActive) {
        onBackground?.();
      }

      if (!wasActive && nowActive) {
        onForeground?.();
      }

      previous = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [onBackground, onForeground]);
};
