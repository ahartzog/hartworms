# Hartworms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a turn-based 2D artillery browser game (Worms-like) with destructible terrain, 2–4 local players, and four weapons including a ninja rope.

**Architecture:** Phaser 3 game with ES modules served by Vite. A single `config.js` exports all tunable constants. Terrain is a pixel-bitmap canvas manipulated directly for destruction; worm ground collision is done by pixel-sampling the terrain canvas each frame rather than rebuilding physics bodies. Scenes are layered: `MenuScene` → `GameScene` + `UIScene` (parallel overlay).

**Tech Stack:** Phaser 3.80, Vite 5, vanilla JavaScript (ES modules), no other dependencies

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Entry point, mounts Vite app |
| `src/config.js` | All tunable constants — single source of truth |
| `src/main.js` | Phaser game instance config, scene registry |
| `src/scenes/MenuScene.js` | Title screen, team count/name setup |
| `src/scenes/GameScene.js` | Core game loop, input, wires all systems |
| `src/scenes/UIScene.js` | HUD overlay (HP, timer, wind, weapon/ammo, floaters) |
| `src/entities/Terrain.js` | Canvas bitmap terrain, `blast(x, y, radius)`, pixel hit-test |
| `src/entities/Worm.js` | Sprite, HP, state machine, pixel-walk movement |
| `src/entities/weapons/Bazooka.js` | Arcing projectile, wind-affected, explodes on contact |
| `src/entities/weapons/Grenade.js` | Bouncing projectile, fuse timer, explodes |
| `src/entities/weapons/Shotgun.js` | Raycast pellets, spread, knockback |
| `src/entities/weapons/NinjaRope.js` | Grapple, pendulum physics, launch on release |
| `src/managers/TeamManager.js` | Holds teams array, worm lists, colors |
| `src/managers/TurnManager.js` | Turn cycling, timer, end-of-turn logic |
| `src/utils/PhysicsHelper.js` | `applyExplosion()`, `seededRandom()`, `degreesToRadians()` |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/config.js`
- Create: `src/scenes/MenuScene.js`
- Create: `src/scenes/GameScene.js`
- Create: `src/scenes/UIScene.js`

- [ ] **Step 1: Initialize project**

```bash
cd /Users/alekhartzog/Code/hartworms
npm init -y
npm install phaser@^3.80.0
npm install --save-dev vite@^5.0.0
```

- [ ] **Step 2: Update package.json scripts**

Replace the `scripts` section in `package.json`:

```json
{
  "name": "hartworms",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 3: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hartworms</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create `src/config.js`**

```js
// src/config.js
// Cole's tuning zone: change these numbers and see what happens!
export const CONFIG = {
  // Game dimensions
  width: 1280,
  height: 720,

  // Teams & worms
  maxTeams: 4,
  wormsPerTeam: 2,       // Cole: try 3 or 4!
  wormHP: 100,           // Cole: try 50 for faster games!

  // Turn rules
  turnDuration: 30,      // seconds
  windMin: -5,
  windMax: 5,

  // Team colors (hex)
  teamColors: [0xff4444, 0x4488ff, 0x44cc44, 0xffdd00],
  teamNames: ['Red', 'Blue', 'Green', 'Yellow'],

  // Weapons — ammo per match
  ammo: {
    bazooka: 3,          // Cole: try Infinity for chaos!
    grenade: 3,
    shotgun: 2,
    ninjaRope: Infinity,
  },

  // Bazooka
  bazooka: {
    damage: 50,          // Cole: try 75 for big hits!
    blastRadius: 60,     // pixels
    speed: 600,
  },

  // Grenade
  grenade: {
    damage: 50,
    blastRadius: 60,
    fuseTime: 3000,      // ms — Cole: try 1500 for panic mode!
    bounce: 0.5,         // 0 = no bounce, 1 = super bouncy
  },

  // Shotgun
  shotgun: {
    damage: 15,          // per pellet
    pellets: 3,          // Cole: try 6 for a blunderbuss!
    spread: 12,          // degrees total spread
    knockback: 200,
  },

  // Ninja rope
  ninjaRope: {
    maxLength: 300,      // pixels
    swingSpeed: 3,       // Cole: try 5 for fast swings!
  },

  // Terrain
  terrainSeed: null,     // null = random; set a number to replay same map
};
```

- [ ] **Step 5: Create stub scenes**

`src/scenes/MenuScene.js`:
```js
import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    this.add.text(100, 100, 'HARTWORMS', { fontSize: '64px', color: '#ffffff' });
    this.add.text(100, 200, 'Press SPACE to play', { fontSize: '32px', color: '#aaaaaa' });
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
```

`src/scenes/GameScene.js`:
```js
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  create() {
    this.add.text(100, 100, 'Game Scene — coming soon', { fontSize: '32px', color: '#ffffff' });
  }
}
```

`src/scenes/UIScene.js`:
```js
import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }
  create() {}
  update() {}
}
```

- [ ] **Step 6: Create `src/main.js`**

```js
import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: CONFIG.width,
  height: CONFIG.height,
  backgroundColor: '#87ceeb',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 400 }, debug: false },
  },
  scene: [MenuScene, GameScene, UIScene],
});
```

- [ ] **Step 7: Verify scaffold**

```bash
npm run dev
```

Expected: Browser opens at `http://localhost:5173`. You see a black page with "HARTWORMS" in white text. Pressing SPACE switches to the "Game Scene — coming soon" stub.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: project scaffold — Phaser 3 + Vite, stub scenes, config"
git push
```

---

## Task 2: Terrain System

**Files:**
- Create: `src/entities/Terrain.js`
- Create: `src/utils/PhysicsHelper.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create `src/utils/PhysicsHelper.js`**

```js
// src/utils/PhysicsHelper.js

/** Seeded pseudo-random number generator (mulberry32) */
export function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert degrees to radians */
export function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Return all worms within blastRadius of (x, y) */
export function getWormsInBlast(worms, x, y, blastRadius) {
  return worms.filter((w) => {
    if (w.isDead) return false;
    const dx = w.x - x;
    const dy = w.y - y;
    return Math.sqrt(dx * dx + dy * dy) <= blastRadius;
  });
}

/** Distance between two points */
export function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
```

- [ ] **Step 2: Create `src/entities/Terrain.js`**

```js
// src/entities/Terrain.js
import { makeRng } from '../utils/PhysicsHelper.js';

export class Terrain {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} width  canvas width
   * @param {number} height canvas height
   * @param {number|null} seed  null = random
   */
  constructor(scene, width, height, seed) {
    this.scene = scene;
    this.width = width;
    this.height = height;

    // Create the offscreen canvas that is the source of truth
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    const resolvedSeed = seed ?? Math.floor(Math.random() * 1e9);
    this._draw(resolvedSeed);

    // Register canvas as a Phaser texture and display it
    scene.textures.addCanvas('terrain', this.canvas);
    this.image = scene.add.image(0, 0, 'terrain').setOrigin(0, 0);
  }

  /** Generate and draw terrain from seed */
  _draw(seed) {
    const { ctx, width, height } = this;
    const rng = makeRng(seed);

    // Generate raw heightmap (0–1, where 1 = top of screen)
    const raw = [];
    let h = 0.55;
    for (let x = 0; x < width; x++) {
      h += (rng() - 0.5) * 0.04;
      h = Math.max(0.3, Math.min(0.85, h));
      raw.push(h);
    }

    // Smooth heightmap (moving average over 20px window)
    const heights = raw.map((_, i) => {
      const lo = Math.max(0, i - 10);
      const hi = Math.min(width - 1, i + 10);
      let sum = 0;
      for (let j = lo; j <= hi; j++) sum += raw[j];
      return sum / (hi - lo + 1);
    });

    // Draw sky (transparent) + terrain (solid green/brown)
    ctx.clearRect(0, 0, width, height);

    // Ground fill: brown base
    ctx.fillStyle = '#7a5c3a';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x < width; x++) {
      ctx.lineTo(x, height * heights[x]);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Grass strip on top surface
    ctx.fillStyle = '#4a9a30';
    ctx.beginPath();
    ctx.moveTo(0, height * heights[0]);
    for (let x = 0; x < width; x++) {
      ctx.lineTo(x, height * heights[x]);
    }
    for (let x = width - 1; x >= 0; x--) {
      ctx.lineTo(x, height * heights[x] + 8);
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Blast a circular hole in the terrain at (x, y) with given radius.
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   */
  blast(x, y, radius) {
    const { ctx } = this;
    const prev = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = prev;

    // Tell Phaser to re-upload the canvas texture to GPU
    this.scene.textures.get('terrain').refresh();
  }

  /**
   * Returns true if the pixel at (x, y) is solid terrain (non-transparent).
   * @param {number} x
   * @param {number} y
   */
  isSolid(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const pixel = this.ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    return pixel[3] > 10; // alpha > 10 = solid
  }

  /**
   * Find the Y coordinate of the terrain surface directly below (x, startY).
   * Returns null if no terrain found below startY.
   * @param {number} x
   * @param {number} startY
   */
  getSurfaceY(x, startY) {
    for (let y = startY; y < this.height; y++) {
      if (this.isSolid(x, y)) return y;
    }
    return null;
  }
}
```

- [ ] **Step 3: Update `GameScene.js` to display terrain**

```js
// src/scenes/GameScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Terrain } from '../entities/Terrain.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.terrain = new Terrain(
      this,
      CONFIG.width,
      CONFIG.height,
      CONFIG.terrainSeed
    );
  }

  update() {}
}
```

- [ ] **Step 4: Verify terrain renders**

```bash
npm run dev
```

Press SPACE on the menu. Expected: rolling hills of brown/green terrain visible across the full canvas. Each reload generates a different map shape (random seed). Pressing SPACE again still generates new terrain (random).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: terrain system — seeded heightmap, canvas bitmap, blast() API"
git push
```

---

## Task 3: Worm Entity

**Files:**
- Create: `src/entities/Worm.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create `src/entities/Worm.js`**

```js
// src/entities/Worm.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';

// Worm states
export const WormState = {
  IDLE: 'idle',
  MOVING: 'moving',
  AIMING: 'aiming',
  FIRING: 'firing',
  FALLING: 'falling',
  DEAD: 'dead',
};

export class Worm {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x  spawn X
   * @param {number} y  spawn Y
   * @param {number} teamColor  hex color e.g. 0xff4444
   * @param {string} name  e.g. "Worm 1"
   */
  constructor(scene, x, y, teamColor, name) {
    this.scene = scene;
    this.name = name;
    this.hp = CONFIG.wormHP;
    this.state = WormState.IDLE;
    this.isActive = false;  // true when it's this worm's turn
    this.facingRight = true;

    // Velocity (pixels/sec)
    this.vx = 0;
    this.vy = 0;

    // Aim angle in degrees (0 = right, 90 = up, 180 = left)
    this.aimAngle = 45;

    // Draw worm as a colored circle with a direction indicator
    this.graphics = scene.add.graphics();
    this.x = x;
    this.y = y;
    this._draw(teamColor);

    this.teamColor = teamColor;
    this._color = teamColor;
  }

  get isDead() { return this.state === WormState.DEAD; }

  /** Redraw the worm graphic at current position */
  _draw(color) {
    this.graphics.clear();
    // Body
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(this.x, this.y, 12);
    // Eyes
    this.graphics.fillStyle(0xffffff, 1);
    const eyeOffX = this.facingRight ? 4 : -4;
    this.graphics.fillCircle(this.x + eyeOffX, this.y - 3, 3);
    this.graphics.fillStyle(0x000000, 1);
    this.graphics.fillCircle(this.x + eyeOffX + (this.facingRight ? 1 : -1), this.y - 3, 1.5);
    // Active indicator (white ring)
    if (this.isActive) {
      this.graphics.lineStyle(2, 0xffffff, 1);
      this.graphics.strokeCircle(this.x, this.y, 15);
    }
  }

  /**
   * Physics update — pixel-walk against terrain.
   * Call from GameScene.update() every frame.
   * @param {import('./Terrain.js').Terrain} terrain
   * @param {number} delta  ms since last frame
   */
  update(terrain, delta) {
    if (this.isDead) return;

    const dt = delta / 1000; // seconds
    const GRAVITY = 500;     // px/s²
    const WALK_SPEED = 100;  // px/s
    const WORM_RADIUS = 12;

    // Apply gravity
    this.vy += GRAVITY * dt;

    // Move
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Terrain collision — check pixel below worm center
    const feetY = this.y + WORM_RADIUS;
    if (terrain.isSolid(this.x, feetY)) {
      // Find exact surface
      let surfY = feetY;
      while (surfY > this.y && terrain.isSolid(this.x, surfY)) surfY--;
      this.y = surfY - WORM_RADIUS;
      this.vy = 0;
      if (this.state === WormState.FALLING) {
        this.state = WormState.IDLE;
      }
    } else if (!terrain.isSolid(this.x, feetY + 1)) {
      if (this.state !== WormState.FALLING) {
        this.state = WormState.FALLING;
      }
    }

    // Kill if fell off screen
    if (this.y > terrain.height + 50) {
      this.die();
    }

    this._draw(this._color);
  }

  /** Move left or right (called from input handler) */
  walk(direction) {
    // direction: -1 = left, 1 = right
    if (this.state === WormState.FALLING || this.isDead) return;
    this.vx = direction * 100;
    this.facingRight = direction > 0;
    this.state = WormState.MOVING;
  }

  /** Stop horizontal movement */
  stopWalk() {
    this.vx = 0;
    if (this.state === WormState.MOVING) this.state = WormState.IDLE;
  }

  /** Jump (only when grounded) */
  jump() {
    if (this.state === WormState.FALLING || this.isDead) return;
    this.vy = -350;
    this.state = WormState.FALLING;
  }

  /** Rotate aim angle. direction: -1 = counterclockwise, 1 = clockwise */
  rotateAim(direction) {
    this.aimAngle = Phaser.Math.Clamp(this.aimAngle + direction * 2, -85, 85);
  }

  /** Get aim direction as a unit vector {x, y} */
  getAimVector() {
    const angle = this.facingRight
      ? -this.aimAngle  // positive aimAngle = upward when facing right
      : -(180 - this.aimAngle);
    const rad = Phaser.Math.DegToRad(angle);
    return { x: Math.cos(rad), y: Math.sin(rad) };
  }

  /** Apply damage and handle death */
  takeDamage(amount) {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) this.die();
  }

  die() {
    this.state = WormState.DEAD;
    this.graphics.clear();
    // Tombstone marker
    const g = this.scene.add.graphics();
    g.fillStyle(0x888888, 1);
    g.fillRect(this.x - 4, this.y - 16, 8, 16);
    g.fillRect(this.x - 8, this.y - 20, 16, 6);
  }

  /** Set whether this worm is the active (currently-controlled) worm */
  setActive(active) {
    this.isActive = active;
    this._draw(this._color);
  }

  /** Knock the worm back from an explosion at (ox, oy) */
  knockback(ox, oy, force) {
    const dx = this.x - ox;
    const dy = this.y - oy;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx += (dx / d) * force;
    this.vy += (dy / d) * force;
    this.state = WormState.FALLING;
  }
}
```

- [ ] **Step 2: Update `GameScene.js` to spawn and move a test worm**

```js
// src/scenes/GameScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Terrain } from '../entities/Terrain.js';
import { Worm, WormState } from '../entities/Worm.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.terrain = new Terrain(this, CONFIG.width, CONFIG.height, CONFIG.terrainSeed);

    // Test worm — will be replaced by TeamManager in Task 4
    this.testWorm = new Worm(this, 200, 100, 0xff4444, 'Test Worm');
    this.testWorm.setActive(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  update(time, delta) {
    const worm = this.testWorm;

    // Movement
    if (this.cursors.left.isDown) {
      worm.walk(-1);
    } else if (this.cursors.right.isDown) {
      worm.walk(1);
    } else {
      worm.stopWalk();
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      worm.jump();
    }

    worm.update(this.terrain, delta);
  }
}
```

- [ ] **Step 3: Verify worm physics**

```bash
npm run dev
```

Press SPACE on the menu. Expected:
- A red circle (worm) falls from Y=100 and lands on terrain
- Arrow Left/Right walks the worm along the terrain surface
- Up arrow makes it jump
- Walking off a cliff: worm falls
- Falling off screen: worm disappears (dies)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Worm entity — pixel-walk physics, state machine, HP, knockback"
git push
```

---

## Task 4: Team Manager & Turn Manager

**Files:**
- Create: `src/managers/TeamManager.js`
- Create: `src/managers/TurnManager.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create `src/managers/TeamManager.js`**

```js
// src/managers/TeamManager.js
import { CONFIG } from '../config.js';
import { Worm } from '../entities/Worm.js';

export class Team {
  constructor(index, name, color) {
    this.index = index;
    this.name = name;
    this.color = color;
    /** @type {Worm[]} */
    this.worms = [];
  }
  get isEliminated() {
    return this.worms.every((w) => w.isDead);
  }
  get livingWorms() {
    return this.worms.filter((w) => !w.isDead);
  }
}

export class TeamManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} teamCount  2–4
   * @param {import('../entities/Terrain.js').Terrain} terrain
   */
  constructor(scene, teamCount, terrain) {
    this.teams = [];

    for (let i = 0; i < teamCount; i++) {
      const team = new Team(i, CONFIG.teamNames[i], CONFIG.teamColors[i]);

      for (let w = 0; w < CONFIG.wormsPerTeam; w++) {
        // Spread worm spawn X positions evenly, staggered by team
        const sectionWidth = CONFIG.width / teamCount;
        const spawnX = sectionWidth * i + sectionWidth / 2 + (w - 0.5) * 80;
        const worm = new Worm(
          scene,
          spawnX,
          50, // drop from above, gravity does the rest
          CONFIG.teamColors[i],
          `${CONFIG.teamNames[i]} ${w + 1}`
        );
        team.worms.push(worm);
      }

      this.teams.push(team);
    }
  }

  /** All worms across all teams */
  get allWorms() {
    return this.teams.flatMap((t) => t.worms);
  }

  /** Teams still in the game */
  get activeTeams() {
    return this.teams.filter((t) => !t.isEliminated);
  }
}
```

- [ ] **Step 2: Create `src/managers/TurnManager.js`**

```js
// src/managers/TurnManager.js
import { CONFIG } from '../config.js';

export class TurnManager {
  /**
   * @param {import('./TeamManager.js').TeamManager} teamManager
   * @param {function} onTurnEnd  called when a turn ends
   */
  constructor(teamManager, onTurnEnd) {
    this.teamManager = teamManager;
    this.onTurnEnd = onTurnEnd;

    this.activeTeamIndex = 0;
    this.activeWormIndex = 0;
    this.timeLeft = CONFIG.turnDuration; // seconds
    this.turnActive = true;

    // Wind: random int from windMin to windMax
    this.wind = this._rollWind();
  }

  get activeTeam() {
    return this.teamManager.activeTeams[this.activeTeamIndex % this.teamManager.activeTeams.length];
  }

  get activeWorm() {
    const living = this.activeTeam.livingWorms;
    return living[this.activeWormIndex % living.length];
  }

  _rollWind() {
    return Math.floor(
      Math.random() * (CONFIG.windMax - CONFIG.windMin + 1) + CONFIG.windMin
    );
  }

  /**
   * Call from GameScene.update() every frame.
   * @param {number} delta  ms since last frame
   */
  update(delta) {
    if (!this.turnActive) return;

    this.timeLeft -= delta / 1000;
    if (this.timeLeft <= 0) {
      this.endTurn();
    }
  }

  /** Advance to next team/worm */
  endTurn() {
    if (!this.turnActive) return;
    this.turnActive = false;

    // Deactivate current worm
    this.activeWorm.setActive(false);

    // Advance team
    const teams = this.teamManager.activeTeams;
    this.activeTeamIndex = (this.activeTeamIndex + 1) % teams.length;

    // Advance worm within next team
    const nextTeam = teams[this.activeTeamIndex];
    this.activeWormIndex = (this.activeWormIndex + 1) % nextTeam.livingWorms.length;

    // New wind
    this.wind = this._rollWind();
    this.timeLeft = CONFIG.turnDuration;
    this.turnActive = true;

    // Activate new worm
    this.activeWorm.setActive(true);

    this.onTurnEnd({ team: this.activeTeam, worm: this.activeWorm, wind: this.wind });
  }

  /** Check if the game is over (only 1 team remains) */
  get isGameOver() {
    return this.teamManager.activeTeams.length <= 1;
  }

  get winningTeam() {
    if (!this.isGameOver) return null;
    return this.teamManager.activeTeams[0] ?? null;
  }
}
```

- [ ] **Step 3: Update `GameScene.js` to use both managers**

```js
// src/scenes/GameScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Terrain } from '../entities/Terrain.js';
import { TeamManager } from '../managers/TeamManager.js';
import { TurnManager } from '../managers/TurnManager.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.terrain = new Terrain(this, CONFIG.width, CONFIG.height, CONFIG.terrainSeed);

    // Default to 2 teams for now; MenuScene will pass teamCount in Task 5
    const teamCount = this.scene.settings.data?.teamCount ?? 2;
    this.teamManager = new TeamManager(this, teamCount, this.terrain);
    this.turnManager = new TurnManager(this.teamManager, (info) => this._onTurnEnd(info));

    // Activate first worm
    this.turnManager.activeWorm.setActive(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Debug text
    this.debugText = this.add.text(10, 10, '', { fontSize: '14px', color: '#ffffff' });
  }

  _onTurnEnd({ team, worm, wind }) {
    console.log(`Turn ended. Now: ${team.name} / ${worm.name} / Wind: ${wind}`);
  }

  update(time, delta) {
    const worm = this.turnManager.activeWorm;
    const tm = this.turnManager;

    // Only accept input if turn is active and worm isn't in mid-fire
    if (tm.turnActive && worm && !worm.isDead) {
      if (this.cursors.left.isDown) worm.walk(-1);
      else if (this.cursors.right.isDown) worm.walk(1);
      else worm.stopWalk();

      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) worm.jump();
    }

    // Update all worms
    for (const w of this.teamManager.allWorms) {
      w.update(this.terrain, delta);
    }

    tm.update(delta);

    // Game over check
    if (tm.isGameOver) {
      const winner = tm.winningTeam;
      this.scene.start('MenuScene');
      console.log(`Winner: ${winner?.name ?? 'Nobody'}`);
    }

    // Debug
    this.debugText.setText([
      `Turn: ${tm.activeTeam.name} / ${worm?.name}`,
      `Time: ${Math.ceil(tm.timeLeft)}s`,
      `Wind: ${tm.wind}`,
    ]);
  }
}
```

- [ ] **Step 4: Verify turns cycle**

```bash
npm run dev
```

Expected:
- Two teams of worms (red and blue circles) spawn and fall onto terrain
- Active worm has a white ring — you can move it with arrows
- After 30 seconds the active worm changes (different team's worm gets the ring)
- Debug text in top-left shows team name, timer counting down, and wind value

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: TeamManager + TurnManager — 2-4 teams, turn cycling, timer, wind"
git push
```

---

## Task 5: Menu Scene

**Files:**
- Modify: `src/scenes/MenuScene.js`

- [ ] **Step 1: Replace stub MenuScene with full team setup UI**

```js
// src/scenes/MenuScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = CONFIG;
    let teamCount = 2;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add.text(width / 2, 100, '🐛 HARTWORMS 🐛', {
      fontSize: '64px', color: '#ffdd00', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 170, 'A game by Alek & Cole', {
      fontSize: '20px', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Team count selector
    this.add.text(width / 2, 270, 'Number of Teams', {
      fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5);

    const countText = this.add.text(width / 2, 320, `${teamCount}`, {
      fontSize: '48px', color: '#ffdd00', fontStyle: 'bold',
    }).setOrigin(0.5);

    const btnStyle = { fontSize: '36px', color: '#ffffff', backgroundColor: '#444', padding: { x: 16, y: 8 } };

    this.add.text(width / 2 - 80, 320, '◀', btnStyle).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        teamCount = Math.max(2, teamCount - 1);
        countText.setText(`${teamCount}`);
      });

    this.add.text(width / 2 + 80, 320, '▶', btnStyle).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        teamCount = Math.min(CONFIG.maxTeams, teamCount + 1);
        countText.setText(`${teamCount}`);
      });

    // Team color preview
    const previewY = 420;
    this.add.text(width / 2, previewY - 30, 'Teams:', {
      fontSize: '20px', color: '#aaaaaa',
    }).setOrigin(0.5);

    for (let i = 0; i < CONFIG.maxTeams; i++) {
      const g = this.add.graphics();
      g.fillStyle(CONFIG.teamColors[i], 1);
      g.fillCircle(width / 2 - 90 + i * 60, previewY + 10, 18);
      this.add.text(width / 2 - 90 + i * 60, previewY + 35, CONFIG.teamNames[i], {
        fontSize: '14px', color: '#ffffff',
      }).setOrigin(0.5);
    }

    // Start button
    const startBtn = this.add.text(width / 2, height - 120, 'START GAME', {
      fontSize: '40px', color: '#000000',
      backgroundColor: '#ffdd00',
      padding: { x: 30, y: 14 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { teamCount });
      this.scene.launch('UIScene');
    });

    startBtn.on('pointerover', () => startBtn.setStyle({ backgroundColor: '#ffcc00' }));
    startBtn.on('pointerout', () => startBtn.setStyle({ backgroundColor: '#ffdd00' }));

    // SPACE shortcut
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { teamCount });
      this.scene.launch('UIScene');
    });
  }
}
```

- [ ] **Step 2: Verify menu**

```bash
npm run dev
```

Expected:
- Dark background with yellow "HARTWORMS" title
- Team count selector showing "2" with left/right arrows
- Clicking arrows changes the count (2–4)
- Clicking START GAME or pressing SPACE launches GameScene
- Worm count in game matches selection

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: MenuScene — team count selector, start game flow"
git push
```

