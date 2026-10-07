const $ = id => document.getElementById(id);
let paused = false;
async function run(operation) {
  try { $('error').textContent = ''; render(await operation()); }
  catch (error) { $('error').textContent = error.message; }
}
function render(status) {
  const active = status.state === 'running' || status.state === 'paused';
  paused = status.state === 'paused';
  $('start').disabled = active; $('stop').disabled = !active; $('pause').disabled = !active;
  $('pause').textContent = paused ? 'Tiếp tục' : 'Tạm dừng';
  const stateLabels = { idle: 'Sẵn sàng', running: 'Đang tập trung', paused: 'Tạm dừng thời gian học', stopped: 'Đã kết thúc', completed: 'Đã hoàn thành' };
  $('status').textContent = stateLabels[status.state] + ' · ' + ({active:'Đang theo dõi và đóng ứng dụng',stopped:'Đã tắt Guard',unsupported:'Hệ điều hành không hỗ trợ Guard'})[status.blocker];
  $('clock').textContent = Math.floor(status.remainingSeconds / 60).toString().padStart(2, '0') + ':' + (status.remainingSeconds % 60).toString().padStart(2, '0');
  $('events').replaceChildren(...status.events.map(event => {
    const row = document.createElement('li'); row.textContent = event.message || 'Đã đóng ' + event.exe; return row;
  }));
}
$('focus-form').addEventListener('submit', event => {
  event.preventDefault();
  void run(() => window.focusGuard.start({ durationSeconds: Number($('minutes').value) * 60,
    confirmed: $('confirmed').checked,
    blockList: [...document.querySelectorAll('input[name=exe]:checked')].map(input => input.value) }));
});
$('stop').addEventListener('click', () => { void run(() => window.focusGuard.stop()); });
$('pause').addEventListener('click', () => { void run(() => paused ? window.focusGuard.resume() : window.focusGuard.pause()); });
setInterval(() => { void run(() => window.focusGuard.getStatus()); }, 1000);
void run(() => window.focusGuard.getStatus());
