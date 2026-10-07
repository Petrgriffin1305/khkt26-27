import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveApiUrl } from '../src/services/apiUrl.ts';

test('native uses explicitly configured localhost and emulator endpoints', () => {
  for (const host of ['localhost', '127.0.0.1', '10.0.2.2']) {
    const endpoint = `http://${host}:4000/api/v1`;
    assert.equal(resolveApiUrl(endpoint, 'android'), endpoint);
  }
});
test('normalizes LAN and HTTPS endpoints without duplicating the API prefix', () => {
  assert.equal(resolveApiUrl(' http://192.168.1.182:3000/// '), 'http://192.168.1.182:3000/api/v1');
  assert.equal(resolveApiUrl('https://api.example.com/api/v1/'), 'https://api.example.com/api/v1');
});
test('web always uses localhost even when env contains the old LAN endpoint', () => {
  assert.equal(resolveApiUrl('http://192.168.1.182:3000/api/v1', 'web'), 'http://localhost:3000/api/v1');
  assert.equal(resolveApiUrl('https://api.example.com', 'web'), 'http://localhost:3000/api/v1');
});
test('missing or blank env always falls back to localhost', () => {
  assert.equal(resolveApiUrl(' ', 'android'), 'http://localhost:3000/api/v1');
  assert.equal(resolveApiUrl(undefined, 'ios'), 'http://localhost:3000/api/v1');
  assert.equal(resolveApiUrl(undefined, 'web'), 'http://localhost:3000/api/v1');
  assert.equal(resolveApiUrl(), 'http://localhost:3000/api/v1');
});
test('rejects endpoints that are not HTTP URLs', () => {
  assert.throws(() => resolveApiUrl('ftp://api.example.com'));
  assert.throws(() => resolveApiUrl('192.168.1.182:3000'));
});