---

## Task 6: HUD (UIScene)

**Files:**
- Modify: `src/scenes/UIScene.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Replace stub UIScene with full HUD**

```js
// src/scenes/UIScene.js
import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    const { width } = this.scale;

    // Top-left: team name + worm name + HP
    this.teamLabel = this.add.text(12, 12, '', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' });
    this.hpLabel = this.add.text(12, 34, '', { fontSize: '14px', color: '#aaffaa' });

    // Top-center: turn timer
    this.timerLabel = this.add.text(width / 2, 12, '', {
      fontSize: '28px', color: '#ffdd00', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Top-right: wind
    this.windLabel = this.add.text(width - 12, 12, '', {
      fontSize: '18px', color: '#aaddff',
    }).setOrigin(1, 0);

    // Bottom-right: weapon + ammo
    this.weaponLabel = this.add.text(width - 12, this.scale.height - 12, '', {
      fontSize: '18px', color: '#ffffff',
    }).setOrigin(1, 1);

    // Floating damage number pool
    this._floaters = [];
  }

  /**
   * Called by GameScene each frame with current game state.
   * @param {object} state
   */
  updateHUD(state) {
    const { teamName, teamColor, wormName, hp, timeLeft, wind, weaponName, ammo } = state;

    const hex = '#' + teamColor.toString(16).padStart(6, '0');
    this.teamLabel.setText(teamName).setColor(hex);
    this.hpLabel.setText(`${wormName}  HP: ${hp}`);

    const t = Math.ceil(timeLeft);
    this.timerLabel.setText(`${t}s`);
    this.timerLabel.setColor(t <= 10 ? '#ff4444' : '#ffdd00');

    const windDir = wind > 0 ? '→' : wind < 0 ? '←' : '—';
    this.windLabel.setText(`Wind ${windDir} ${Math.abs(wind)}`);

    const ammoStr = ammo === Infinity ? '∞' : `${ammo}`;
    this.weaponLabel.setText(`${weaponName}  ×${ammoStr}`);
  }

  /**
   * Show a floating damage number at (x, y).
   * @param {number} x
   * @param {number} y
   * @param {number} amount
   */
  showDamage(x, y, amount) {
    const text = this.add.text(x, y, `-${amount}`, {
      fontSize: '20px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1200,
      onComplete: () => text.destroy(),
    });
  }
}
```

- [ ] **Step 2: Update GameScene to drive the HUD**

Add weapon state tracking and HUD calls to `GameScene.js`. Replace the full file:

```js
// src/scenes/GameScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Terrain } from '../entities/Terrain.js';
import { TeamManager } from '../managers/TeamManager.js';
import { TurnManager } from '../managers/TurnManager.js';

const WEAPONS = ['Bazooka', 'Grenade', 'Shotgun', 'Ninja Rope'];

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create(data) {
    this.terrain = new Terrain(this, CONFIG.width, CONFIG.height, CONFIG.terrainSeed);

    const teamCount = data?.teamCount ?? 2;
    this.teamManager = new TeamManager(this, teamCount, this.terrain);
    this.turnManager = new TurnManager(this.teamManager, (info) => this._onTurnEnd(info));
    this.turnManager.activeWorm.setActive(true);

    // Weapon state
    this.weaponIndex = 0;
    this.ammo = { ...CONFIG.ammo };  // copy so we can mutate

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  _ammoKey() {
    return ['bazooka', 'grenade', 'shotgun', 'ninjaRope'][this.weaponIndex];
  }

  _onTurnEnd({ team, worm, wind }) {
    // Reset ammo for the new turn (per-turn ammo)
    this.ammo = { ...CONFIG.ammo };
    this.weaponIndex = 0;
  }

  update(time, delta) {
    const tm = this.turnManager;
    const worm = tm.activeWorm;

    if (tm.turnActive && worm && !worm.isDead) {
      // Movement
      if (this.cursors.left.isDown) worm.walk(-1);
      else if (this.cursors.right.isDown) worm.walk(1);
      else worm.stopWalk();

      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) worm.jump();

      // Weapon switch
      if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
        this.weaponIndex = (this.weaponIndex + WEAPONS.length - 1) % WEAPONS.length;
      }
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.weaponIndex = (this.weaponIndex + 1) % WEAPONS.length;
      }
    }

    // Update all worms
    for (const w of this.teamManager.allWorms) {
      w.update(this.terrain, delta);
    }

    tm.update(delta);

    // Push state to UIScene
    const ui = this.scene.get('UIScene');
    if (ui && worm) {
      const ammoVal = this.ammo[this._ammoKey()];
      ui.updateHUD({
        teamName: tm.activeTeam.name,
        teamColor: tm.activeTeam.color,
        wormName: worm.name,
        hp: worm.hp,
        timeLeft: tm.timeLeft,
        wind: tm.wind,
        weaponName: WEAPONS[this.weaponIndex],
        ammo: ammoVal,
      });
    }

    // Game over
    if (tm.isGameOver) {
      const winner = tm.winningTeam;
      this.add.text(CONFIG.width / 2, CONFIG.height / 2,
        `${winner?.name ?? 'Nobody'} Wins! 🎉`,
        { fontSize: '56px', color: '#ffdd00', fontStyle: 'bold' }
      ).setOrigin(0.5);
      this.time.delayedCall(3000, () => {
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      });
      this.turnManager.turnActive = false;
    }
  }
}
```

- [ ] **Step 3: Verify HUD**

```bash
npm run dev
```

Expected:
- Top-left: team name in team color, worm name + HP
- Top-center: countdown timer in yellow (turns red below 10s)
- Top-right: wind direction and strength
- Bottom-right: weapon name + ammo count
- Q/E cycles through weapon names in bottom-right

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: UIScene HUD — timer, HP, wind, weapon/ammo display, damage floaters"
git push
```

