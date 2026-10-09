import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    host: "localhost", port: 8084, strictPort: true,
    watch: {
      ignored: [
        "**/desktop/dist/**", "**/desktop/web-dist/**", "**/desktop/release/**",
        "**/backend/dist/**", "**/backend/.local-data/**",
      ],
    },
  },
  preview: { host: "localhost", port: 8084, strictPort: true },
  build: { outDir: "dist" },
});
