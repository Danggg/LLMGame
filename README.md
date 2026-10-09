# Zombie Sword

A small top-down survival game: you are a swordsman in the middle of a zombie horde. Swing, don't get touched, survive.

## Run

Open `index.html` directly in a browser, or:

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

No build step, no dependencies — vanilla JS on a canvas.

## Code layout

`src/` holds plain scripts loaded in order by `index.html` (no modules, no bundler —
everything shares the global scope, in the order listed):

| File | Contents |
|---|---|
| `util.js` | math helpers (`rand`, `clamp`, `angDiff`) |
| `audio.js` | lazy `AudioContext` + oscillator SFX |
| `state.js` | canvas refs + shared game state |
| `ground.js` | pre-rendered ground texture |
| `particles.js` | blood particles |
| `zombies.js` | spawn, swing hit detection, kill logic, pairwise separation |
| `zombies/zombie.js` | `Zombie` base class: shared physics (chase, wobble, contact damage) + shared drawing (shadow, hit flash, HP bar) |
| `zombies/runner.js` | `Runner` — fast chaser |
| `zombies/shambler.js` | `Shambler` — slow passive wanderer, drowsy tint |
| `zombies/brute.js` | `Brute` — big 3-hp zombie with HP bar |
| `player.js` | movement, i-frames, swinging |
| `render.js` | all drawing (player, sword, zombies, HUD, `draw`) |
| `input.js` | keyboard / mouse listeners |
| `main.js` | game flow (`reset`, `gameOver`), main loop, `window.__g` debug hook |

## Controls

| Input | Action |
|---|---|
| WASD | move |
| mouse | aim sword |
| click | swing |
| `R` | restart |

## Milestone 1 (current)

- Player movement + mouse-aimed sword with cooldown, swing arc hitbox, knockback, i-frames
- Zombies spawn at screen edges: fast runners chase from spawn, slow shamblers wander passively until you get close or hit them (wobble, separation push, contact damage)
- runner (fast) / shambler (slow, passive) / big (3 hp, HP bar, heavier hit) zombies
- Score (10 / 25 points), wave indicator (ramps every 25 s), survival timer
- Blood particles, hit flash, swing trail, pre-rendered textured ground
- Oscillator SFX (swing / hit / die / hurt), lazy `AudioContext` on first gesture
- Game over overlay with score + survival time, click or `R` to restart

## Proposed next milestones

- **M2** — Pickups (hearts, score gems) + varied wave composition
- **M3** — Boss every N waves + `localStorage` best score
- **M4** — Touch controls / gamepad support
