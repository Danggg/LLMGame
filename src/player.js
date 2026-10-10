// player: swinging + movement
'use strict';

function startSwing() {
  if (state !== 'play' || player.coolLeft > 0) return;
  player.swing = 0.25;
  player.coolLeft = SWORD_TIERS[player.tier - 1].cool;
  player.swingId++;
  sfx('swing');
}

function updatePlayer(dt) {
  player.coolLeft = Math.max(0, player.coolLeft - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  if (player.swing > 0) {
    player.swing = Math.max(0, player.swing - dt);
    swingHit();
  }
  let mx = 0, my = 0;
  if (keys.has('w')) my -= 1;
  if (keys.has('s')) my += 1;
  if (keys.has('a')) mx -= 1;
  if (keys.has('d')) mx += 1;
  if (mx || my) {
    const l = Math.hypot(mx, my);
    player.x += mx / l * player.speed * dt;
    player.y += my / l * player.speed * dt;
    player.moving = true;
    player.walk += dt * 15;
  } else {
    player.moving = false;
  }
  player.x = clamp(player.x, player.r, W - player.r);
  player.y = clamp(player.y, player.r, H - player.r);
  player.facing = Math.atan2(mouse.y - player.y, mouse.x - player.x);
}
