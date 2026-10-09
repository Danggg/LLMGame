# LLMGame (Zombie Sword) — Agent Guide

Top-down zombie survival: swordsman in the middle of a horde. Swing, survive, score.

## What this is

Vanilla JS, **no build step, no modules, no dependencies**. `index.html` loads plain
scripts in order; **everything shares one global scope**. Load order in `index.html`
is significant — later files use globals declared earlier:

```
util → audio → state → ground → particles → zombies/zombie → zombies/runner → zombies/shambler → zombies/brute → zombies.js → player → render → input → main
```

- Canvas: `#c`, fixed logical size **960×540** (`W`, `H` in `state.js`), CSS-scaled to viewport. All game coordinates are canvas-space; mouse is mapped through `getBoundingClientRect() * (W / rect.width)`.
- `#overlay`: DOM menu / game-over screen, hidden (`.hidden`) during play.
- No test suite, no linter, no bundler. Verification is manual in a browser.

## File map

| File | Responsibility |
|---|---|
| `src/util.js` | `rand(a,b)`, `clamp(v,a,b)`, `angDiff(a,b)` (smallest angular distance) |
| `src/audio.js` | Lazy `AudioContext` (`ac()`); `sfx(kind)` — oscillator SFX, spec table `[type, f0, f1, dur, gain]` for `swing`/`hit`/`die`/`hurt` |
| `src/state.js` | Canvas/ctx/overlay refs + **all shared mutable state** |
| `src/ground.js` | One-time pre-rendered ground texture (offscreen canvas `ground`) |
| `src/particles.js` | `blood(x,y,n)`, `updateParticles(dt)` |
| `src/zombies.js` | spawn, swing hit detection (`swingHit()`), kill logic (`killZombie()`), pairwise separation |
| `src/zombies/zombie.js` | `Zombie` base class: chase/wobble physics, contact damage, shared drawing (shadow, hit flash, HP bar) |
| `src/zombies/runner.js` | `Runner` subclass — fast chaser |
| `src/zombies/shambler.js` | `Shambler` subclass — passive wanderer, drowsy tint |
| `src/zombies/brute.js` | `Brute` subclass — big brute with HP bar |
| `src/player.js` | `startSwing()`, `updatePlayer(dt)` — movement + i-frames + swing timing |
| `src/render.js` | all drawing: `drawPlayer`, `drawSword`, `drawHUD`, `draw()` (zombies self-draw via `z.draw()`) |
| `src/input.js` | Keyboard/mouse listeners only (no game logic) |
| `src/main.js` | `reset()`, `gameOver()`, `requestAnimationFrame` loop, `window.__g` debug hook |

## Shared state (all in `state.js`)

```js
state      // 'menu' | 'play' | 'over'  (let)
score, time, spawnTimer, lastT          // (let)
mouse = { x, y }                       // aim target
player   // mutated IN PLACE — never reassigned:
         //   x, y, r, speed, hp, maxHp, facing,
         //   swing, cool, coolLeft, invuln, swingId, moving, walk
zombies  // array; REASSIGNED via .filter() each frame after removals
particles// same pattern: mutated in place, array reassigned via .filter()
```

**Convention:** mutate `player`/zombie/particle objects in place; replace the
`zombies`/`particles` arrays with `arr = arr.filter(…)` when removing. Do not
introduce a second copy of shared state.

## Game flow

```
menu --mousedown on overlay--> play --hp<=0--> over --click overlay / R--> play
```

- `main.js` runs `requestAnimationFrame(frame)` from load; `dt` clamped to 0.05 s.
- Update order per frame: `updatePlayer` → `updateZombies` → `updateParticles` (only in `play`).
- `reset()` in `main.js` re-centers player, zeroes score/time, clears arrays, sets `state='play'`.
- Spawn cadence: `spawnTimer` (starts 0.8 s), interval `max(0.4, 1.3 - time*0.015) * rand(0.7,1.3)`; cap **60 zombies**.
- Wave is display-only: `1 + floor(time / 25)` (HUD only; nothing keys off wave number yet).