---

## Task 7: Bazooka

**Files:**
- Create: `src/entities/weapons/Bazooka.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create `src/entities/weapons/Bazooka.js`**

```js
// src/entities/weapons/Bazooka.js
import Phaser from 'phaser';
import { CONFIG } from '../../config.js';
import { getWormsInBlast } from '../../utils/PhysicsHelper.js';

export class Bazooka {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('../Terrain.js').Terrain} terrain
   * @param {import('../Worm.js').Worm[]} allWorms
   * @param {number} wind
   * @param {function} onExplode  called with (x, y) when done
   * @param {function} onDamage   called with (worm, amount) for each worm hit
   */
  constructor(scene, terrain, allWorms, wind, onExplode, onDamage) {
    this.scene = scene;
    this.terrain = terrain;
    this.allWorms = allWorms;
    this.wind = wind;
    this.onExplode = onExplode;
    this.onDamage = onDamage;
    this.active = false;
  }

  /**
   * Fire the bazooka from (x, y) in direction of aimVector at the given power.
   * @param {number} x
   * @param {number} y
   * @param {{x:number, y:number}} aimVector  unit vector
   * @param {number} power  0–1
   */
  fire(x, y, aimVector, power) {
    if (this.active) return;
    this.active = true;

    const speed = CONFIG.bazooka.speed * power;
    let vx = aimVector.x * speed;
    let vy = aimVector.y * speed;
    let px = x;
    let py = y;

    // Draw projectile
    const g = this.scene.add.graphics();
    const WIND_FORCE = this.wind * 15; // px/s² per wind unit

    // Use a repeating timer to update projectile position
    const step = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const dt = 0.016;
        vx += WIND_FORCE * dt;
        vy += 300 * dt; // gravity on projectile
        px += vx * dt;
        py += vy * dt;

        g.clear();
        g.fillStyle(0xff8800, 1);
        g.fillCircle(px, py, 5);

        // Check terrain collision
        if (this.terrain.isSolid(px, py) || py > CONFIG.height || px < 0 || px > CONFIG.width) {
          step.remove();
          g.destroy();
          this._explode(px, py);
          return;
        }

        // Check worm collision
        for (const worm of this.allWorms) {
          if (worm.isDead) continue;
          const dx = worm.x - px;
          const dy = worm.y - py;
          if (Math.sqrt(dx * dx + dy * dy) < 14) {
            step.remove();
            g.destroy();
            this._explode(px, py);
            return;
          }
        }
      },
    });
  }

  _explode(x, y) {
    const { blastRadius, damage } = CONFIG.bazooka;

    // Blast terrain
    this.terrain.blast(x, y, blastRadius);

    // Explosion visual
    const g = this.scene.add.graphics();
    g.fillStyle(0xff6600, 0.9);
    g.fillCircle(x, y, blastRadius);
    this.scene.time.delayedCall(200, () => g.destroy());

    // Damage worms in radius
    const hit = getWormsInBlast(this.allWorms, x, y, blastRadius);
    for (const worm of hit) {
      worm.takeDamage(damage);
      worm.knockback(x, y, 300);
      this.onDamage(worm, damage);
    }

    this.active = false;
    this.onExplode(x, y);
  }
}
```

- [ ] **Step 2: Wire Bazooka firing into GameScene**

In `GameScene.js`, add weapon imports and firing logic. Add after the `create()` method's keyboard setup:

```js
// Add inside create(), after key definitions:
this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
this.powerCharge = 0;
this.isCharging = false;
this._currentWeapon = null;
```

Replace the `update()` method in `GameScene.js`:

```js
update(time, delta) {
  const tm = this.turnManager;
  const worm = tm.activeWorm;

  if (tm.turnActive && worm && !worm.isDead && !this._currentWeapon?.active) {
    // Movement
    if (this.cursors.left.isDown) worm.walk(-1);
    else if (this.cursors.right.isDown) worm.walk(1);
    else worm.stopWalk();

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) worm.jump();

    // Aim
    if (this.keyA.isDown) worm.rotateAim(-1);
    if (this.keyD.isDown) worm.rotateAim(1);

    // Weapon switch (only when not airborne)
    if (!worm.state === 'falling') {
      if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
        this.weaponIndex = (this.weaponIndex + WEAPONS.length - 1) % WEAPONS.length;
      }
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.weaponIndex = (this.weaponIndex + 1) % WEAPONS.length;
      }
    }

    // Fire bazooka (weapon index 0)
    if (this.weaponIndex === 0 && this.ammo.bazooka > 0) {
      if (this.spaceKey.isDown && !this.isCharging) {
        this.isCharging = true;
        this.powerCharge = 0;
      }
      if (this.isCharging && this.spaceKey.isDown) {
        this.powerCharge = Math.min(1, this.powerCharge + delta / 1000);
      }
      if (this.isCharging && Phaser.Input.Keyboard.JustUp(this.spaceKey)) {
        this.isCharging = false;
        this.ammo.bazooka--;
        const { Bazooka } = await import('./entities/weapons/Bazooka.js');
        this._currentWeapon = new Bazooka(
          this, this.terrain, this.teamManager.allWorms, tm.wind,
          () => { tm.endTurn(); },
          (hitWorm, dmg) => {
            const ui = this.scene.get('UIScene');
            if (ui) ui.showDamage(hitWorm.x, hitWorm.y - 20, dmg);
          }
        );
        this._currentWeapon.fire(worm.x, worm.y, worm.getAimVector(), this.powerCharge);
      }
    }
  }

  for (const w of this.teamManager.allWorms) w.update(this.terrain, delta);
  tm.update(delta);

  const ui = this.scene.get('UIScene');
  if (ui && worm) {
    ui.updateHUD({
      teamName: tm.activeTeam.name,
      teamColor: tm.activeTeam.color,
      wormName: worm.name,
      hp: worm.hp,
      timeLeft: tm.timeLeft,
      wind: tm.wind,
      weaponName: WEAPONS[this.weaponIndex],
      ammo: this.ammo[this._ammoKey()],
    });
  }

  if (tm.isGameOver) {
    const winner = tm.winningTeam;
    this.add.text(CONFIG.width / 2, CONFIG.height / 2,
      `${winner?.name ?? 'Nobody'} Wins! 🎉`,
      { fontSize: '56px', color: '#ffdd00', fontStyle: 'bold' }
    ).setOrigin(0.5);
    this.time.delayedCall(3000, () => {
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
    this.turnManager.turnActive = false;
  }
}
```

> **Note:** Dynamic `import()` in update() is not ideal — in Task 8 you will refactor all weapon imports to be static at the top of GameScene.js. For now, add static imports at the top of the file:

```js
import { Bazooka } from '../entities/weapons/Bazooka.js';
```

And replace the dynamic import in update() with:
```js
this._currentWeapon = new Bazooka( ... );
```

- [ ] **Step 3: Verify bazooka**

```bash
npm run dev
```

Expected:
- Hold SPACE to charge (longer = faster projectile)
- Release SPACE to fire an orange dot on an arcing path
- Wind pushes the projectile left or right
- Hitting terrain blasts a circular hole; worms fall through craters
- Hitting a worm does 50 damage (red floating number) and knocks it back
- After firing, turn ends automatically

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Bazooka — arcing projectile, wind, terrain blast, worm damage"
git push
```

---

## Task 8: Grenade

**Files:**
- Create: `src/entities/weapons/Grenade.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create `src/entities/weapons/Grenade.js`**

```js
// src/entities/weapons/Grenade.js
import Phaser from 'phaser';
import { CONFIG } from '../../config.js';
import { getWormsInBlast } from '../../utils/PhysicsHelper.js';

export class Grenade {
  constructor(scene, terrain, allWorms, onExplode, onDamage) {
    this.scene = scene;
    this.terrain = terrain;
    this.allWorms = allWorms;
    this.onExplode = onExplode;
    this.onDamage = onDamage;
    this.active = false;
  }

  fire(x, y, aimVector, power) {
    if (this.active) return;
    this.active = true;

    const speed = 400 * power;
    let vx = aimVector.x * speed;
    let vy = aimVector.y * speed;
    let px = x;
    let py = y;
    let fuse = CONFIG.grenade.fuseTime; // ms remaining

    const g = this.scene.add.graphics();
    const fuseText = this.scene.add.text(px, py - 20, '3', {
      fontSize: '16px', color: '#ffdd00', fontStyle: 'bold',
    }).setOrigin(0.5);

    const step = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const dt = 0.016;
        vy += 400 * dt; // gravity

        // Try to move; bounce off terrain
        const nextX = px + vx * dt;
        const nextY = py + vy * dt;

        if (this.terrain.isSolid(nextX, nextY)) {
          // Simple bounce: reflect velocity, apply elasticity
          const hitH = this.terrain.isSolid(nextX, py);
          const hitV = this.terrain.isSolid(px, nextY);
          if (hitH) vx *= -CONFIG.grenade.bounce;
          if (hitV) vy *= -CONFIG.grenade.bounce;
        } else {
          px = nextX;
          py = nextY;
        }

        fuse -= 16;
        const secLeft = Math.ceil(fuse / 1000);

        g.clear();
        g.fillStyle(0x44cc44, 1);
        g.fillCircle(px, py, 8);
        fuseText.setPosition(px, py - 20).setText(`${secLeft}`);

        // Off-screen safety
        if (py > CONFIG.height + 50) {
          step.remove();
          g.destroy();
          fuseText.destroy();
          this.active = false;
          this.onExplode(px, py);
          return;
        }

        if (fuse <= 0) {
          step.remove();
          g.destroy();
          fuseText.destroy();
          this._explode(px, py);
        }
      },
    });
  }

  _explode(x, y) {
    const { blastRadius, damage } = CONFIG.grenade;
    this.terrain.blast(x, y, blastRadius);

    const g = this.scene.add.graphics();
    g.fillStyle(0xff6600, 0.9);
    g.fillCircle(x, y, blastRadius);
    this.scene.time.delayedCall(200, () => g.destroy());

    const hit = getWormsInBlast(this.allWorms, x, y, blastRadius);
    for (const worm of hit) {
      worm.takeDamage(damage);
      worm.knockback(x, y, 300);
      this.onDamage(worm, damage);
    }

    this.active = false;
    this.onExplode(x, y);
  }
}
```

- [ ] **Step 2: Add Grenade to GameScene**

At the top of `GameScene.js`, add:
```js
import { Grenade } from '../entities/weapons/Grenade.js';
```

In `update()`, after the bazooka firing block (weaponIndex === 0), add:

```js
// Grenade (weapon index 1)
if (this.weaponIndex === 1 && this.ammo.grenade > 0) {
  if (this.spaceKey.isDown && !this.isCharging) {
    this.isCharging = true;
    this.powerCharge = 0;
  }
  if (this.isCharging && this.spaceKey.isDown) {
    this.powerCharge = Math.min(1, this.powerCharge + delta / 1000);
  }
  if (this.isCharging && Phaser.Input.Keyboard.JustUp(this.spaceKey)) {
    this.isCharging = false;
    this.ammo.grenade--;
    this._currentWeapon = new Grenade(
      this, this.terrain, this.teamManager.allWorms,
      () => { tm.endTurn(); },
      (hitWorm, dmg) => {
        const ui = this.scene.get('UIScene');
        if (ui) ui.showDamage(hitWorm.x, hitWorm.y - 20, dmg);
      }
    );
    this._currentWeapon.fire(worm.x, worm.y, worm.getAimVector(), this.powerCharge);
  }
}
```

- [ ] **Step 3: Verify grenade**

```bash
npm run dev
```

Switch to Grenade with E. Expected:
- Hold SPACE to charge, release to throw a green ball
- Grenade bounces off terrain with countdown (3, 2, 1) shown above it
- Explodes after 3 seconds with same blast as bazooka
- No wind effect on grenade

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Grenade — bouncy, fuse countdown, blast on detonation"
git push
```

