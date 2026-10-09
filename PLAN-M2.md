# Milestone 2 — Pickups + Wave Composition

Two features, both small, both reusing existing patterns:

1. **Pickups** — hearts (heal) and gems (score), dropped by dead zombies.
2. **Varied wave composition** — the wave number (already shown in the HUD,
   `1 + floor(time / 25)`) starts actually controlling spawn mix, and every
   5th wave fires a runner surge.

## Non-goals

- No pickup magnetism, stacking limits, or pickup-vs-zombie collision (pickups
  are static; zombies walk over them).
- No boss (M3), no `localStorage` best score (M3), no touch/gamepad (M4),
  no module system, no new input listeners (collection is proximity-based,
  needs no keyboard/mouse).

## Design

### Pickups

New shared state in `state.js`: `let pickups = [];` — same in-place-mutate +
`pickups = pickups.filter(…)` removal convention as `zombies`/`particles`.

Pickup object shape (all plain objects, no class — consistent with
particles):

```
{ x, y, kind: 'heart' | 'gem', life: 20, max: 20, phase: rand(0, 2π), taken: false }
```

**Drops** — `maybeDrop(z)` in new file `src/pickups.js`, called from
`killZombie()` (one line in `zombies.js`):

| killer      | drop                              |
|---|---|
| runner / shambler | 15% gem, 8% heart (else nothing) |
| brute       | guaranteed gem (+ same 8% heart roll) |

Spawn at the zombie's death position, clamped to `[12, W-12] × [12, H-12]` so
edge kills still leave collectible pickups.

**Collection** — in `updatePickups(dt)` (called in `main.js` frame after
`updateZombies`, before `updateParticles`): if `dist(player, pickup) <
player.r + 10`, apply effect and mark `taken`:

- `heart`: `player.hp = Math.min(player.maxHp, player.hp + 25)`, `sfx('pickup')`,
  8 red-ish `blood()`-style particles (reuse `blood()`).
- `gem`: `score += 50`, `sfx('gem')`, same particle burst.

**Lifetime** — `life -= dt`; pickup fades (alpha ramps down over the final
3 s); expired → removed by the filter.

**SFX** — two new rows in the `sfx()` spec table in `audio.js`:

```
pickup: ['sine', 520, 880, 0.18, 0.07]   // rising blip (heart)
gem:    ['triangle', 700, 1400, 0.15, 0.07]
```

**Drawing** — per convention, drawing lives in `render.js`, not `pickups.js`:
`drawPickups(e)` called in `draw()` between the particle loop and the
y-sorted entities (pickups are ground objects, entities can overlap them).

- `heart`: two overlapping circles + a point below, `#e0455a`, r ≈ 7.
- `gem`: rotated square (diamond) `#7fd4e0`, r ≈ 6, with a lighter facet line.
- Both: vertical bob `y + sin(time * 2 + p.phase) * 3`, alpha =
  `p.life <= 3 ? p.life / 3 : 1`.

### Wave composition

Hoist the wave number into shared state so one place computes it:

- `state.js`: `let wave = 1;`
- `main.js` frame loop: `wave = 1 + Math.floor(time / 25);` each frame (cheap).
- `render.js` HUD: read `wave` instead of recomputing.
- `spawnZombie()` in `zombies.js` uses `wave` for the mix:

| component | formula (w = wave) |
|---|---|
| shambler share of small | `max(0.50 - (w-1) * 0.05, 0.10)` |
| brute chance | `min(0.10 + (w-1) * 0.05, 0.60)` |
| runner speed | `rand(130 + 6*(w-1), 185 + 6*(w-1))`, capped at 260 |

Wave 1 ≈ current game (10% brute, 50/50 small mix, speed 130–185); by wave 9+
the field is mostly fast runners with frequent brutes.

