// entry: game flow + main loop
'use strict';

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
    'WASD: move &nbsp;·&nbsp; click: swing &nbsp;·&nbsp; R: restart<br>' +
    '<span style="opacity:.7">click anywhere to restart</span>';
  overlay.classList.remove('hidden');
}

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