---

## Task 9: Shotgun

**Files:**
- Create: `src/entities/weapons/Shotgun.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create `src/entities/weapons/Shotgun.js`**

```js
// src/entities/weapons/Shotgun.js
import { CONFIG } from '../../config.js';
import { toRad } from '../../utils/PhysicsHelper.js';

export class Shotgun {
  constructor(scene, terrain, allWorms, onFired, onDamage) {
    this.scene = scene;
    this.terrain = terrain;
    this.allWorms = allWorms;
    this.onFired = onFired;
    this.onDamage = onDamage;
    this.active = false;
  }

  fire(x, y, aimVector) {
    if (this.active) return;
    this.active = true;

    const { pellets, spread, damage, knockback } = CONFIG.shotgun;
    const baseAngle = Math.atan2(aimVector.y, aimVector.x); // radians

    for (let i = 0; i < pellets; i++) {
      // Spread pellets evenly across the spread arc
      const spreadOffset = toRad(spread) * ((i / (pellets - 1 || 1)) - 0.5);
      const angle = baseAngle + spreadOffset;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      this._castRay(x, y, dx, dy, damage, knockback);
    }

    this.active = false;
    // Shotgun ends turn immediately after firing
    this.scene.time.delayedCall(300, () => this.onFired());
  }

  /** Cast a ray, find the first worm or terrain hit, draw tracer line */
  _castRay(ox, oy, dx, dy, damage, knockback) {
    const MAX_DIST = 600;
    const STEP = 4;

    let hitWorm = null;
    let hitX = ox;
    let hitY = oy;

    for (let d = 0; d < MAX_DIST; d += STEP) {
      const cx = ox + dx * d;
      const cy = oy + dy * d;

      if (this.terrain.isSolid(cx, cy) || cx < 0 || cx > CONFIG.width || cy > CONFIG.height) {
        hitX = cx;
        hitY = cy;
        break;
      }

      // Check worm collision
      for (const worm of this.allWorms) {
        if (worm.isDead) continue;
        const wx = worm.x - cx;
        const wy = worm.y - cy;
        if (Math.sqrt(wx * wx + wy * wy) < 14) {
          hitWorm = worm;
          hitX = cx;
          hitY = cy;
          break;
        }
      }
      if (hitWorm) break;
      hitX = cx;
      hitY = cy;
    }

    // Draw tracer line
    const g = this.scene.add.graphics();
    g.lineStyle(1, 0xffff88, 0.7);
    g.beginPath();
    g.moveTo(ox, oy);
    g.lineTo(hitX, hitY);
    g.strokePath();
    this.scene.time.delayedCall(150, () => g.destroy());

    if (hitWorm) {
      hitWorm.takeDamage(damage);
      hitWorm.knockback(ox, oy, knockback);
      this.onDamage(hitWorm, damage);
    }
  }
}
```

- [ ] **Step 2: Add Shotgun to GameScene**

At top of `GameScene.js`:
```js
import { Shotgun } from '../entities/weapons/Shotgun.js';
```

In `update()`, after the Grenade block (weaponIndex === 1), add:

```js
// Shotgun (weapon index 2)
if (this.weaponIndex === 2 && this.ammo.shotgun > 0 && worm.state !== 'falling') {
  if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
    this.ammo.shotgun--;
    this._currentWeapon = new Shotgun(
      this, this.terrain, this.teamManager.allWorms,
      () => { tm.endTurn(); },
      (hitWorm, dmg) => {
        const ui = this.scene.get('UIScene');
        if (ui) ui.showDamage(hitWorm.x, hitWorm.y - 20, dmg);
      }
    );
    this._currentWeapon.fire(worm.x, worm.y, worm.getAimVector());
  }
}
```

- [ ] **Step 3: Verify shotgun**

```bash
npm run dev
```

Switch to Shotgun with E (weapon index 2). Expected:
- Press SPACE: 3 faint tracer lines fan out in the aim direction
- Worms hit by a pellet take 15 damage each and get knocked back
- No terrain blast (tracers stop at terrain)
- Turn ends after short delay

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Shotgun — raycast pellets, spread, knockback, tracer lines"
git push
```

