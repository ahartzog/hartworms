// src/entities/weapons/Bazooka.js
import Phaser from 'phaser';
import { CONFIG } from '../../config.js';
import { getWormsInBlast } from '../../utils/PhysicsHelper.js';

export class Bazooka {
  constructor(scene, terrain, allWorms, wind, onExplode, onDamage) {
    this.scene = scene;
    this.terrain = terrain;
    this.allWorms = allWorms;
    this.wind = wind;
    this.onExplode = onExplode;
    this.onDamage = onDamage;
    this.active = false;
  }

  fire(x, y, aimVector, power) {
    if (this.active) return;
    this.active = true;

    const speed = CONFIG.bazooka.speed * power;
    let vx = aimVector.x * speed;
    let vy = aimVector.y * speed;
    let px = x;
    let py = y;

    const g = this.scene.add.graphics();
    const WIND_FORCE = this.wind * 15;

    const step = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const dt = 0.016;
        vx += WIND_FORCE * dt;
        vy += CONFIG.gravity.bazooka * dt;
        px += vx * dt;
        py += vy * dt;

        g.clear();
        g.fillStyle(0xff8800, 1);
        g.fillCircle(px, py, 5);

        if (this.terrain.isSolid(px, py) || py > CONFIG.height || px < 0 || px > CONFIG.width) {
          step.remove();
          g.destroy();
          this._explode(px, py);
          return;
        }

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
