// Dùng cùng endpoint đã cấu hình trên web và native; localhost chỉ để phát triển.
export function resolveApiUrl(fromEnv?: string, _platform?: string): string {
  const localhost = "http://localhost:3000/api/v1";
  const configured = fromEnv?.trim().replace(/\/+$/, "");
  if (configured) {
    const url = new URL(configured);
    if (!['http:', 'https:'].includes(url.protocol))
      throw new Error("EXPO_PUBLIC_API_URL phải là URL HTTP hoặc HTTPS.");
    return url.pathname === "/" ? `${configured}/api/v1` : configured;
  }

  return localhost;
}