---

## Task 10: Ninja Rope

**Files:**
- Create: `src/entities/weapons/NinjaRope.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create `src/entities/weapons/NinjaRope.js`**

```js
// src/entities/weapons/NinjaRope.js
import Phaser from 'phaser';
import { CONFIG } from '../../config.js';

export class NinjaRope {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('../Terrain.js').Terrain} terrain
   * @param {import('../Worm.js').Worm} worm  the worm using the rope
   * @param {function} onDetach  called when rope releases
   */
  constructor(scene, terrain, worm, onDetach) {
    this.scene = scene;
    this.terrain = terrain;
    this.worm = worm;
    this.onDetach = onDetach;
    this.active = false;

    // Rope state
    this.anchorX = 0;
    this.anchorY = 0;
    this.ropeLength = 0;
    this.angle = 0;         // radians from anchor, where 0 = straight down
    this.angularVel = 0;    // radians/sec

    this.graphics = scene.add.graphics();
  }

  /** Fire grapple in aimVector direction */
  fire(aimVector) {
    if (this.active) return;

    // Shoot the hook: step along aimVector until terrain hit or max length
    const ox = this.worm.x;
    const oy = this.worm.y;
    const STEP = 4;
    let foundAnchor = false;

    for (let d = 20; d <= CONFIG.ninjaRope.maxLength; d += STEP) {
      const cx = ox + aimVector.x * d;
      const cy = oy + aimVector.y * d;

      if (this.terrain.isSolid(cx, cy)) {
        this.anchorX = cx;
        this.anchorY = cy;
        this.ropeLength = d;
        foundAnchor = true;
        break;
      }
    }

    if (!foundAnchor) return; // missed

    // Compute initial angle (worm relative to anchor)
    const dx = ox - this.anchorX;
    const dy = oy - this.anchorY;
    this.angle = Math.atan2(dx, -dy); // angle from anchor's "down"
    this.angularVel = 0;
    this.active = true;

    // Disable worm's normal physics while swinging
    this.worm.vx = 0;
    this.worm.vy = 0;
  }

  /** Call from GameScene.update() while rope is active */
  update(delta) {
    if (!this.active) return;

    const dt = delta / 1000;
    const GRAVITY = 500;
    const SWING_DAMPING = 0.998;
    const { swingSpeed } = CONFIG.ninjaRope;

    // Pendulum: angular acceleration = -(g / L) * sin(angle)
    const angularAccel = -(GRAVITY / this.ropeLength) * Math.sin(this.angle);
    this.angularVel += angularAccel * dt;
    this.angularVel *= SWING_DAMPING;
    this.angle += this.angularVel * dt;

    // Player can pump the swing
    const scene = this.scene;
    if (scene.cursors?.left.isDown) this.angularVel -= swingSpeed * dt;
    if (scene.cursors?.right.isDown) this.angularVel += swingSpeed * dt;

    // Compute worm position from anchor + angle
    this.worm.x = this.anchorX + Math.sin(this.angle) * this.ropeLength;
    this.worm.y = this.anchorY - Math.cos(this.angle) * this.ropeLength;

    // Draw rope
    this.graphics.clear();
    this.graphics.lineStyle(2, 0xdddddd, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(this.anchorX, this.anchorY);
    this.graphics.lineTo(this.worm.x, this.worm.y);
    this.graphics.strokePath();

    // Anchor dot
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(this.anchorX, this.anchorY, 4);
  }

  /** Release the rope — worm flies off at current angular velocity */
  release() {
    if (!this.active) return;
    this.active = false;
    this.graphics.clear();

    // Convert angular velocity to linear velocity
    const tangentX = Math.cos(this.angle);
    const tangentY = Math.sin(this.angle);
    this.worm.vx = tangentX * this.angularVel * this.ropeLength;
    this.worm.vy = tangentY * this.angularVel * this.ropeLength;
    this.worm.state = 'falling';

    this.onDetach();
  }

  destroy() {
    this.graphics.clear();
    this.graphics.destroy();
    this.active = false;
  }
}
```

- [ ] **Step 2: Add NinjaRope to GameScene**

At top of `GameScene.js`:
```js
import { NinjaRope } from '../entities/weapons/NinjaRope.js';
```

Add to `create()` after existing key definitions:
```js
this._rope = null;
```

In `update()`, after the Shotgun block (weaponIndex === 2), add:

```js
// Ninja Rope (weapon index 3)
if (this.weaponIndex === 3) {
  // If rope active, handle swing and release
  if (this._rope && this._rope.active) {
    this._rope.update(delta);
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this._rope.release();
      this._rope = null;
      // Rope doesn't end turn — worm gets to land and move again
    }
  } else if (!this._rope?.active) {
    // Fire rope on SPACE
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this._rope = new NinjaRope(
        this, this.terrain, worm,
        () => { /* no turn end on release */ }
      );
      this._rope.fire(worm.getAimVector());
    }
  }
}
// Skip normal worm physics while rope is active (rope controls worm position)
```

Also skip `worm.update()` while rope is swinging — replace the allWorms update loop:

```js
for (const w of this.teamManager.allWorms) {
  // Skip physics for the active worm while swinging on rope
  if (w === worm && this._rope?.active) continue;
  w.update(this.terrain, delta);
}
```

- [ ] **Step 3: Verify ninja rope**

```bash
npm run dev
```

Switch to Ninja Rope with E (weapon index 3). Expected:
- Press SPACE: grapple shoots in aim direction, sticks to terrain
- A white line appears from anchor point to worm
- Worm swings as a pendulum; Left/Right arrows pump the swing
- Press SPACE again: worm releases and flies off in the swing direction
- Rope can be re-fired after landing

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: NinjaRope — pendulum physics, player-pumped swing, launch on release"
git push
```