## Combat invariants

- Swing: `player.swing = 0.25` (animation window), `player.cool = 0.4` (cooldown), one
  swing per cooldown (`startSwing` guards on `coolLeft > 0`).
- `player.swingId` increments per swing. `swingHit()` (called every frame while
  `swing > 0`) hits each zombie **at most once per swing** via `z.lastHit === player.swingId`.
  Do not break this dedup — it is what makes one swing = one hit per zombie.
- Swing hitbox: distance `≤ 58 + z.r` AND `angDiff(zombie angle, player.facing) ≤ 1.4` rad.
- Hit effect: `-1 hp`, `z.flash = 1`, `z.stun = 0.4` (zombie stops moving), 16 px knockback.
- Contact damage: only when `player.invuln <= 0`; sets `invuln = 0.8` (i-frames). Player flash in render keys off `invuln`.
- Zombies: runner `r12 hp1 dmg12 speed 130–185, score 10` (always chases); shambler (50% of small) `r12 hp1 dmg12 speed 28–45, score 10` (passive wanderer — starts chasing when the player comes within 110 px); big (18% chance) `r18 hp3 dmg25 speed 38–55, score 25` with HP bar when `hp < 3`.
- Zombie motion: chase (hunt) or wander (passive shamblers) + perpendicular sine wobble (`z.wob` phase), then O(n²) pairwise separation push; dead removed by filter at end of `updateZombies`.

## Rendering

- Ground is pre-rendered once (don't repaint per frame).
- `draw()` order: ground → particles (alpha = life/max) → **y-sorted entities** (player + zombies, painter's algorithm) → HUD (HP bar left, score/wave/time right).
- Player faces `player.facing` (local +x = facing); sword arm/sword drawn relative to that.
- Colors are inline hex/rgba literals; no palette module.

## Input (current controls)

- **WASD** only for movement — tracked in a lowercase `Set` (`keys`); cleared on blur.
- **Mouse move** sets `mouse`; **mouse click** swings (only in `play`); overlay mousedown starts/restarts.
- **R** restarts (any state except `menu`).
- Arrows / J / Space were deliberately removed — do not reintroduce.

## Audio

- `AudioContext` is created lazily on first `ac()` call (user gesture); all SFX call sites assume `sfx()` is safe to call before context exists (it no-ops).
- Wrap new `AudioContext` usage in try/catch like existing code.

## Debug / verification

- `window.__g` (set in `main.js`) is the smoke-test hook:
  `__g.state`, `__g.score`, `__g.zombies`, `__g.player`, `__g.mouse`, `__g.reset()`.
- Smoke-test recipe:
  ```bash
  python3 -m http.server 8000   # from repo root, then open http://localhost:8000
  ```
  In-browser: start via `document.getElementById('overlay').dispatchEvent(new MouseEvent('mousedown', {bubbles:true}))`, then assert on `__g.*`.
- Note for browser automation: evaluate page code in the **main world** (`tab.evaluate` / CDP `Runtime.evaluate` in main context); `page.evaluate` from an isolated-world wrapper returns a different scope where game globals are invisible.

## Coding conventions

- Every file: comment header, `'use strict';`, 2-space indent, semicolons, `const`/`let` for globals, plain function declarations (hoisted across files — rely on this).
- No imports/exports anywhere. The only classes in the codebase are the zombie types in `src/zombies/` (base `Zombie` + `Runner`/`Shambler`/`Brute`, instantiated in `spawnZombie()`); everything else is plain functions + globals. Adding a module system is out of scope unless asked.
- New globals go in `state.js`; new listeners go in `input.js`; new drawing goes in `render.js`; keep the file-responsibility split.
- Keep `README.md`'s Controls table and the hint strings in `index.html` + `main.js` in sync when input changes (three places, easy to miss).
