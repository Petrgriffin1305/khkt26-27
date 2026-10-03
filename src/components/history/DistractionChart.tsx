import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ApiSession } from "@/services/contracts";
import { colors, typography } from "@/theme/colors";
import { common } from "@/components/common/Screen";

const PLOT_HEIGHT = 140;

/** History arrives newest first; show the newest ten from left to right in time. */
export function DistractionChart({ sessions }: { sessions: ApiSession[] }) {
  const recent = sessions.slice(0, 10).reverse();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = recent.find((s) => s.id === selectedId) ?? recent.at(-1);
  const maximum = Math.max(4, Math.ceil(Math.max(0, ...recent.map((s) => s.distraction_attempts)) / 4) * 4);
  const total = recent.reduce((sum, s) => sum + s.distraction_attempts, 0);

  return (
    <View style={common.card}>
      <Text style={styles.title}>Mất tập trung qua các phiên</Text>
      <Text style={common.muted}>Số lần / phiên · 10 phiên gần nhất</Text>
      {recent.length === 0 ? (
        <Text style={common.muted}>Biểu đồ sẽ xuất hiện sau khi bạn lưu phiên học đầu tiên.</Text>
      ) : (
        <>
          <Text style={common.text}>
            {total} lần trong {recent.length} phiên · Trung bình {(total / recent.length).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} lần/phiên
          </Text>
          <View style={styles.chart}>
            {[4, 3, 2, 1, 0].map((step) => (
              <View key={step} pointerEvents="none" style={[styles.gridRow, { top: 22 + (1 - step / 4) * PLOT_HEIGHT }]}>
                <Text style={styles.tick}>{maximum * step / 4}</Text>
                <View style={styles.gridLine} />
              </View>
            ))}
            <View style={styles.columns}>
              {recent.map((session, index) => (
                <View key={session.id} style={styles.column}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Phiên ${index + 1}, ${session.goal_text}, ${new Date(session.created_at).toLocaleString("vi-VN")}, ${session.distraction_attempts} lần mất tập trung`}
                    accessibilityState={{ selected: selected?.id === session.id }}
                    onPress={() => setSelectedId(session.id)}
                    style={styles.barTouch}
                  >
                    <Text style={styles.value}>{session.distraction_attempts}</Text>
                    <View style={[styles.bar, {
                      height: session.distraction_attempts / maximum * PLOT_HEIGHT,
                      backgroundColor: selected?.id === session.id ? colors.accentPressed : colors.accent,
                    }]} />
                  </Pressable>
                  <Text style={styles.sessionLabel}>{index + 1}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.direction}>
            <Text style={styles.caption}>Cũ hơn</Text>
            <Text style={styles.caption}>Mới nhất →</Text>
          </View>
          {selected && (
            <View style={styles.detail} accessibilityLiveRegion="polite">
              <Text style={common.text} numberOfLines={2}>{selected.goal_text}</Text>
              <Text style={common.muted}>{new Date(selected.created_at).toLocaleString("vi-VN")} · {selected.distraction_attempts} lần</Text>
            </View>
          )}
          <Text style={styles.caption}>Chạm một cột để xem phiên học. Số lần được ghi nhận khi bạn rời ứng dụng.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.body, fontSize: 18, fontWeight: "700" },
  chart: { height: PLOT_HEIGHT + 48, marginTop: 8 },
  gridRow: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", height: 1 },
  tick: { width: 30, fontSize: 11, color: colors.textSecondary, textAlign: "right", paddingRight: 8 },
  gridLine: { flex: 1, height: 1, backgroundColor: colors.border },
  columns: { flexDirection: "row", marginLeft: 30 },
  column: { flex: 1, alignItems: "center" },
  barTouch: { height: PLOT_HEIGHT + 22, width: "100%", alignItems: "center", justifyContent: "flex-end" },
  value: { fontSize: 11, fontWeight: "600", color: colors.text, marginBottom: 4 },
  bar: { width: "65%", maxWidth: 36, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  sessionLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 8 },
  direction: { flexDirection: "row", justifyContent: "space-between", marginLeft: 30 },
  caption: { ...typography.bodySecondary, fontSize: 12 },
  detail: { padding: 12, borderRadius: 12, gap: 4, backgroundColor: colors.accentSoft },
});
