import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { DistractionChart } from "@/components/history/DistractionChart";
import { colors } from "@/theme/colors";
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
  const requestId = useRef(0);
  const load = useCallback(
    (next = 1) => {
      const current = ++requestId.current;
      setBusy(true);
      setError(null);
      return Promise.all([
        request<{ data: ApiSession[]; pagination: { total_pages: number } }>(
          `/sessions?page=${next}&limit=20&sort=created_at%3Adesc`,
        ),
        request<Stats>("/sessions/stats?period=all"),
      ])
        .then(([history, summary]) => {
          if (current !== requestId.current) return;
          setError(null);
          setSessions((old) =>
            next === 1 ? history.data : [...old, ...history.data],
          );
          setStats(summary);
          setPage(next);
          setTotalPages(history.pagination.total_pages);
        })
        .catch((e) => {
          if (current === requestId.current)
            setError(e instanceof Error ? e.message : "Không tải được lịch sử.");
        })
        .finally(() => {
          if (current === requestId.current) setBusy(false);
        });
    },
    [],
  );
  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestId.current++; };
  }, [load]));
  return (
    <Screen title="Lịch sử học">
      {busy && <ActivityIndicator color={colors.accent} accessibilityLabel="Đang tải lịch sử học" />}
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
      {(!busy || sessions.length > 0) && !error && <DistractionChart sessions={sessions} />}
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
      {!error && <PrimaryButton label="LÀM MỚI" onPress={() => { void load(); }} disabled={busy} />}
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
          <Text style={common.muted}>Mất tập trung: {s.distraction_attempts} lần</Text>
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
