// pre-rendered graveyard: moonlit ground, scattered gravestones,
// tomb of the great warrior dead-centre
'use strict';

const ground = document.createElement('canvas');
ground.width = W; ground.height = H;

// rounded slab (arcTo, no roundRect dependency)
function slab(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// one weathered gravestone: rounded-top slab, inset face, crack
function drawGrave(g, x, y, w, rot, tone) {
  const c1 = tone > 1.9 ? '#6b727c' : tone > 1 ? '#60676f' : '#565d66';
  const c2 = tone > 1.9 ? '#7a828c' : '#686f78';
  g.save();
  g.translate(x, y); g.rotate(rot);
  // ground shadow
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.beginPath(); g.ellipse(2, 4, w * 0.72, w * 0.3, 0, 0, Math.PI * 2); g.fill();
  // slab
  const hw = w / 2, h = w * 1.25;
  g.fillStyle = c1;
  g.beginPath();
  g.moveTo(-hw, hw * 0.5);
  g.lineTo(-hw, -h + hw * 0.5);
  g.arc(0, -h + hw * 0.5, hw, Math.PI, 0);
  g.lineTo(hw, hw * 0.5);
  g.closePath(); g.fill();
  // inset face (lighter, catches moonlight)
  g.fillStyle = c2;
  g.beginPath();
  g.moveTo(-hw + 3, hw * 0.3);
  g.lineTo(-hw + 3, -h + hw);
  g.arc(0, -h + hw, hw - 3, Math.PI, 0);
  g.lineTo(hw - 3, hw * 0.3);
  g.closePath(); g.fill();
  // crack
  g.strokeStyle = 'rgba(18,22,28,0.55)'; g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(-w * 0.12, -h * 0.5);
  g.lineTo(w * 0.02, -h * 0.28);
  g.lineTo(-w * 0.06, -h * 0.08);
  g.stroke();
  g.restore();
}

// weathered moss blob
function moss(g, x, y, r) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, 'rgba(70,92,66,0.35)');
  gr.addColorStop(1, 'rgba(70,92,66,0)');
  g.fillStyle = gr;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}

