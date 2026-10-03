import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/colors';
import type { StudyMaterial } from '@/types';
<<<<<<< HEAD

const GRID_SIZE = 4; // 2x2
=======
import { useSetupStore } from '@/store/setupStore';
import { t } from '@/utils/i18n';
>>>>>>> a2e8653 (1st)

interface MaterialsGridProps {
  materials: StudyMaterial[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}

<<<<<<< HEAD
/** 2x2 grid of study material slots. Empty slots show a dashed add card. */
export function MaterialsGrid({ materials, onAdd, onRemove }: MaterialsGridProps) {
  const slots: (StudyMaterial | null)[] = Array.from(
    { length: GRID_SIZE },
    (_, i) => materials[i] ?? null,
  );

  return (
    <View style={styles.grid}>
      {slots.map((material, index) =>
        material ? (
          <MaterialCard
            key={material.id}
            material={material}
            onRemove={() => onRemove(material.id)}
          />
        ) : (
          <AddCard key={`empty-${index}`} onPress={onAdd} />
        ),
=======
export function MaterialsGrid({ materials, onAdd, onRemove }: MaterialsGridProps) {
  const { language } = useSetupStore();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.mainAddButton, pressed && styles.cardPressed]}
        accessibilityRole="button"
      >
        <Text style={styles.plus}>+</Text>
        <Text style={styles.addText}>{t('add_material', language)}</Text>
      </Pressable>

      {materials.length > 0 && (
        <View style={styles.listContainer}>
          {materials.map((material) => (
            <View key={material.id} style={styles.listItem}>
              <View style={styles.fileIcon}>
                <Text style={styles.fileIconText}>{material.mimeType?.includes('image') ? 'IMG' : 'PDF'}</Text>
              </View>
              <Text style={styles.fileName} numberOfLines={1}>
                {material.name}
              </Text>
              <Pressable
                onPress={() => onRemove(material.id)}
                style={styles.removeButton}
                hitSlop={12}
              >
                <Text style={styles.removeIcon}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
>>>>>>> a2e8653 (1st)
      )}
    </View>
  );
}

<<<<<<< HEAD
function AddCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, styles.addCard, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel="Thêm tài liệu học tập"
    >
      <Text style={styles.plus}>+</Text>
      <Text style={styles.addText}>Thêm PDF hoặc ảnh</Text>
    </Pressable>
  );
}

function MaterialCard({
  material,
  onRemove,
}: {
  material: StudyMaterial;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.card, styles.fileCard]}>
      <View style={styles.fileIcon}>
        <Text style={styles.fileIconText}>PDF</Text>
      </View>
      <Text style={styles.fileName} numberOfLines={1}>
        {material.name}
      </Text>
      <Pressable
        onPress={onRemove}
        style={styles.removeButton}
        accessibilityRole="button"
        accessibilityLabel={`Xóa ${material.name}`}
        hitSlop={8}
      >
        <Text style={styles.removeIcon}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: radius.card,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  addCard: {
=======
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  mainAddButton: {
    width: '100%',
    height: 80,
    borderRadius: radius.card,
>>>>>>> a2e8653 (1st)
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.textTertiary,
    backgroundColor: 'transparent',
<<<<<<< HEAD
=======
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
>>>>>>> a2e8653 (1st)
  },
  cardPressed: {
    opacity: 0.7,
  },
  plus: {
<<<<<<< HEAD
    fontSize: 28,
    fontWeight: '300',
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  addText: {
    ...typography.bodySecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  fileCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fileIcon: {
    width: 40,
    height: 40,
=======
    fontSize: 24,
    fontWeight: '400',
    color: colors.textTertiary,
  },
  addText: {
    ...typography.bodySecondary,
    fontSize: 14,
  },
  listContainer: {
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileIcon: {
    width: 32,
    height: 32,
>>>>>>> a2e8653 (1st)
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
<<<<<<< HEAD
    marginBottom: spacing.sm,
  },
  fileIconText: {
    fontSize: 11,
=======
    marginRight: spacing.md,
  },
  fileIconText: {
    fontSize: 10,
>>>>>>> a2e8653 (1st)
    fontWeight: '700',
    color: colors.accent,
  },
  fileName: {
<<<<<<< HEAD
    ...typography.bodySecondary,
    fontSize: 12,
    maxWidth: '85%',
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    fontSize: 11,
=======
    ...typography.body,
    flex: 1,
    fontSize: 14,
  },
  removeButton: {
    padding: spacing.xs,
  },
  removeIcon: {
    fontSize: 14,
>>>>>>> a2e8653 (1st)
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
