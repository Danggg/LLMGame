// input
'use strict';
// ---------- fullscreen ----------
// Fullscreen is entered from the start/restart click (a user gesture), as the
// Fullscreen API requires. The `.fs` class drives the CSS letterboxing.
function enterFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el);
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}
function syncFsClass() {
  document.documentElement.classList.toggle(
    'fs', !!(document.fullscreenElement || document.webkitFullscreenElement));
}
document.addEventListener('fullscreenchange', syncFsClass);
document.addEventListener('webkitfullscreenchange', syncFsClass);


const keys = new Set();
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd'].includes(k)) keys.add(k);
  if (k === 'r' && state !== 'menu') { ac(); reset(); }
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (W / r.width);
  mouse.y = (e.clientY - r.top) * (H / r.height);
});
canvas.addEventListener('mousedown', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (W / r.width);
  mouse.y = (e.clientY - r.top) * (H / r.height);
  ac();
  if (state === 'play') startSwing();
});
overlay.addEventListener('mousedown', (e) => {
  ac();
  enterFullscreen();
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (W / r.width);
  mouse.y = (e.clientY - r.top) * (H / r.height);
  if (state !== 'play') reset();
});