---

## Task 11: Win Condition & Game Polish

**Files:**
- Modify: `src/scenes/GameScene.js`
- Modify: `src/scenes/UIScene.js`

- [ ] **Step 1: Add power bar to UIScene**

In `UIScene.create()`, add after weaponLabel:

```js
// Power bar (shown while charging)
this.powerBarBg = this.add.rectangle(width / 2, this.scale.height - 20, 200, 16, 0x333333).setOrigin(0.5, 0.5);
this.powerBarFill = this.add.rectangle(width / 2 - 100, this.scale.height - 20, 0, 14, 0xff4400).setOrigin(0, 0.5);
this.powerBarBg.setVisible(false);
this.powerBarFill.setVisible(false);
```

Add to `updateHUD()` — accept a `power` field:
```js
// Inside updateHUD(), after existing lines:
const showPower = state.power != null;
this.powerBarBg.setVisible(showPower);
this.powerBarFill.setVisible(showPower);
if (showPower) {
  this.powerBarFill.width = (state.power ?? 0) * 200;
}
```

- [ ] **Step 2: Pass power to HUD in GameScene**

In the `updateHUD()` call inside `GameScene.update()`, add:
```js
power: this.isCharging ? this.powerCharge : null,
```

- [ ] **Step 3: Win screen polish**

