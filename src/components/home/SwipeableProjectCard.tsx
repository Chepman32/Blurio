import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Copy, Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { Project } from '../../types';
import { RADIUS, SPACING, STRINGS } from '../../constants';
import { useAppTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { ProjectCard } from './ProjectCard';

interface SwipeableProjectCardProps {
  project: Project;
  onOpen: () => void;
  onLongPress: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const actionWidth = 94;

export const SwipeableProjectCard: React.FC<SwipeableProjectCardProps> = ({
  project,
  onOpen,
  onLongPress,
  onDuplicate,
  onDelete,
}) => {
  const { colors } = useAppTheme();

  const renderRightActions = () => (
    <View style={styles.rightActions}>
      <TouchableOpacity
        accessibilityLabel={STRINGS.home.duplicateAction}
        onPress={onDuplicate}
        style={[styles.action, { backgroundColor: `${colors.accent}22` }]}> 
        <Copy size={16} color={colors.accent} />
        <AppText variant="micro" color={colors.accent}>
          {STRINGS.common.duplicate}
        </AppText>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel={STRINGS.home.deleteAction}
        onPress={onDelete}
        style={[styles.action, { backgroundColor: `${colors.destructive}22` }]}> 
        <Trash2 size={16} color={colors.destructive} />
        <AppText variant="micro" color={colors.destructive}>
          {STRINGS.common.delete}
        </AppText>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable friction={2} rightThreshold={40} renderRightActions={renderRightActions}>
      <ProjectCard
        project={project}
        onPress={onOpen}
        onLongPress={onLongPress}
        accessibilityLabel={`${STRINGS.accessibility.projectCard} ${project.name}`}
      />
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  rightActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: SPACING.md,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    width: actionWidth * 2,
  },
  action: {
    width: actionWidth,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
});
