# LLMGame (Zombie Sword) — Agent Guide

Top-down zombie survival: swordsman in the middle of a horde. Swing, survive, score.

## What this is

Vanilla JS, **no build step, no modules, no dependencies, no test suite, no linter**. `index.html` loads plain
scripts in order; **everything shares one global scope**. Load order in `index.html`
is significant — later files use globals declared earlier:

```
util → audio → state → ground → particles → pickups → stones → zombies/zombie → zombies/runner → zombies/shambler → zombies/brute → zombies/thrower → zombies/boss → zombies.js → player → render → input → main
```

- Canvas: `#c`, fixed logical size **960×540** (`W`, `H` in `state.js`), CSS-scaled to viewport. All game coordinates are canvas-space; mouse is mapped through `getBoundingClientRect() * (W / rect.width)`.
- `#overlay`: DOM menu / game-over screen, hidden (`.hidden`) during play. The menu shows a `.changelog` block (last 3 milestones); `gameOver()` hides it so the death screen stays clean.

## File map

| File | Responsibility |
|---|---|
| `src/util.js` | `rand(a,b)`, `clamp(v,a,b)`, `angDiff(a,b)` (smallest angular distance) |
| `src/audio.js` | Lazy `AudioContext` (`ac()`); `sfx(kind)` — oscillator SFX, spec table `[type, f0, f1, dur, gain]` for `swing`/`hit`/`die`/`hurt`/`pickup`/`gem`/`boss`/`throw`/`thud` |
| `src/state.js` | Canvas/ctx/overlay refs + **all shared mutable state** |
| `src/ground.js` | One-time pre-rendered ground texture (offscreen canvas `ground`) |
| `src/particles.js` | `blood(x,y,n)`, `dust(x,y,n)` (grey; per-particle color via `p.c`), `updateParticles(dt)` |
| `src/pickups.js` | `spawnPickup(x,y,kind)`, `maybeDrop(z)`, `updatePickups(dt)` — hearts (heal) / gems (score) dropped by dead zombies |
| `src/stones.js` | `throwStone(x,y,tx,ty,dmg)`, `updateStones(dt)` — stone projectiles: fly to a fixed spot, splash damage if the player is on it when they land |
| `src/zombies.js` | spawn, swing hit detection (`swingHit()`), kill logic (`killZombie()` → `maybeDrop(z)`), pairwise separation |
| `src/zombies/zombie.js` | `Zombie` base class: chase/wobble physics, contact damage, shared drawing (shadow, hit flash, HP bar) |
| `src/zombies/runner.js` | `Runner` subclass — fast chaser |
| `src/zombies/shambler.js` | `Shambler` subclass — passive wanderer, drowsy tint |
| `src/zombies/brute.js` | `Brute` subclass — big brute with HP bar |
| `src/zombies/thrower.js` | `Thrower` subclass — stone-thrower: keeps ~170 px, stops, 1.2 s arm-spin windup, hurls a stone at the player's spot |
| `src/zombies/boss.js` | `Boss` subclass — giant boss (wave 2), wave-scaled HP (min 20), always hunts, HP bar |
| `src/player.js` | `startSwing()`, `updatePlayer(dt)` — movement + i-frames + swing timing |
| `src/render.js` | all drawing: `drawPlayer`, `drawSword`, `drawHUD`, `draw()` (zombies self-draw via `z.draw()`) |
| `src/input.js` | Keyboard/mouse listeners only (no game logic) |
| `src/main.js` | `reset()`, `gameOver()` (saves best score to `localStorage`), `requestAnimationFrame` loop, `window.__g` debug hook |

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
pickups  // same pattern: `{ x, y, kind: 'heart'|'gem', life, max, phase, taken }`
stones   // same pattern: `{ sx, sy, x, y, tx, ty, life, maxLife, dmg, dead }` — fixed-target projectile
wave     // (let) — `1 + floor(time/25)`, read by HUD and spawn mix
boss     // (let) — reference to the live `Boss`, or `null`
best     // (let) — best score, read from `localStorage['zs-best']` at load
```

**Convention:** mutate `player`/zombie/particle objects in place; replace the
`zombies`/`particles`/`pickups` arrays with `arr = arr.filter(…)` when removing. Do not
introduce a second copy of shared state.

## Game flow

```
menu --mousedown on overlay--> play --hp<=0--> over --click overlay / R--> play
```

- `main.js` runs `requestAnimationFrame(frame)` from load; `dt` clamped to 0.05 s.
- Update order per frame: `updatePlayer` → `updateZombies` → `updateStones` → `updatePickups` → `updateParticles` (only in `play`).
- `reset()` in `main.js` re-centers player, zeroes score/time, clears arrays and `boss`, sets `state='play'`.
- Spawn cadence: `spawnTimer` (starts 0.8 s), interval `max(0.4, 1.3 - time*0.015) * rand(0.7,1.3)`; cap **60 zombies**.
- Wave: `1 + floor(time / 25)`, hoisted into shared state — HUD reads it, `spawnZombie()` keys its mix off it, and every 5th wave (5, 10, …) fires a 6-runner surge; the Boss spawns on the wave-2 push (skipped if the 60-cap is full); Throwers join from wave 3 (cap 3 alive).
- Best score: `best` starts from `localStorage['zs-best']` (try/catch); `gameOver()` raises it and saves it only when `score > best`; the overlay shows `NEW BEST!` on a record, otherwise `Best <n>`; the HUD shows `BEST <n>`.

## Combat invariants

- Swing: `player.swing = 0.25` (animation window), `player.cool = 0.4` (cooldown), one
  swing per cooldown (`startSwing` guards on `coolLeft > 0`).
- `player.swingId` increments per swing. `swingHit()` (called every frame while
  `swing > 0`) hits each zombie **at most once per swing** via `z.lastHit === player.swingId`.
  Do not break this dedup — it is what makes one swing = one hit per zombie.
- Swing hitbox: distance `≤ 58 + z.r` AND `angDiff(zombie angle, player.facing) ≤ 1.4` rad.
- Hit effect: `-1 hp`, `z.flash = 1`, `z.stun = 0.4` (zombie stops moving), 16 px knockback.
- Contact: overlap `z.r + player.r + 2` always pushes the zombie 10 px away; damage only when `player.invuln <= 0` (then `−z.dmg`, `invuln = 0.8` i-frames). Player flash in render keys off `invuln`.
- Zombies: runner `r12 hp1 dmg12, score 10` (always chases; speed wave-scaled); shambler `r12 hp1 dmg12 speed 28–45, score 10` (passive wanderer — starts chasing when the player comes within 110 px; aggro is one-way, and offscreen wanderers steer back toward center); Brute (chance grows with wave) `r18 hp3 dmg25 speed 38–55, score 25` with HP bar when `hp < 3`; thrower (wave 3+, cap 3) `r13 hp2 speed 45–60, score 20`, HP bar when `hp < 2` — keeps ~170 px: approaches, stops, spins its arm (1.2 s windup), then throws a stone at the player's current spot (windup cancels if the player breaks < 100 or > 230 px); boss (wave 2) `r30 hp(20 + 10·(wave−4), min 20) dmg30 speed 26–38, score 150` — always-hunting, HP bar always shown, plus a top-center boss bar in the HUD while alive; boss death drops a guaranteed heart + 3 gems.
- Stones: `throwStone()` aims at the spot the player occupies at release; the stone flies at 300 px/s (flight time = dist/300) to that fixed spot and splashes for the thrower's `15` damage within `player.r + 14` px of it (i-frame gated like contact). No homing — a moving swordsman evades it.
- Spawn mix (w = wave): thrower first — w≥3, at most 3 alive, 15% chance; then shambler share of small `max(0.50 - (w-1)*0.05, 0.10)`; brute chance `min(0.10 + (w-1)*0.05, 0.60)`; runner speed `rand(130 + 6*(w-1), 185 + 6*(w-1))` capped at 260. Wave 1 ≈ current game (10% brute, 50/50 small, 130–185).
- Zombie motion: chase (hunt) or wander (passive shamblers) + perpendicular sine wobble (`z.wob` phase), then O(n²) pairwise separation push; dead removed by filter at end of `updateZombies`.

## Rendering

- Ground is pre-rendered once (don't repaint per frame).
- `draw()` order: ground → particles (alpha = life/max) → pickups → **y-sorted entities** (player + zombies, painter's algorithm) → stones (in flight, over entities, with ground shadow + parabolic arc) → HUD (HP bar left, score/wave/time/best right, top-center boss bar while alive).
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
  `__g.state`, `__g.score`, `__g.zombies`, `__g.player`, `__g.stones`, `__g.mouse`, `__g.pickups`, `__g.wave`, `__g.boss`, `__g.best`, `__g.reset()`.
- Smoke-test recipe: serve the repo root (see README → Run), then open `http://localhost:8000`.
  In-browser: start via `document.getElementById('overlay').dispatchEvent(new MouseEvent('mousedown', {bubbles:true}))`, then assert on `__g.*`.
- Note for browser automation: evaluate page code in the **main world** (`tab.evaluate` / CDP `Runtime.evaluate` in main context); `page.evaluate` from an isolated-world wrapper returns a different scope where game globals are invisible.

## Coding conventions

- Every file: comment header, `'use strict';`, 2-space indent, semicolons, `const`/`let` for globals, plain function declarations (hoisted across files — rely on this).
- No imports/exports. The only classes in the codebase are the zombie types in `src/zombies/` (see file map), instantiated in `spawnZombie()`; everything else is plain functions + globals. Adding a module system is out of scope unless asked.
- New globals go in `state.js`; new listeners go in `input.js`; new drawing goes in `render.js`; keep the file-responsibility split.
- Keep `README.md`'s Controls table and the hint strings in `index.html` + `main.js` in sync when input changes (three places, easy to miss).

## Publishing

- Workflow: `.omp/skills/publish-release/SKILL.md` — commit → tag → `gh release create` → Pages check. **Only run when asked.**
- Pages serves `main` at `/` (https://danggg.github.io/LLMGame/); the repo must stay public (Free plan). Tag the commit currently on `main`.
- Releases: https://github.com/Danggg/LLMGame/releases
