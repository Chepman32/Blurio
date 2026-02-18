import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ListRenderItemInfo,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import Animated, {
  cancelAnimation,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { Project, RootStackParamList } from '../types';
import { useEditorStore, useProjectList } from '../store';
import {
  GradientBackground,
  AppText,
  BlurButton,
  EmptyStateIllustration,
  ActionSheetModal,
} from '../components/common';
import { SwipeableProjectCard } from '../components/home';
import { SPACING, STRINGS } from '../constants';
import { useAppTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const projects = useProjectList();
  const deleteProject = useEditorStore(state => state.deleteProject);
  const duplicateProjectById = useEditorStore(state => state.duplicateProjectById);
  const selectProject = useEditorStore(state => state.selectProject);

  const [contextProjectId, setContextProjectId] = useState<string | null>(null);

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.03, { duration: 860 }), -1, true);

    return () => {
      cancelAnimation(pulse);
      pulse.value = 1;
    };
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const contextProject = useMemo(
    () => projects.find(project => project.id === contextProjectId) ?? null,
    [contextProjectId, projects],
  );

  const openProject = (project: Project) => {
    selectProject(project.id);
    navigation.navigate('Editor', { projectId: project.id });
  };

  const onDeleteProject = (project: Project) => {
    Alert.alert(
      STRINGS.home.deleteConfirmTitle,
      STRINGS.home.deleteConfirmBody,
      [
        { text: STRINGS.common.cancel, style: 'cancel' },
        {
          text: STRINGS.common.delete,
          style: 'destructive',
          onPress: () => deleteProject(project.id),
        },
      ],
    );
  };

  const renderProjectItem = ({ item, index }: ListRenderItemInfo<Project>) => (
    <Animated.View entering={FadeInDown.delay(index * 70).springify()}>
      <SwipeableProjectCard
        project={item}
        onOpen={() => openProject(item)}
        onLongPress={() => setContextProjectId(item.id)}
        onDuplicate={() => duplicateProjectById(item.id)}
        onDelete={() => onDeleteProject(item)}
      />
    </Animated.View>
  );

  const fabBottom = Math.max(insets.bottom + SPACING.sm, SPACING.xl);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="title">{STRINGS.navigation.homeTitle}</AppText>
          <TouchableOpacity
            accessibilityLabel={STRINGS.accessibility.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            style={[styles.settingsButton, { borderColor: colors.cardBorder }]}>
            <Image
              source={require('../assets/icons/settings--.png')}
              style={[styles.settingsIcon, { tintColor: colors.textPrimary }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {projects.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyStateIllustration />
            <AppText variant="title" style={styles.emptyTitle}>
              {STRINGS.home.emptyTitle}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.emptyBody}>
              {STRINGS.home.emptyBody}
            </AppText>
            <Animated.View style={pulseStyle}>
              <BlurButton
                label={STRINGS.home.emptyButton}
                onPress={() => navigation.navigate('Import')}
                accessibilityLabel={STRINGS.accessibility.importButton}
              />
            </Animated.View>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={item => item.id}
            renderItem={renderProjectItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: fabBottom + 84 }]}
          />
        )}

        <ActionSheetModal
          visible={Boolean(contextProject)}
          title={STRINGS.home.contextTitle}
          onClose={() => setContextProjectId(null)}
          options={
            contextProject
              ? [
                  {
                    id: 'open',
                    label: STRINGS.home.openAction,
                    onPress: () => openProject(contextProject),
                  },
                  {
                    id: 'duplicate',
                    label: STRINGS.home.duplicateAction,
                    onPress: () => duplicateProjectById(contextProject.id),
                  },
                  {
                    id: 'delete',
                    label: STRINGS.home.deleteAction,
                    destructive: true,
                    onPress: () => onDeleteProject(contextProject),
                  },
                ]
              : []
          }
        />

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={STRINGS.home.createProjectFab}
          onPress={() => navigation.navigate('Import')}
          style={[
            styles.fabButton,
            {
              bottom: fabBottom,
              backgroundColor: colors.accent,
              borderColor: `${colors.accent}BB`,
            },
          ]}>
          <Plus size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    width: 22,
    height: 22,
  },
  listContent: {
    paddingBottom: SPACING.md,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingBottom: 72,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: SPACING.sm,
  },
  fabButton: {
    position: 'absolute',
    right: SPACING.md,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
