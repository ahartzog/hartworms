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
