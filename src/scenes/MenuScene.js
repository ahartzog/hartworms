// src/scenes/MenuScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';

const SPRITE_PREFIXES = ['pink', 'owlet', 'dude', 'pink'];
const BASE = 'assets/craftpix-net-622999-free-pixel-art-tiny-hero-sprites';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  preload() {
    // Only need idle sheets for the menu preview
    const idlePaths = {
      pink:  `${BASE}/1 Pink_Monster/Pink_Monster_Idle_4.png`,
      owlet: `${BASE}/2 Owlet_Monster/Owlet_Monster_Idle_4.png`,
      dude:  `${BASE}/3 Dude_Monster/Dude_Monster_Idle_4.png`,
    };
    for (const [p, path] of Object.entries(idlePaths)) {
      this.load.spritesheet(`${p}_idle`, path, { frameWidth: 32, frameHeight: 32 });
    }
  }

  _createIdleAnims() {
    const prefixes = ['pink', 'owlet', 'dude'];
    for (const p of prefixes) {
      if (!this.anims.exists(`${p}_idle`)) {
        this.anims.create({
          key: `${p}_idle`,
          frames: this.anims.generateFrameNumbers(`${p}_idle`, { start: 0, end: 3 }),
          frameRate: 8, repeat: -1,
        });
      }
    }
  }

  create() {
    this._createIdleAnims();

    const { width, height } = CONFIG;
    let teamCount = 2;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title with flanking sprites
    this.add.text(width / 2, 100, 'HARTWORMS', {
      fontSize: '64px', color: '#ffdd00', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.sprite(width / 2 - 290, 95, 'pink_idle').setScale(2.5).play('pink_idle');
    this.add.sprite(width / 2 + 290, 95, 'owlet_idle').setScale(2.5).setFlipX(true).play('owlet_idle');

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

    // Team sprite preview
    const previewY = 420;
    this.add.text(width / 2, previewY - 30, 'Teams:', {
      fontSize: '20px', color: '#aaaaaa',
    }).setOrigin(0.5);

    for (let i = 0; i < CONFIG.maxTeams; i++) {
      const sx = width / 2 - 90 + i * 60;
      const prefix = SPRITE_PREFIXES[i];
      this.add.sprite(sx, previewY + 10, `${prefix}_idle`).setScale(1.0).play(`${prefix}_idle`);
      this.add.text(sx, previewY + 35, CONFIG.teamNames[i], {
        fontSize: '14px', color: '#' + CONFIG.teamColors[i].toString(16).padStart(6, '0'),
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
