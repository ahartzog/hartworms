// src/managers/TurnManager.js
import { CONFIG } from '../config.js';

export class TurnManager {
  constructor(teamManager, onTurnEnd) {
    this.teamManager = teamManager;
    this.onTurnEnd = onTurnEnd;

    this.timeLeft = CONFIG.turnDuration;
    this.turnActive = true;
    this.wind = this._rollWind();

    // Stable indices into teams[] and team.worms[]
    this._teamIdx = 0;
    this._wormIdx = 0;
  }

  get activeTeam() {
    return this.teamManager.teams[this._teamIdx];
  }

  get activeWorm() {
    return this.activeTeam?.worms[this._wormIdx] ?? null;
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
    if (this.isGameOver) return;
    this.turnActive = false;

    // Cache and deactivate the outgoing worm
    const outgoing = this.activeWorm;
    if (outgoing) outgoing.setActive(false);

    // Advance to next alive team (skip eliminated)
    const teams = this.teamManager.teams;
    const n = teams.length;
    let nextTeamIdx = this._teamIdx;
    for (let i = 0; i < n; i++) {
      nextTeamIdx = (nextTeamIdx + 1) % n;
      if (!teams[nextTeamIdx].isEliminated) break;
    }
    this._teamIdx = nextTeamIdx;

    // Advance to next alive worm within that team (round-robin)
    const nextTeam = teams[this._teamIdx];
    const worms = nextTeam.worms;
    const m = worms.length;
    let nextWormIdx = this._wormIdx;
    for (let i = 0; i < m; i++) {
      nextWormIdx = (nextWormIdx + 1) % m;
      if (!worms[nextWormIdx].isDead) break;
    }
    this._wormIdx = nextWormIdx;

    this.wind = this._rollWind();
    this.timeLeft = CONFIG.turnDuration;
    this.turnActive = true;

    const incoming = this.activeWorm;
    if (incoming) incoming.setActive(true);

    this.onTurnEnd({ team: this.activeTeam, worm: incoming, wind: this.wind });
  }

  get isGameOver() {
    return this.teamManager.activeTeams.length <= 1;
  }

  get winningTeam() {
    if (!this.isGameOver) return null;
    return this.teamManager.activeTeams[0] ?? null;
  }
}
