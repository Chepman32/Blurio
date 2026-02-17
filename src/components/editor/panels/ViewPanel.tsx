import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SPACING, STRINGS } from '../../../constants';
import type { PreviewQuality } from '../../../types';
import { SegmentedControl } from '../../common/SegmentedControl';
import { SwitchRow } from '../../common/SwitchRow';

interface ViewPanelProps {
  previewQuality: PreviewQuality;
  showGuides: boolean;
  showThumbnails: boolean;
  showSafeAreaOverlay: boolean;
  onPreviewQualityChange: (quality: PreviewQuality) => void;
  onGuidesChange: (value: boolean) => void;
  onThumbnailsChange: (value: boolean) => void;
  onSafeAreaOverlayChange: (value: boolean) => void;
}

export const ViewPanel: React.FC<ViewPanelProps> = ({
  previewQuality,
  showGuides,
  showThumbnails,
  showSafeAreaOverlay,
  onPreviewQualityChange,
  onGuidesChange,
  onThumbnailsChange,
  onSafeAreaOverlayChange,
}) => (
  <View style={styles.container}>
    <SegmentedControl
      value={previewQuality}
      options={[
        { label: STRINGS.view.ultra, value: 'ultra' },
        { label: STRINGS.view.balanced, value: 'balanced' },
        { label: STRINGS.view.smooth, value: 'smooth' },
      ]}
      onChange={onPreviewQualityChange}
      accessibilityLabel={STRINGS.view.previewQuality}
    />

    <SwitchRow
      title={STRINGS.view.guides}
      value={showGuides}
      onValueChange={onGuidesChange}
      accessibilityLabel={STRINGS.view.guides}
    />
    <SwitchRow
      title={STRINGS.view.thumbnails}
      value={showThumbnails}
      onValueChange={onThumbnailsChange}
      accessibilityLabel={STRINGS.view.thumbnails}
    />
    <SwitchRow
      title={STRINGS.view.safeAreaOverlay}
      value={showSafeAreaOverlay}
      onValueChange={onSafeAreaOverlayChange}
      accessibilityLabel={STRINGS.view.safeAreaOverlay}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
});
