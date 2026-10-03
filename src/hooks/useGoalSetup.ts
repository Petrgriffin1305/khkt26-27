import { useCallback, useMemo } from "react";
import * as DocumentPicker from "expo-document-picker";
import { useSetupStore } from "@/store/setupStore";
import type { StudyMaterial } from "@/types";
import { fileLimits } from "@/services/materialValidation";
import { Alert } from "react-native";

const MAX_MATERIALS = 4; // 2x2 grid

/** Encapsulates goal-input logic: text state, material picking, validation. */
export function useGoalSetup() {
  const { goalText, materials, setGoalText, addMaterials, removeMaterial } =
    useSetupStore();

  const isGoalFilled = useMemo(
    () => goalText.trim().length >= 3 && goalText.trim().length <= 500,
    [goalText],
  );
  const canAddMore = materials.length < MAX_MATERIALS;

  const pickMaterials = useCallback(async () => {
    if (!canAddMore) return;

    let result: DocumentPicker.DocumentPickerResult;
    try {
      result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
        type: Object.keys(fileLimits),
      });
    } catch {
      Alert.alert("Không mở được tài liệu", "Vui lòng thử lại.");
      return;
    }

    if (result.canceled) return;

    const remaining = MAX_MATERIALS - materials.length;
    const validAssets = result.assets.filter((asset) => {
      const limit = fileLimits[asset.mimeType ?? ""];
      return (
        !!limit &&
        asset.size !== undefined &&
        asset.size > 0 &&
        asset.size <= limit
      );
    });
    if (validAssets.length !== result.assets.length)
      Alert.alert(
        "Tài liệu không hợp lệ",
        "PDF tối đa 20 MB, ảnh tối đa 10 MB, văn bản tối đa 5 MB.",
      );
    const picked: StudyMaterial[] = validAssets
      .slice(0, remaining)
      .map((asset, index) => ({
        id: `${Date.now()}-${index}`,
        name: asset.name,
        uri: asset.uri,
        mimeType: asset.mimeType,
        size: asset.size,
        file: asset.file,
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
