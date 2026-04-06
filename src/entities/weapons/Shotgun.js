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
    const baseAngle = Math.atan2(aimVector.y, aimVector.x);

    for (let i = 0; i < pellets; i++) {
      const spreadOffset = toRad(spread) * ((i / (pellets - 1 || 1)) - 0.5);
      const angle = baseAngle + spreadOffset;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      this._castRay(x, y, dx, dy, damage, knockback);
    }

    this.scene.time.delayedCall(300, () => {
      this.active = false;
      this.onFired();
    });
  }

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
