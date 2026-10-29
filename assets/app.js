import { mountDesktop } from './desktop.js?v=room-2';

const $ = (q) => document.querySelector(q);
const shell = $('#desktop-shell');
const canvas = $('#room-canvas');
const controls = $('#computer-controls');
const furniture = ['walnut','atelier','bauhaus'].includes(new URLSearchParams(location.search).get('furniture')) ? new URLSearchParams(location.search).get('furniture') : 'walnut';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let room = null, desktop = null, inside = false, busy = false, sound = false, night = false, audio = null;
let enterSource = null;
let pendingNavigation = null;
const wait = (ms) => new Promise(resolve => setTimeout(resolve, reducedMotion ? 0 : ms));
function reconcileNavigation() {
  if (busy || !pendingNavigation) return;
  const next = pendingNavigation; pendingNavigation = null;
  if (next.inside && !inside) openComputer(next.app, { historyMode: 'none' });
  else if (!next.inside && inside) leaveComputer();
}
function remember(key, value) { try { localStorage.setItem(key, value); } catch {} }
try { night = localStorage.getItem('coihan-room-night') === 'true'; } catch {}

function playSound(kind = 'click') {
  if (!sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.connect(gain); gain.connect(audio.destination);
    const t = audio.currentTime;
    oscillator.type = kind === 'enter' ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(kind === 'enter' ? 420 : 620, t);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'enter' ? 680 : 240, t + .065);
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(.025, t + .006); gain.gain.exponentialRampToValueAtTime(.0001, t + .12);
    oscillator.start(t); oscillator.stop(t + .13);
  } catch {}
}

function updateLight() {
  document.body.classList.toggle('is-night', night);
  $('#light-toggle').setAttribute('aria-pressed', String(night));
  $('#light-toggle').setAttribute('aria-label', night ? '切换为日光' : '切换为夜晚');
  $('#light-label').textContent = night ? '夜晚' : '日光';
  room?.setNight(night);
}
updateLight();

function placeScreen() {
  const rect = room?.getScreenRect?.();
  const width = rect?.width > 10 ? rect.width - 3 : Math.min(920, innerWidth - 32);
  const height = rect?.height > 10 ? rect.height - 3 : Math.min(640, innerHeight - 144);
  shell.style.left = `${rect?.width > 10 ? rect.x + 1.5 : (innerWidth - width) / 2}px`;
  shell.style.top = `${rect?.height > 10 ? rect.y + 1.5 : (innerHeight - height) / 2 + 12}px`;
  shell.style.width = `${width}px`; shell.style.height = `${height}px`;
  desktop?.resize?.();
}

async function openComputer(app = 'desktop', { historyMode = 'push' } = {}) {
  if (busy) return;
  if (inside) { desktop.openApp(app); return; }
  busy = true;
  enterSource = document.activeElement;
  $('#enter-computer').disabled = true;
  playSound('enter');
  document.body.classList.add('in-computer');
  try { await room?.enter?.(); } catch {}
  placeScreen();
  shell.hidden = false;
  if (!desktop) desktop = mountDesktop(shell, { onExit: requestExit, onSound: () => playSound() });
  desktop.openApp(app);
  $('#room').inert = true;
  controls.hidden = false;
  await new Promise(requestAnimationFrame);
  shell.classList.add('screen-ready');
  desktop.resize?.();
  await wait(320);
  room?.setActive?.(false);
  inside = true; busy = false;
  desktop.focus?.();
  if (historyMode !== 'none' && !pendingNavigation) history[historyMode === 'replace' ? 'replaceState' : 'pushState']({ app, roomEntry: historyMode === 'push' }, '', `${location.pathname}${location.search}#computer`);
  $('#enter-computer').disabled = false;
  reconcileNavigation();
}

function requestExit() {
  if (busy || !inside) return;
  if (history.state?.roomEntry) history.back();
  else leaveComputer({ updateHistory: true });
}