**Surge** — on a wave transition to a multiple of 5 (track previous `wave`
locally in `frame`), spawn 6 runners immediately at random edges (reuse
`spawnZombie()`'s edge logic; respect the 60-zombie cap). Implementation:
factor edge-position picking out of `spawnZombie()` into `edgePos()` so the
surge can call `new Runner(edgePos())` in a loop without duplicating the
edge math.

## File changes (load order)

1. `src/state.js` — add `let pickups = [];` and `let wave = 1;`.
2. `src/audio.js` — add `pickup` and `gem` spec rows.
3. `src/pickups.js` — **new file**: `spawnPickup(x, y, kind)`, `maybeDrop(z)`,
   `updatePickups(dt)`. Function declarations only (hoisted, no top-level
   side effects).
4. `src/zombies.js` — `killZombie()` calls `maybeDrop(z)`; `spawnZombie()`
   uses `wave`-based mix + `edgePos()` helper.
5. `src/render.js` — add `drawPickups(e)`; call it in `draw()` after particles,
   before the y-sorted entities; HUD reads `wave`.
6. `src/main.js` — frame: compute `wave`, call `updatePickups(dt)` (play only),
   fire surge on wave 5/10/… transition; `reset()` clears `pickups`; `__g`
   gains `get pickups()` and `get wave()`.
7. `index.html` — insert `<script src="src/pickups.js"></script>` after
   `src/particles.js` and before `src/zombies/zombie.js`.
8. `AGENTS.md` — update file map (add `pickups.js`), shared-state block
   (`pickups`, `wave`), load-order line, wave bullet (no longer display-only),
   spawn-mix numbers, `__g` list.
9. `README.md` — M2 bullet: mark done, move to a "Milestone 2" section.

## Invariants to preserve

- `z.lastHit === player.swingId` swing dedup — untouched.
- `zombies`/`particles`/`pickups` array-reassignment-via-filter pattern.
- `player` mutated in place, never reassigned.
- File-responsibility split: logic in `pickups.js`, drawing in `render.js`,
  SFX table in `audio.js`, globals in `state.js`.
- No new listeners; `input.js` unchanged.

## Acceptance criteria

- [x] Hearts restore 25 hp (capped at 100), gems add 50 score; both play SFX
      and burst particles on collect.
- [x] Pickups bob, fade out after 20 s, vanish when collected; draw under
      entities.
- [x] Runner/shambler kills drop at 15%/8%; brute kills always drop a gem.
- [x] Spawn mix follows the wave table; wave 5/10/… fires a 6-runner surge
      (cap 60 still holds).
- [x] HUD wave number unchanged in value (`1 + floor(time/25)`) now sourced
      from shared state.
- [x] `reset()` clears pickups; `__g.pickups` / `__g.wave` exposed.
- [x] `node --check` clean on all files; `index.html` lists `pickups.js` in
      load order.
- [x] AGENTS.md + README updated to match.

## Verification

1. `node --check` every `src/*.js` (same loop as the publish-release skill).
2. Serve the repo root; in the browser main world (per AGENTS.md debug
   section — main context, not an isolated-world wrapper):
   - Start: `document.getElementById('overlay').dispatchEvent(new MouseEvent('mousedown', {bubbles:true}))`; assert `__g.state === 'play'`.
   - Deterministic collection: `spawnPickup(__g.player.x, __g.player.y, 'heart')`;
     wait ~200 ms; assert `__g.pickups.length === 0` and hp increased (with hp < 100 first).
     Repeat with `'gem'`; assert `__g.score` rose by 50.
   - Drop rates: loop `spawnZombie(); killZombie(__g.zombies[0])` 300×, then
     assert `__g.pickups.length > 0` (expected ≈ 70; P(0) negligible).
   - Lifetime: spawn a pickup away from the player, wait ~21 s, assert
     `__g.pickups` emptied.
   - Wave: assert `__g.wave === 1` at start, `=== 2` after 26 s. (Surge needs a
     125 s wait — verify the trigger line by inspection; run it live only if
     convenient.)
3. Play 2–3 minutes by hand: confirm pickups read clearly on the ground,
   drops feel fair, late waves feel harder.
