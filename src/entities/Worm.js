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
  constructor(scene, x, y, teamColor, name, spritePrefix = 'pink') {
    this.scene = scene;
    this.name = name;
    this.hp = CONFIG.wormHP;
    this.state = WormState.IDLE;
    this.isActive = false;
    this.facingRight = true;
    this.vx = 0;
    this.vy = 0;
    this.aimAngle = 45;
    this.teamColor = teamColor;
    this._color = teamColor;
    this._spritePrefix = spritePrefix;
    this.x = x;
    this.y = y;

    // Sprite instead of graphics
    this.sprite = scene.add.sprite(x, y, `${spritePrefix}_idle`).setScale(1.5).setOrigin(0.5, 0.5);
    this.sprite.play(`${spritePrefix}_idle`);

    // Active ring graphic (separate from sprite)
    this.graphics = scene.add.graphics();

    // HP bar background
    this.hpBarBg = scene.add.graphics();
    this.hpBarFill = scene.add.graphics();

    // Name label
    this.nameLabel = scene.add.text(x, y - 28, name, {
      fontSize: '10px', color: '#ffffff',
    }).setOrigin(0.5, 1);
  }

  get isDead() { return this.state === WormState.DEAD; }

  _draw(color) {
    // Update sprite position and facing
    this.sprite.setPosition(this.x, this.y);
    this.sprite.setFlipX(!this.facingRight);

    // Play animation based on state
    const prefix = this._spritePrefix;
    const state = this.state;
    if (state === WormState.FALLING) {
      if (!this.sprite.anims.currentAnim?.key.startsWith(prefix + '_jump')) {
        this.sprite.play(`${prefix}_jump`, true);
      }
    } else if (state === WormState.MOVING) {
      if (!this.sprite.anims.currentAnim?.key.startsWith(prefix + '_walk')) {
        this.sprite.play(`${prefix}_walk`, true);
      }
    } else {
      if (!this.sprite.anims.currentAnim?.key.startsWith(prefix + '_idle')) {
        this.sprite.play(`${prefix}_idle`, true);
      }
    }

    // Active ring
    this.graphics.clear();
    if (this.isActive) {
      this.graphics.lineStyle(2, 0xffffff, 1);
      this.graphics.strokeCircle(this.x, this.y, 18);

      // Aim indicator
      const aim = this.getAimVector();
      const LINE_START = 20;
      const LINE_END = 65;
      const DOT_SPACING = 8;
      this.graphics.fillStyle(0xffff00, 0.9);
      for (let d = LINE_START; d < LINE_END - 10; d += DOT_SPACING) {
        this.graphics.fillCircle(this.x + aim.x * d, this.y + aim.y * d, 2);
      }
      const tipX = this.x + aim.x * LINE_END;
      const tipY = this.y + aim.y * LINE_END;
      const perpX = -aim.y;
      const perpY = aim.x;
      const A = 6;
      this.graphics.fillStyle(0xffff00, 1);
      this.graphics.fillTriangle(
        tipX, tipY,
        tipX - aim.x * A + perpX * A * 0.5, tipY - aim.y * A + perpY * A * 0.5,
        tipX - aim.x * A - perpX * A * 0.5, tipY - aim.y * A - perpY * A * 0.5
      );
    }

    // HP bar (above sprite)
    this.hpBarBg.clear();
    this.hpBarFill.clear();
    const barW = 24;
    const barH = 3;
    const barX = this.x - barW / 2;
    const barY = this.y - 26;
    this.hpBarBg.fillStyle(0x333333, 1);
    this.hpBarBg.fillRect(barX, barY, barW, barH);
    const pct = this.hp / CONFIG.wormHP;
    const fillColor = pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffaa00 : 0xff3333;
    this.hpBarFill.fillStyle(fillColor, 1);
    this.hpBarFill.fillRect(barX, barY, barW * pct, barH);

    // Name label
    this.nameLabel.setPosition(this.x, this.y - 29);
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

    // Hard map boundaries — bounce off sides, die only if below map
    if (this.x < WORM_RADIUS) {
      this.x = WORM_RADIUS;
      this.vx = Math.abs(this.vx) * 0.5;
    } else if (this.x > terrain.width - WORM_RADIUS) {
      this.x = terrain.width - WORM_RADIUS;
      this.vx = -Math.abs(this.vx) * 0.5;
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
    this.sprite.play(`${this._spritePrefix}_death`);
    this.sprite.once('animationcomplete', () => {
      this.sprite.setVisible(false);
    });
    this.graphics.clear();
    this.hpBarBg.clear();
    this.hpBarFill.clear();
    this.nameLabel.setVisible(false);
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
