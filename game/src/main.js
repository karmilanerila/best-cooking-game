// Sizzle & Serve — bootstrap: canvas, loop, restart, screenshot scenes.
// One clear job: start the game and keep its frames ticking.

import { CANVAS_W, CANVAS_H } from './config.js';
import { createState, spawnOrder, mulberry32, resetRunId } from './state.js';
import { bindInput } from './input.js';
import { update } from './engine.js';
import { render } from './render.js';
import { SCENES } from './scenes.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shot = Number(params.get('shot') || 0);

let state;
if (SCENES[shot]) {
  // Screenshot mode: a fixed moment, drawn once, clock frozen.
  const help = document.getElementById('help');
  if (help) help.style.display = 'none';
  document.body.style.overflow = 'hidden';
  state = SCENES[shot]();
  render(ctx, state);
  document.title = `Sizzle & Serve — shot ${shot}`;
} else {
  // Live game: fresh run, seeded orders, 60fps loop.
  resetRunId();
  state = createState();
  const rng = mulberry32(20261125);
  spawnOrder(state, rng);
  spawnOrder(state, rng);
  bindInput(state, canvas);

  let last = performance.now();
  let firstFrame = true;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state.phase === 'playing') {
      update(state, dt);
    } else if (state.keys['r']) {
      window.location.reload();
    }
    render(ctx, state);
    if (firstFrame) {
      firstFrame = false;
      document.title = 'Sizzle & Serve — Lunch Rush';
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