Replace the inline win-screen text in `GameScene.update()` with a styled panel:

```js
if (tm.isGameOver) {
  const winner = tm.winningTeam;
  const cx = CONFIG.width / 2;
  const cy = CONFIG.height / 2;

  // Dark overlay
  const overlay = this.add.rectangle(cx, cy, CONFIG.width, CONFIG.height, 0x000000, 0.6);

  // Panel
  this.add.rectangle(cx, cy, 500, 200, 0x1a1a2e).setOrigin(0.5);
  this.add.rectangle(cx, cy, 496, 196, 0x2a2a4e).setOrigin(0.5);

  const winColor = winner ? '#' + winner.color.toString(16).padStart(6, '0') : '#ffffff';
  this.add.text(cx, cy - 40, winner ? `${winner.name} Wins! 🎉` : 'Draw!', {
    fontSize: '48px', color: winColor, fontStyle: 'bold',
  }).setOrigin(0.5);

  this.add.text(cx, cy + 20, 'Returning to menu...', {
    fontSize: '20px', color: '#aaaaaa',
  }).setOrigin(0.5);

  this.time.delayedCall(3000, () => {
    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
  });

  this.turnManager.turnActive = false;
}
```

- [ ] **Step 4: Full playtest**

```bash
npm run dev
```

