// shambler — slow passive wanderer: r12 hp1 dmg12, speed 28–45, score 10.
// Wanders until the player comes within 110 px (then hunts); tinted drowsy.
'use strict';

class Shambler extends Zombie {
  constructor(x, y) {
    super(x, y, 12, 1, rand(28, 45), 12, 10);
    this.kind = 'shambler';
    this.wobble = 0.3;
    this.mode = 'wander';
    this.aggro = 110;
  }
  think(dx, dy, d, dt) {
    if (this.mode === 'wander') {
      if (d < this.aggro) this.mode = 'hunt';
      else {
        this.wanderAng += (Math.random() - 0.5) * 2 * dt;
        // steer back toward center when lost offscreen
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H)
          this.wanderAng = Math.atan2(H / 2 - this.y, W / 2 - this.x);
        return [Math.cos(this.wanderAng), Math.sin(this.wanderAng)];
      }
    }
    return super.think(dx, dy, d, dt);
  }
  drawOverlay(e) {
    if (this.mode !== 'wander') return;
    // drowsy tint: passive shamblers read as non-threatening
    e.globalAlpha = 0.3;
    e.fillStyle = '#1a2415';
    e.beginPath(); e.arc(0, 0, this.r, 0, Math.PI * 2); e.fill();
    e.globalAlpha = 1;
  }
}
