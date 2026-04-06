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
    let fuse = CONFIG.grenade.fuseTime;

    const g = this.scene.add.graphics();
    const fuseText = this.scene.add.text(px, py - 20, '3', {
      fontSize: '16px', color: '#ffdd00', fontStyle: 'bold',
    }).setOrigin(0.5);

    const step = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const dt = 0.016;
        vy += 400 * dt;

        const nextX = px + vx * dt;
        const nextY = py + vy * dt;

        if (this.terrain.isSolid(nextX, nextY)) {
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
