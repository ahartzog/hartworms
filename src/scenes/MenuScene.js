// src/scenes/MenuScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = CONFIG;
    let teamCount = 2;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add.text(width / 2, 100, '🐛 HARTWORMS 🐛', {
      fontSize: '64px', color: '#ffdd00', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 170, 'A game by Alek & Cole', {
      fontSize: '20px', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Team count selector
    this.add.text(width / 2, 270, 'Number of Teams', {
      fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5);

    const countText = this.add.text(width / 2, 320, `${teamCount}`, {
      fontSize: '48px', color: '#ffdd00', fontStyle: 'bold',
    }).setOrigin(0.5);

    const btnStyle = { fontSize: '36px', color: '#ffffff', backgroundColor: '#444', padding: { x: 16, y: 8 } };

    this.add.text(width / 2 - 80, 320, '◀', btnStyle).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        teamCount = Math.max(2, teamCount - 1);
        countText.setText(`${teamCount}`);
      });

    this.add.text(width / 2 + 80, 320, '▶', btnStyle).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        teamCount = Math.min(CONFIG.maxTeams, teamCount + 1);
        countText.setText(`${teamCount}`);
      });

    // Team color preview
    const previewY = 420;
    this.add.text(width / 2, previewY - 30, 'Teams:', {
      fontSize: '20px', color: '#aaaaaa',
    }).setOrigin(0.5);

    for (let i = 0; i < CONFIG.maxTeams; i++) {
      const g = this.add.graphics();
      g.fillStyle(CONFIG.teamColors[i], 1);
      g.fillCircle(width / 2 - 90 + i * 60, previewY + 10, 18);
      this.add.text(width / 2 - 90 + i * 60, previewY + 35, CONFIG.teamNames[i], {
        fontSize: '14px', color: '#ffffff',
      }).setOrigin(0.5);
    }

    // Start button
    const startBtn = this.add.text(width / 2, height - 120, 'START GAME', {
      fontSize: '40px', color: '#000000',
      backgroundColor: '#ffdd00',
      padding: { x: 30, y: 14 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerdown', () => {
      this.scene.launch('UIScene');
      this.scene.start('GameScene', { teamCount });
    });

    const btnBaseStyle = {
      fontSize: '40px', color: '#000000',
      backgroundColor: '#ffdd00',
      padding: { x: 30, y: 14 },
      fontStyle: 'bold',
    };
    startBtn.on('pointerover', () => startBtn.setStyle({ ...btnBaseStyle, backgroundColor: '#ffcc00' }));
    startBtn.on('pointerout',  () => startBtn.setStyle(btnBaseStyle));

    // SPACE shortcut
    const onSpace = () => {
      this.scene.launch('UIScene');
      this.scene.start('GameScene', { teamCount });
    };
    this.input.keyboard.on('keydown-SPACE', onSpace);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown-SPACE', onSpace));
  }
}
