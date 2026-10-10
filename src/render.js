// drawing
'use strict';

function drawSword(e, px, py, ang) {
  e.save();
  e.translate(px, py);
  e.rotate(ang);
  const blade = SWORD_TIERS[player.tier - 1].glow;
  // pommel
  e.fillStyle = '#b08d3c';
  e.beginPath(); e.arc(player.r - 7, 0, 2, 0, Math.PI * 2); e.fill();
  // grip
  e.fillStyle = '#6b4a2f';
  e.fillRect(player.r - 6, -1.5, 8, 3);
  // crossguard
  e.fillRect(player.r + 2, -4.5, 3, 9);
  // blade
  e.fillStyle = blade;
  e.fillRect(player.r + 5, -1.5, 28, 3);
  // fuller
  e.strokeStyle = 'rgba(120,130,150,0.8)';
  e.lineWidth = 1;
  e.beginPath(); e.moveTo(player.r + 9, 0); e.lineTo(player.r + 31, 0); e.stroke();
  // tip
  e.beginPath();
  e.fillStyle = blade;
  e.moveTo(player.r + 33, -3);
  e.lineTo(player.r + 38, 0);
  e.lineTo(player.r + 33, 3);
  e.closePath(); e.fill();
  e.restore();
}
function drawPlayer(e) {
  const p = player;
  e.save();
  const half = SWORD_TIERS[p.tier - 1].arc - 0.1;
  const swingProg = p.swing > 0 ? 1 - p.swing / 0.25 : 0;
  if (p.invuln > 0 && Math.floor(performance.now() / 90) % 2 === 0) e.globalAlpha = 0.4;
  // swing trail
  if (p.swing > 0) {
    const from = p.facing - half, to = p.facing + half;
    e.strokeStyle = 'rgba(255,255,255,0.3)';
    e.lineWidth = 3;
    e.beginPath();
    e.arc(p.x, p.y, p.r + 26, from, from + (to - from) * swingProg);
    e.stroke();
  }
  // shadow
  e.fillStyle = 'rgba(0,0,0,0.35)';
  e.beginPath(); e.ellipse(p.x, p.y + p.r * 0.8, p.r, p.r * 0.4, 0, 0, Math.PI * 2); e.fill();
  // body, rotated to face mouse (local +x = facing)
  e.translate(p.x, p.y);
  e.rotate(p.facing);
  const t = time;
  if (p.swing > 0) e.translate(Math.sin(swingProg * Math.PI) * 3, 0); // forward lunge
  const stride = p.moving ? Math.sin(p.walk * 1.4) : 0;
  // legs, alternating along facing axis
  e.fillStyle = '#2b3040';
  e.beginPath(); e.ellipse(stride * 4, -p.r * 0.45, 5, 3.5, 0, 0, Math.PI * 2); e.fill();
  e.beginPath(); e.ellipse(-stride * 4, p.r * 0.45, 5, 3.5, 0, 0, Math.PI * 2); e.fill();
  // cape flapping behind
  const flap = Math.sin(t * 6) * 2 + (p.moving ? 3 : 0);
  e.fillStyle = '#8c2f39';
  e.beginPath();
  e.moveTo(-p.r * 0.3, -p.r * 0.6);
  e.quadraticCurveTo(-p.r * 1.6 - flap, -p.r * 0.15, -p.r * 1.25 - flap * 0.5, 0);
  e.quadraticCurveTo(-p.r * 1.6 - flap, p.r * 0.15, -p.r * 0.3, p.r * 0.6);
  e.closePath(); e.fill();
  // torso armor
  e.fillStyle = '#3f4a63';
  e.beginPath(); e.arc(0, 0, p.r, 0, Math.PI * 2); e.fill();
  e.strokeStyle = '#262d3d';
  e.lineWidth = 2;
  e.beginPath(); e.arc(0, 0, p.r - 1, 0, Math.PI * 2); e.stroke();
  // breastplate
  e.fillStyle = '#4d5978';
  e.beginPath(); e.arc(p.r * 0.12, 0, p.r * 0.62, 0, Math.PI * 2); e.fill();
  // belt
  e.strokeStyle = '#262d3d';
  e.lineWidth = 3;
  e.beginPath(); e.arc(0, 0, p.r * 0.78, 2.3, Math.PI - 2.3); e.stroke();
  // shoulder pauldrons
  e.fillStyle = '#566282';
  e.strokeStyle = '#262d3d';
  e.lineWidth = 1.5;
  e.beginPath(); e.arc(0, -p.r * 0.72, p.r * 0.36, 0, Math.PI * 2); e.fill(); e.stroke();
  e.beginPath(); e.arc(0, p.r * 0.72, p.r * 0.36, 0, Math.PI * 2); e.fill(); e.stroke();
  // off-arm, resting forward
  e.strokeStyle = '#4d5978';
  e.lineCap = 'round';
  e.lineWidth = 5;
  e.beginPath(); e.moveTo(-p.r * 0.1, -p.r * 0.55); e.lineTo(p.r * 0.55, -p.r * 0.35); e.stroke();
  e.fillStyle = '#cfa06a';
  e.beginPath(); e.arc(p.r * 0.55, -p.r * 0.35, 3, 0, Math.PI * 2); e.fill();
  // sword arm follows the sword (grip at local +x)
  const sAng = p.swing > 0
    ? p.facing - half + 2 * half * swingProg
    : p.facing + 0.7;
  const d = sAng - p.facing;
  const hx = Math.cos(d) * (p.r - 2), hy = Math.sin(d) * (p.r - 2);
  const sh = hy >= 0 ? 1 : -1;
  e.strokeStyle = '#4d5978';
  e.beginPath(); e.moveTo(p.r * 0.15, sh * p.r * 0.62); e.lineTo(hx, hy); e.stroke();
  e.fillStyle = '#cfa06a';
  e.beginPath(); e.arc(hx, hy, 3.5, 0, Math.PI * 2); e.fill();
  drawSword(e, 0, 0, d);
  // helmet
  e.fillStyle = '#8d99b5';
  e.beginPath(); e.arc(p.r * 0.15, 0, p.r * 0.55, 0, Math.PI * 2); e.fill();
  e.strokeStyle = '#262d3d';
  e.lineWidth = 1.5;
  e.beginPath(); e.arc(p.r * 0.15, 0, p.r * 0.55, 0, Math.PI * 2); e.stroke();
  // visor slit
  e.strokeStyle = '#1c2130';
  e.lineWidth = 2;
  e.beginPath(); e.arc(p.r * 0.15, 0, p.r * 0.38, -0.5, 0.5); e.stroke();
  // plume
  e.fillStyle = '#b23a48';
  e.beginPath(); e.ellipse(-p.r * 0.05, 0, p.r * 0.35, p.r * 0.12, 0, 0, Math.PI * 2); e.fill();
  e.restore();
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
  e.fillText('WAVE ' + wave, W - 20, 50);
  e.fillText('TIME ' + Math.floor(time) + 's', W - 20, 70);
  e.fillText('BEST ' + best, W - 20, 90);
  e.fillStyle = SWORD_TIERS[player.tier - 1].glow;
  e.fillText('TIER ' + player.tier, W - 20, 110);
  e.fillStyle = '#cfd3da';
  e.textAlign = 'left';
  // boss HP bar (top center, while the boss is alive)
  if (boss) {
    const bw2 = 280, bh2 = 8, bx2 = W / 2 - bw2 / 2, by2 = 22;
    e.fillStyle = 'rgba(0,0,0,0.5)'; e.fillRect(bx2, by2, bw2, bh2);
    e.fillStyle = '#c0392b';
    e.fillRect(bx2, by2, bw2 * (boss.hp / boss.maxHp), bh2);
    e.strokeStyle = 'rgba(255,255,255,0.25)'; e.lineWidth = 1;
    e.strokeRect(bx2 + .5, by2 + .5, bw2 - 1, bh2 - 1);
    e.fillStyle = '#cfd3da';
    e.font = '11px ui-monospace, Menlo, Consolas, monospace';
    e.fillText('BOSS', bx2, by2 - 5);
  }
}
function drawPickups(e) {
  for (const p of pickups) {
    const y = p.y + Math.sin(time * 2 + p.phase) * 3;
    e.globalAlpha = p.life <= 3 ? p.life / 3 : 1;
    if (p.kind === 'heart') {
      e.fillStyle = '#e0455a';
      e.beginPath(); e.arc(p.x - 3, y - 2, 4.5, 0, Math.PI * 2); e.fill();
      e.beginPath(); e.arc(p.x + 3, y - 2, 4.5, 0, Math.PI * 2); e.fill();
      e.beginPath(); e.moveTo(p.x - 6.8, y); e.lineTo(p.x + 6.8, y); e.lineTo(p.x, y + 8); e.closePath(); e.fill();
    } else if (p.kind === 'shard') {
      e.save();
      e.translate(p.x, y);
      e.fillStyle = 'rgba(150,225,255,0.35)';   // soft glow
      e.beginPath();
      e.moveTo(0, -8); e.lineTo(5, 0); e.lineTo(0, 8); e.lineTo(-5, 0); e.closePath(); e.fill();
      e.fillStyle = '#bff0ff';                  // bright core
      e.beginPath();
      e.moveTo(0, -6.5); e.lineTo(3.4, 0); e.lineTo(0, 6.5); e.lineTo(-3.4, 0); e.closePath(); e.fill();
      e.strokeStyle = 'rgba(255,255,255,0.7)'; e.lineWidth = 1;
      e.beginPath(); e.moveTo(0, -6.5); e.lineTo(0, 6.5); e.stroke();
      e.restore();
    } else {
      e.save();
      e.translate(p.x, y); e.rotate(Math.PI / 4);
      e.fillStyle = '#7fd4e0';
      e.fillRect(-4.5, -4.5, 9, 9);
      e.strokeStyle = 'rgba(255,255,255,0.55)'; e.lineWidth = 1;
      e.beginPath(); e.moveTo(-4.5, -4.5); e.lineTo(4.5, -4.5); e.stroke();
      e.restore();
    }
  }
  e.globalAlpha = 1;
}
function drawStones(e) {
  for (const s of stones) {
    const p = 1 - s.life / s.maxLife;
    const h = 4 * 26 * p * (1 - p); // parabolic arc, peak ~26 px
    // ground shadow
    e.fillStyle = 'rgba(0,0,0,0.25)';
    e.beginPath(); e.ellipse(s.x, s.y, 5, 3, 0, 0, Math.PI * 2); e.fill();
    // stone
    e.fillStyle = '#8f959e';
    e.beginPath(); e.arc(s.x, s.y - h - 4, 4.5, 0, Math.PI * 2); e.fill();
    e.fillStyle = '#b7bdc7';
    e.beginPath(); e.arc(s.x - 1.2, s.y - h - 5.4, 1.6, 0, Math.PI * 2); e.fill();
  }
}
function draw() {
  ctx.drawImage(ground, 0, 0);
  drawFog(ctx);
  // particles
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.c || (p.r > 2.6 ? '#8e1f1f' : '#5c1010');
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawPickups(ctx);
  // y-sorted entities
  const ents = [];
  for (const z of zombies) ents.push({ y: z.y, kind: 'z', ref: z });
  ents.push({ y: player.y, kind: 'p' });
  ents.sort((a, b) => a.y - b.y);
  for (const en of ents) {
    if (en.kind === 'p') drawPlayer(ctx);
    else en.ref.draw(ctx);
  }
  drawStones(ctx);
  drawHUD(ctx);
}
