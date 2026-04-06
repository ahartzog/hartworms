# Hartworms — Design Spec

**Date:** 2026-04-05
**Project:** Father-son game project (Alek + Cole, age 10)
**Goal:** A fun, silly browser-based Worms clone — built together, not for a market

---

## Overview

A turn-based 2D artillery game inspired by Worms 2: Armageddon. Two to four local players share a keyboard, each controlling a team of worms. Players take turns moving, aiming, and firing weapons at each other across destructible terrain. Last team standing wins.

The project is explicitly a learning and bonding exercise. Cole contributes code for tunable values (damage, timing, physics constants) and eventually whole weapons. Alek drives the architecture.

---

## Platform & Stack

- **Target:** Web browser (desktop), no installation required
- **Framework:** Phaser.js (already familiar)
- **Language:** JavaScript (ES modules)
- **Multiplayer:** Local only — 2–4 players share one keyboard, one screen
- **No backend:** No server, accounts, save state, or network play

---

## Architecture

```
worms-game/
  index.html
  src/
    config.js                 ← ALL tunable game constants (see Config section)
    main.js                   ← Phaser game config, scene registry
    scenes/
      MenuScene.js            ← title screen, team count/name config (2–4 teams)
      GameScene.js            ← core gameplay loop
      UIScene.js              ← HUD overlay (runs in parallel with GameScene)
    entities/
      Worm.js                 ← sprite, movement, HP, state machine
      Terrain.js              ← destructible terrain (pixel canvas bitmap)
      weapons/
        Bazooka.js
        Grenade.js
        Shotgun.js
        NinjaRope.js
    managers/
      TurnManager.js          ← cycles through teams, manages 30s turn timer
      TeamManager.js          ← holds up to 4 teams, each with worms, color, name
    utils/
      PhysicsHelper.js        ← projectile arc math, explosion radius, wind
```

---

## Config System

All tunable game constants live in a single `src/config.js` file. Nothing is hardcoded elsewhere — entities and managers import from config. This means Cole can change any number in one place and immediately see the effect.

```js
// src/config.js
export const CONFIG = {
  // Teams & worms
  maxTeams: 4,
  wormsPerTeam: 2,          // Cole's tuning zone
  wormHP: 100,              // Cole's tuning zone

  // Turn rules
  turnDuration: 30,         // seconds
  windMin: -5,
  windMax: 5,

  // Weapons — ammo
  ammo: {
    bazooka: 3,             // Cole's tuning zone
    grenade: 3,             // Cole's tuning zone
    shotgun: 2,             // Cole's tuning zone
    ninjaRope: Infinity,
  },

  // Weapons — damage & physics
  bazooka: {
    damage: 50,             // Cole's tuning zone
    blastRadius: 60,        // Cole's tuning zone
    speed: 600,
  },
  grenade: {
    damage: 50,             // Cole's tuning zone
    blastRadius: 60,        // Cole's tuning zone
    fuseTime: 3000,         // ms — Cole's tuning zone
    bounce: 0.5,            // elasticity — Cole's tuning zone
  },
  shotgun: {
    damage: 15,             // per pellet — Cole's tuning zone
    pellets: 3,             // Cole's tuning zone
    spread: 12,             // degrees — Cole's tuning zone
    knockback: 200,         // Cole's tuning zone
  },
  ninjaRope: {
    maxLength: 300,         // pixels — Cole's tuning zone
    swingSpeed: 3,          // Cole's tuning zone
  },

  // Terrain
  terrainSeed: null,        // null = random each match; set a number to replay a map
};
```

The `terrainSeed` field is a bonus: set it to any number to replay an exact map layout — useful for testing, or for a rematch on the same terrain.

---

## Teams & Turn Structure

- **Teams:** 2–4, configured on the menu screen before match starts
- **Colors:** Red, Blue, Green, Yellow (classic Worms palette)
- **Worms per team:** `CONFIG.wormsPerTeam` (default 2)
- **Turn order:** Sequential — Team 1 → Team 2 → Team 3 → Team 4 → repeat
- **Turn timer:** 30 seconds. When it expires, the turn ends immediately.
- **Elimination:** A team is eliminated when all its worms reach 0 HP
- **Win condition:** Last team with living worms wins; a win screen is shown, then return to menu

