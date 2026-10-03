import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@/theme/colors';

interface DistractionAlertModalProps {
  visible: boolean;
  /** Name of the app the user accessed during the session. */
  appName: string;
  onResume: () => void;
  onAcceptViolation: () => void;
}

/**
 * Full-screen active warning overlay shown when an off-limit
 * app is detected during a focus session. The countdown timer
 * is paused while this modal is visible.
 */
export function DistractionAlertModal({
  visible,
  appName,
  onResume,
  onAcceptViolation,
}: DistractionAlertModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onResume}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="alert-decagram"
              size={48}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.header}>Cảnh báo Sao Nhãng!</Text>
          <Text style={styles.body}>
            Bạn vừa truy cập{' '}
            <Text style={styles.appName}>{appName}</Text> trong lúc đang học!
          </Text>

          <Pressable
            onPress={onResume}
            style={[styles.button, styles.primaryButton]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Quay lại học ngay</Text>
          </Pressable>

          <Pressable
            onPress={onAcceptViolation}
            style={[styles.button, styles.secondaryButton]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Chấp nhận vi phạm</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: '#FFF7F0',
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    ...typography.heading,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  appName: {
    fontWeight: '700',
    color: '#E85A3C',
  },
  button: {
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: '#FF6B4A',
  },
  primaryButtonText: {
    ...typography.button,
  },
  secondaryButton: {
    backgroundColor: '#FFE8E0',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
  },
});
