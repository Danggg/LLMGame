// zombies: spawning, shared update loop (per-type physics in src/zombies/
// classes — zombie/runner/shambler/brute), swing hit detection, kills
'use strict';

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
  score += z.score;
  blood(z.x, z.y, 14);
  sfx('die');
}

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
  const z = big ? new Brute(x, y)
    : (Math.random() < 0.5 ? new Runner(x, y) : new Shambler(x, y));
  zombies.push(z);
}
function updateZombies(dt) {
  for (const z of zombies) {
    z.update(dt);
    if (player.hp <= 0) return; // player died mid-pass
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
