# Hartworms — Claude Code Context

## Project

Turn-based 2D artillery browser game (Worms-like). Built by Alek & Cole Hartzog.

**Run locally:** `npm run dev` → http://localhost:5173

**Stack:** Phaser 3.80, Vite 5, vanilla JS ES modules. No TypeScript, no test suite.

---

## Architecture

| File | Responsibility |
|------|---------------|
| `src/config.js` | Single source of truth for all tunable constants. Edit here first. |
| `src/main.js` | Phaser game bootstrap, scene registry |
| `src/scenes/MenuScene.js` | Team count selector, launches UIScene + GameScene |
| `src/scenes/GameScene.js` | Core loop: wires terrain, teams, turns, weapons, HUD. All input handling lives here. |
| `src/scenes/UIScene.js` | HUD overlay (runs in parallel with GameScene via `scene.launch`) |
| `src/entities/Terrain.js` | Canvas bitmap terrain, `blast()`, pixel-cached `isSolid()` |
| `src/entities/Worm.js` | Sprite + physics + state machine. Renders via Phaser sprites (not Graphics). |
| `src/entities/weapons/` | Bazooka, Grenade, Shotgun, NinjaRope — each self-contained with callbacks |
| `src/managers/TeamManager.js` | Teams and worm spawning |
| `src/managers/TurnManager.js` | Turn cycling, timer, wind |
| `src/utils/PhysicsHelper.js` | `makeRng`, `toRad`, `getWormsInBlast`, `dist` |

---

## Key Design Decisions

### Terrain
- Pixel-bitmap canvas. Destruction via `destination-out` composite op.
- `isSolid()` uses a **cached pixel buffer** (`this.pixels`), refreshed after each `blast()`. Do NOT switch back to per-call `getImageData` — it kills framerate.
- Texture key `'terrain'` is removed and re-added on each `GameScene.create()` to support replay.

### Worm Physics
- Pixel-walk collision: sample `feetY = y + 12` each frame, snap to surface.
- Ground snap only fires when `vy >= 0` (prevents jump cancellation).
- Hard map boundaries: bounce off left/right edges (50% velocity dampen), die only if below map bottom.

### Worm Rendering
- Sprites from `assets/craftpix-net-622999-free-pixel-art-tiny-hero-sprites/`
- Team → sprite prefix mapping: `['pink', 'owlet', 'dude', 'pink']` (for up to 4 teams)
- Frame size: 32×32px
- Animations: `{prefix}_idle` (4f), `{prefix}_walk` (6f), `{prefix}_jump` (8f), `{prefix}_death` (8f)
- Spritesheets loaded in `GameScene.preload()`, animations registered in `GameScene._createAnims()`

### TurnManager
- Uses **stable indices** into `teams[]` and `worms[]` (not filtered arrays). This was a critical fix — do not revert to indexing into `activeTeams` / `livingWorms`.
- `endTurn()` caches the outgoing worm before mutating indices.
- Wind is re-rolled each turn (not seeded).

### Weapons
- All share constructor shape: `(scene, terrain, allWorms, ...callbacks)`
- Bazooka/Grenade: hold SPACE to charge, release to fire → ends turn
- Shotgun: instant fire (JustDown), grounded only → ends turn after 300ms
- NinjaRope: SPACE to grapple, L/R arrows to pump, SPACE to release → does NOT end turn
- `_currentWeapon?.active` flag blocks input while projectile is in flight
- Ammo is **per-match** (not per-turn). Initialized once in `create()`.

### Scene Flow
```
MenuScene
  └─ scene.launch('UIScene')   ← must be BEFORE scene.start
  └─ scene.start('GameScene', { teamCount })
       └─ on game over: scene.stop('UIScene') → scene.start('MenuScene')
```
UIScene is launched (parallel) not started, so `scene.get('UIScene')` works from GameScene.

### Gravity Constants
All gravity values live in `CONFIG.gravity`:
- `worm: 500` px/s²
- `bazooka: 300` px/s²
- `grenade: 400` px/s²

---

## Controls

| Key | Action |
|-----|--------|
| ← → | Walk |
| ↑ | Jump |
| W / S | Aim up / down |
| Q / E | Cycle weapons |
| SPACE (hold/release) | Charge + fire (Bazooka, Grenade) |
| SPACE (tap) | Fire (Shotgun, Ninja Rope) |

---

## Known Limitations / Future Work

- No slope climbing — worms can get stuck on steep terrain edges
- No camera follow — worms can walk off-screen without dying (just hard-stop at edges)
- MenuScene uses static team names/colors from CONFIG; no custom naming UI
- Wind only affects Bazooka (by design)
- Worm collision is single-column pixel sample — fast-moving worms can tunnel through thin terrain after heavy knockback
- `UIScene._floaters` array is declared but unused (showDamage creates text objects directly)

---

## Docs

- `docs/superpowers/specs/2026-04-05-worms-game-design.md` — original game design spec
- `docs/superpowers/plans/2026-04-05-hartworms-implementation.md` — full 11-task implementation plan used to build this
