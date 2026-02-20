import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Layers, SlidersHorizontal } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { SPACING, STRINGS } from '../../constants';
import type { EditorPanel } from '../../types';
import { useAppTheme } from '../../theme';
import { IconActionButton } from '../common/IconActionButton';

interface ToolDockProps {
  activePanel: EditorPanel;
  onSelectPanel: (panel: EditorPanel) => void;
}

const PANEL_ITEMS: Array<{
  panel: EditorPanel;
  label: string;
  icon: LucideIcon;
}> = [
  { panel: 'regions', label: STRINGS.editor.regions, icon: Layers },
  { panel: 'params', label: STRINGS.editor.params, icon: SlidersHorizontal },
];

export const ToolDock: React.FC<ToolDockProps> = ({
  activePanel,
  onSelectPanel,
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: 4,
  },
});
