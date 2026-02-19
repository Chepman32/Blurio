import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  SectionList,
  SectionListRenderItemInfo,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import Animated, {
  cancelAnimation,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type {
  ID,
  NativeContextMenuAction,
  Project,
  RootStackParamList,
} from '../types';
import { BlurioContextMenuView } from '../native';
import {
  useEditorStore,
  useFolderList,
  useProjectList,
} from '../store';
import {
  AppText,
  BlurButton,
  EmptyStateIllustration,
  GradientBackground,
} from '../components/common';
import { ProjectCard } from '../components/home';
import { SPACING, STRINGS } from '../constants';
import { useAppTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface HomeSection {
  key: string;
  title: string;
  type: 'all' | 'folder' | 'trash';
  folderId: ID | null;
  totalCount: number;
  data: Project[];
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const folders = useFolderList();
  const projects = useProjectList();
  const deleteProject = useEditorStore(state => state.deleteProject);
  const recoverProject = useEditorStore(state => state.recoverProject);
  const permanentlyDeleteProject = useEditorStore(state => state.permanentlyDeleteProject);
  const duplicateProjectById = useEditorStore(state => state.duplicateProjectById);
  const renameProject = useEditorStore(state => state.renameProject);
  const createFolder = useEditorStore(state => state.createFolder);
  const moveProjectToFolder = useEditorStore(state => state.moveProjectToFolder);
  const renameFolder = useEditorStore(state => state.renameFolder);
  const removeFolder = useEditorStore(state => state.removeFolder);
  const cleanTrash = useEditorStore(state => state.cleanTrash);
  const selectProject = useEditorStore(state => state.selectProject);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'all-projects': true,
  });
  const [namePromptVisible, setNamePromptVisible] = useState(false);
  const [namePromptTitle, setNamePromptTitle] = useState('');
  const [namePromptValue, setNamePromptValue] = useState('');
  const namePromptSubmitRef = useRef<((value: string) => void) | null>(null);
  const previousSectionKeysRef = useRef<string[]>([]);

  const pulse = useSharedValue(1);
  const sectionLayoutTransition = LinearTransition.springify().damping(20).stiffness(180);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.03, { duration: 860 }), -1, true);

    return () => {
      cancelAnimation(pulse);
      pulse.value = 1;
    };
  }, [pulse]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const activeProjects = useMemo(
    () =>
      projects
        .filter(project => project.trashedAt === null)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [projects],
  );

  const trashProjects = useMemo(
    () =>
      projects
        .filter(project => project.trashedAt !== null)
        .sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0)),
    [projects],
  );

  const sectionDescriptors = useMemo(() => {
    const sections: HomeSection[] = [
      {
        key: 'all-projects',
        title: STRINGS.home.allProjectsFolder,
        type: 'all',
        folderId: null,
        totalCount: activeProjects.length,
        data: activeProjects,
      },
      ...folders.map(folder => {
        const folderProjects = activeProjects.filter(project => project.folderId === folder.id);
        return {
          key: `folder:${folder.id}`,
          title: folder.name,
          type: 'folder' as const,
          folderId: folder.id,
          totalCount: folderProjects.length,
          data: folderProjects,
        };
      }),
    ];

    if (trashProjects.length > 0) {
      sections.push({
        key: 'trash',
        title: STRINGS.home.trashFolder,
        type: 'trash',
        folderId: null,
        totalCount: trashProjects.length,
        data: trashProjects,
      });
    }

    return sections;
  }, [activeProjects, folders, trashProjects]);

  useEffect(() => {
    const nextSectionKeys = sectionDescriptors.map(section => section.key);
    const previousSectionKeys = previousSectionKeysRef.current;
    const sectionStructureChanged =
      previousSectionKeys.length > 0 &&
      (previousSectionKeys.length !== nextSectionKeys.length ||
        previousSectionKeys.some((key, index) => key !== nextSectionKeys[index]));

    if (sectionStructureChanged) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    previousSectionKeysRef.current = nextSectionKeys;

    setExpandedSections(previous => {
      let changed = false;
      const next = { ...previous };
      sectionDescriptors.forEach(section => {
        if (next[section.key] === undefined) {
          next[section.key] = true;
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  }, [sectionDescriptors]);

  const sections = useMemo(
    () =>
      sectionDescriptors.map(section => ({
        ...section,
        data: expandedSections[section.key] === false ? [] : section.data,
      })),
    [expandedSections, sectionDescriptors],
  );

  const openProject = (project: Project) => {
    selectProject(project.id);
    navigation.navigate('Editor', { projectId: project.id });
  };

  const promptForName = (
    title: string,
    defaultValue: string,
    onSubmit: (value: string) => void,
  ) => {
    const normalizePromptValue = (value?: string): string => {
      const trimmed = value?.trim() ?? '';
      if (trimmed.length === 0) {
        return '';
      }

      return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
    };

    if (Platform.OS === 'ios') {
      setNamePromptTitle(title);
      setNamePromptValue(normalizePromptValue(defaultValue));
      namePromptSubmitRef.current = onSubmit;
      setNamePromptVisible(true);
      return;
    }

    Alert.alert(title, defaultValue);
  };

  const closeNamePrompt = () => {
    setNamePromptVisible(false);
    namePromptSubmitRef.current = null;
  };

  const onChangeNamePromptValue = (value: string) => {
    if (value.length === 0) {
      setNamePromptValue('');
      return;
    }

    setNamePromptValue(`${value.charAt(0).toUpperCase()}${value.slice(1)}`);
  };

  const onSaveNamePrompt = () => {
    const normalized = namePromptValue.trim();
    if (normalized.length === 0) {
      return;
    }

    namePromptSubmitRef.current?.(normalized);
    closeNamePrompt();
  };

  const onRemoveProject = (project: Project) => {
    deleteProject(project.id);
  };

  const onRemoveProjectPermanently = (project: Project) => {
    Alert.alert(
      STRINGS.home.deleteConfirmTitle,
      STRINGS.home.deleteConfirmBody,
      [
        { text: STRINGS.common.cancel, style: 'cancel' },
        {
          text: STRINGS.home.removePermanentlyAction,
          style: 'destructive',
          onPress: () => permanentlyDeleteProject(project.id),
        },
      ],
    );
  };

  const onFolderAction = (folderId: ID, actionId: string) => {
    const folder = folders.find(candidate => candidate.id === folderId);
    if (!folder) {
      return;
    }

    if (actionId === 'rename-folder') {
      promptForName(STRINGS.home.renameFolderTitle, folder.name, value => {
        renameFolder(folderId, value);
      });
      return;
    }

    if (actionId === 'remove-folder') {
      Alert.alert(
        STRINGS.home.removeFolderConfirmTitle,
        STRINGS.home.removeFolderConfirmBody,
        [
          { text: STRINGS.common.cancel, style: 'cancel' },
          {
            text: STRINGS.home.removeAction,
            style: 'destructive',
            onPress: () => removeFolder(folderId),
          },
        ],
      );
    }
  };

  const onTrashAction = (actionId: string) => {
    if (actionId !== 'clean-trash') {
      return;
    }

    Alert.alert(
      STRINGS.settings.cleanTrashTitle,
      STRINGS.settings.cleanTrashBody,
      [
        { text: STRINGS.common.cancel, style: 'cancel' },
        {
          text: STRINGS.settings.cleanTrash,
          style: 'destructive',
          onPress: () => cleanTrash(),
        },
      ],
    );
  };

  const buildProjectMenuItems = (project: Project): NativeContextMenuAction[] => {
    if (project.trashedAt !== null) {
      return [
        { id: 'recover', title: STRINGS.home.recoverAction },
        {
          id: 'remove-permanently',
          title: STRINGS.home.removePermanentlyAction,
          destructive: true,
        },
      ];
    }

    const moveTargets = folders
      .filter(folder => folder.id !== project.folderId)
      .map(folder => ({
        id: `move:${folder.id}`,
        title: folder.name,
      }));

    const moveChildren = [
      ...moveTargets,
      {
        id: 'move:new-folder',
        title: STRINGS.home.newFolderAction,
      },
    ];

    return [
      { id: 'rename', title: STRINGS.common.rename },
      { id: 'duplicate', title: STRINGS.common.duplicate },
      {
        id: 'move',
        title: STRINGS.home.moveToFolderAction,
        children: moveChildren,
      },
      {
        id: 'remove',
        title: STRINGS.home.removeAction,
        destructive: true,
      },
    ];
  };

  const onProjectAction = (project: Project, actionId: string) => {
    if (actionId === 'rename') {
      promptForName(STRINGS.home.renameProjectTitle, project.name, value => {
        renameProject(project.id, value);
      });
      return;
    }

    if (actionId === 'duplicate') {
      duplicateProjectById(project.id);
      return;
    }

    if (actionId.startsWith('move:')) {
      const folderId = actionId.replace('move:', '');
      if (folderId === 'new-folder') {
        promptForName(STRINGS.home.createFolderTitle, '', value => {
          const nextFolderId = createFolder(value);
          moveProjectToFolder(project.id, nextFolderId);
        });
        return;
      }
      if (folderId.length > 0) {
        moveProjectToFolder(project.id, folderId);
      }
      return;
    }

    if (actionId === 'remove') {
      onRemoveProject(project);
      return;
    }

    if (actionId === 'recover') {
      recoverProject(project.id);
      return;
    }

    if (actionId === 'remove-permanently') {
      onRemoveProjectPermanently(project);
    }
  };

  const folderMenuItems: NativeContextMenuAction[] = [
    { id: 'rename-folder', title: STRINGS.common.rename },
    { id: 'remove-folder', title: STRINGS.home.removeAction, destructive: true },
  ];

  const trashMenuItems: NativeContextMenuAction[] = [
    {
      id: 'clean-trash',
      title: STRINGS.settings.cleanTrash,
      destructive: true,
    },
  ];

  const toggleSection = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(previous => ({
      ...previous,
      [key]: previous[key] === false,
    }));
  };

  const renderProjectItem = ({
    item,
    index,
    section,
  }: SectionListRenderItemInfo<Project, HomeSection>) => (
    <Animated.View
      layout={sectionLayoutTransition}
      entering={FadeInDown.delay(index * 50).springify()}
      exiting={FadeOutUp.duration(180)}>
      <BlurioContextMenuView
        menuItems={buildProjectMenuItems(item)}
        onPressMenuItem={actionId => onProjectAction(item, actionId)}>
        <ProjectCard
          project={item}
          onPress={() => {
            if (section.type !== 'trash') {
              openProject(item);
            }
          }}
          accessibilityLabel={`${STRINGS.accessibility.projectCard} ${item.name}`}
          disabled={section.type === 'trash'}
        />
      </BlurioContextMenuView>
    </Animated.View>
  );

  const renderSectionHeader = ({ section }: { section: HomeSection }) => {
    const expanded = expandedSections[section.key] !== false;
    const header = (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => toggleSection(section.key)}
        style={[
          styles.sectionHeader,
          {
            borderColor: colors.cardBorder,
            backgroundColor: `${colors.card}B5`,
          },
        ]}>
        <View style={styles.sectionHeaderLeft}>
          {expanded ? (
            <ChevronDown size={16} color={colors.textSecondary} />
          ) : (
            <ChevronRight size={16} color={colors.textSecondary} />
          )}
          <AppText variant="section">{section.title}</AppText>
        </View>
        <AppText variant="micro" color={colors.textSecondary}>
          {section.totalCount}
        </AppText>
      </TouchableOpacity>
    );

    const wrappedHeader =
      section.type === 'folder' && section.folderId ? (
        <BlurioContextMenuView
          menuItems={folderMenuItems}
          onPressMenuItem={actionId => onFolderAction(section.folderId as ID, actionId)}>
          {header}
        </BlurioContextMenuView>
      ) : section.type === 'trash' ? (
        <BlurioContextMenuView
          menuItems={trashMenuItems}
          onPressMenuItem={onTrashAction}>
          {header}
        </BlurioContextMenuView>
      ) : (
        header
      );

    return (
      <Animated.View
        layout={sectionLayoutTransition}
        entering={FadeInDown.springify()}
        exiting={FadeOutUp.duration(180)}>
        {wrappedHeader}
      </Animated.View>
    );
  };

  const fabBottom = Math.max(insets.bottom + SPACING.sm, SPACING.xl);

  return (
    <GradientBackground>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + SPACING.sm,
          },
        ]}>
        <View style={styles.header}>
          <AppText variant="title">{STRINGS.navigation.homeTitle}</AppText>
          <View style={styles.headerActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={STRINGS.home.createFolderTitle}
              onPress={() =>
                promptForName(STRINGS.home.createFolderTitle, '', value => {
                  createFolder(value);
                })
              }
              style={[
                styles.newFolderButton,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: `${colors.card}BB`,
                },
              ]}>
              <Image
                source={
                  isDark
                    ? require('../assets/icons/newFolder_white.png')
                    : require('../assets/icons/newFolder.png')
                }
                style={styles.newFolderIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

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
          <SectionList
            sections={sections}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderProjectItem}
            renderSectionHeader={renderSectionHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: fabBottom + 84 }]}
            stickySectionHeadersEnabled={false}
          />
        )}

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

        {Platform.OS === 'ios' ? (
          <Modal
            transparent
            visible={namePromptVisible}
            animationType="fade"
            onRequestClose={closeNamePrompt}>
            <Pressable style={styles.promptBackdrop} onPress={closeNamePrompt}>
              <KeyboardAvoidingView behavior="padding" style={styles.promptWrap}>
                <Pressable
                  style={[styles.promptCard, { backgroundColor: colors.sheet }]}
                  onPress={event => event.stopPropagation()}>
                  <AppText variant="section" style={styles.promptTitle}>
                    {namePromptTitle}
                  </AppText>
                  <TextInput
                    value={namePromptValue}
                    onChangeText={onChangeNamePromptValue}
                    style={[
                      styles.promptInput,
                      { borderColor: colors.cardBorder, color: colors.textPrimary },
                    ]}
                    autoFocus
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    selectionColor={colors.accent}
                  />
                  <View style={[styles.promptActions, { borderColor: colors.cardBorder }]}>
                    <TouchableOpacity
                      onPress={closeNamePrompt}
                      style={[
                        styles.promptActionButton,
                        styles.promptActionButtonDivider,
                        { borderRightColor: colors.cardBorder },
                      ]}>
                      <AppText variant="bodyStrong" color={colors.accent}>
                        {STRINGS.common.cancel}
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onSaveNamePrompt} style={styles.promptActionButton}>
                      <AppText variant="bodyStrong" color={colors.accent}>
                        {STRINGS.common.save}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </KeyboardAvoidingView>
            </Pressable>
          </Modal>
        ) : null}
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  newFolderButton: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  newFolderIcon: {
    width: 74,
    height: 26,
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
    width: 36,
    height: 36,
  },
  listContent: {
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  sectionHeader: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
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
  promptBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  promptWrap: {
    width: '100%',
    alignItems: 'center',
  },
  promptCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    paddingTop: SPACING.lg,
  },
  promptTitle: {
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  promptInput: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: 17,
  },
  promptActions: {
    marginTop: SPACING.lg,
    minHeight: 56,
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  promptActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptActionButtonDivider: {
    borderRightWidth: 1,
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
