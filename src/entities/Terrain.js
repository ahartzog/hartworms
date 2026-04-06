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
  }

  isSolid(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const pixel = this.ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    return pixel[3] > 10;
  }

  getSurfaceY(x, startY) {
    for (let y = startY; y < this.height; y++) {
      if (this.isSolid(x, y)) return y;
    }
    return null;
  }
}