Play a full 2-player game to completion. Verify:
- [ ] Menu → 2 teams → START GAME works
- [ ] Worms spawn and land on terrain
- [ ] All 4 weapons fire correctly
- [ ] Bazooka: arc + wind effect + terrain blast + worm damage
- [ ] Grenade: bounces + fuse countdown + blast
- [ ] Shotgun: tracer lines + knockback
- [ ] Ninja rope: grapple + swing + release
- [ ] Turn timer counts down and advances turn at 0
- [ ] Damage numbers float up on hit
- [ ] Power bar shows when charging
- [ ] Worm HP reaches 0 → tombstone marker
- [ ] Last team standing → win screen → menu

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: win screen, power bar HUD, full game loop complete"
git push
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Web browser target | Task 1 (Vite) |
| Phaser.js | Task 1 |
| 2–4 local players | Task 4 (TeamManager), Task 5 (MenuScene) |
| Turn-based + 30s timer | Task 4 (TurnManager) |
| Destructible terrain | Task 2 (Terrain.blast) |
| Worm HP + state machine | Task 3 (Worm) |
| Wind (bazooka only) | Task 4 (wind roll), Task 7 (Bazooka) |
| Bazooka | Task 7 |
| Grenade | Task 8 |
| Shotgun | Task 9 |
| Ninja rope | Task 10 |
| HUD (HP, timer, wind, weapon, ammo) | Task 6 |
| Floating damage numbers | Task 6 (UIScene.showDamage) |
| CONFIG single source of truth | Task 1 |
| Cole's tuning zone comments | Task 1 (config.js) |
| Win condition + return to menu | Task 11 |
| Worm falls off map → dead | Task 3 (Worm.update) |
| terrainSeed replay | Task 2 (Terrain constructor) |

All spec requirements covered. No gaps found.
