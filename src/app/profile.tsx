import { useState } from "react";
import { Text, TextInput } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { request } from "@/services/api";
import type { User } from "@/services/contracts";
import { Screen, common, ErrorMessage } from "@/components/common/Screen";
import { PrimaryButton } from "@/components/goal/PrimaryButton";
export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [name, setName] = useState(user?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await request<User>("/users/me", {
        method: "PUT",
        body: JSON.stringify({ name: name.trim() }),
      });
      useAuthStore.setState({ user: updated });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được.");
    } finally {
      setBusy(false);
    }
  };
  const leave = async () => {
    setBusy(true);
    setError(null);
    try {
      await logout();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đăng xuất được.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Tài khoản">
      <Text style={common.text}>{user?.email}</Text>
      <TextInput
        style={common.input}
        accessibilityLabel="Họ tên"
        value={name}
        onChangeText={(v) => {
          setName(v);
          setSaved(false);
        }}
        maxLength={100}
      />
      <ErrorMessage message={error} />
      {saved && <Text style={common.muted}>Đã lưu.</Text>}
      <PrimaryButton
        label="LƯU HỒ SƠ"
        onPress={() => {
          void save();
        }}
        disabled={busy || !name.trim()}
      />
      <PrimaryButton
        label="ĐĂNG XUẤT"
        onPress={() => {
          void leave();
        }}
        disabled={busy}
      />
      <PrimaryButton
        label="QUAY LẠI"
        onPress={() => router.back()}
        disabled={busy}
      />
    </Screen>
  );
}
