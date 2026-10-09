// thrower — stone-throwing zombie: r13 hp2, speed 45–60, stone dmg 15, score 20.
// Keeps its distance: approaches until ~170 px, then stops and spends the
// windup (~1.2 s) spinning its arm; on release it hurls a stone at the spot
// the player occupies at that moment — the stone flies and only hits that
// spot, so a moving swordsman evades it. Backs off if the player closes in.
// Appears from wave 3, at most 3 alive at once (see spawnZombie).
'use strict';

class Thrower extends Zombie {
  constructor(x, y) {
    super(x, y, 13, 2, rand(45, 60), 15, 20);
    this.kind = 'thrower';
    this.showBar = true;
    this.wobble = 0.3;
    this.windupMax = 1.2;   // stop + arm-spin before the throw
    this.windup = 0;
  }
  update(dt) {
    this.flash = Math.max(0, this.flash - dt * 4);
    if (this.stun > 0) { this.stun -= dt; return; }
    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    if (this.windup > 0) {
      // stopped, spinning the arm — no movement; cancel if the player breaks range
      this.windup -= dt;
      if (d < 100 || d > 230) this.windup = 0;
      else if (this.windup <= 0) {
        // release: stone is aimed at the player's current spot
        const nx = dx / d, ny = dy / d;
        throwStone(this.x + nx * this.r, this.y + ny * this.r, player.x, player.y, this.dmg);
      }
      this.contact();
      return;
    }
    if (d > 170) {
      // out of throwing range: close in (base chase + wobble)
      const [nx, ny] = this.think(dx, dy, d, dt);
      const len = Math.hypot(nx, ny) || 1;
      this.x += nx / len * this.speed * dt;
      this.y += ny / len * this.speed * dt;
    } else if (d < 100) {
      // player too close: back off (contact still applies while overlapping)
      this.x -= dx / d * this.speed * dt;
      this.y -= dy / d * this.speed * dt;
    } else {
      // in range: stop and wind up
      this.windup = this.windupMax;
    }
    this.walk += this.speed * dt * 0.2;
    this.contact();
  }
  drawBody(e) {
    const r = this.r;
    // legs
    e.strokeStyle = '#45453a';
    e.lineCap = 'round';
    e.lineWidth = 4;
    const s = Math.sin(this.walk);
    e.beginPath(); e.moveTo(-0.15*r, -0.4*r); e.lineTo(-0.35*r + s*0.3*r, -0.55*r); e.stroke();
    e.beginPath(); e.moveTo(-0.15*r, 0.4*r); e.lineTo(-0.35*r - s*0.3*r, 0.55*r); e.stroke();
    // off-arm: rests at the side
    e.beginPath(); e.moveTo(0.2*r, 0.5*r); e.lineTo(1.1*r, 0.9*r); e.stroke();
    // torso
    e.fillStyle = '#67665a';
    e.beginPath(); e.ellipse(0.05*r, 0, 0.85*r, 0.72*r, 0, 0, Math.PI*2); e.fill();
    // head (forward)
    e.fillStyle = '#7a796b';
    e.beginPath(); e.arc(0.55*r, 0, 0.48*r, 0, Math.PI*2); e.fill();
    // open jaw
    e.fillStyle = '#42422f';
    e.beginPath(); e.ellipse(0.72*r, 0.12*r, 0.2*r, 0.14*r, 0, 0, Math.PI*2); e.fill();
    // eyes
    e.fillStyle = '#e8e4c9';
    e.beginPath(); e.arc(0.66*r, -0.14*r, 0.08*r, 0, Math.PI*2); e.fill();
    e.beginPath(); e.arc(0.66*r, 0.24*r, 0.08*r, 0, Math.PI*2); e.fill();
    // throwing arm: raised ready, two full spins during the windup,
    // stone held in the hand
    const prog = this.windup > 0 ? 1 - this.windup / this.windupMax : 1;
    const ang = -0.9 + prog * 4 * Math.PI;
    e.save();
    e.translate(0.15*r, -0.4*r);
    e.rotate(ang);
    e.strokeStyle = '#67665a';
    e.lineWidth = 4;
    e.beginPath(); e.moveTo(0, 0); e.lineTo(1.4*r, 0); e.stroke();
    e.fillStyle = '#9aa0a8';
    e.beginPath(); e.arc(1.5*r, 0, 0.28*r, 0, Math.PI*2); e.fill();
    e.restore();
  }
}
