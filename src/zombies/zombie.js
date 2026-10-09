// zombie base class: shared physics (chase, wobble, contact damage)
// and shared drawing (shadow, hit flash, HP bar). Per-type subclasses
// live in their own files: runner.js, shambler.js, brute.js
'use strict';

class Zombie {
  constructor(x, y, r, hp, speed, dmg, score) {
    this.x = x; this.y = y;
    this.r = r; this.hp = hp; this.maxHp = hp;
    this.speed = speed; this.dmg = dmg; this.score = score;
    this.kind = 'zombie';
    this.wobble = 0.5;              // perpendicular sine wobble amplitude while hunting
    this.mode = 'hunt';            // 'hunt' | 'wander' (shambler)
    this.wanderAng = rand(0, Math.PI * 2);
    this.wob = rand(0, Math.PI * 2); // wobble phase
    this.walk = rand(0, Math.PI * 2); // gait phase — locked to motion, freezes when stunned
    this.flash = 0; this.stun = 0;
    this.lastHit = -1; this.dead = false;
    this.showBar = false;           // brute shows its HP bar once damaged
  }

  // pick this frame's movement direction; returns unnormalized [nx, ny]
  think(dx, dy, d, dt) {
    let nx = dx / d, ny = dy / d;
    const px = -ny, py = nx;
    const w = Math.sin(time * 2.2 + this.wob) * this.wobble;
    return [nx + px * w, ny + py * w];
  }

  update(dt) {
    this.flash = Math.max(0, this.flash - dt * 4);
    if (this.stun > 0) { this.stun -= dt; return; }
    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const [nx, ny] = this.think(dx, dy, d, dt);
    const len = Math.hypot(nx, ny) || 1;
    this.x += nx / len * this.speed * dt;
    this.y += ny / len * this.speed * dt;
    this.walk += this.speed * dt * 0.2;
    this.contact();
  }

  // push into the player + contact damage (gated by i-frames)
  contact() {
    const pd = Math.hypot(player.x - this.x, player.y - this.y);
    if (pd < this.r + player.r + 2) {
      const ox = (player.x - this.x) / (pd || 1), oy = (player.y - this.y) / (pd || 1);
      this.x -= ox * 10; this.y -= oy * 10;
      if (player.invuln <= 0) {
        player.hp -= this.dmg;
        player.invuln = 0.8;
        sfx('hurt');
        blood(player.x, player.y, 5);
        if (player.hp <= 0) { player.hp = 0; gameOver(); }
      }
    }
  }
  draw(e) {
    const a = Math.atan2(player.y - this.y, player.x - this.x);
    // ground shadow (world-space, unrotated)
    e.save();
    e.translate(this.x, this.y);
    e.scale(1, 0.55);
    e.fillStyle = 'rgba(0,0,0,0.25)';
    e.beginPath(); e.arc(0, 0, this.r, 0, Math.PI * 2); e.fill();
    e.restore();
    e.save();
    e.translate(this.x, this.y);
    e.rotate(a);
    this.drawBody(e);
    // hit flash
    if (this.flash > 0) {
      e.globalAlpha = this.flash;
      e.fillStyle = '#ffffff';
      e.beginPath(); e.arc(0, 0, this.r, 0, Math.PI * 2); e.fill();
      e.globalAlpha = 1;
    }
    this.drawOverlay(e);
    e.restore();
    // HP bar (brute only, once damaged)
    if (this.showBar && this.hp < this.maxHp) {
      const w = this.r * 1.6, x = this.x - w / 2, y = this.y - this.r - 8;
      e.fillStyle = 'rgba(0,0,0,0.5)'; e.fillRect(x, y, w, 3);
      e.fillStyle = '#c0392b';
      e.fillRect(x, y, w * (this.hp / this.maxHp), 3);
    }
  }

  // default body: small scurrying zombie (runner and shambler share it)
  drawBody(e) {
    const r = this.r;
    // legs: scurrying gait (locked to motion via this.walk)
    e.strokeStyle = '#42572f';
    e.lineCap = 'round';
    e.lineWidth = 4;
    const s = Math.sin(this.walk);
    e.beginPath(); e.moveTo(-0.15*r, -0.4*r); e.lineTo(-0.35*r + s*0.3*r, -0.55*r); e.stroke();
    e.beginPath(); e.moveTo(-0.15*r, 0.4*r); e.lineTo(-0.35*r - s*0.3*r, 0.55*r); e.stroke();
    // arms: both reach forward (classic zombie reach)
    const sway = Math.sin(time * 6 + this.wob) * 0.18 * r;
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

  // tint drawn on top of the body (drowsy shamblers)
  drawOverlay(e) {}
}
