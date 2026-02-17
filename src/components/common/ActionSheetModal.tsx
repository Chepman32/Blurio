import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { RADIUS, SPACING, STRINGS } from '../../constants';
import { useAppTheme } from '../../theme';
import { AppText } from './AppText';

export interface ActionSheetOption {
  id: string;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionSheetModalProps {
  visible: boolean;
  title: string;
  options: ActionSheetOption[];
  onClose: () => void;
}

export const ActionSheetModal: React.FC<ActionSheetModalProps> = ({
  visible,
  title,
  options,
  onClose,
}) => {
  const { colors } = useAppTheme();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel={STRINGS.common.close}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.sheet, borderColor: colors.cardBorder },
          ]}>
          <AppText variant="section" style={styles.title}>
            {title}
          </AppText>
          {options.map(option => (
            <TouchableOpacity
              key={option.id}
              onPress={() => {
                option.onPress();
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              style={[styles.option, { borderColor: colors.cardBorder }]}> 
              <AppText
                variant="body"
                color={option.destructive ? colors.destructive : colors.textPrimary}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel={STRINGS.common.cancel}
            style={[styles.cancel, { borderColor: colors.cardBorder }]}> 
            <AppText variant="bodyStrong">{STRINGS.common.cancel}</AppText>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  sheet: {
    borderRadius: RADIUS.sheet,
    padding: SPACING.md,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  option: {
    borderWidth: 1,
    borderRadius: RADIUS.control,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancel: {
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderRadius: RADIUS.control,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