// small grave cross: base block + shaft + arms
function drawCross(g, x, y, s, rot, tone) {
  g.save();
  g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.beginPath(); g.ellipse(1.5, s * 0.32, s * 0.5, s * 0.2, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = tone > 1.5 ? '#5e656e' : '#535a63';
  g.fillRect(-s * 0.3, -s * 0.05, s * 0.6, s * 0.3);
  g.fillRect(-s * 0.11, -s * 0.9, s * 0.22, s * 0.85);
  g.fillRect(-s * 0.34, -s * 0.72, s * 0.68, s * 0.17);
  g.restore();
}
// tomb of the great warrior: broken plinth + tilted weathered stele + spectral sword
function drawTomb(g, x, y) {
  g.save();
  g.translate(x, y);
  // dark aura on the ground
  let gr = g.createRadialGradient(0, 8, 30, 0, 8, 130);
  gr.addColorStop(0, 'rgba(0,0,0,0.26)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 8, 130, 0, Math.PI * 2); g.fill();
  // long soft shadow
  g.fillStyle = 'rgba(0,0,0,0.42)';
  g.beginPath(); g.ellipse(10, 12, 92, 48, 0, 0, Math.PI * 2); g.fill();
  // rubble at the base
  g.fillStyle = '#4d545d';
  g.beginPath(); g.moveTo(-88, 36); g.lineTo(-70, 24); g.lineTo(-56, 36); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(60, 32); g.lineTo(80, 24); g.lineTo(92, 40); g.closePath(); g.fill();
  g.fillStyle = '#454b54';
  g.beginPath(); g.moveTo(-52, 42); g.lineTo(-38, 32); g.lineTo(-28, 44); g.closePath(); g.fill();
  // plinth, two tiers (weathered dark stone)
  g.fillStyle = '#4e555e'; slab(g, -78, -54, 156, 108, 9); g.fill();
  g.fillStyle = '#5a616b'; slab(g, -64, -44, 128, 88, 7); g.fill();
  // weathering: moss + cracks
  moss(g, -58, 22, 15); moss(g, 50, 32, 12); moss(g, -18, -44, 10);
  g.strokeStyle = 'rgba(16,20,26,0.6)'; g.lineWidth = 1.5; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-70, -20); g.lineTo(-52, -10); g.lineTo(-58, 4);
  g.stroke();
  g.beginPath();
  g.moveTo(42, -38); g.lineTo(58, -26); g.lineTo(50, -12);
  g.stroke();
  // stele shadow on the plinth
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath(); g.ellipse(7, 28, 36, 13, 0, 0, Math.PI * 2); g.fill();
  // stele + cap: tilted with age
  g.save();
  g.rotate(-0.05);
  g.fillStyle = '#6b737e'; slab(g, -28, -94, 56, 122, 11); g.fill();
  g.fillStyle = '#7a828d'; slab(g, -22, -88, 44, 110, 8); g.fill();
  // chipped edges
  g.fillStyle = '#565d66';
  g.beginPath(); g.moveTo(28, -42); g.lineTo(19, -32); g.lineTo(28, -20); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-28, -12); g.lineTo(-20, -4); g.lineTo(-28, 6); g.closePath(); g.fill();
  // cracks
  g.strokeStyle = 'rgba(16,20,26,0.55)'; g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(-17, -58); g.lineTo(-6, -42); g.lineTo(-12, -22);
  g.stroke();
  g.beginPath();
  g.moveTo(16, -6); g.lineTo(7, 6); g.lineTo(13, 22);
  g.stroke();
  // moss
  moss(g, -20, -80, 8); moss(g, 18, 18, 9);
  // cap
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.beginPath(); g.ellipse(0, -78, 36, 7, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#79818c'; slab(g, -33, -106, 66, 20, 9); g.fill();
  g.fillStyle = '#565d66';
  g.beginPath(); g.moveTo(-33, -106); g.lineTo(-21, -106); g.lineTo(-30, -95); g.closePath(); g.fill();
  // faint spectral glow behind the blade
  gr = g.createRadialGradient(0, -20, 2, 0, -20, 36);
  gr.addColorStop(0, 'rgba(140,190,160,0.20)'); gr.addColorStop(1, 'rgba(140,190,160,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, -20, 36, 0, Math.PI * 2); g.fill();
  // epitaph, chiselled above the blade
  g.font = '8px Georgia, serif';
  g.textAlign = 'center';
  g.fillStyle = 'rgba(150,160,172,0.22)';
  g.fillText('glory to', 0, -67.1);
  g.fillText('fallen', 0, -56.1);
  g.fillStyle = 'rgba(20,25,33,0.92)';
  g.fillText('glory to', 0, -68);
  g.fillText('fallen', 0, -57);
  // engraved sword, worn into the stone like a wound
  g.fillStyle = 'rgba(26,32,40,0.9)';
  g.beginPath();
  g.moveTo(-2.5, -46); g.lineTo(0, -56); g.lineTo(2.5, -46);
  g.closePath(); g.fill();
  g.fillRect(-2.5, -46, 5, 56);
  g.fillRect(-8, 10, 16, 4);
  g.fillRect(-1.8, 14, 3.6, 8);
  g.beginPath(); g.arc(0, 25, 2.2, 0, Math.PI * 2); g.fill();
  // ember glow at the pommel
  gr = g.createRadialGradient(0, 25, 0, 0, 25, 8);
  gr.addColorStop(0, 'rgba(160,210,170,0.30)'); gr.addColorStop(1, 'rgba(160,210,170,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 25, 8, 0, Math.PI * 2); g.fill();
  g.restore(); // tilt
  g.restore(); // tomb
}

(function paintGround() {
  const g = ground.getContext('2d');
  // base: cold moonlit earth
  g.fillStyle = '#232830'; g.fillRect(0, 0, W, H);
  // soft dark mottling
  for (let i = 0; i < 140; i++) {
    const x = rand(0, W), y = rand(0, H), r = rand(8, 54);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(0,0,0,' + rand(0.03, 0.11).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // moss patches
  for (let i = 0; i < 26; i++) {
    const x = rand(0, W), y = rand(0, H), r = rand(14, 40);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(64,84,60,' + rand(0.05, 0.12).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(64,84,60,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // grass tufts
  g.strokeStyle = 'rgba(96,124,84,0.35)'; g.lineWidth = 1; g.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const x = rand(0, W), y = rand(0, H);
    for (let b = -1; b <= 1; b++) {
      g.beginPath(); g.moveTo(x + b * 2, y);
      g.lineTo(x + b * 2 + b, y - rand(3, 7)); g.stroke();
    }
  }
  // pebbles
  g.fillStyle = 'rgba(120,128,140,0.18)';
  for (let i = 0; i < 60; i++) {
    g.beginPath(); g.arc(rand(0, W), rand(0, H), rand(1, 2.4), 0, Math.PI * 2); g.fill();
  }
  // scattered gravestones (keep the centre clear for the tomb)
  for (let i = 0; i < 14; i++) {
    let x, y, tries = 0;
    do {
      x = rand(44, W - 44); y = rand(44, H - 44); tries++;
    } while (Math.hypot(x - W / 2, y - H / 2) < 132 && tries < 30);
    drawGrave(g, x, y, rand(14, 22), rand(-0.18, 0.18), rand(0, 3));
  }
  // small crosses scattered among the stones
  for (let i = 0; i < 12; i++) {
    let x, y, tries = 0;
    do {
      x = rand(40, W - 40); y = rand(40, H - 40); tries++;
    } while (Math.hypot(x - W / 2, y - H / 2) < 140 && tries < 30);
    drawCross(g, x, y, rand(8, 13), rand(-0.2, 0.2), rand(0, 3));
  }
  // extra small gravestones
  for (let i = 0; i < 6; i++) {
    let x, y, tries = 0;
    do {
      x = rand(40, W - 40); y = rand(40, H - 40); tries++;
    } while (Math.hypot(x - W / 2, y - H / 2) < 140 && tries < 30);
    drawGrave(g, x, y, rand(10, 16), rand(-0.22, 0.22), rand(0, 3));
  }
  // offering stones flanking the tomb
  drawGrave(g, W / 2 - 104, H / 2 + 24, 12, -0.25, 1.2);
  drawGrave(g, W / 2 + 100, H / 2 - 18, 10, 0.2, 0.4);
  // the tomb, dead centre
  drawTomb(g, W / 2, H / 2);
  // vignette
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
})();
