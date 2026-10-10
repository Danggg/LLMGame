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
    // guaranteed loot: 1 heart + 1 sword shard + 3 gems scattered near the death point
    spawnPickup(z.x, z.y, 'heart');
    spawnPickup(z.x, z.y, 'shard');
    for (let i = 0; i < 3; i++) {
      const a = rand(0, Math.PI * 2), s = rand(14, 26);
      spawnPickup(z.x + Math.cos(a) * s, z.y + Math.sin(a) * s, 'gem');
    }
  } else if (z.kind === 'brute') {
    if (Math.random() < 0.25) spawnPickup(z.x, z.y, 'shard');
    else {
      spawnPickup(z.x, z.y, 'gem');
      if (Math.random() < 0.08) spawnPickup(z.x, z.y, 'heart');
    }
  } else {
    // runner / shambler: 6% shard, 15% gem, 8% heart (else nothing)
    if (Math.random() < 0.06) spawnPickup(z.x, z.y, 'shard');
    else if (Math.random() < 0.15) spawnPickup(z.x, z.y, 'gem');
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
        blood(p.x, p.y, 8);
      } else if (p.kind === 'shard') {
        if (player.tier < SWORD_TIERS.length) {
          player.tier++;
          sfx('upgrade');
          burst(p.x, p.y, SWORD_TIERS[player.tier - 1].glow, 14);
        } else {
          score += 50;  // maxed sword: a shard is worth a gem
          sfx('gem');
          dust(p.x, p.y, 8);
        }
      } else {
        score += 50;
        sfx('gem');
        blood(p.x, p.y, 8);
      }
    }
  }
  pickups = pickups.filter(p => !p.taken && p.life > 0);
}
