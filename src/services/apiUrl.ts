// Web luôn dùng backend localhost; native dùng env hoặc fallback localhost.
export function resolveApiUrl(fromEnv?: string, platform?: string): string {
  const localhost = "http://localhost:3000/api/v1";
  if (platform === "web") return localhost;
  const configured = fromEnv?.trim().replace(/\/+$/, "");
  if (configured) {
    const url = new URL(configured);
    if (!['http:', 'https:'].includes(url.protocol))
      throw new Error("EXPO_PUBLIC_API_URL phải là URL HTTP hoặc HTTPS.");
    return url.pathname === "/" ? `${configured}/api/v1` : configured;
  }

  return localhost;
}
