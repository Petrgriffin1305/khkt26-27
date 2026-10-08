const { cpSync, existsSync, rmSync } = require("node:fs");
const { resolve } = require("node:path");
const source = resolve(__dirname, "../dist");
if (!existsSync(resolve(source, "index.html")))
  throw new Error("Run npm run build:web at the repository root first.");
const target = resolve(__dirname, "web-dist");
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
