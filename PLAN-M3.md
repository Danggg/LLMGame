# Milestone 3 — Boss + Best Score

Two features:

1. **Boss** — a giant boss zombie spawns on every 5th wave (5, 10, 15, …),
   joining the existing runner surge.
2. **Best score** — high score persisted in `localStorage`, shown in the HUD
   and on the game-over overlay.

## Non-goals

- No boss special attacks (no charge, roar phases, or projectile mechanics) —
  the boss uses the base class chase/wobble/contact physics like every other
  zombie.
- No boss entrance animation or death animation beyond the existing hit flash
  and a larger blood burst.
- No per-user best scores, leaderboards, or settings — one `localStorage`
  key, no new input listeners.
- No changes to the 60-zombie cap, spawn cadence, or wave formula.

## Design

### Boss

New zombie type in `src/zombies/boss.js`: `class Boss extends Zombie`.

| stat | value |
|---|---|
| radius | 30 |
| hp | `20 + 10 * (wave - 4)` — wave 5 → 30, wave 10 → 70, wave 15 → 110 |
| speed | `rand(26, 38)` (slower than brutes; you can kite it) |
| dmg | 30 (4 clean hits = death) |
| score | 150 |
| behavior | always hunts (base `think`), wobble 0.5, individual HP bar always shown |

Wave-scaled HP makes later bosses a longer fight at the same swing rate
(~2.5 hits/s max). The boss counts toward the 60-zombie cap and goes through
the normal pairwise separation + contact damage — no physics special-casing.

**Shared state** — `state.js`: `let boss = null;` — reference to the live boss
(or `null`). Set at spawn, cleared in `killZombie()` when `z === boss`, and in
`reset()`. The normal `zombies` filter does not touch it (the reference is
independent of the array).

**Spawn** — in `main.js` `frame()`, inside the existing wave-transition block
(`wave > prevWave && wave % 5 === 0`), after the 6-runner surge:

```js
if (!boss && zombies.length < 60) {
  const [x, y] = edgePos();
  boss = new Boss(x, y);
  zombies.push(boss);
  sfx('boss');
}
```

The `!boss` guard makes the spawn idempotent; the cap check means a full
field skips the boss (the surge runs first, so it has priority).

**Death** — `killZombie()` in `zombies.js`:
- blood burst 40 particles (vs 14) so a boss kill reads as big;
- `if (z === boss) boss = null;`
- existing `score += z.score`, `sfx('die')`, `maybeDrop(z)` unchanged.

**Drops** — `maybeDrop()` in `pickups.js`: boss always drops 1 heart + 3
gems, scattered within 14–26 px of the death point (spawns stay clamped by
`spawnPickup`).

**SFX** — one new row in `audio.js`:

```
boss: ['sawtooth', 70, 35, 0.5, 0.12]   // low roar, on spawn
```

**Drawing** — per convention, in `render.js`:
- `Boss.drawBody(e)`: big dark-red body (torso ellipse, heavy legs, two
  reaching arms, back spikes, head with horns, glowing eyes) — distinct from
  the green horde at a glance.
- HUD: while `boss` is alive, a wide boss HP bar across the top center
  (280 px) with a `BOSS` label, drawn in `drawHUD()`. The individual HP bar
  (inherited, `showBar = true`) still appears over the boss once damaged.

### Best score

**Shared state** — `state.js`: `let best = 0;`, initialized once from
`localStorage['zs-best']` in try/catch (storage can throw in restricted
contexts — same try/catch convention as the `AudioContext`):

```js
try { best = parseInt(localStorage.getItem('zs-best'), 10) || 0; } catch (e) {}
```

**Save** — `gameOver()` in `main.js`: if `score > best`, update `best` and
`localStorage.setItem('zs-best', String(best))` in try/catch. Never lowers
the stored value; a run that ties the best is not a new best.

**Display** —
- HUD: fourth right-aligned line `BEST <n>` in `drawHUD()`.
- Game-over overlay `.sub`: `Score X — survived Ys` plus a second line —
  `NEW BEST!` on a record, otherwise `Best <n>` (innerHTML, numeric content
  only).

## File changes (load order)

