// src/managers/TurnManager.js
import { CONFIG } from '../config.js';

export class TurnManager {
  constructor(teamManager, onTurnEnd) {
    this.teamManager = teamManager;
    this.onTurnEnd = onTurnEnd;

    this.activeTeamIndex = 0;
    this.activeWormIndex = 0;
    this.timeLeft = CONFIG.turnDuration;
    this.turnActive = true;

    this.wind = this._rollWind();
  }

  get activeTeam() {
    return this.teamManager.activeTeams[this.activeTeamIndex % this.teamManager.activeTeams.length];
  }

  get activeWorm() {
    const living = this.activeTeam.livingWorms;
    return living[this.activeWormIndex % living.length];
  }

  _rollWind() {
    return Math.floor(
      Math.random() * (CONFIG.windMax - CONFIG.windMin + 1) + CONFIG.windMin
    );
  }

  update(delta) {
    if (!this.turnActive) return;

    this.timeLeft -= delta / 1000;
    if (this.timeLeft <= 0) {
      this.endTurn();
    }
  }

  endTurn() {
    if (!this.turnActive) return;
    this.turnActive = false;

    this.activeWorm.setActive(false);

    const teams = this.teamManager.activeTeams;
    this.activeTeamIndex = (this.activeTeamIndex + 1) % teams.length;

    const nextTeam = teams[this.activeTeamIndex];
    this.activeWormIndex = (this.activeWormIndex + 1) % nextTeam.livingWorms.length;

    this.wind = this._rollWind();
    this.timeLeft = CONFIG.turnDuration;
    this.turnActive = true;

    this.activeWorm.setActive(true);

    this.onTurnEnd({ team: this.activeTeam, worm: this.activeWorm, wind: this.wind });
  }

  get isGameOver() {
    return this.teamManager.activeTeams.length <= 1;
  }

  get winningTeam() {
    if (!this.isGameOver) return null;
    return this.teamManager.activeTeams[0] ?? null;
  }
}
