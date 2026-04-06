// src/scenes/GameScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Terrain } from '../entities/Terrain.js';
import { Worm, WormState } from '../entities/Worm.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.terrain = new Terrain(this, CONFIG.width, CONFIG.height, CONFIG.terrainSeed);

    this.testWorm = new Worm(this, 200, 100, 0xff4444, 'Test Worm');
    this.testWorm.setActive(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  update(time, delta) {
    const worm = this.testWorm;

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
