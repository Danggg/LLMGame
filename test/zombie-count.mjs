// Screenshot test: spawn N zombies, screenshot the game canvas, count the
// zombies by pixel (zombie heads are solid #6f8f52) and compare against the
// expected number (N == __g.zombies.length).
//
// Zero dependencies: drives the system Chromium over raw CDP (Node WebSocket).
// Run: node test/zombie-count.mjs
import { spawn } from 'node:child_process';
import http from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createServer as netServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 960, H = 540;
const N_ZOMBIES = 9;
const TOL = 15;                       // head color tolerance (rgb)
const HEAD = [111, 143, 82];          // #6f8f52 — zombie head fill
const MIN_BLOB = 4;                   // min component size in px
const NEAR = 25;                      // max centroid distance to expected pos

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- static file server -----------------------------------------------------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer(async (req, res) => {
      try {
        const u = req.url.split('?')[0];
        const rel = u === '/' || u === '' ? 'index.html' : u.replace(/^\/+/, '');
        const p = path.join(ROOT, path.normalize(rel));
        if (!p.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
        const buf = await readFile(p);
        res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
        res.end(buf);
      } catch { res.writeHead(404); res.end(); }
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

// --- raw CDP client ----------------------------------------------------------
class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id != null && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(m.error.message)) : resolve(m.result);
      } else if (m.method) {
        const key = m.sessionId ? `${m.sessionId}::${m.method}` : m.method;
        for (const fn of this.listeners.get(key) || []) fn(m.params);
      }
    };
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const msg = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    this.ws.send(JSON.stringify(msg));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`CDP timeout: ${method}`));
      }, 15000);
    });
  }
  once(method, sessionId, timeout = 15000) {
    const key = sessionId ? `${sessionId}::${method}` : method;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        const l = this.listeners.get(key);
        if (l) l.splice(l.indexOf(fn), 1);
        reject(new Error(`event timeout: ${method}`));
      }, timeout);
      const fn = (params) => { clearTimeout(t); resolve(params); };
      if (!this.listeners.has(key)) this.listeners.set(key, []);
      this.listeners.get(key).push(fn);
    });
  }
}

async function launchChromium(url) {
  const proc = spawn('/usr/bin/chromium', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    `--remote-debugging-port=0`, '--user-data-dir=/tmp/zombie-count-profile',
    '--window-size=1024,640', 'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const wsUrl = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('chromium did not report CDP url')), 15000);
    proc.stderr.on('data', (d) => {
      const m = String(d).match(/ws:\/\/[^\s]+\/devtools\/browser\/[a-f0-9-]+/);
      if (m) { clearTimeout(t); resolve(m[0]); }
    });
    proc.on('exit', (code) => { clearTimeout(t); reject(new Error(`chromium exited: ${code}`)); });
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('ws error'));
  });
  const cdp = new CDP(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Page.enable', {}, sessionId);
  return { proc, ws, cdp, targetId, sessionId };
}

// Runs code in the page's MAIN world and returns the value.
function evaluate(cdp, sessionId, expression) {
  return cdp.send('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true,
  }, sessionId).then((r) => {
    if (r.exceptionDetails) throw new Error('page error: ' + JSON.stringify(r.exceptionDetails));
    return r.result.value;
  });
}

// --- pixel counting ----------------------------------------------------------
function countHeadBlobs(pixels) {
  const mask = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    if (Math.abs(pixels[i] - HEAD[0]) <= TOL &&
        Math.abs(pixels[i + 1] - HEAD[1]) <= TOL &&
        Math.abs(pixels[i + 2] - HEAD[2]) <= TOL) mask[p] = 1;
  }
  const blobs = [];
  const stack = [];
  for (let p = 0; p < mask.length; p++) {
    if (!mask[p]) continue;
    mask[p] = 0;
    let size = 0, sx = 0, sy = 0;
    stack.push(p);
    while (stack.length) {
      const q = stack.pop();
      size++; sx += q % W; sy += Math.floor(q / W);
      const x = q % W, y = Math.floor(q / W);
      if (x > 0 && mask[q - 1]) { mask[q - 1] = 0; stack.push(q - 1); }
      if (x < W - 1 && mask[q + 1]) { mask[q + 1] = 0; stack.push(q + 1); }
      if (y > 0 && mask[q - W]) { mask[q - W] = 0; stack.push(q - W); }
      if (y < H - 1 && mask[q + W]) { mask[q + W] = 0; stack.push(q + W); }
    }
    if (size >= MIN_BLOB) blobs.push({ x: sx / size, y: sy / size, size });
  }
  return blobs;
}

