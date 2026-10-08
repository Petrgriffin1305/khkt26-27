const { test } = require('node:test');
const assert = require('node:assert/strict');
const { win32 } = require('node:path');
const { resolveProtocolPath } = require('../dist/protocolPath.js');

test('Windows asset paths stay under the app bundle and allow dot-prefixed files', () => {
  const root = String.raw`C:\Program Files\Vien Du\resources\app.asar\web-dist`;

  assert.deepEqual(
    resolveProtocolPath(root, '/..preview.png', win32),
    {
      kind: 'ok',
      file: String.raw`C:\Program Files\Vien Du\resources\app.asar\web-dist\..preview.png`,
    },
  );
  assert.deepEqual(
    resolveProtocolPath(root, '/%2e%2e%5c..%5cWindows%5cwin.ini', win32),
    { kind: 'forbidden' },
  );
  assert.deepEqual(
    resolveProtocolPath(root, '/%5cC%3a%5cWindows%5cwin.ini', win32),
    { kind: 'forbidden' },
  );
  assert.deepEqual(resolveProtocolPath(root, '/broken%2', win32), { kind: 'bad-request' });
});