1. `src/state.js` — add `let boss = null;` and `let best = 0;` (+ storage read).
2. `src/audio.js` — add the `boss` spec row.
3. `src/zombies/boss.js` — **new file**: `class Boss extends Zombie` with
   wave-scaled hp and its own `drawBody`.
4. `src/zombies.js` — `killZombie()`: 40-particle burst for bosses, clear
   `boss` reference on boss death.
5. `src/pickups.js` — `maybeDrop()`: boss branch (heart + 3 gems).
6. `src/main.js` — `frame()`: spawn boss on the 5/10/… transition; `reset()`:
   clear `boss`; `gameOver()`: best-score save + overlay line; `__g` gains
   `get boss()` and `get best()`.
7. `src/render.js` — `drawHUD()`: `BEST` line + top-center boss HP bar.
8. `index.html` — insert `<script src="src/zombies/boss.js"></script>` after
   `src/zombies/brute.js` and before `src/zombies.js`.
9. `AGENTS.md` — file map (`boss.js`), load-order line, shared-state block
   (`boss`, `best`), wave bullet (boss on 5/10/…), boss stats in the zombie
   list, game-flow note (best save), `__g` list.
10. `README.md` — new "Milestone 3" section; drop the M3 line from
    "Proposed next milestones".

## Invariants to preserve

- `z.lastHit === player.swingId` swing dedup — untouched.
- `zombies`/`particles`/`pickups` array-reassignment-via-filter pattern —
  the boss lives in `zombies` like everything else; the extra `boss` reference
  is a pointer, not a second copy of state.
- `player` mutated in place, never reassigned.
- 60-zombie cap, spawn cadence, and wave formula unchanged.
- File-responsibility split: class in `zombies/boss.js`, logic in
  `zombies.js`/`pickups.js`/`main.js`, drawing in `render.js`, SFX table in
  `audio.js`, globals in `state.js`.
- No new listeners; `input.js` unchanged.
- All `localStorage` access wrapped in try/catch.

## Acceptance criteria

- [x] Waves 5, 10, … spawn a boss alongside the 6-runner surge (cap 60 still
      holds; boss skipped if the field is full).
- [x] Boss stats: r30, hp `20 + 10(w−4)`, speed 26–38, dmg 30, score 150;
      individual HP bar once damaged; top-center boss bar while alive.
- [x] Boss death: 40-particle burst, `boss` cleared, guaranteed heart + 3 gems.
- [x] `best` read from `localStorage['zs-best']` on load; saved only on a new
      record at `gameOver`; overlay shows `NEW BEST!` / `Best <n>`; HUD shows
      `BEST <n>`.
- [x] `reset()` clears `boss`; `__g.boss` / `__g.best` exposed.
- [x] `node --check` clean on all files; `index.html` lists `boss.js` in load
      order (after `brute.js`, before `zombies.js`).
- [x] AGENTS.md + README updated to match.

## Verification

1. `node --check` every `src/*.js` and `src/zombies/*.js`.
2. Serve the repo root; in the browser main world (per AGENTS.md debug
   section — main context, not an isolated-world wrapper):
   - Pre-seed `localStorage.setItem('zs-best', '42')` before load; assert
     `__g.best === 42`.
   - Start: dispatch `mousedown` on the overlay; assert `__g.state === 'play'`
     and `__g.boss === null`.
   - Boss spawn: set `time = 124.9`; after a frame assert `__g.boss` is
     non-null, `__g.zombies.some(z => z.kind === 'boss')`, and the surge
     added 6 runners.
   - Boss kill: record `score` and `pickups.length`, then `killZombie(__g.boss)`;
     assert `__g.boss === null`, score rose by 150, and 4 new pickups
     (1 heart + 3 gems).
   - Best save: `score = 500; gameOver();` assert `__g.best === 500` and
     `localStorage.getItem('zs-best') === '500'`.
   - No downgrade: restart, `score = 100; gameOver();` assert `__g.best` is
     still 500 and storage unchanged.
   - Boss bar: frames keep running with the boss alive (draw path exercised,
     no exceptions in console).
3. Play by hand until wave 5: confirm the boss reads as big and distinct, the
   top bar tracks its HP, and killing it drops its loot.
