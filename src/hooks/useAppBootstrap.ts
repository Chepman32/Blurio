import { useEffect } from 'react';
import { useEditorStore } from '../store';

export const useAppBootstrap = (): boolean => {
  const initialize = useEditorStore(state => state.initializeFromDisk);
  const initialized = useEditorStore(state => state.bootstrapCompleted);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  return initialized;
};
