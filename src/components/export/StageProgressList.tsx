import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, Dot } from 'lucide-react-native';
import { ExportStage } from '../../types';
import { SPACING, STRINGS } from '../../constants';
import { useAppTheme } from '../../theme';
import { AppText } from '../common/AppText';

interface StageProgressListProps {
  stage: ExportStage;
}

const ORDER: ExportStage[] = [
  ExportStage.DECODING,
  ExportStage.APPLYING_BLUR,
  ExportStage.ENCODING,
  ExportStage.SAVING,
];

const LABELS: Record<ExportStage, string> = {
  [ExportStage.IDLE]: STRINGS.export.settingsTitle,
  [ExportStage.DECODING]: STRINGS.export.stageDecoding,
  [ExportStage.APPLYING_BLUR]: STRINGS.export.stageApplying,
  [ExportStage.ENCODING]: STRINGS.export.stageEncoding,
  [ExportStage.SAVING]: STRINGS.export.stageSaving,
  [ExportStage.COMPLETE]: STRINGS.export.successTitle,
  [ExportStage.CANCELLED]: STRINGS.export.cancelledLabel,
  [ExportStage.FAILED]: STRINGS.export.failedLabel,
};

export const StageProgressList: React.FC<StageProgressListProps> = ({ stage }) => {
  const { colors } = useAppTheme();
  const activeIndex = ORDER.indexOf(stage);

  return (
    <View style={styles.container}>
      {ORDER.map((entry, index) => {
        const done = activeIndex > index || stage === ExportStage.COMPLETE;
        const active = activeIndex === index;

        return (
          <View key={entry} style={styles.row}>
            {done ? (
              <Check size={16} color={colors.success} />
            ) : (
              <Dot size={16} color={active ? colors.accent : colors.textMuted} />
            )}
            <AppText
              variant="micro"
              color={done ? colors.success : active ? colors.textPrimary : colors.textMuted}>
              {LABELS[entry]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
});