// --- test ---------------------------------------------------------------------
const failures = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failures.push(msg); };

const { srv, port } = await serve();
const url = `http://127.0.0.1:${port}/`;
const { proc, ws, cdp, targetId, sessionId } = await launchChromium(url);

try {
  await cdp.once('Page.loadEventFired', sessionId);
  // wait for the game's debug hook
  for (let i = 0; i < 100 && !(await evaluate(cdp, sessionId, 'typeof window.__g === "object"')); i++) await sleep(50);
  check(await evaluate(cdp, sessionId, 'typeof window.__g === "object"'), 'game loaded (window.__g present)');

  // Start the game, then build a deterministic scene: N stationary zombies on a
  // grid, spawning frozen, no particles/pickups/stones/boss.
  const scene = await evaluate(cdp, sessionId, `(() => {
    document.getElementById('overlay').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    if (state !== 'play') throw new Error('game did not start');
    zombies = []; particles = []; pickups = []; stones = []; boss = null;
    spawnTimer = 1e9;
    player.hp = player.maxHp;
    const pos = [];
    for (let i = 0; i < ${N_ZOMBIES}; i++) {
      const x = 560 + (i % 3) * 110, y = 90 + Math.floor(i / 3) * 110;
      zombies.push(new Zombie(x, y, 12, 3, 0, 12, 10)); // speed 0: stands still
      pos.push([x, y]);
    }
    return { n: ${N_ZOMBIES}, pos, stateLen: zombies.length };
  })()`);
  check(scene.n === scene.stateLen && scene.stateLen === N_ZOMBIES,
        `game state has ${scene.stateLen} zombies (expected ${N_ZOMBIES})`);

  await sleep(400); // let a few frames render

  // Screenshot: exact logical pixels of the game canvas.
  const shot = await evaluate(cdp, sessionId, `(() => {
    const cv = document.getElementById('c');
    const d = cv.getContext('2d').getImageData(0, 0, ${W}, ${H});
    const u = new Uint8Array(d.data);
    let s = '';
    for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
    return { png: cv.toDataURL('image/png'), pixels: btoa(s) };
  })()`);
  await writeFile('/tmp/zombie-count.png', Buffer.from(shot.png.split(',')[1], 'base64'));
  console.log(`  screenshot: /tmp/zombie-count.png (${W}x${H})`);

  const pixels = new Uint8Array(Buffer.from(shot.pixels, 'base64'));
  if (pixels.length !== W * H * 4) throw new Error(`bad pixel size ${pixels.length}`);

  const blobs = countHeadBlobs(pixels);
  check(blobs.length === N_ZOMBIES, `pixel count: ${blobs.length} zombies (expected ${N_ZOMBIES})`);

  // every expected zombie position must be covered by a detected blob
  const uncovered = [];
  for (const [ex, ey] of scene.pos) {
    if (!blobs.some((b) => Math.hypot(b.x - ex, b.y - ey) < NEAR)) uncovered.push(`(${ex},${ey})`);
  }
  check(uncovered.length === 0, uncovered.length
        ? `positions without a detected head: ${uncovered.join(', ')}`
        : 'every expected position has a detected zombie head');

  // no stray detections
  const stray = blobs.filter((b) => !scene.pos.some(([ex, ey]) => Math.hypot(b.x - ex, b.y - ey) < NEAR));
  check(stray.length === 0, stray.length
        ? `unexpected blobs at ${stray.map((b) => `(${b.x | 0},${b.y | 0})`).join(', ')}`
        : 'no unexpected zombie-shaped blobs');

  const stateCount = await evaluate(cdp, sessionId, '__g.zombies.length');
  check(stateCount === blobs.length, `pixel count ${blobs.length} == game state count ${stateCount}`);
} catch (err) {
  failures.push(String(err.message || err));
  console.error('  FAIL ' + err.stack);
} finally {
  try { await cdp.send('Target.closeTarget', { targetId }); } catch {}
  ws.close();
  proc.kill('SIGKILL');
  srv.close();
}

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
process.exit(0);
