// src/scenes/UIScene.js
import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    const { width } = this.scale;

    // Top-left: team name + worm name + HP
    this.teamLabel = this.add.text(12, 12, '', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' });
    this.hpLabel = this.add.text(12, 34, '', { fontSize: '14px', color: '#aaffaa' });

    // Top-center: turn timer
    this.timerLabel = this.add.text(width / 2, 12, '', {
      fontSize: '28px', color: '#ffdd00', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Top-right: wind
    this.windLabel = this.add.text(width - 12, 12, '', {
      fontSize: '18px', color: '#aaddff',
    }).setOrigin(1, 0);

    // Bottom-right: weapon + ammo
    this.weaponLabel = this.add.text(width - 12, this.scale.height - 12, '', {
      fontSize: '18px', color: '#ffffff',
    }).setOrigin(1, 1);

    // Floating damage number pool
    this._floaters = [];
  }

  /**
   * Called by GameScene each frame with current game state.
   */
  updateHUD(state) {
    const { teamName, teamColor, wormName, hp, timeLeft, wind, weaponName, ammo } = state;

    const hex = '#' + teamColor.toString(16).padStart(6, '0');
    this.teamLabel.setText(teamName).setColor(hex);
    this.hpLabel.setText(`${wormName}  HP: ${hp}`);

    const t = Math.ceil(timeLeft);
    this.timerLabel.setText(`${t}s`);
    this.timerLabel.setColor(t <= 10 ? '#ff4444' : '#ffdd00');

    const windDir = wind > 0 ? '→' : wind < 0 ? '←' : '—';
    this.windLabel.setText(`Wind ${windDir} ${Math.abs(wind)}`);

    const ammoStr = ammo === Infinity ? '∞' : `${ammo}`;
    this.weaponLabel.setText(`${weaponName}  ×${ammoStr}`);
  }

  /**
   * Show a floating damage number at (x, y).
   */
  showDamage(x, y, amount) {
    const text = this.add.text(x, y, `-${amount}`, {
      fontSize: '20px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1200,
      onComplete: () => text.destroy(),
    });
  }
}
