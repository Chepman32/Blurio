import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import {
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  LockOpen,
  Trash2,
} from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { ID, Track } from '../../../types';
import { SPACING } from '../../../constants';
import { useAppTheme } from '../../../theme';
import { AppText } from '../../common/AppText';

interface RegionsPanelProps {
  tracks: Track[];
  selectedTrackId: ID | null;
  onSelectTrack: (trackId: ID) => void;
  onToggleVisibility: (trackId: ID) => void;
  onToggleLock: (trackId: ID) => void;
  onRemoveTrack: (trackId: ID) => void;
  onReorderTracks: (orderedTrackIds: ID[]) => void;
}

export const RegionsPanel: React.FC<RegionsPanelProps> = ({
  tracks,
  selectedTrackId,
  onSelectTrack,
  onToggleVisibility,
  onToggleLock,
  onRemoveTrack,
  onReorderTracks,
}) => {
  const { colors } = useAppTheme();

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Track>) => {
    const selected = item.id === selectedTrackId;

    const rightActions = () => (
      <TouchableOpacity
        accessibilityLabel={`Delete ${item.name}`}
        onPress={() => onRemoveTrack(item.id)}
        style={[styles.quickAction, { backgroundColor: `${colors.destructive}22` }]}>
        <Trash2 size={16} color={colors.destructive} />
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={rightActions}>
        <TouchableOpacity
          accessibilityLabel={`Select ${item.name}`}
          onPress={() => onSelectTrack(item.id)}
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.row,
            {
              backgroundColor: selected ? `${colors.accent}1F` : `${colors.card}AA`,
              borderColor: selected ? `${colors.accent}66` : colors.cardBorder,
            },
            isActive ? styles.rowActive : null,
          ]}>
          <GripVertical size={18} color={colors.textMuted} />
          <View style={styles.titleWrap}>
            <AppText variant="micro" color={selected ? colors.accent : colors.textSecondary}>
              {item.name}
            </AppText>
            <AppText variant="micro" color={colors.textMuted}>
              {item.type}
            </AppText>
          </View>
          <TouchableOpacity
            accessibilityLabel={`Toggle visibility ${item.name}`}
            onPress={() => onToggleVisibility(item.id)}
            style={styles.iconButton}>
            {item.visible ? (
              <Eye size={16} color={colors.textSecondary} />
            ) : (
              <EyeOff size={16} color={colors.textMuted} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={`Toggle lock ${item.name}`}
            onPress={() => onToggleLock(item.id)}
            style={styles.iconButton}>
            {item.locked ? (
              <Lock size={16} color={colors.warning} />
            ) : (
              <LockOpen size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={tracks}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        activationDistance={18}
        containerStyle={styles.list}
        contentContainerStyle={styles.content}
        onDragEnd={({ data }) => onReorderTracks(data.map(item => item.id))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  content: {
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  row: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  rowActive: {
    opacity: 0.85,
  },
  titleWrap: {
    flex: 1,
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAction: {
    width: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
});
