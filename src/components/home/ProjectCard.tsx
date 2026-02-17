import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Project } from '../../types';
import { SPACING } from '../../constants';
import { useAppTheme } from '../../theme';
import { formatMsToClock } from '../../utils';
import { AppText } from '../common/AppText';
import { GlassCard } from '../common/GlassCard';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel: string;
}

const formatDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString();

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onPress,
  onLongPress,
  accessibilityLabel,
}) => {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.9}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <Image source={{ uri: project.thumbnailUri }} style={styles.thumb} resizeMode="cover" />
          <View style={styles.meta}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {project.name}
            </AppText>
            <AppText variant="micro" color={colors.textSecondary}>
              {formatDate(project.updatedAt)}
            </AppText>
            <AppText variant="micro" color={colors.textMuted}>
              {formatMsToClock(project.video.durationMs)}
            </AppText>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  thumb: {
    width: 96,
    height: 72,
    borderRadius: 12,
  },
  meta: {
    flex: 1,
    gap: 4,
  },
});
