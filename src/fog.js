// flowing mist: pre-rendered soft sprites that drift across the graveyard,
// fade in, and dissipate from time to time
'use strict';

const FOG_W = 260, FOG_H = 120;
const fogSprites = [];
for (let i = 0; i < 3; i++) {
  const c = document.createElement('canvas');
  c.width = FOG_W; c.height = FOG_H;
  const g = c.getContext('2d');
  for (let b = 0; b < 5; b++) {
    const x = rand(FOG_W * 0.2, FOG_W * 0.8), y = rand(FOG_H * 0.35, FOG_H * 0.75), r = rand(50, 100);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(190,205,225,' + rand(0.10, 0.22).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(190,205,225,0)');
    g.save();
    g.translate(x, y); g.scale(1.6, 0.55); g.translate(-x, -y); // squash into a wisp
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  fogSprites.push(c);
}

let fog = [];
function respawnFog(p, initial) {
  p.sprite = fogSprites[(Math.random() * fogSprites.length) | 0];
  p.s = rand(1.2, 2.6);
  p.v = rand(10, 32);
  p.y = rand(H * 0.2, H * 0.95);
  p.x = initial ? rand(-FOG_W, W + FOG_W) : -FOG_W * p.s / 2; // else: re-enter from the left
  p.max = rand(7, 16);
  p.life = initial ? rand(0, p.max) : p.max;
}
function initFog() {
  fog = [];
  for (let i = 0; i < 9; i++) {
    const p = {};
    respawnFog(p, true);
    fog.push(p);
  }
}
function updateFog(dt) {
  for (const p of fog) {
    p.life -= dt;
    p.x += p.v * dt;
    if (p.life <= 0 || p.x - FOG_W * p.s / 2 > W) respawnFog(p, false);
  }
}
function drawFog(e) {
  for (const p of fog) {
    const t = p.max - p.life;
    // fade in over the first 30%, out over the last 45% of each life
    const a = Math.min(1, t / (p.max * 0.3), p.life / (p.max * 0.45));
    if (a <= 0.01) continue;
    e.globalAlpha = a;
    const w = FOG_W * p.s, h = FOG_H * p.s;
    e.drawImage(p.sprite, p.x - w / 2, p.y - h / 2, w, h);
  }
  e.globalAlpha = 1;
}
initFog();
