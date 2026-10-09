const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { spawnSync } = require('node:child_process');
const { runInNewContext } = require('node:vm');

const projectRoot = resolve(__dirname, '../..');

test('offline worker serves Vite image and font assets from its cache', async (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'viendu-offline-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));

  const dist = join(fixture, 'dist');
  mkdirSync(join(dist, 'assets'), { recursive: true });
  writeFileSync(join(dist, 'index.html'), '<html lang="en"><head></head><body></body></html>');
  writeFileSync(join(dist, 'favicon.ico'), 'icon');
  writeFileSync(join(dist, 'assets/app.js'), 'bundle');
  writeFileSync(join(dist, 'assets/app.css'), 'style');
  writeFileSync(join(dist, 'assets/train.png'), Buffer.from([0, 1, 2, 3]));
  writeFileSync(join(dist, 'assets/train map#1.png'), Buffer.from([8, 9, 10]));
  writeFileSync(join(dist, 'assets/font.woff2'), Buffer.from([4, 5, 6, 7]));

  const build = spawnSync(process.execPath, [join(projectRoot, 'scripts/build-web.mjs')], {
    cwd: fixture,
    encoding: 'utf8',
    env: { ...process.env, VITE_API_URL: 'http://192.168.1.20:3000/api/v1' },
  });
  assert.equal(build.status, 0, build.stderr);
  assert.deepEqual(
    JSON.parse(readFileSync(join(dist, 'desktop-config.json'), 'utf8')),
    { apiOrigin: 'http://192.168.1.20:3000' },
  );

  const swSource = readFileSync(join(dist, 'sw.js'), 'utf8');
  assert.match(readFileSync(join(dist, 'index.html'), 'utf8'), /<html lang="vi">/);
  const listeners = {};
  const cached = new Map();
  const cache = {
    addAll: async (paths) => {
      for (const path of paths) cached.set(path, new Response(path));
    },
  };
  const caches = {
    open: async () => cache,
    keys: async () => [],
    delete: async () => true,
    match: async (path) => cached.get(path),
  };
  const self = {
    location: { origin: 'https://viendu.example' },
    clients: { claim: async () => {} },
    addEventListener: (name, listener) => { listeners[name] = listener; },
  };
  runInNewContext(swSource, {
    URL,
    Promise,
    Response,
    caches,
    self,
    fetch: async () => { throw new Error('network offline'); },
  });

  let installPromise;
  listeners.install({ waitUntil: (promise) => { installPromise = promise; } });
  await installPromise;

  const assetPaths = [
    '/assets/train.png',
    '/assets/train%20map%231.png',
    '/assets/font.woff2',
  ];
  for (const path of assetPaths) {
    let responsePromise;
    listeners.fetch({
      request: {
        method: 'GET',
        mode: 'no-cors',
        url: `https://viendu.example${path}`,
        headers: { has: () => false },
      },
      respondWith: (promise) => { responsePromise = promise; },
    });
    assert.ok(responsePromise, `worker should intercept ${path}`);
    const response = await responsePromise;
    assert.equal(await response.text(), path);
  }

  let navigationResponse;
  listeners.fetch({
    request: {
      method: 'GET',
      mode: 'navigate',
      url: 'https://viendu.example/study/trip-1',
      headers: { has: () => false },
    },
    respondWith: (promise) => { navigationResponse = promise; },
  });
  assert.equal(await (await navigationResponse).text(), '/index.html');

  for (const request of [
    {
      method: 'GET', mode: 'cors', url: 'https://viendu.example/api/v1/users',
      headers: { has: () => false },
    },
    {
      method: 'GET', mode: 'cors', url: 'https://viendu.example/private/data.json',
      headers: { has: (name) => name === 'Authorization' },
    },
  ]) {
    let intercepted = false;
    listeners.fetch({ request, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false, 'API and authenticated requests stay on the network path');
  }

  const repeatedBuild = spawnSync(process.execPath, [join(projectRoot, 'scripts/build-web.mjs')], {
    cwd: fixture,
    encoding: 'utf8',
    env: { ...process.env, VITE_API_URL: 'http://192.168.1.20:3000/api/v1' },
  });
  assert.equal(repeatedBuild.status, 0, repeatedBuild.stderr);
  assert.equal(readFileSync(join(dist, 'sw.js'), 'utf8'), swSource);
});

test('desktop API origin follows Vite production env precedence and expansion', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'viendu-env-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));

  const dist = join(fixture, 'dist');
  mkdirSync(join(dist, 'assets'), { recursive: true });
  writeFileSync(join(fixture, '.env.local'), 'VITE_API_URL=http://localhost:3000/api/v1\n');
  writeFileSync(join(fixture, '.env.production'), 'API_HOST=api.example.test\nVITE_API_URL="https://${API_HOST}/api/v1" # release endpoint\n');
  writeFileSync(join(dist, 'index.html'), '<html lang="en"><body></body></html>');

  const env = { ...process.env };
  delete env.VITE_API_URL;
  const build = spawnSync(process.execPath, [join(projectRoot, 'scripts/build-web.mjs')], {
    cwd: fixture,
    encoding: 'utf8',
    env,
  });
  assert.equal(build.status, 0, build.stderr);
  assert.deepEqual(
    JSON.parse(readFileSync(join(dist, 'desktop-config.json'), 'utf8')),
    { apiOrigin: 'https://api.example.test' },
  );
});

test('desktop prepare step copies the complete web build and preserves the prior bundle on failure', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'viendu-prepare-web-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));

  const desktop = join(fixture, 'desktop');
  const source = join(fixture, 'dist');
  const target = join(desktop, 'web-dist');
  mkdirSync(join(source, 'assets'), { recursive: true });
  mkdirSync(desktop, { recursive: true });
  cpSync(join(projectRoot, 'desktop/prepare-web.cjs'), join(desktop, 'prepare-web.cjs'));
  writeFileSync(join(source, 'index.html'), 'web shell');
  writeFileSync(join(source, 'desktop-config.json'), '{"apiOrigin":"https://api.example.test"}');
  writeFileSync(join(source, 'metadata.json'), '{"version":"fixture"}');
  writeFileSync(join(source, 'assets/train.png'), Buffer.from([11, 12, 13]));

  const prepare = () => spawnSync(process.execPath, [join(desktop, 'prepare-web.cjs')], {
    cwd: fixture,
    encoding: 'utf8',
  });
  const good = prepare();
  assert.equal(good.status, 0, good.stderr);
  assert.equal(readFileSync(join(target, 'metadata.json'), 'utf8'), '{"version":"fixture"}');
  assert.deepEqual(
    [...readFileSync(join(target, 'assets/train.png'))],
    [11, 12, 13],
  );
  assert.equal(
    JSON.parse(readFileSync(join(target, 'desktop-config.json'), 'utf8')).apiOrigin,
    'https://api.example.test',
  );

  writeFileSync(join(target, 'previous-bundle.marker'), 'keep on failed prepare');
  rmSync(join(source, 'index.html'));
  const bad = prepare();
  assert.notEqual(bad.status, 0);
  assert.equal(readFileSync(join(target, 'previous-bundle.marker'), 'utf8'), 'keep on failed prepare');
});
