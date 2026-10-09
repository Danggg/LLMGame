// drawing
'use strict';

function drawSword(e, px, py, ang) {
  e.save();
  e.translate(px, py);
  e.rotate(ang);
  // pommel
  e.fillStyle = '#b08d3c';
  e.beginPath(); e.arc(player.r - 7, 0, 2, 0, Math.PI * 2); e.fill();
  // grip
  e.fillStyle = '#6b4a2f';
  e.fillRect(player.r - 6, -1.5, 8, 3);
  // crossguard
  e.fillRect(player.r + 2, -4.5, 3, 9);
  // blade
  e.fillStyle = '#d7dce6';
  e.fillRect(player.r + 5, -1.5, 28, 3);
  // fuller
  e.strokeStyle = 'rgba(120,130,150,0.8)';
  e.lineWidth = 1;
  e.beginPath(); e.moveTo(player.r + 9, 0); e.lineTo(player.r + 31, 0); e.stroke();
  // tip
  e.fillStyle = '#d7dce6';
  e.beginPath();
  e.moveTo(player.r + 33, -3);
  e.lineTo(player.r + 38, 0);
  e.lineTo(player.r + 33, 3);
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
    e.arc(p.x, p.y, p.r + 26, from, from + (to - from) * prog);
    e.stroke();
  }
  // shadow
  e.fillStyle = 'rgba(0,0,0,0.35)';
  e.beginPath(); e.ellipse(p.x, p.y + p.r * 0.8, p.r, p.r * 0.4, 0, 0, Math.PI * 2); e.fill();
  // body, rotated to face mouse (local +x = facing)
  e.translate(p.x, p.y);
  e.rotate(p.facing);
  const t = time;
  const swingProg = p.swing > 0 ? 1 - p.swing / 0.25 : 0;
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
    ? p.facing - 1.3 + 2.6 * swingProg
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
function drawZombieSmall(e, z) {
  const r = z.r;
  // legs: scurrying gait (locked to motion via z.walk)
  e.strokeStyle = '#42572f';
  e.lineCap = 'round';
  e.lineWidth = 4;
  const s = Math.sin(z.walk);
  e.beginPath(); e.moveTo(-0.15*r, -0.4*r); e.lineTo(-0.35*r + s*0.3*r, -0.55*r); e.stroke();
  e.beginPath(); e.moveTo(-0.15*r, 0.4*r); e.lineTo(-0.35*r - s*0.3*r, 0.55*r); e.stroke();
  // arms: both reach forward (classic zombie reach)
  const sway = Math.sin(time * 6 + z.wob) * 0.18 * r;
  e.lineWidth = 4;
  e.strokeStyle = '#5d7a46';
  e.beginPath(); e.moveTo(0.2*r, -0.5*r); e.lineTo(1.45*r, -0.55*r + sway); e.stroke();
  e.beginPath(); e.moveTo(0.2*r, 0.5*r); e.lineTo(1.45*r, 0.55*r - sway); e.stroke();
  // torso: lean, forward hunch
  e.fillStyle = '#5d7a46';
  e.beginPath(); e.ellipse(0.05*r, 0, 0.85*r, 0.72*r, 0, 0, Math.PI*2); e.fill();
  // head (forward)
  e.fillStyle = '#6f8f52';
  e.beginPath(); e.arc(0.55*r, 0, 0.48*r, 0, Math.PI*2); e.fill();
  // open jaw
  e.fillStyle = '#3e5329';
  e.beginPath(); e.ellipse(0.72*r, 0.12*r, 0.2*r, 0.14*r, 0, 0, Math.PI*2); e.fill();
  // eyes
  e.fillStyle = '#dbe69a';
  e.beginPath(); e.arc(0.66*r, -0.14*r, 0.08*r, 0, Math.PI*2); e.fill();
  e.beginPath(); e.arc(0.66*r, 0.24*r, 0.08*r, 0, Math.PI*2); e.fill();
}
function drawZombieBig(e, z) {
  const r = z.r;
  // legs: slow plod
  e.strokeStyle = '#3a4c2b';
  e.lineCap = 'round';
  e.lineWidth = 7;
  const s = Math.sin(z.walk);
  e.beginPath(); e.moveTo(-0.25*r, -0.45*r); e.lineTo(-0.45*r + s*0.22*r, -0.6*r); e.stroke();
  e.beginPath(); e.moveTo(-0.25*r, 0.45*r); e.lineTo(-0.45*r - s*0.22*r, 0.6*r); e.stroke();
  // arms: one lurches forward, one raised menacing (slow pump)
  const pump = Math.sin(time * 3 + z.wob) * 0.2 * r;
  e.lineWidth = 8;
  e.strokeStyle = '#4f6b3a';
  e.beginPath(); e.moveTo(0.15*r, 0.5*r); e.lineTo(1.5*r, 0.55*r + pump); e.stroke();
  e.beginPath(); e.moveTo(0.15*r, -0.5*r); e.lineTo(0.85*r, -1.05*r - pump); e.stroke();
  // bulky torso
  e.fillStyle = '#4f6b3a';
  e.beginPath(); e.ellipse(0.05*r, 0, 1.0*r, 0.9*r, 0, 0, Math.PI*2); e.fill();
  // shoulder bulks
  e.fillStyle = '#587a44';
  e.beginPath(); e.arc(-0.12*r, -0.42*r, 0.4*r, 0, Math.PI*2); e.fill();
  e.beginPath(); e.arc(-0.12*r, 0.42*r, 0.4*r, 0, Math.PI*2); e.fill();
  // head (forward)
  e.fillStyle = '#6a8a4c';
  e.beginPath(); e.arc(0.55*r, 0, 0.58*r, 0, Math.PI*2); e.fill();
  // snout / jaw
  e.fillStyle = '#445c33';
  e.beginPath(); e.ellipse(0.82*r, 0.12*r, 0.3*r, 0.22*r, 0, 0, Math.PI*2); e.fill();
  // eyes (glowing)
  e.fillStyle = '#e6ef9d';
  e.beginPath(); e.arc(0.78*r, -0.16*r, 0.1*r, 0, Math.PI*2); e.fill();
  e.beginPath(); e.arc(0.78*r, 0.3*r, 0.1*r, 0, Math.PI*2); e.fill();
}
function drawZombie(e, z) {
  const a = Math.atan2(player.y - z.y, player.x - z.x);
  // ground shadow (world-space, unrotated)
  e.save();
  e.translate(z.x, z.y);
  e.scale(1, 0.55);
  e.fillStyle = 'rgba(0,0,0,0.25)';
  e.beginPath(); e.arc(0, 0, z.r, 0, Math.PI*2); e.fill();
  e.restore();
  e.save();
  e.translate(z.x, z.y);
  e.rotate(a);
  if (z.big) drawZombieBig(e, z); else drawZombieSmall(e, z);
  // hit flash
  if (z.flash > 0) {
    e.globalAlpha = z.flash;
    e.fillStyle = '#ffffff';
    e.beginPath(); e.arc(0, 0, z.r, 0, Math.PI*2); e.fill();
    e.globalAlpha = 1;
  }
  // drowsy tint: passive shamblers read as non-threatening
  if (z.kind === 'shambler' && z.mode === 'wander') {
    e.globalAlpha = 0.3;
    e.fillStyle = '#1a2415';
    e.beginPath(); e.arc(0, 0, z.r, 0, Math.PI*2); e.fill();
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
