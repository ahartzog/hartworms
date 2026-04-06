// src/entities/Worm.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';

export const WormState = {
  IDLE: 'idle',
  MOVING: 'moving',
  AIMING: 'aiming',
  FIRING: 'firing',
  FALLING: 'falling',
  DEAD: 'dead',
};

export class Worm {
  constructor(scene, x, y, teamColor, name) {
    this.scene = scene;
    this.name = name;
    this.hp = CONFIG.wormHP;
    this.state = WormState.IDLE;
    this.isActive = false;
    this.facingRight = true;

    this.vx = 0;
    this.vy = 0;

    this.aimAngle = 45;

    this.graphics = scene.add.graphics();
    this.x = x;
    this.y = y;
    this._draw(teamColor);

    this.teamColor = teamColor;
    this._color = teamColor;
  }

  get isDead() { return this.state === WormState.DEAD; }

  _draw(color) {
    this.graphics.clear();
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(this.x, this.y, 12);
    this.graphics.fillStyle(0xffffff, 1);
    const eyeOffX = this.facingRight ? 4 : -4;
    this.graphics.fillCircle(this.x + eyeOffX, this.y - 3, 3);
    this.graphics.fillStyle(0x000000, 1);
    this.graphics.fillCircle(this.x + eyeOffX + (this.facingRight ? 1 : -1), this.y - 3, 1.5);
    if (this.isActive) {
      this.graphics.lineStyle(2, 0xffffff, 1);
      this.graphics.strokeCircle(this.x, this.y, 15);
    }
  }

  update(terrain, delta) {
    if (this.isDead) return;

    const dt = delta / 1000;
    const GRAVITY = CONFIG.gravity.worm;
    const WORM_RADIUS = 12;

    this.vy += GRAVITY * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const feetY = this.y + WORM_RADIUS;
    if (terrain.isSolid(this.x, feetY) && this.vy >= 0) {
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

    if (this.y > terrain.height + 50) {
      this.die();
    }

    this._draw(this._color);
  }

  walk(direction) {
    if (this.state === WormState.FALLING || this.isDead) return;
    this.vx = direction * 100;
    this.facingRight = direction > 0;
    this.state = WormState.MOVING;
  }

  stopWalk() {
    this.vx = 0;
    if (this.state === WormState.MOVING) this.state = WormState.IDLE;
  }

  jump() {
    if (this.state === WormState.FALLING || this.isDead) return;
    this.vy = -350;
    this.state = WormState.FALLING;
  }

  rotateAim(direction) {
    this.aimAngle = Phaser.Math.Clamp(this.aimAngle + direction * 2, -85, 85);
  }

  getAimVector() {
    const angle = this.facingRight
      ? -this.aimAngle
      : -(180 - this.aimAngle);
    const rad = Phaser.Math.DegToRad(angle);
    return { x: Math.cos(rad), y: Math.sin(rad) };
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) this.die();
  }

  die() {
    this.state = WormState.DEAD;
    this.graphics.destroy();
    const g = this.scene.add.graphics();
    g.fillStyle(0x888888, 1);
    g.fillRect(this.x - 4, this.y - 16, 8, 16);
    g.fillRect(this.x - 8, this.y - 20, 16, 6);
  }

  setActive(active) {
    this.isActive = active;
    this._draw(this._color);
  }

  knockback(ox, oy, force) {
    const dx = this.x - ox;
    const dy = this.y - oy;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx += (dx / d) * force;
    this.vy += (dy / d) * force;
    this.state = WormState.FALLING;
  }
}
