// particles
'use strict';

function blood(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(40, 180);
    const life = rand(0.25, 0.6);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(1.5, 3.5), life, max: life });
  }
}
function dust(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(30, 120);
    const life = rand(0.25, 0.5);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(1.5, 3.5), life, max: life, c: '#8d929b' });
  }
}
function updateParticles(dt) {
  const damp = Math.max(0, 1 - 3 * dt);
  for (const p of particles) {
    p.life -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= damp; p.vy *= damp;
  }
  particles = particles.filter(p => p.life > 0);
}
