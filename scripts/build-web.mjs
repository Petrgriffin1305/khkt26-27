import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "vite";

// Match Vite's production parsing, expansion, process-env priority, and blanks.
// Use cwd so packaging tests can build an isolated fixture with the real tools.
const distDirectory = resolve("dist");
const root = pathToFileURL(`${distDirectory}/`);
const configName = "desktop-config.json";
const apiUrl = loadEnv("production", process.cwd(), "VITE_").VITE_API_URL?.trim();
let apiOrigin = null;
if (apiUrl) {
  const parsed = new URL(apiUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("VITE_API_URL must use HTTP or HTTPS.");
  }
  apiOrigin = parsed.origin;
}
await writeFile(
  join(distDirectory, configName),
  `${JSON.stringify({ apiOrigin }, null, 2)}\n`,
);

const files = [];
async function collect(directory, prefix = "") {
  const entries = (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await collect(join(directory, entry.name), relativePath);
    } else if (entry.isFile() && relativePath !== "sw.js") {
      const encodedPath = relativePath
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      files.push(`/${encodedPath}`);
    }
  }
}

await collect(distDirectory);
files.sort();
if (!files.includes("/index.html")) {
  throw new Error("Web build is missing dist/index.html.");
}

const index = new URL("index.html", root);
const html = await readFile(index, "utf8");
const localizedHtml = html.replace(/<html\b([^>]*)>/i, (_tag, attributes) => {
  const languageAttribute = /\blang\s*=\s*(?:"[^"]*"|'[^']*')/i;
  const nextAttributes = languageAttribute.test(attributes)
    ? attributes.replace(languageAttribute, 'lang="vi"')
    : `${attributes} lang="vi"`;
  return `<html${nextAttributes}>`;
});
if (localizedHtml === html && !/<html\b[^>]*\blang=["']vi["']/i.test(html)) {
  throw new Error("Could not set the exported web document language.");
}
await writeFile(index, localizedHtml);

const hash = createHash("sha256");
for (const file of files) {
  hash.update(file).update("\0");
  hash.update(await readFile(new URL(`.${file}`, root)));
}
const version = hash.digest("hex").slice(0, 16);
await writeFile(
  new URL("sw.js", root),
  `
const CACHE = 'viendu-shell-${version}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
// A new worker waits for existing tabs to close, preserving an active study trip.
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('viendu-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || /^\\/api(?:\\/|$)/.test(url.pathname) || request.headers.has('Authorization')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
  } else if (FILES.includes(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then(cached => cached || fetch(request)));
  }
});
`,
);
console.log(`Offline web shell: ${files.length} files, version ${version}`);
