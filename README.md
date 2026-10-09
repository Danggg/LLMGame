# Zombie Sword

A small top-down survival game: you are a swordsman in the middle of a zombie horde. Swing, don't get touched, survive.

## Run

Open `index.html` directly in a browser, or:

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

No build step, no dependencies — vanilla JS on a canvas.

## Controls

| Input | Action |
|---|---|
| WASD / arrows | move |
| mouse | aim sword |
| click / `J` / `Space` | swing |
| `R` | restart |

## Milestone 1 (current)

- Player movement + mouse-aimed sword with cooldown, swing arc hitbox, knockback, i-frames
- Zombies chase from screen edges with wobble, separation push, contact damage
- Normal (1 hp) and big (3 hp, HP bar, heavier hit) zombies
- Score (10 / 25 points), wave indicator (ramps every 25 s), survival timer
- Blood particles, hit flash, swing trail, pre-rendered textured ground
- Oscillator SFX (swing / hit / die / hurt), lazy `AudioContext` on first gesture
- Game over overlay with score + survival time, click or `R` to restart

## Proposed next milestones

- **M2** — Pickups (hearts, score gems) + varied wave composition
- **M3** — Boss every N waves + `localStorage` best score
- **M4** — Touch controls / gamepad support
