import { useCallback, useMemo } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useSetupStore } from '@/store/setupStore';
import type { StudyMaterial } from '@/types';

const MAX_MATERIALS = 4; // 2x2 grid

/** Encapsulates goal-input logic: text state, material picking, validation. */
export function useGoalSetup() {
  const { goalText, materials, setGoalText, addMaterials, removeMaterial } =
    useSetupStore();

  const isGoalFilled = useMemo(() => goalText.trim().length > 0, [goalText]);
  const canAddMore = materials.length < MAX_MATERIALS;

  const pickMaterials = useCallback(async () => {
    if (!canAddMore) return;

    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: ['application/pdf', 'image/*'],
    });

    if (result.canceled) return;

    const remaining = MAX_MATERIALS - materials.length;
    const picked: StudyMaterial[] = result.assets
      .slice(0, remaining)
      .map((asset, index) => ({
        id: `${Date.now()}-${index}`,
        name: asset.name,
        uri: asset.uri,
        mimeType: asset.mimeType,
        size: asset.size,
      }));

    if (picked.length > 0) addMaterials(picked);
  }, [canAddMore, materials.length, addMaterials]);

  const handleRemove = useCallback(
    (id: string) => removeMaterial(id),
    [removeMaterial],
  );

  return {
    goalText,
    materials,
    isGoalFilled,
    canAddMore,
    setGoalText,
    pickMaterials,
    handleRemove,
  };
}
