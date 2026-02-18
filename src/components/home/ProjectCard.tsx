import React, { useEffect, useState } from 'react';
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
  onLongPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

const formatDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString();

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onPress,
  onLongPress,
  disabled = false,
  accessibilityLabel,
}) => {
  const { colors } = useAppTheme();
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    setThumbFailed(false);
  }, [project.thumbnailUri]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.9}
      style={disabled ? styles.disabledCard : undefined}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          {project.thumbnailUri && !thumbFailed ? (
            <Image
              source={{ uri: project.thumbnailUri }}
              style={styles.thumb}
              resizeMode="cover"
              onError={() => setThumbFailed(true)}
            />
          ) : (
            <View
              style={[
                styles.thumb,
                styles.thumbFallback,
                { borderColor: colors.cardBorder, backgroundColor: `${colors.card}88` },
              ]}>
              <AppText variant="micro" color={colors.textMuted}>
                {project.video.displayName}
              </AppText>
            </View>
          )}
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
  disabledCard: {
    opacity: 0.7,
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
  thumbFallback: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  meta: {
    flex: 1,
    gap: 4,
  },
});
