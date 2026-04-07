// src/entities/Terrain.js
import { makeRng } from '../utils/PhysicsHelper.js';

export class Terrain {
  constructor(scene, width, height, seed) {
    this.scene = scene;
    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    const resolvedSeed = seed ?? Math.floor(Math.random() * 1e9);
    this._draw(resolvedSeed);

    if (scene.textures.exists('terrain')) scene.textures.remove('terrain');
    scene.textures.addCanvas('terrain', this.canvas);
    this.image = scene.add.image(0, 0, 'terrain').setOrigin(0, 0);
  }

  _draw(seed) {
    const { ctx, width, height } = this;
    const rng = makeRng(seed);

    const raw = [];
    let h = 0.55;
    for (let x = 0; x < width; x++) {
      h += (rng() - 0.5) * 0.04;
      h = Math.max(0.3, Math.min(0.85, h));
      raw.push(h);
    }

    const heights = raw.map((_, i) => {
      const lo = Math.max(0, i - 10);
      const hi = Math.min(width - 1, i + 10);
      let sum = 0;
      for (let j = lo; j <= hi; j++) sum += raw[j];
      return sum / (hi - lo + 1);
    });

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#7a5c3a';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x < width; x++) {
      ctx.lineTo(x, height * heights[x]);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4a9a30';
    ctx.beginPath();
    ctx.moveTo(0, height * heights[0]);
    for (let x = 0; x < width; x++) {
      ctx.lineTo(x, height * heights[x]);
    }
    for (let x = width - 1; x >= 0; x--) {
      ctx.lineTo(x, height * heights[x] + 8);
    }
    ctx.closePath();
    ctx.fill();

    this.pixels = this.ctx.getImageData(0, 0, this.width, this.height).data;
  }

  blast(x, y, radius) {
    const { ctx } = this;
    const prev = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = prev;

    this.scene.textures.get('terrain').refresh();
    this.pixels = this.ctx.getImageData(0, 0, this.width, this.height).data;
  }

  isSolid(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const idx = (Math.floor(y) * this.width + Math.floor(x)) * 4;
    return this.pixels[idx + 3] > 10;
  }

  getSurfaceY(x, startY) {
    for (let y = startY; y < this.height; y++) {
      if (this.isSolid(x, y)) return y;
    }
    return null;
  }

  // Returns slope angle in degrees at pixel column x, searching from nearY upward.
  // Samples SAMPLE pixels left and right; rise/run > tan(45°) = 1 means too steep.
  getSlopeAngleDeg(x, nearY) {
    const SAMPLE = 6;
    const searchFrom = Math.max(0, nearY - 30);
    const yL = this.getSurfaceY(Math.max(0, x - SAMPLE), searchFrom) ?? nearY;
    const yR = this.getSurfaceY(Math.min(this.width - 1, x + SAMPLE), searchFrom) ?? nearY;
    return Math.abs(Math.atan2(Math.abs(yR - yL), SAMPLE * 2) * 180 / Math.PI);
  }
}
