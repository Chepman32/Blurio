import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Eye,
  KeyRound,
  Layers,
  PlusSquare,
  Redo2,
  SlidersHorizontal,
  Undo2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { SPACING, STRINGS } from '../../constants';
import type { EditorPanel } from '../../types';
import { useAppTheme } from '../../theme';
import { IconActionButton } from '../common/IconActionButton';

interface ToolDockProps {
  activePanel: EditorPanel;
  onSelectPanel: (panel: EditorPanel) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const PANEL_ITEMS: Array<{
  panel: EditorPanel;
  label: string;
  icon: LucideIcon;
}> = [
  { panel: 'addRegion', label: STRINGS.editor.addRegion, icon: PlusSquare },
  { panel: 'regions', label: STRINGS.editor.regions, icon: Layers },
  { panel: 'params', label: STRINGS.editor.params, icon: SlidersHorizontal },
  { panel: 'keyframes', label: STRINGS.editor.keyframes, icon: KeyRound },
  { panel: 'view', label: STRINGS.editor.view, icon: Eye },
];

export const ToolDock: React.FC<ToolDockProps> = ({
  activePanel,
  onSelectPanel,
  onUndo,
  onRedo,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { borderColor: colors.cardBorder }]}> 
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {PANEL_ITEMS.map(item => (
          <IconActionButton
            key={item.panel}
            icon={item.icon}
            label={item.label}
            selected={activePanel === item.panel}
            onPress={() => onSelectPanel(item.panel)}
            accessibilityLabel={`Open ${item.label} panel`}
          />
        ))}
        <IconActionButton
          icon={Undo2}
          label={STRINGS.editor.undo}
          onPress={onUndo}
          accessibilityLabel={STRINGS.editor.undo}
        />
        <IconActionButton
          icon={Redo2}
          label={STRINGS.editor.redo}
          onPress={onRedo}
          accessibilityLabel={STRINGS.editor.redo}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: SPACING.xs,
    paddingHorizontal: 6,
  },
  scrollContent: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: 4,
  },
});
