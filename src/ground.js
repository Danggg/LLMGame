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

// tomb of the great warrior: plinth + tall engraved stele + cap
function drawTomb(g, x, y) {
  g.save();
  g.translate(x, y);
  // long soft shadow
  g.fillStyle = 'rgba(0,0,0,0.32)';
  g.beginPath(); g.ellipse(8, 12, 88, 48, 0, 0, Math.PI * 2); g.fill();
  // plinth, two tiers
  g.fillStyle = '#616871'; slab(g, -78, -54, 156, 108, 9); g.fill();
  g.fillStyle = '#757d88'; slab(g, -64, -44, 128, 88, 7); g.fill();
  // stele shadow on the plinth
  g.fillStyle = 'rgba(0,0,0,0.30)';
  g.beginPath(); g.ellipse(5, 28, 36, 13, 0, 0, Math.PI * 2); g.fill();
  // stele (tall slab, faked height)
  g.fillStyle = '#868e9a'; slab(g, -28, -94, 56, 122, 11); g.fill();
  // lit face
  g.fillStyle = '#99a2ae'; slab(g, -22, -88, 44, 110, 8); g.fill();
  // cap
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.beginPath(); g.ellipse(0, -78, 36, 7, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#a8b0bb'; slab(g, -33, -106, 66, 20, 9); g.fill();
  // engraved sword of the warrior
  g.fillStyle = 'rgba(34,40,50,0.85)';
  g.fillRect(-2.5, -72, 5, 84);
  g.beginPath();
  g.moveTo(-2.5, -72); g.lineTo(0, -84); g.lineTo(2.5, -72);
  g.closePath(); g.fill();
  g.fillRect(-9, 14, 18, 4);
  g.fillRect(-2, 18, 4, 16);
  g.beginPath(); g.arc(0, 37, 3, 0, Math.PI * 2); g.fill();
  g.restore();
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
