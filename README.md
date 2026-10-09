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
everything shares the global scope). See `AGENTS.md` for the file map, architecture,
and coding conventions.

## Controls

| Input | Action |
|---|---|
| WASD | move |
| mouse | aim sword |
| click | swing |
| `R` | restart |

## Milestone 3

- Boss every 5th wave (5, 10, …): a giant r30 zombie with wave-scaled HP (`20 + 10·(wave−4)`),
  a top-center boss HP bar, and guaranteed heart + 3 gems on death
- Best score persisted in `localStorage` — shown in the HUD (`BEST`) and on the
  game-over screen (`NEW BEST!` / `Best <n>`)

## Milestone 2

- Pickups: hearts (+25 hp) and gems (+50 score) dropped by dead zombies — brutes always drop a gem, smalls drop at 15%/8%
- Varied wave composition: spawn mix and runner speed scale with the wave number; every 5th wave fires a 6-runner surge

## Milestone 1

- Player movement + mouse-aimed sword with cooldown, swing arc hitbox, knockback, i-frames
- Zombies spawn at screen edges: fast runners chase from spawn, slow shamblers wander passively until you get close (wobble, separation push, contact damage)
- runner (fast) / shambler (slow, passive) / big (3 hp, HP bar, heavier hit) zombies
- Score (10 / 25 points), wave indicator (ramps every 25 s), survival timer
- Blood particles, hit flash, swing trail, pre-rendered textured ground
- Oscillator SFX (swing / hit / die / hurt), lazy `AudioContext` on first gesture
- Game over overlay with score + survival time, click or `R` to restart

## Proposed next milestones

- **M4** — Touch controls / gamepad support
