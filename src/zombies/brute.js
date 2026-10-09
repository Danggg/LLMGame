// brute — big zombie: r18 hp3 dmg25, speed 38–55, score 25, HP bar.
// Always hunts the player with the base chase + 0.5 wobble.
'use strict';

class Brute extends Zombie {
  constructor(x, y) {
    super(x, y, 18, 3, rand(38, 55), 25, 25);
    this.kind = 'brute';
    this.showBar = true;
  }
  drawBody(e) {
    const r = this.r;
    // legs: slow plod
    e.strokeStyle = '#3a4c2b';
    e.lineCap = 'round';
    e.lineWidth = 7;
    const s = Math.sin(this.walk);
    e.beginPath(); e.moveTo(-0.25*r, -0.45*r); e.lineTo(-0.45*r + s*0.22*r, -0.6*r); e.stroke();
    e.beginPath(); e.moveTo(-0.25*r, 0.45*r); e.lineTo(-0.45*r - s*0.22*r, 0.6*r); e.stroke();
    // arms: one lurches forward, one raised menacing (slow pump)
    const pump = Math.sin(time * 3 + this.wob) * 0.2 * r;
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
}
