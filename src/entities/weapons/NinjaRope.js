// src/entities/weapons/NinjaRope.js
import Phaser from 'phaser';
import { CONFIG } from '../../config.js';

export class NinjaRope {
  constructor(scene, terrain, worm, onDetach) {
    this.scene = scene;
    this.terrain = terrain;
    this.worm = worm;
    this.onDetach = onDetach;
    this.active = false;

    this.anchorX = 0;
    this.anchorY = 0;
    this.ropeLength = 0;
    this.angle = 0;
    this.angularVel = 0;

    this.graphics = scene.add.graphics();
  }

  fire(aimVector) {
    if (this.active) return;

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

    if (!foundAnchor) return;

    const dx = ox - this.anchorX;
    const dy = oy - this.anchorY;
    this.angle = Math.atan2(dx, dy);
    this.angularVel = 0;
    this.active = true;

    this.worm.vx = 0;
    this.worm.vy = 0;
  }

  update(delta) {
    if (!this.active) return;

    const dt = delta / 1000;
    const GRAVITY = 500;
    const SWING_DAMPING = 0.998;
    const { swingSpeed } = CONFIG.ninjaRope;

    const angularAccel = -(GRAVITY / this.ropeLength) * Math.sin(this.angle);
    this.angularVel += angularAccel * dt;
    this.angularVel *= SWING_DAMPING;
    this.angle += this.angularVel * dt;

    const scene = this.scene;
    if (scene.cursors?.left.isDown) this.angularVel -= swingSpeed * dt;
    if (scene.cursors?.right.isDown) this.angularVel += swingSpeed * dt;

    this.worm.x = this.anchorX + Math.sin(this.angle) * this.ropeLength;
    this.worm.y = this.anchorY + Math.cos(this.angle) * this.ropeLength;

    this.graphics.clear();
    this.graphics.lineStyle(2, 0xdddddd, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(this.anchorX, this.anchorY);
    this.graphics.lineTo(this.worm.x, this.worm.y);
    this.graphics.strokePath();

    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(this.anchorX, this.anchorY, 4);
  }

  release() {
    if (!this.active) return;
    this.active = false;
    this.graphics.destroy();

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
