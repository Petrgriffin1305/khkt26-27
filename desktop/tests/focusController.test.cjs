const { test } = require('node:test');
const assert = require('node:assert/strict');
const { FocusController } = require('../dist/focusController.js');
const { WindowsGuard } = require('../dist/services/windowsGuard.js');
test('pause excludes waiting time while the guard remains active; expiry drains guard', async () => {
  let now = 0;
  const guard = new WindowsGuard({ platform:'win32', run:async()=>'' });
  const focus = new FocusController(guard,()=>now);
  try {
    await focus.start({durationSeconds:60,blockList:['discord.exe'],confirmed:true});
    now=20000; await focus.pause(); assert.equal(focus.getStatus().remainingSeconds,40);
    now=100000; assert.equal(focus.getStatus().remainingSeconds,40); assert.equal(guard.status,'active');
    await focus.resume(); now=140000; const status=await focus.refresh();
    assert.equal(status.state,'completed'); assert.equal(status.blocker,'stopped');
  } finally { await focus.stop(); }
});
test('refuses unconfirmed/duplicate sessions and stops idempotently', async () => {
  const focus = new FocusController(new WindowsGuard({platform:'linux'}));
  await assert.rejects(focus.start({durationSeconds:60,blockList:[],confirmed:false}));
  try {
    await focus.start({durationSeconds:60,blockList:[],confirmed:true});
    await assert.rejects(focus.start({durationSeconds:60,blockList:[],confirmed:true}));
    await focus.stop(); await focus.stop(); assert.equal(focus.getStatus().state,'stopped');
  } finally { await focus.stop(); }
});
