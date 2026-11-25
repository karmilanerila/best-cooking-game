// Sizzle & Serve — input: keyboard and mouse, click-to-move included.
// One clear job: turn keys and clicks into intents the engine reads.

import { STATIONS, FLOOR } from './config.js';

export function bindInput(state, canvas) {
  const down = (e) => {
    const k = e.key.toLowerCase();
    state.keys[k] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }
    if (k === 'e' || k === ' ') state.wantInteract = true;
    if (k === 'q') state.wantServe = true;
  };
  const up = (e) => {
    state.keys[e.key.toLowerCase()] = false;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    // Clicking a station walks the chef there and uses it on arrival.
    for (const [id, st] of Object.entries(STATIONS)) {
      const r = st.rect;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        state.target = { x: st.at.x, y: st.at.y };
        state.targetStation = id;
        return;
      }
    }
    // Clicking the floor walks there.
    if (x >= FLOOR.x && x <= FLOOR.x + FLOOR.w && y >= FLOOR.y && y <= FLOOR.y + FLOOR.h) {
      state.target = { x, y };
      state.targetStation = null;
    }
  });

  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
  };
}

// Movement intent from keys, or from the click target. Returns {dx, dy}.
export function moveIntent(state) {
  let dx = 0;
  let dy = 0;
  const k = state.keys;
  if (k['arrowleft'] || k['a']) dx -= 1;
  if (k['arrowright'] || k['d']) dx += 1;
  if (k['arrowup'] || k['w']) dy -= 1;
  if (k['arrowdown'] || k['s']) dy += 1;
  if (dx !== 0 || dy !== 0) {
    state.target = null;
    state.targetStation = null;
    const len = Math.hypot(dx, dy);
    return { dx: dx / len, dy: dy / len };
  }
  if (state.target) {
    const tx = state.target.x - state.chef.x;
    const ty = state.target.y - state.chef.y;
    const d = Math.hypot(tx, ty);
    if (d < 6) {
      state.target = null;
      if (state.targetStation) {
        state.wantInteract = true;
        state.interactStation = state.targetStation;
        state.targetStation = null;
      }
      return { dx: 0, dy: 0 };
    }
    return { dx: tx / d, dy: ty / d };
  }
  return { dx: 0, dy: 0 };
}
