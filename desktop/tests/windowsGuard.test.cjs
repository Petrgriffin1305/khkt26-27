const { test } = require('node:test');
const assert = require('node:assert/strict');
const { WindowsGuard, validateExecutableAllowlist } = require('../dist/services/windowsGuard.js');
const { parseTasklistImageNames } = require('../dist/services/processRunner.js');
const flush = () => new Promise(resolve => setImmediate(resolve));
test('non-Windows never scans or kills even with unsupported input', async () => {
  let calls = 0;
  const guard = new WindowsGuard({ platform: 'linux', run: async () => { calls++; return ''; } });
  assert.equal(await guard.startBlocker(['discord.exe']), 'unsupported');
  await guard.scanNow(); await guard.stopBlocker(); assert.equal(calls, 0);
});
test('CSV parsing handles BOM/CRLF and repeated image names', () => {
  assert.deepEqual([...parseTasklistImageNames('\uFEFF"Discord.EXE","1","Console","1","1,000 K"\r\n"discord.exe","2"\r\n')], ['discord.exe']);
  assert.throws(() => parseTasklistImageNames('garbage'));
});
test('allowlist rejects shell input, paths, wildcards and protected runtimes', () => {
  assert.deepEqual(validateExecutableAllowlist(['DISCORD.EXE', 'discord.exe']), ['discord.exe']);
  for (const name of ['*.exe', 'chrome.exe & taskkill', 'C:\\chrome.exe', 'node.exe', 'electron.exe', 'explorer.exe'])
    assert.throws(() => validateExecutableAllowlist([name]));
});
test('one kill per allowed image and no commands after stop', async () => {
  const calls = []; const events = [];
  const guard = new WindowsGuard({ platform: 'win32', onEvent: e => events.push(e), run: async (command, args) => {
    calls.push([command, args]);
    return command === 'tasklist.exe' ? '"Discord.EXE","1"\n"discord.exe","2"\n"other.exe","3"' : '';
  } });
  try {
    await guard.startBlocker(['discord.exe']); await guard.scanNow();
    assert.deepEqual(calls, [['tasklist.exe', ['/FO', 'CSV', '/NH']], ['taskkill.exe', ['/F', '/IM', 'discord.exe']]]);
    assert.equal(events[0].type, 'kill-success');
    await guard.stopBlocker(); const count = calls.length; await guard.scanNow(); assert.equal(calls.length, count);
  } finally { await guard.stopBlocker(); }
});
test('stop aborts an in-flight scan and prevents its subsequent kill', async () => {
  let scans = 0; let kills = 0; let aborted = false;
  const guard = new WindowsGuard({ platform: 'win32', run: async (command, _args, signal) => {
    if (command === 'taskkill.exe') { kills++; return ''; }
    scans++;
    return new Promise((_, reject) => signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')); }, {once:true}));
  } });
  await guard.startBlocker(['discord.exe']);
  const scan = guard.scanNow(); await flush(); assert.equal(scans, 1);
  await guard.stopBlocker(); await scan; assert.equal(aborted, true); assert.equal(kills, 0);
});
test('concurrent restarts serialize and scan failures do not claim success', async () => {
  const events = []; let scans = 0;
  const guard = new WindowsGuard({ platform:'win32', onEvent:e=>events.push(e), run:async()=>{scans++; throw new Error('access denied');} });
  try {
    await Promise.all([guard.startBlocker(['discord.exe']), guard.startBlocker(['chrome.exe'])]);
    await guard.scanNow(); assert.equal(guard.status, 'active');
    assert.ok(scans >= 1); assert.ok(events.every(e => e.type === 'scan-failed'));
  } finally { await guard.stopBlocker(); }
});
test('deadline guard prevents scan and stale scan from killing after expiration', async () => {
  let active = true; let release; let kills = 0;
  const guard = new WindowsGuard({ platform:'win32', canScan:()=>active, run:async command=>{
    if(command==='taskkill.exe'){kills++;return '';}
    return new Promise(resolve=>{release=resolve;});
  } });
  await guard.startBlocker(['discord.exe']); await flush(); active=false;
  release('"discord.exe","1"'); await guard.scanNow(); assert.equal(kills,0);
  await guard.stopBlocker();
});
