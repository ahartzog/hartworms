// src/scenes/GameScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Terrain } from '../entities/Terrain.js';
import { TeamManager } from '../managers/TeamManager.js';
import { TurnManager } from '../managers/TurnManager.js';

const WEAPONS = ['Bazooka', 'Grenade', 'Shotgun', 'Ninja Rope'];

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create(data) {
    this.terrain = new Terrain(this, CONFIG.width, CONFIG.height, CONFIG.terrainSeed);

    const teamCount = data?.teamCount ?? 2;
    this.teamManager = new TeamManager(this, teamCount, this.terrain);
    this.turnManager = new TurnManager(this.teamManager, (info) => this._onTurnEnd(info));
    this.turnManager.activeWorm.setActive(true);

    // Weapon state
    this.weaponIndex = 0;
    this.ammo = { ...CONFIG.ammo };

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  _ammoKey() {
    return ['bazooka', 'grenade', 'shotgun', 'ninjaRope'][this.weaponIndex];
  }

  _onTurnEnd({ team, worm, wind }) {
    this.ammo = { ...CONFIG.ammo };
    this.weaponIndex = 0;
  }

  update(time, delta) {
    const tm = this.turnManager;
    const worm = tm.activeWorm;

    if (tm.turnActive && worm && !worm.isDead) {
      // Movement
      if (this.cursors.left.isDown) worm.walk(-1);
      else if (this.cursors.right.isDown) worm.walk(1);
      else worm.stopWalk();

      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) worm.jump();

      // Weapon switch
      if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
        this.weaponIndex = (this.weaponIndex + WEAPONS.length - 1) % WEAPONS.length;
      }
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.weaponIndex = (this.weaponIndex + 1) % WEAPONS.length;
      }
    }

    // Update all worms
    for (const w of this.teamManager.allWorms) {
      w.update(this.terrain, delta);
    }

    tm.update(delta);

    // Push state to UIScene
    const ui = this.scene.get('UIScene');
    if (ui && worm) {
      const ammoVal = this.ammo[this._ammoKey()];
      ui.updateHUD({
        teamName: tm.activeTeam.name,
        teamColor: tm.activeTeam.color,
        wormName: worm.name,
        hp: worm.hp,
        timeLeft: tm.timeLeft,
        wind: tm.wind,
        weaponName: WEAPONS[this.weaponIndex],
        ammo: ammoVal,
      });
    }

    // Game over
    if (tm.isGameOver) {
      const winner = tm.winningTeam;
      this.add.text(CONFIG.width / 2, CONFIG.height / 2,
        `${winner?.name ?? 'Nobody'} Wins! 🎉`,
        { fontSize: '56px', color: '#ffdd00', fontStyle: 'bold' }
      ).setOrigin(0.5);
      this.time.delayedCall(3000, () => {
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      });
      this.turnManager.turnActive = false;
    }
  }
}