---

## Core Entities

### Worm
- 100 HP
- State machine: `idle → moving → aiming → firing → dead`
- Only the active worm accepts input
- Movement: left/right walk + jump via Phaser arcade physics with gravity
- Weapon selection disabled while airborne — must land first

### Terrain
- Rendered to an offscreen canvas as a pixel bitmap
- Explosions call a `blast(x, y, radius)` function that paints a circular hole into the bitmap
- Phaser `RenderTexture` + collider updated after each blast so worms fall into craters
- Worms that fall off the map die instantly

### Projectiles
- Each weapon spawns a Phaser physics-enabled sprite
- Resolve on contact with terrain or worm
- Explosion triggers `blast()` on terrain + applies damage to worms within radius

---

## Weapons

Weapon select is disabled mid-air. Ammo counts come from `CONFIG.ammo.*` — defaults: Bazooka 3, Grenade 3, Shotgun 2, Ninja Rope unlimited.

### Bazooka
- Single projectile on a physics arc
- Affected by wind (see Wind below)
- Explodes on contact with terrain or worm
- Damage: 50 | Blast radius: medium
- **Cole's tuning zone:** damage value, blast radius

### Grenade
- Lobbed projectile with a 3-second fuse (countdown shown visually)
- Bounces off terrain before detonating
- Not affected by wind
- Damage: 50 | Blast radius: medium
- **Cole's tuning zone:** fuse timer, bounce elasticity

### Shotgun
- Fires 3 pellets in a spread via near-instant raycast
- Short range; pushes worms back on hit (knockback)
- Damage: 15 per pellet | No terrain blast
- **Cole's tuning zone:** pellet count, spread angle, knockback force

### Ninja Rope
- Fires a grapple that sticks to terrain on contact
- Worm swings as a pendulum; player releases to launch
- No direct damage — tactical movement tool; can knock worms off ledges by collision
- **Cole's tuning zone:** rope length, swing speed constants

---

## Controls (Shared Keyboard)

All controls apply to the active worm. No conflict between players.

| Action | Key |
|---|---|
| Move left / right | Arrow Left / Arrow Right |
| Jump | Arrow Up |
| Aim (rotate weapon) | A / D |
| Fire / charge power | Space (hold for power) |
| Switch weapon | Q / E |
| Ninja rope attach / release | Space (context-sensitive when rope selected) |

---

## HUD (UIScene)

Displayed as a Phaser scene overlay running in parallel with GameScene:

- **Top-left:** Active team name + color indicator, active worm name + HP
- **Top-center:** Turn timer countdown (30s)
- **Top-right:** Wind indicator (arrow + value, e.g. "→ 3")
- **Bottom-right:** Selected weapon icon + remaining ammo
- **On hit:** Floating damage numbers above worm

---

## Wind

- A random integer from -5 to +5 is generated at the start of each turn
- Displayed in the HUD as a directional arrow
- Affects Bazooka trajectory only (applied as a continuous horizontal force)
- Grenade, Shotgun, Ninja Rope are unaffected

---

## Out of Scope (for now)

- AI opponents
- Network / online multiplayer
- Save state or match history
- Mobile / touch controls
- More than 4 weapons at launch
- Hand-crafted terrain levels (terrain is procedurally generated each match from a random seed — no authored levels needed)

---

## Sound Effects

Optional stretch goal — Cole can add sounds via Phaser's audio API as a side quest once gameplay is solid. No sounds are required for the MVP.

---

## Error Handling & Edge Cases

- Worm falls off map → instant death
- Turn timer expires → turn ends, no action taken
- All worms on a team eliminated → team removed from rotation
- No unit tests — manual playtesting is the QA strategy

---

## Cole's Contribution Areas

Designed so Cole can make meaningful, visible changes without touching the engine:

1. Weapon damage values and blast radii
2. Grenade fuse timer and bounce behavior
3. Shotgun pellet count and spread
4. Ninja rope length and swing constants
5. Team names and colors on the menu
6. HUD text and styling
7. Sound effect integration (stretch)
8. Eventually: a new weapon of his own design
