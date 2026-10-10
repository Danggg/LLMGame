#!/usr/bin/env node
// test/zombies-screenshot.test.js
//
// Screenshot test: for each N in COUNTS the game is reset, frozen in state
// 'over' (no updates run, but draw() still renders every frame), and exactly
// N Runner zombies are placed on a deterministic, well-separated grid. A PNG
// of the canvas element is captured and the zombie bodies actually drawn in
// that frame are counted with a green-body pixel detector + connected-
// component analysis. The drawn count is asserted to equal N.
//
// Detector: zombie torso #5d7a46 / head #6f8f52 are the only green pixels
// below the y=40 HUD strip (the green HP bar sits at y 18-32 and is masked;
// ground moss/grass is too dark; fog is blue-grey; the player is blue/red;
// gems and shards are cyan and fail g > b+30).
//
// Zero dependencies: Node builtins + the system Chromium over CDP.
//   node test/zombies-screenshot.test.js
//   CHROME_BIN=/path/to/chrome node test/zombies-screenshot.test.js
// Screenshots are saved to test/screenshots/zombies-<N>.png

import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_BIN || '/usr/bin/chromium';
const OUT = path.join(__dirname, 'screenshots');
const COUNTS = [0, 3, 7, 12, 25];
const W = 960, H = 540;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
    s.on('error', rej);
  });
}
function serve(root) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  const srv = http.createServer((req, res) => {
    const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    try { const b = fs.readFileSync(path.join(root, p)); res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
    catch { res.writeHead(404); res.end('nf'); }
  });
  return new Promise((res) => srv.listen(0, '127.0.0.1', () => res({ srv, port: srv.address().port })));
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = {}; }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { (this.handlers[method] ||= []).push(fn); }
  start() { this.ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
    if (m.id && this.pending.has(m.id)) { const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else if (m.method && this.handlers[m.method]) for (const fn of this.handlers[m.method]) fn(m.params); }); }
}
async function launchChrome(cdpPort) {
  const userDir = fs.mkdtempSync('/tmp/zs-test-');
  return spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=960,620',
    `--remote-debugging-port=${cdpPort}`, '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${userDir}`, 'about:blank',
  ], { stdio: 'ignore' });
}
async function connectPage(cdpPort) {
  for (let i = 0; i < 50; i++) {
    try {
      const targets = JSON.parse(await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).text());
      const page = targets.find((t) => t.type === 'page');
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws error')); });
        const cdp = new CDP(ws); cdp.start();
        await cdp.send('Runtime.enable'); await cdp.send('Page.enable');
        return cdp;
      }
    } catch {}
    await sleep(200);
  }
  throw new Error('CDP never came up');
}
function evaluate(cdp, expression) {
  return cdp.send('Runtime.evaluate', { expression, returnByValue: true }).then((ev) => {
    if (ev.exceptionDetails) throw new Error('page eval failed: ' + (ev.exceptionDetails.text || JSON.stringify(ev.exceptionDetails)));
    return ev.result.value;
  });
}

// Freeze the game and place exactly n zombies on a deterministic grid
// (8x5, skipping slots near the player). Scene globals are `let`/`class`
// top-levels — bare identifiers in the main-world eval, not window.*.
function setupExpr(n) {
  return `(function(){
    reset();
    state = 'over';
    zombies = [];
    const cols = 8, rows = 5, x0 = 120, y0 = 170, dx = 100, dy = 76;
    const px = player.x, py = player.y;
    const chosen = [];
    for (let ry = 0; ry < rows && chosen.length < ${n}; ry++)
      for (let cx = 0; cx < cols && chosen.length < ${n}; cx++) {
        const x = x0 + cx * dx, y = y0 + ry * dy;
        if (Math.hypot(x - px, y - py) < 70) continue;
        if (chosen.some((c) => Math.hypot(c.x - x, c.y - y) < 45)) continue;
        chosen.push({ x, y });
      }
    for (const c of chosen) zombies.push(new Runner(c.x, c.y, 100));
    return { placed: chosen.length, zombiesLen: zombies.length };
  })()`;
}

