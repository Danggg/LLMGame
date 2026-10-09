// Zombie Sword — milestone 1: core survival loop. Vanilla JS, no deps.
(function () {
  'use strict';

  // ---------- canvas ----------
  const W = 960, H = 540;
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');

  // ---------- state ----------
  let state = 'menu';           // 'menu' | 'play' | 'over'
  let score = 0, time = 0, spawnTimer = 0.8;
  let lastT = 0;
  const mouse = { x: W / 2, y: H / 2 - 60 };
  const player = {
    x: W / 2, y: H / 2, r: 13, speed: 230,
    hp: 100, maxHp: 100, facing: 0,
    swing: 0, cool: 0.4, coolLeft: 0, invuln: 0, swingId: 0,
  };
  let zombies = [];
  let particles = [];

  // ---------- audio (lazy, tiny oscillator SFX) ----------
  let _ac = null;
  function ac() {
    if (!_ac) {
      try { _ac = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { _ac = null; }
    }
    if (_ac && _ac.state === 'suspended') { try { _ac.resume(); } catch (e) {} }
    return _ac;
  }
  function sfx(kind) {
    const a = ac(); if (!a) return;
    try {
      const t0 = a.currentTime;
      const o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      const spec = {
        swing: ['sawtooth', 300, 90, 0.2, 0.06],
        hit:   ['square', 160, 60, 0.12, 0.07],
        die:   ['triangle', 120, 30, 0.3, 0.09],
        hurt:  ['square', 90, 90, 0.25, 0.08],
      }[kind];
      o.type = spec[0];
      o.frequency.setValueAtTime(spec[1], t0);
      o.frequency.exponentialRampToValueAtTime(spec[2], t0 + spec[3]);
      g.gain.setValueAtTime(spec[4], t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + spec[3]);
      o.start(t0); o.stop(t0 + spec[3] + 0.02);
    } catch (e) {}
  }

  // ---------- helpers ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const angDiff = (a, b) => {
    let d = Math.abs(a - b) % (Math.PI * 2);
    return d > Math.PI ? Math.PI * 2 - d : d;
  };

  // ---------- pre-rendered ground ----------
  const ground = document.createElement('canvas');
  ground.width = W; ground.height = H;
  (function paintGround() {
    const g = ground.getContext('2d');
    g.fillStyle = '#262b33'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) {
      const x = rand(0, W), y = rand(0, H), r = rand(8, 54);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(0,0,0,' + rand(0.03, 0.11).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,0.025)'; g.lineWidth = 1;
    for (let x = 0; x <= W; x += 48) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H); g.stroke(); }
    for (let y = 0; y <= H; y += 48) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke(); }
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  })();

  // ---------- game flow ----------
  function reset() {
    player.x = W / 2; player.y = H / 2;
    player.hp = player.maxHp;
    player.facing = 0; player.swing = 0; player.coolLeft = 0;
    player.invuln = 0; player.swingId++;
    zombies = []; particles = [];
    score = 0; time = 0; spawnTimer = 0.8;
    overlay.classList.add('hidden');
    state = 'play';
  }
  function gameOver() {
    state = 'over';
    overlay.querySelector('h1').textContent = 'YOU DIED';
    overlay.querySelector('.sub').textContent =
      'Score ' + score + ' — survived ' + Math.floor(time) + 's';
    overlay.querySelector('.hint').innerHTML =
      'WASD / arrows: move &nbsp;·&nbsp; click / J / Space: swing &nbsp;·&nbsp; R: restart<br>' +
      '<span style="opacity:.7">click anywhere to restart</span>';
    overlay.classList.remove('hidden');
  }

  // ---------- swinging ----------
  function startSwing() {
    if (state !== 'play' || player.coolLeft > 0) return;
    player.swing = 0.25;
    player.coolLeft = player.cool;
    player.swingId++;
    sfx('swing');
  }
  function swingHit() {
    for (const z of zombies) {
      if (z.dead || z.lastHit === player.swingId) continue;
      const dx = z.x - player.x, dy = z.y - player.y;
      const d = Math.hypot(dx, dy);
      if (d > 58 + z.r) continue;
      if (angDiff(Math.atan2(dy, dx), player.facing) > 1.4) continue;
      z.lastHit = player.swingId;
      z.hp -= 1; z.flash = 1; z.stun = 0.4;
      const nx = d > 0 ? dx / d : 1, ny = d > 0 ? dy / d : 0;
      z.x += nx * 16; z.y += ny * 16;
      blood(z.x, z.y, 6);
      sfx('hit');
      if (z.hp <= 0) killZombie(z);
    }
  }
  function killZombie(z) {
    z.dead = true;
    score += z.r > 13 ? 25 : 10;
    blood(z.x, z.y, 14);
    sfx('die');
  }

  // ---------- particles ----------
  function blood(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), s = rand(40, 180);
      const life = rand(0.25, 0.6);
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(1.5, 3.5), life, max: life });
    }
  }
  function updateParticles(dt) {
    const damp = Math.max(0, 1 - 3 * dt);
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= damp; p.vy *= damp;
    }
    particles = particles.filter(p => p.life > 0);
  }

  // ---------- zombies ----------
  function spawnZombie() {
    if (zombies.length >= 60) return;
    const m = 20;
    const edge = Math.random() * 4 | 0;
    let x, y;
    if (edge === 0) { x = rand(-m, W + m); y = -m; }
    else if (edge === 1) { x = W + m; y = rand(-m, H + m); }
    else if (edge === 2) { x = rand(-m, W + m); y = H + m; }
    else { x = -m; y = rand(-m, H + m); }
    const big = Math.random() < 0.18;
    zombies.push({
      x, y,
      r: big ? 18 : 12, hp: big ? 3 : 1,
      speed: big ? rand(38, 55) : rand(65, 105),
      dmg: big ? 25 : 12,
      wob: rand(0, Math.PI * 2), flash: 0, stun: 0, lastHit: -1, dead: false,
      big,
    });
  }
  function updateZombies(dt) {
    for (const z of zombies) {
      if (z.dead) continue;
      z.flash = Math.max(0, z.flash - dt * 4);
      if (z.stun > 0) { z.stun -= dt; continue; }
      const dx = player.x - z.x, dy = player.y - z.y;
      const d = Math.hypot(dx, dy) || 1;
      let nx = dx / d, ny = dy / d;
      // perpendicular wobble
      const px = -ny, py = nx;
      nx += px * Math.sin(time * 2.2 + z.wob) * 0.5;
      ny += py * Math.sin(time * 2.2 + z.wob) * 0.5;
      const len = Math.hypot(nx, ny) || 1;
      z.x += nx / len * z.speed * dt;
      z.y += ny / len * z.speed * dt;
      // contact with player
      const pd = Math.hypot(player.x - z.x, player.y - z.y);
      if (pd < z.r + player.r + 2) {
        const ox = (player.x - z.x) / (pd || 1), oy = (player.y - z.y) / (pd || 1);
        z.x -= ox * 10; z.y -= oy * 10;
        if (player.invuln <= 0) {
          player.hp -= z.dmg;
          player.invuln = 0.8;
          sfx('hurt');
          blood(player.x, player.y, 5);
          if (player.hp <= 0) { player.hp = 0; gameOver(); return; }
        }
      }
    }
    // pairwise separation
    for (let i = 0; i < zombies.length; i++) {
      const a = zombies[i]; if (a.dead) continue;
      for (let j = i + 1; j < zombies.length; j++) {
        const b = zombies[j]; if (b.dead) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy), min = a.r + b.r;
        if (d > 0 && d < min) {
          const push = (min - d) / 2, nx = dx / d, ny = dy / d;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
        }
      }
    }
    zombies = zombies.filter(z => !z.dead);
  }

  // ---------- player ----------
  function updatePlayer(dt) {
    player.coolLeft = Math.max(0, player.coolLeft - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    if (player.swing > 0) {
      player.swing = Math.max(0, player.swing - dt);
      swingHit();
    }
    let mx = 0, my = 0;
    if (keys.has('w') || keys.has('arrowup')) my -= 1;
    if (keys.has('s') || keys.has('arrowdown')) my += 1;
    if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
    if (keys.has('d') || keys.has('arrowright')) mx += 1;
    if (mx || my) {
      const l = Math.hypot(mx, my);
      player.x += mx / l * player.speed * dt;
      player.y += my / l * player.speed * dt;
    }
    player.x = clamp(player.x, player.r, W - player.r);
    player.y = clamp(player.y, player.r, H - player.r);
    player.facing = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  }

  // ---------- drawing ----------
  function drawSword(e, px, py, ang) {
    e.save();
    e.translate(px, py);
    e.rotate(ang);
    // grip
    e.fillStyle = '#6b4a2f';
    e.fillRect(player.r - 6, -2, 8, 4);
    // blade
    e.fillStyle = '#d7dce6';
    e.fillRect(player.r + 2, -1.5, 28, 3);
    // tip
    e.beginPath();
    e.moveTo(player.r + 30, -3);
    e.lineTo(player.r + 35, 0);
    e.lineTo(player.r + 30, 3);
    e.closePath(); e.fill();
    e.restore();
  }
  function drawPlayer(e) {
    const p = player;
    e.save();
    if (p.invuln > 0 && Math.floor(performance.now() / 90) % 2 === 0) e.globalAlpha = 0.4;
    // swing trail
    if (p.swing > 0) {
      const prog = 1 - p.swing / 0.25;
      const from = p.facing - 1.3, to = p.facing + 1.3;
      e.strokeStyle = 'rgba(255,255,255,0.3)';
      e.lineWidth = 3;
      e.beginPath();
      e.arc(p.x, p.y, p.r + 18, from, from + (to - from) * prog);
      e.stroke();
    }
    // shadow
    e.fillStyle = 'rgba(0,0,0,0.35)';
    e.beginPath(); e.ellipse(p.x, p.y + p.r * 0.8, p.r, p.r * 0.4, 0, 0, Math.PI * 2); e.fill();
    // sword (rotated around player)
    const sAng = p.swing > 0
      ? p.facing - 1.3 + 2.6 * (1 - p.swing / 0.25)
      : p.facing + 0.7;
    drawSword(e, p.x, p.y, sAng);
    // body
    e.fillStyle = '#3d4657';
    e.beginPath(); e.arc(p.x, p.y, p.r, 0, Math.PI * 2); e.fill();
    // head
    e.fillStyle = '#cfa06a';
    e.beginPath(); e.arc(p.x + 3, p.y, p.r * 0.55, 0, Math.PI * 2); e.fill();
    e.restore();
  }
  function drawZombie(e, z) {
    const a = Math.atan2(player.y - z.y, player.x - z.x);
    e.save();
    e.translate(z.x, z.y);
    e.rotate(a);
    // shadow (unrotated would be nicer, but keep simple)
    // arms: reach toward player (local +x)
    e.strokeStyle = z.big ? '#4f6b3a' : '#5d7a46';
    e.lineCap = 'round';
    e.lineWidth = z.big ? 5 : 4;
    const jit = Math.sin(time * 7 + z.wob) * 3;
    e.beginPath(); e.moveTo(0.3 * z.r, -0.55 * z.r); e.lineTo(1.55 * z.r, -0.5 * z.r + jit); e.stroke();
    e.beginPath(); e.moveTo(0.3 * z.r, 0.55 * z.r); e.lineTo(1.55 * z.r, 0.5 * z.r - jit); e.stroke();
    // body
    e.fillStyle = z.big ? '#4f6b3a' : '#5d7a46';
    e.beginPath(); e.arc(0, 0, z.r, 0, Math.PI * 2); e.fill();
    // head forward
    e.fillStyle = '#7d9a60';
    e.beginPath(); e.arc(0.35 * z.r, 0, 0.55 * z.r, 0, Math.PI * 2); e.fill();
    // hit flash
    if (z.flash > 0) {
      e.globalAlpha = z.flash;
      e.fillStyle = '#ffffff';
      e.beginPath(); e.arc(0, 0, z.r, 0, Math.PI * 2); e.fill();
      e.globalAlpha = 1;
    }
    e.restore();
    // HP bar for big zombies
    if (z.big && z.hp < 3) {
      const w = z.r * 1.6, x = z.x - w / 2, y = z.y - z.r - 8;
      e.fillStyle = 'rgba(0,0,0,0.5)';
      e.fillRect(x, y, w, 3);
      e.fillStyle = '#c0392b';
      e.fillRect(x, y, w * (z.hp / 3), 3);
    }
  }
  function drawHUD(e) {
    // HP bar
    const bx = 20, by = 18, bw = 200, bh = 14;
    const f = player.hp / player.maxHp;
    e.fillStyle = 'rgba(0,0,0,0.5)'; e.fillRect(bx, by, bw, bh);
    e.fillStyle = f > 0.5 ? '#4caf50' : f > 0.25 ? '#d9a21a' : '#c0392b';
    e.fillRect(bx, by, bw * f, bh);
    e.strokeStyle = 'rgba(255,255,255,0.25)'; e.lineWidth = 1;
    e.strokeRect(bx + .5, by + .5, bw - 1, bh - 1);
    e.fillStyle = '#cfd3da';
    e.font = '14px ui-monospace, Menlo, Consolas, monospace';
    e.textAlign = 'right';
    e.fillText('SCORE ' + score, W - 20, 30);
    e.fillText('WAVE ' + (1 + Math.floor(time / 25)), W - 20, 50);
    e.fillText('TIME ' + Math.floor(time) + 's', W - 20, 70);
    e.textAlign = 'left';
  }
  function draw() {
    ctx.drawImage(ground, 0, 0);
    // particles
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.r > 2.6 ? '#8e1f1f' : '#5c1010';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // y-sorted entities
    const ents = [];
    for (const z of zombies) ents.push({ y: z.y, kind: 'z', ref: z });
    ents.push({ y: player.y, kind: 'p' });
    ents.sort((a, b) => a.y - b.y);
    for (const en of ents) {
      if (en.kind === 'p') drawPlayer(ctx);
      else drawZombie(ctx, en.ref);
    }
    drawHUD(ctx);
  }

  // ---------- input ----------
  const keys = new Set();
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) keys.add(k);
    if ((k === 'j' || k === ' ') && !e.repeat) { ac(); startSwing(); }
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
  overlay.addEventListener('mousedown', () => { ac(); if (state !== 'play') reset(); });

  // ---------- main loop ----------
  function frame(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (state === 'play') {
      time += dt;
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnZombie();
        spawnTimer = Math.max(0.4, 1.3 - time * 0.015) * rand(0.7, 1.3);
      }
      updatePlayer(dt);
      updateZombies(dt);
      updateParticles(dt);
    }
    if (state !== 'menu') draw();
    else ctx.drawImage(ground, 0, 0);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // debug hook (smoke tests / console)
  window.__g = {
    get state() { return state; },
    get score() { return score; },
    get zombies() { return zombies; },
    get player() { return player; },
    get mouse() { return mouse; },
    reset,
  };
})();
