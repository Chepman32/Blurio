import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { BlurButton, GradientBackground, ShimmerOverlay, AppText } from '../components/common';
import { SPACING, STRINGS } from '../constants';
import type { RootStackParamList, VideoMeta } from '../types';
import { useEditorStore } from '../store';
import { createVideoMetaFromAsset, isICloudOnlyAsset } from '../utils';
import { useAppTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Import'>;

export const ImportScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const createProjectFromVideo = useEditorStore(state => state.createProjectFromVideo);
  const setUnsupportedVideoPromptVisible = useEditorStore(
    state => state.setUnsupportedVideoPromptVisible,
  );

  const [preparing, setPreparing] = useState(false);
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);

  const pickVideo = async () => {
    const response = await launchImageLibrary({
      mediaType: 'video',
      selectionLimit: 1,
      includeExtra: true,
      formatAsMp4: false,
      presentationStyle: 'fullScreen',
    });

    const asset = response.assets?.[0];

    if (!asset) {
      return;
    }

    if (isICloudOnlyAsset(asset)) {
      Alert.alert(STRINGS.import.iCloudWarningTitle, STRINGS.import.iCloudWarningBody);
      return;
    }

    const meta = createVideoMetaFromAsset(asset);
    if (!meta || meta.unsupportedCodec || meta.corrupted) {
      setUnsupportedVideoPromptVisible(true);
      Alert.alert(STRINGS.import.unsupportedTitle, STRINGS.import.unsupportedBody);
      return;
    }

    setPreparing(true);
    setVideoMeta(meta);

    setTimeout(() => {
      setPreparing(false);
    }, 850);
  };

  const openEditor = () => {
    if (!videoMeta) {
      return;
    }

    const projectId = createProjectFromVideo(videoMeta);
    navigation.replace('Editor', {
      projectId,
      fromImport: true,
    });
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <AppText variant="title">{STRINGS.navigation.importTitle}</AppText>

        <BlurButton
          label={STRINGS.import.pickButton}
          onPress={pickVideo}
          accessibilityLabel={STRINGS.import.pickButton}
          style={styles.pickButton}
        />

        {videoMeta ? (
          <View
            style={[
              styles.previewCard,
              {
                borderColor: colors.cardBorder,
                backgroundColor: `${colors.card}CC`,
              },
            ]}>
            <Image source={{ uri: videoMeta.thumbnailUris[0] }} style={styles.previewImage} />

            {preparing ? (
              <>
                <ShimmerOverlay />
                <View style={styles.overlayTextWrap}>
                  <AppText variant="section">{STRINGS.import.preparing}</AppText>
                  <AppText variant="micro" color={colors.textSecondary}>
                    {STRINGS.import.preparingBody}
                  </AppText>
                </View>
              </>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbStrip}>
              {videoMeta.thumbnailUris.map(uri => (
                <Image key={uri} source={{ uri }} style={styles.thumb} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <BlurButton
          label={STRINGS.import.doneButton}
          disabled={preparing || !videoMeta}
          onPress={openEditor}
          accessibilityLabel={STRINGS.import.doneButton}
          style={styles.doneButton}
        />
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xxl,
    gap: SPACING.md,
  },
  pickButton: {
    marginTop: SPACING.sm,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  overlayTextWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: 'center',
    gap: 4,
  },
  thumbStrip: {
    gap: 6,
    padding: 8,
  },
  thumb: {
    width: 48,
    height: 36,
    borderRadius: 6,
  },
  doneButton: {
    marginTop: 'auto',
    marginBottom: SPACING.lg,
  },
});