// Count zombie bodies in the current frame: green mask (y >= 40 skips the
// HP bar strip) + 4-connected components (min 40 px), plus a per-zombie
// center-pixel hit check. Also returns the canvas rect for the screenshot
// clip (1:1 with canvas pixels at device scale 1).
const ANALYZE_EXPR = `(function(){
  const c = document.getElementById('c');
  const d = c.getContext('2d').getImageData(0, 0, ${W}, ${H}).data;
  const n = ${W} * ${H};
  const mask = new Uint8Array(n);
  for (let y = 40; y < ${H}; y++)
    for (let x = 0; x < ${W}; x++) {
      const o = (y * ${W} + x) * 4;
      const r = d[o], gg = d[o + 1], b = d[o + 2];
      if (gg >= 90 && gg > r + 20 && gg > b + 30) mask[y * ${W} + x] = 1;
    }
  const seen = new Uint8Array(n);
  const blobs = [];
  for (let y = 0; y < ${H}; y++)
    for (let x = 0; x < ${W}; x++) {
      const i = y * ${W} + x;
      if (!mask[i] || seen[i]) continue;
      let size = 0, sx = 0, sy = 0;
      const stack = [i];
      seen[i] = 1;
      while (stack.length) {
        const p = stack.pop();
        const py = (p / ${W}) | 0, px = p % ${W};
        size++; sx += px; sy += py;
        if (px > 0 && !seen[p - 1] && mask[p - 1]) { seen[p - 1] = 1; stack.push(p - 1); }
        if (px < ${W} - 1 && !seen[p + 1] && mask[p + 1]) { seen[p + 1] = 1; stack.push(p + 1); }
        if (py > 0 && !seen[p - ${W}] && mask[p - ${W}]) { seen[p - ${W}] = 1; stack.push(p - ${W}); }
        if (py < ${H} - 1 && !seen[p + ${W}] && mask[p + ${W}]) { seen[p + ${W}] = 1; stack.push(p + ${W}); }
      }
      if (size >= 40) blobs.push({ x: (sx / size) | 0, y: (sy / size) | 0, size });
    }
  let hits = 0;
  for (const z of zombies) {
    const o = (((z.y | 0) * ${W} + (z.x | 0)) * 4);
    const r = d[o], gg = d[o + 1], b = d[o + 2];
    if (gg >= 90 && gg > r + 20 && gg > b + 30) hits++;
  }
  const rect = c.getBoundingClientRect();
  return {
    zombieCount: zombies.length,
    blobCount: blobs.length,
    blobs,
    hits,
    rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
  };
})()`;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const { srv, port } = await serve(ROOT);
  const cdpPort = await freePort();
  const chrome = await launchChrome(cdpPort);
  let failures = 0;
  try {
    const cdp = await connectPage(cdpPort);
    const loaded = new Promise((res) => cdp.on('Page.loadEventFired', res));
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
    await loaded;
    await sleep(600); // scripts load, first frames render

    for (const n of COUNTS) {
      const setup = await evaluate(cdp, setupExpr(n));
      if (setup.placed !== n) throw new Error(`n=${n}: only placed ${setup.placed} zombies (grid too small)`);
      await sleep(150); // let rAF draw the frozen scene
      const res = await evaluate(cdp, ANALYZE_EXPR);
      const clip = { x: res.rect.left, y: res.rect.top, width: res.rect.width, height: res.rect.height, scale: 1 };
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png', clip });
      fs.writeFileSync(path.join(OUT, `zombies-${n}.png`), Buffer.from(shot.data, 'base64'));
      const pass = res.zombieCount === n && res.blobCount === n && res.hits === n;
      if (!pass) failures++;
      console.log(`n=${String(n).padStart(2)}  expected=${n}  drawn-blobs=${res.blobCount}  position-hits=${res.hits}/${res.zombieCount}  ${pass ? 'PASS' : 'FAIL'}`);
    }
  } finally {
    chrome.kill();
    srv.close();
  }
  console.log(failures ? `\n${failures} FAILING case(s)` : '\nAll cases passed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error('ERR', e); process.exit(1); });
