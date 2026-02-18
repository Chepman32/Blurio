import React from 'react';
import {
  Platform,
  UIManager,
  View,
  type ViewProps,
  requireNativeComponent,
} from 'react-native';
import type { NativeSyntheticEvent } from 'react-native';
import type { NativeContextMenuAction } from '../types';

interface NativePayload {
  id: string;
}

interface NativeComponentProps extends ViewProps {
  menuItems: string;
  onPressMenuItem?: (event: NativeSyntheticEvent<NativePayload>) => void;
}

interface BlurioContextMenuViewProps extends ViewProps {
  menuItems: NativeContextMenuAction[];
  onPressMenuItem?: (id: string) => void;
  children?: React.ReactNode;
}

const COMPONENT_NAME = 'BlurioContextMenuView';
const hasNativeContextMenu =
  Platform.OS === 'ios' &&
  Boolean(UIManager.getViewManagerConfig(COMPONENT_NAME));

const NativeBlurioContextMenuView = hasNativeContextMenu
  ? requireNativeComponent<NativeComponentProps>(COMPONENT_NAME)
  : null;

export const BlurioContextMenuView: React.FC<BlurioContextMenuViewProps> = ({
  menuItems,
  onPressMenuItem,
  children,
  ...viewProps
}) => {
  if (!NativeBlurioContextMenuView) {
    return <View {...viewProps}>{children}</View>;
  }

  return (
    <NativeBlurioContextMenuView
      {...viewProps}
      menuItems={JSON.stringify(menuItems)}
      onPressMenuItem={event => onPressMenuItem?.(event.nativeEvent.id)}>
      {children}
    </NativeBlurioContextMenuView>
  );
};
