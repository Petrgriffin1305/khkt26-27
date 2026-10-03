import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { request } from "@/services/api";
import type { ApiSession, Stats } from "@/services/contracts";
import { Screen, common, ErrorMessage } from "@/components/common/Screen";
import { PrimaryButton } from "@/components/goal/PrimaryButton";
export default function HistoryScreen() {
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(
    (next = 1) =>
      Promise.all([
        request<{ data: ApiSession[]; pagination: { total_pages: number } }>(
          `/sessions?page=${next}&limit=20`,
        ),
        request<Stats>("/sessions/stats?period=all"),
      ])
        .then(([history, summary]) => {
          setError(null);
          setSessions((old) =>
            next === 1 ? history.data : [...old, ...history.data],
          );
          setStats(summary);
          setPage(next);
          setTotalPages(history.pagination.total_pages);
        })
        .catch((e) =>
          setError(e instanceof Error ? e.message : "Không tải được lịch sử."),
        )
        .finally(() => setBusy(false)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Screen title="Lịch sử học">
      {stats && (
        <View style={common.card}>
          <Text style={common.text}>
            Tổng tập trung: {stats.total_focus_time_formatted}
          </Text>
          <Text style={common.text}>
            Số phiên: {stats.total_sessions} · Chuỗi ngày: {stats.streak_days}
          </Text>
          <Text style={common.text}>
            Tỷ lệ đúng: {Math.round(stats.average_quiz_score * 100)}%
          </Text>
        </View>
      )}
      <ErrorMessage message={error} />
      {error && (
        <PrimaryButton
          label="THỬ LẠI"
          onPress={() => {
            setBusy(true);
            void load();
          }}
          disabled={busy}
        />
      )}
      {!busy && !error && sessions.length === 0 && (
        <Text style={common.muted}>Chưa có phiên học nào.</Text>
      )}
      {sessions.map((s) => (
        <View style={common.card} key={s.id}>
          <Text style={common.text}>{s.goal_text}</Text>
          <Text style={common.muted}>
            {new Date(s.created_at).toLocaleString("vi-VN")}
          </Text>
          <Text style={common.text}>
            {Math.floor(s.actual_duration_seconds / 60)} phút ·{" "}
            {s.is_completed ? "Hoàn thành" : "Dừng sớm"} · Quiz {s.quiz_score}/
            {s.total_quiz_questions}
          </Text>
        </View>
      ))}
      {page < totalPages && (
        <PrimaryButton
          label={busy ? "ĐANG TẢI…" : "TẢI THÊM"}
          onPress={() => {
            setBusy(true);
            void load(page + 1);
          }}
          disabled={busy}
        />
      )}
      <PrimaryButton label="QUAY LẠI" onPress={() => router.back()} />
    </Screen>
  );
}
