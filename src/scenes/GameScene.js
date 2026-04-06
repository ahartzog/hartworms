import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  create() {
    this.add.text(100, 100, 'Game Scene — coming soon', { fontSize: '32px', color: '#ffffff' });
  }
}