async function leaveComputer({ updateHistory = false } = {}) {
  if (busy || !inside) return;
  busy = true; playSound();
  desktop?.dismissOverlays?.();
  shell.classList.remove('screen-ready');
  controls.hidden = true;
  await wait(300);
  shell.hidden = true; inside = false;
  try { await room?.exit?.(); } catch {}
  document.body.classList.remove('in-computer');
  $('#room').inert = false;
  if (updateHistory && !pendingNavigation) {
    const roomUrl = new URL(location.href); roomUrl.searchParams.delete('app'); roomUrl.hash = '';
    history.replaceState(null, '', roomUrl.pathname + roomUrl.search);
  }
  busy = false;
  const target = enterSource && document.contains(enterSource) ? enterSource : $('#enter-computer');
  target.focus({ preventScroll: true });
  reconcileNavigation();
}

$('#enter-computer').addEventListener('click', () => openComputer());
$('#leave-computer').addEventListener('click', requestExit);
document.querySelectorAll('[data-app]').forEach(el => el.addEventListener('click', () => openComputer(el.dataset.app)));
canvas.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openComputer(); } });
$('#sound-toggle').addEventListener('click', () => {
  sound = !sound; document.body.classList.toggle('has-sound', sound);
  $('#sound-toggle').setAttribute('aria-pressed', String(sound));
  $('#sound-toggle').setAttribute('aria-label', sound ? '关闭声音' : '开启声音');
  $('#sound-label').textContent = sound ? '声音' : '静音'; playSound();
});
$('#light-toggle').addEventListener('click', () => { night = !night; updateLight(); remember('coihan-room-night', String(night)); playSound(); });
$('#info-toggle').addEventListener('click', () => $('#space-info').showModal());
$('#space-info').addEventListener('click', event => { if (event.target === $('#space-info')) $('#space-info').close(); });

function clock() { $('#local-time').textContent = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()) + ' / CST'; }
clock(); setInterval(clock, 30000);

let ready = false;
function finishLoading() {
  if (ready) return;
  ready = true; $('#boot-progress').style.width = '100%'; $('#boot-copy').textContent = '欢迎来坐坐。';
  setTimeout(() => $('#boot').classList.add('is-done'), reducedMotion ? 0 : 180);
}
function showLightweight() {
  document.body.classList.add('lite-mode'); $('#lite-card').hidden = false; canvas.hidden = true; finishLoading();
}

const startAt = performance.now();
try {
  const { createRoom } = await import('./room-scene.js?v=room-2');
  room = await createRoom({
    canvas,
    furniture,
    onOpen: app => openComputer(app || 'desktop'),
    onHover: label => { $('#object-hint').textContent = label || '点击电脑，或看看桌上的小东西。'; },
    onProgress: value => { $('#boot-progress').style.width = `${Math.max(8,Math.min(94,value * 100))}%`; },
    onReady: () => {}
  });
  updateLight();
  await wait(Math.max(0, 700 - (performance.now() - startAt)));
  finishLoading();
} catch (error) {
  console.warn('Room preview unavailable; opening the lightweight workspace.', error);
  showLightweight();
}

const initialApp = new URLSearchParams(location.search).get('app') || (location.hash === '#computer' ? 'desktop' : null);
if (initialApp && ['about','projects','photos','contact','notebook','philome','desktop'].includes(initialApp)) { await wait(350); openComputer(initialApp, { historyMode: 'replace' }); }
window.addEventListener('pagehide', () => { if (audio?.state === 'running') audio.suspend(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && audio?.state === 'running') audio.suspend(); });
window.addEventListener('popstate', () => {
  pendingNavigation = { inside: location.hash === '#computer', app: history.state?.app || 'desktop' };
  reconcileNavigation();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && inside && !shell.contains(event.target)) { event.preventDefault(); requestExit(); }
});
let screenResizeFrame = 0;
window.addEventListener('resize', () => {
  if (shell.hidden) return;
  cancelAnimationFrame(screenResizeFrame);
  screenResizeFrame = requestAnimationFrame(placeScreen);
});
