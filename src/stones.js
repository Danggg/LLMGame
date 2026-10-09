// stones — hurled by Throwers. A stone flies to the spot it was thrown
// at (fixed target, no homing): it only hits the player if he is standing
// on that spot when it lands, so moving away evades it.
// drawing lives in render.js (drawStones)
'use strict';

function throwStone(x, y, tx, ty, dmg) {
  const dist = Math.hypot(tx - x, ty - y);
  const maxLife = Math.max(0.2, dist / 300); // flight time at 300 px/s
  stones.push({ sx: x, sy: y, x, y, tx, ty, dist, life: maxLife, maxLife, dmg, dead: false });
  sfx('throw');
}
function updateStones(dt) {
  for (const s of stones) {
    if (s.dead) continue;
    s.life -= dt;
    if (s.life > 0) {
      // advance along the throw line by flight progress
      const p = 1 - s.life / s.maxLife;
      s.x = s.sx + (s.tx - s.sx) * p;
      s.y = s.sy + (s.ty - s.sy) * p;
      continue;
    }
    // impact: hits the spot it was thrown at
    s.x = s.tx; s.y = s.ty;
    s.dead = true;
    dust(s.tx, s.ty, 8);
    sfx('thud');
    const pd = Math.hypot(player.x - s.tx, player.y - s.ty);
    if (pd <= player.r + 14 && player.invuln <= 0) {
      player.hp -= s.dmg;
      player.invuln = 0.8;
      sfx('hurt');
      blood(player.x, player.y, 5);
      if (player.hp <= 0) { player.hp = 0; gameOver(); }
    }
  }
  stones = stones.filter(s => !s.dead);
}
