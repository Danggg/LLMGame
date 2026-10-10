// entry: game flow + main loop
'use strict';

function reset() {
  player.x = W / 2; player.y = H / 2;
  player.hp = player.maxHp;
  player.facing = 0; player.swing = 0; player.coolLeft = 0;
  player.invuln = 0; player.swingId++; player.tier = 1;
  zombies = []; particles = []; pickups = []; stones = []; boss = null;
  score = 0; time = 0; spawnTimer = 0.8; wave = 1;
  overlay.classList.add('hidden');
  state = 'play';
}
function gameOver() {
  state = 'over';
  const cl = overlay.querySelector('.changelog');
  if (cl) cl.style.display = 'none';
  const record = score > best;
  if (record) {
    best = score;
    try { localStorage.setItem('zs-best', String(best)); } catch (e) {}
  }
  overlay.querySelector('h1').textContent = 'YOU DIED';
  overlay.querySelector('.sub').innerHTML =
    'Score ' + score + ' — survived ' + Math.floor(time) + 's<br>' +
    (record ? 'NEW BEST!' : 'Best ' + best);
  overlay.querySelector('.hint').innerHTML =
    'WASD: move &nbsp;·&nbsp; click: swing &nbsp;·&nbsp; R: restart<br>' +
    '<span style="opacity:.7">click anywhere to restart</span>';
  overlay.classList.remove('hidden');
}

// ---------- main loop ----------
function frame(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  updateFog(dt);
  if (state === 'play') {
    time += dt;
    const prevWave = wave;
    wave = 1 + Math.floor(time / 25);
    if (wave > prevWave) {
      if (wave % 5 === 0) {
        // runner surge on waves 5, 10, …
        for (let i = 0; i < 6 && zombies.length < 60; i++) {
          const [x, y] = edgePos();
          zombies.push(new Runner(x, y, Math.min(260, rand(130 + 6 * (wave - 1), 185 + 6 * (wave - 1)))));
        }
      }
      // boss joins the wave-2 push (once per run)
      if (wave === 2 && !boss && zombies.length < 60) {
        const [x, y] = edgePos();
        boss = new Boss(x, y);
        zombies.push(boss);
        sfx('boss');
      }
    }
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnZombie();
      spawnTimer = Math.max(0.4, 1.3 - time * 0.015) * rand(0.7, 1.3);
    }
    updatePlayer(dt);
    updateZombies(dt);
    updateStones(dt);
    updatePickups(dt);
    updateParticles(dt);
  }
  if (state !== 'menu') draw();
  else { ctx.drawImage(ground, 0, 0); drawFog(ctx); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// debug hook (smoke tests / console)
window.__g = {
  get state() { return state; },
  get score() { return score; },
  get zombies() { return zombies; },
  get player() { return player; },
  get stones() { return stones; },
  get pickups() { return pickups; },
  get wave() { return wave; },
  get boss() { return boss; },
  get best() { return best; },
  get tier() { return player.tier; },
  reset,
};
