import { Pressable, Text, View } from "react-native";
import type { ConfidenceRating as Rating } from "@/services/contracts";
import { colors } from "@/theme/colors";
const ratings: { value: Rating; label: string }[] = [
  { value: "low", label: "Low · Thấp" },
  { value: "medium", label: "Medium · Vừa" },
  { value: "high", label: "High · Cao" },
];
export function ConfidenceRating({ value, disabled, onChange }: {
  value?: Rating; disabled: boolean; onChange: (rating: Rating) => void;
}) {
  return <View style={{ gap: 8, marginVertical: 12 }}>
    <Text style={{ color: colors.text }}>Bạn tự tin vào đáp án ở mức nào?</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {ratings.map(rating => <Pressable key={rating.value}
        accessibilityRole="button" accessibilityLabel={`Độ tự tin ${rating.label}`}
        accessibilityState={{ disabled, selected: value === rating.value }}
        disabled={disabled} onPress={() => onChange(rating.value)}
        style={{ minHeight: 48, padding: 12, borderRadius: 12, borderWidth: 1,
          borderColor: value === rating.value ? colors.accent : colors.border,
          backgroundColor: value === rating.value ? colors.accentSoft : colors.card }}>
        <Text style={{ color: colors.text }}>{rating.label}</Text>
      </Pressable>)}
    </View>
  </View>;
}
