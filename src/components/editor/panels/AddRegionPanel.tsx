import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Circle, PenLine, RectangleHorizontal, Square } from 'lucide-react-native';
import { SPACING, STRINGS } from '../../../constants';
import type { RegionType } from '../../../types';
import { useAppTheme } from '../../../theme';
import { BlurButton } from '../../common/BlurButton';
import { IconActionButton } from '../../common/IconActionButton';
import { AnimatedSlider } from '../AnimatedSlider';

interface AddRegionPanelProps {
  onAddRegion: (type: RegionType, template?: 'face' | 'plate') => void;
  hasSelection: boolean;
  strength: number;
  onChangeStrength: (strength: number) => void;
  onStrengthChangeStart?: () => void;
  onStrengthChangeEnd?: () => void;
}

export const AddRegionPanel: React.FC<AddRegionPanelProps> = ({
  onAddRegion,
  hasSelection,
  strength,
  onChangeStrength,
  onStrengthChangeStart,
  onStrengthChangeEnd,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <IconActionButton
          icon={Square}
          label={STRINGS.editor.rectangle}
          onPress={() => onAddRegion('rectangle')}
          accessibilityLabel={STRINGS.editor.rectangle}
        />
        <IconActionButton
          icon={RectangleHorizontal}
          label={STRINGS.editor.roundedRect}
          onPress={() => onAddRegion('roundedRect')}
          accessibilityLabel={STRINGS.editor.roundedRect}
        />
        <IconActionButton
          icon={Circle}
          label={STRINGS.editor.ellipse}
          onPress={() => onAddRegion('ellipse')}
          accessibilityLabel={STRINGS.editor.ellipse}
        />
        <IconActionButton
          icon={PenLine}
          label={STRINGS.editor.path}
          onPress={() => onAddRegion('path')}
          accessibilityLabel={STRINGS.editor.path}
        />
      </View>

      <View style={styles.templates}>
        <BlurButton
          label={STRINGS.editor.faceTemplate}
          onPress={() => onAddRegion('face', 'face')}
          accessibilityLabel={STRINGS.editor.faceTemplate}
          variant="secondary"
          style={styles.templateButton}
        />
        <BlurButton
          label={STRINGS.editor.plateTemplate}
          onPress={() => onAddRegion('plate', 'plate')}
          accessibilityLabel={STRINGS.editor.plateTemplate}
          variant="secondary"
          style={styles.templateButton}
        />
      </View>
      <View
        style={[styles.note, { borderColor: colors.cardBorder, backgroundColor: `${colors.card}66` }]}>
        <BlurButton
          label={STRINGS.editor.addRegion}
          onPress={() => onAddRegion('roundedRect')}
          accessibilityLabel={STRINGS.editor.addRegion}
        />
        {hasSelection ? (
          <AnimatedSlider
            label={STRINGS.params.strength}
            value={strength}
            onChange={onChangeStrength}
            onChangeStart={onStrengthChangeStart}
            onChangeEnd={onStrengthChangeEnd}
            accessibilityLabel={STRINGS.params.strength}
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  templates: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  templateButton: {
    flex: 1,
  },
  note: {
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
});
