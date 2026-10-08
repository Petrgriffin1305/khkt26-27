import test from 'node:test';
import assert from 'node:assert/strict';
import * as focus from '../src/adventure/focus.ts';
const { tick, observe, classify, focused, pause, resume, restore } = focus;
const trip = () => ({ id:'test', owner:'guest', goal:'Read biology', topic:'biology', document:'', target:600, groupId:null, started:1000, lastAt:1000, segments:[], state:'focus', reconnect:0 });
test('unclassified background time does not earn progress until confirmed', () => {
  const waiting = observe(trip(), 11000);
  assert.equal(focused(tick(waiting, 61000)), 10);
  assert.equal(focused(classify(waiting, 'material', 61000)), 60);
  const distracted = classify(waiting, 'distraction', 61000);
  assert.equal(focused(distracted), 10);
  assert.equal(distracted.state, 'reconnecting');
});
test('reconnection counts as learning, repeated distraction resets only recovery', () => {
  let s = classify(observe(trip(), 11000), 'distraction', 31000);
  s = tick(s, 91000);
  assert.equal(focused(s), 70); assert.equal(s.reconnect, 60);
  s = classify(observe(s, 101000), 'distraction', 111000);
  assert.equal(focused(s), 80); assert.equal(s.reconnect, 120);
  s = tick(s, 231000);
  assert.equal(s.state, 'focus'); assert.equal(focused(s), 200);
});
test('pause preserves the goal and restart makes uncertain time pending', () => {
  const paused = pause(trip(), 11000);
  const continued = resume(paused, 111000);
  assert.equal(focused(continued), 10);
  assert.equal(focused(tick(continued, 121000)),20);
  assert.equal(restore(continued).state, 'pending');
  assert.equal(restore(paused).state, 'paused');
});
test('ticks clamp to target duration and never create overlap', () => {
  const s = tick(trip(), 900000);
  assert.equal(focused(s), 600);
  assert.equal(s.segments.length, 1);
  assert.equal(s.segments[0].end,601000);
  assert.equal(focused(tick(s,950000)),600);
});
test('device clock rollback never awards negative or invented time', () => {
  const s = tick(trip(), 11000);
  const back = tick(s,5000);
  assert.equal(back.state,'pending'); assert.equal(focused(back),10);
  assert.equal(focused(classify(back,'material',6000)),10);
});
test('an intentional break clears recovery without losing earned study', () => {
  const recovering = classify(observe(trip(), 11000), 'distraction', 31000);
  const continued = resume(pause(recovering, 91000), 111000);
  assert.equal(continued.state, 'focus');
  assert.equal(continued.reconnect, 0);
  assert.equal(focused(continued), 70);
});
test('a brief window switch is noise but a longer absence stays unclassified', () => {
  const waiting = observe(trip(), 11000);
  const brief = focus.returnFromBackground(waiting, 13000);
  assert.equal(brief.state, 'focus');
  assert.equal(focused(brief), 12);
  const long = focus.returnFromBackground(waiting, 15000);
  assert.equal(long.state, 'pending');
  assert.equal(focused(long), 10);
});
test('restart uncertainty cannot be cleared as a brief window switch', () => {
  const restarted = restore(observe(trip(), 11000));
  assert.equal(focus.returnFromBackground(restarted, 12000).state, 'pending');
});
test('leaving the study view cannot use the brief-window grace to earn time', () => {
  const away = focus.leaveFocusView(trip(), 11000);
  const returned = focus.returnFromBackground(away, 12000);
  assert.equal(returned.state, 'pending');
  assert.equal(focused(returned), 10);
});
