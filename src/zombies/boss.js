// boss — giant zombie: r30, hp 20 + 10*(wave-4) [min 20], speed 26–38, dmg 30,
// score 150. Spawns on the wave-2 push (once per run).
// Always hunts with the base chase + 0.5 wobble; HP bar always shown.
'use strict';

class Boss extends Zombie {
  constructor(x, y) {
    super(x, y, 30, Math.max(20, 20 + 10 * (wave - 4)), rand(26, 38), 30, 150);
    this.kind = 'boss';
    this.showBar = true;
  }
  drawBody(e) {
    const r = this.r;
    // legs: heavy plod
    e.strokeStyle = '#4a2230';
    e.lineCap = 'round';
    e.lineWidth = 10;
    const s = Math.sin(this.walk);
    e.beginPath(); e.moveTo(-0.25*r, -0.4*r); e.lineTo(-0.5*r + s*0.25*r, -0.62*r); e.stroke();
    e.beginPath(); e.moveTo(-0.25*r, 0.4*r); e.lineTo(-0.5*r - s*0.25*r, 0.62*r); e.stroke();
    // arms: both reach forward (massive zombie reach, slow pump)
    const pump = Math.sin(time * 2.5 + this.wob) * 0.2 * r;
    e.lineWidth = 11;
    e.strokeStyle = '#6d2f42';
    e.beginPath(); e.moveTo(0.15*r, -0.55*r); e.lineTo(1.55*r, -0.4*r - pump); e.stroke();
    e.beginPath(); e.moveTo(0.15*r, 0.55*r); e.lineTo(1.55*r, 0.4*r + pump); e.stroke();
    // torso
    e.fillStyle = '#6d2f42';
    e.beginPath(); e.ellipse(0.05*r, 0, 1.1*r, 0.95*r, 0, 0, Math.PI * 2); e.fill();
    // back spikes
    e.fillStyle = '#4a2230';
    for (let i = -1; i <= 1; i++) {
      e.beginPath();
      e.moveTo(i*0.4*r - 0.14*r, -0.8*r);
      e.lineTo(i*0.4*r, -1.28*r);
      e.lineTo(i*0.4*r + 0.14*r, -0.8*r);
      e.closePath(); e.fill();
    }
    // shoulder bulks
    e.fillStyle = '#83394f';
    e.beginPath(); e.arc(-0.12*r, -0.45*r, 0.42*r, 0, Math.PI * 2); e.fill();
    e.beginPath(); e.arc(-0.12*r, 0.45*r, 0.42*r, 0, Math.PI * 2); e.fill();
    // head (forward)
    e.fillStyle = '#83394f';
    e.beginPath(); e.arc(0.6*r, 0, 0.6*r, 0, Math.PI * 2); e.fill();
    // horns
    e.strokeStyle = '#d8c9a8';
    e.lineWidth = 4;
    e.beginPath(); e.moveTo(0.55*r, -0.45*r); e.quadraticCurveTo(0.78*r, -1.1*r, 0.42*r, -1.18*r); e.stroke();
    e.beginPath(); e.moveTo(0.78*r, -0.3*r); e.quadraticCurveTo(1.2*r, -0.72*r, 0.95*r, -1.02*r); e.stroke();
    // jaw
    e.fillStyle = '#4a2230';
    e.beginPath(); e.ellipse(0.88*r, 0.15*r, 0.28*r, 0.2*r, 0, 0, Math.PI * 2); e.fill();
    // eyes (glowing)
    e.fillStyle = '#ffd166';
    e.beginPath(); e.arc(0.82*r, -0.18*r, 0.1*r, 0, Math.PI * 2); e.fill();
    e.beginPath(); e.arc(0.85*r, 0.12*r, 0.1*r, 0, Math.PI * 2); e.fill();
  }
}
