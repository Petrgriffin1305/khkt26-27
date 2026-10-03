import { useState } from "react";
import { Text, TextInput, Pressable } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { Screen, common, ErrorMessage } from "@/components/common/Screen";
import { PrimaryButton } from "@/components/goal/PrimaryButton";
export default function AuthScreen() {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password, register ? name.trim() : undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng nhập thất bại.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title={register ? "Tạo tài khoản" : "Đăng nhập"}>
      <Text style={common.muted}>
        Lưu phiên học và theo dõi tiến bộ của bạn.
      </Text>
      {register && (
        <TextInput
          style={common.input}
          placeholder="Họ tên"
          accessibilityLabel="Họ tên"
          value={name}
          onChangeText={setName}
          maxLength={100}
        />
      )}
      <TextInput
        style={common.input}
        placeholder="Email"
        accessibilityLabel="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        maxLength={255}
      />
      <TextInput
        style={common.input}
        placeholder="Mật khẩu"
        accessibilityLabel="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete={register ? "new-password" : "current-password"}
        maxLength={72}
      />
      {register && (
        <Text style={common.muted}>
          Ít nhất 8 ký tự, có chữ hoa, số và ký tự đặc biệt.
        </Text>
      )}
      <ErrorMessage message={error} />
      <PrimaryButton
        label={busy ? "ĐANG XỬ LÝ…" : register ? "ĐĂNG KÝ" : "ĐĂNG NHẬP"}
        onPress={() => {
          void submit();
        }}
        disabled={
          busy || !email.trim() || !password || (register && !name.trim())
        }
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setRegister(!register);
          setError(null);
        }}
        disabled={busy}
      >
        <Text style={common.link}>
          {register
            ? "Đã có tài khoản? Đăng nhập"
            : "Chưa có tài khoản? Đăng ký"}
        </Text>
      </Pressable>
    </Screen>
  );
}
