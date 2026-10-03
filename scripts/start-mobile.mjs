import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";
const networks = networkInterfaces();
const addresses = Object.entries(networks).flatMap(([name, rows]) =>
  (rows ?? [])
    .filter((r) => r.family === "IPv4" && !r.internal)
    .map((r) => ({ name, address: r.address })),
);
const address =
  process.env.MOBILE_HOST ??
  addresses.find((r) => r.name === "en0")?.address ??
  addresses[0]?.address;
if (!address)
  throw new Error("Chưa có IP mạng LAN. Kết nối Wi-Fi hoặc đặt MOBILE_HOST.");
const origin = `http://${address}:3000`;
const env = {
  ...process.env,
  EXPO_PUBLIC_API_URL: `${origin}/api/v1`,
  PUBLIC_API_ORIGIN: origin,
};
console.log(
  `Expo Go: điện thoại và máy tính cần chung mạng. API: ${origin}/api/v1`,
);
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [
  spawn(npm, ["--prefix", "backend", "run", "dev:local"], {
    stdio: "inherit",
    env,
  }),
  spawn(npm, ["run", "start:go"], { stdio: "inherit", env }),
];
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
};
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, stop);
for (const child of children) {
  child.on("error", (error) => {
    console.error(error.message);
    stop();
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    if (!stopping) {
      stop();
      process.exitCode = code ?? 1;
    }
  });
}
