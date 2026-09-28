import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/colors';
import type { StudyMaterial } from '@/types';

const GRID_SIZE = 4; // 2x2

interface MaterialsGridProps {
  materials: StudyMaterial[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}

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
      )}
    </View>
  );
}

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
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.textTertiary,
    backgroundColor: 'transparent',
  },
  cardPressed: {
    opacity: 0.7,
  },
  plus: {
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
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  fileIconText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  fileName: {
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
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
