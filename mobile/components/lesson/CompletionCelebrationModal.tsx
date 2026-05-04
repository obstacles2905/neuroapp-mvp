import { useAppTheme } from '@/hooks/useAppTheme';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  subtitle: string;
  primaryLabel: string;
  onRequestClose: () => void;
  onPrimaryPress: () => void;
};

export function CompletionCelebrationModal(props: Props): React.JSX.Element {
  const {
    visible,
    title,
    subtitle,
    primaryLabel,
    onRequestClose,
    onPrimaryPress,
  } = props;
  const t = useAppTheme();
  const styles = useMemo(() => createCelebrationStyles(), []);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={[styles.modalBackdrop, { backgroundColor: t.scrim }]}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: t.surface,
              borderColor: t.borderSubtle,
            },
          ]}
        >
          <Text style={[styles.modalEmoji, { color: t.success }]} importantForAccessibility="no">
            ✓
          </Text>
          <Text style={[styles.modalTitle, { color: t.text }]}>{title}</Text>
          <Text style={[styles.modalSubtitle, { color: t.textSecondary }]}>
            {subtitle}
          </Text>
          <Pressable
            style={[styles.modalBtn, { backgroundColor: t.tint }]}
            onPress={onPrimaryPress}
          >
            <Text style={[styles.modalBtnText, { color: t.tintForeground }]}>
              {primaryLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createCelebrationStyles() {
  return StyleSheet.create({
    modalBackdrop: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    modalBtn: {
      alignSelf: 'stretch',
      borderRadius: 14,
      marginTop: 22,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    modalBtnText: {
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
    },
    modalCard: {
      borderRadius: 20,
      borderWidth: 1,
      maxWidth: 360,
      paddingHorizontal: 24,
      paddingVertical: 28,
      width: '100%',
    },
    modalEmoji: {
      fontSize: 48,
      fontWeight: '700',
      marginBottom: 10,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
      textAlign: 'center',
    },
    modalTitle: {
      fontSize: 23,
      fontWeight: '800',
      letterSpacing: -0.4,
      textAlign: 'center',
    },
  });
}
