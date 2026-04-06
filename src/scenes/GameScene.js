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
