// pickups: hearts (heal) and gems (score), dropped by dead zombies
// drawing lives in render.js (drawPickups)
'use strict';

function spawnPickup(x, y, kind) {
  // clamp so edge kills still leave collectible pickups
  x = clamp(x, 12, W - 12);
  y = clamp(y, 12, H - 12);
  pickups.push({ x, y, kind, life: 20, max: 20, phase: rand(0, Math.PI * 2), taken: false });
}

function maybeDrop(z) {
  if (z.kind === 'boss') {
    // guaranteed loot: 1 heart + 3 gems scattered near the death point
    spawnPickup(z.x, z.y, 'heart');
    for (let i = 0; i < 3; i++) {
      const a = rand(0, Math.PI * 2), s = rand(14, 26);
      spawnPickup(z.x + Math.cos(a) * s, z.y + Math.sin(a) * s, 'gem');
    }
  } else if (z.kind === 'brute') {
    spawnPickup(z.x, z.y, 'gem');
    if (Math.random() < 0.08) spawnPickup(z.x, z.y, 'heart');
  } else {
    // runner / shambler: 15% gem, 8% heart (else nothing)
    if (Math.random() < 0.15) spawnPickup(z.x, z.y, 'gem');
    else if (Math.random() < 0.08) spawnPickup(z.x, z.y, 'heart');
  }
}

function updatePickups(dt) {
  for (const p of pickups) {
    p.life -= dt;
    if (p.taken) continue;
    const d = Math.hypot(p.x - player.x, p.y - player.y);
    if (d < player.r + 10) {
      p.taken = true;
      if (p.kind === 'heart') {
        player.hp = Math.min(player.maxHp, player.hp + 25);
        sfx('pickup');
      } else {
        score += 50;
        sfx('gem');
      }
      blood(p.x, p.y, 8);
    }
  }
  pickups = pickups.filter(p => !p.taken && p.life > 0);
}
