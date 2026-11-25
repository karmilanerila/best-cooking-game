// Sizzle & Serve — engine: movement, cooking timers, interactions.
// One clear job: the rules that move the game from one frame to the next.

import {
  CHEF_SPEED, CHEF_RADIUS, FLOOR, STATIONS,
  GRILL_COOK_SECONDS, GRILL_BURN_SECONDS, FRY_SECONDS, FRY_BURN_SECONDS,
  CHOP_SECONDS, INGREDIENTS,
} from './config.js';
import {
  tickClock, matchingOrder, serveOrder, addPopup, addParticles,
} from './state.js';
import { moveIntent } from './input.js';
import { sfx } from './audio.js';

function clampToFloor(chef) {
  chef.x = Math.max(FLOOR.x + CHEF_RADIUS, Math.min(FLOOR.x + FLOOR.w - CHEF_RADIUS, chef.x));
  chef.y = Math.max(FLOOR.y + CHEF_RADIUS, Math.min(FLOOR.y + FLOOR.h - CHEF_RADIUS, chef.y));
}

function nearStation(state, id) {
  const st = STATIONS[id];
  const dx = state.chef.x - st.at.x;
  const dy = state.chef.y - st.at.y;
  return Math.hypot(dx, dy) < 70;
}

function nearestStation(state) {
  let best = null;
  let bestD = 70;
  for (const id of Object.keys(STATIONS)) {
    const st = STATIONS[id];
    const d = Math.hypot(state.chef.x - st.at.x, state.chef.y - st.at.y);
    if (d < bestD) { bestD = d; best = id; }
  }
  return best;
}

function setMessage(state, msg) {
  state.message = msg;
  state.messageT = 2.2;
}

// Pantry: cycle through its goods with repeated presses.
const PANTRY_CYCLE = ['bun', 'lettuce', 'tomato', 'cheese'];
let pantryIndex = 0;

function interact(state) {
  const id = state.interactStation || nearestStation(state);
  state.interactStation = null;
  if (!id) {
    setMessage(state, 'Walk up to a station first!');
    return;
  }
  const chef = state.chef;

  if (id === 'pantry') {
    if (chef.carry) {
      // Hands full at the pantry: put the item back on the shelf.
      const back = chef.carry;
      chef.carry = null;
      sfx.drop();
      setMessage(state, `Put back ${INGREDIENTS[back].label}`);
      return;
    }
    const item = PANTRY_CYCLE[pantryIndex % PANTRY_CYCLE.length];
    pantryIndex += 1;
    chef.carry = item;
    sfx.pickup();
    setMessage(state, `Picked up ${INGREDIENTS[item].label} — grill it, chop it or plate it`);
    return;
  }

  if (id === 'grill') {
    // The grill keeps its own rack of raw patties: press E to start one.
    const slot = state.grill.findIndex((s) => s === null);
    if (slot === -1) { setMessage(state, 'Grill is full'); return; }
    state.grill[slot] = { item: 'patty', t: 0 };
    sfx.sizzle();
    setMessage(state, 'Patty on the grill — 5s to cook, grab it before it burns!');
    return;
  }

  if (id === 'fryer') {
    if (state.fryer) { setMessage(state, 'Fries already frying'); return; }
    state.fryer = { t: 0 };
    sfx.sizzle();
    setMessage(state, 'Fries in the fryer — 6s to crisp');
    return;
  }

  if (id === 'chop') {
    if (state.chop) { setMessage(state, 'Board is busy'); return; }
    if (chef.carry !== 'tomato') { setMessage(state, 'Bring a tomato to chop'); return; }
    chef.carry = null;
    state.chop = { item: 'tomato', t: 0 };
    sfx.chop();
    return;
  }

  if (id === 'plate') {
    if (!chef.carry) {
      // Empty hands at the plate: take the top item back off.
      const top = state.plate.pop();
      if (top) { chef.carry = top; sfx.pickup(); }
      else setMessage(state, 'Plate is empty');
      return;
    }
    // Only stack what some open order can still use.
    const item = chef.carry;
    const usable = state.orders.some((o) => {
      const stack = o.recipe.stack;
      return state.plate.length < stack.length &&
        stack.slice(0, state.plate.length).join('|') === state.plate.join('|') &&
        stack[state.plate.length] === item;
    });
    if (!usable) {
      setMessage(state, `${INGREDIENTS[item].label} does not fit any open order — check the board!`);
      sfx.fail();
      return;
    }
    state.plate.push(item);
    chef.carry = null;
    sfx.drop();
    addParticles(state, STATIONS.plate.at.x, STATIONS.plate.at.y - 30, '#ffd76a', 6);
    return;
  }

  if (id === 'serve') {
    const order = matchingOrder(state);
    if (!order) {
      setMessage(state, 'No open order matches this plate — check the board!');
      sfx.fail();
      return;
    }
    const pay = serveOrder(state, order);
    sfx.served();
    sfx.bell();
    addParticles(state, STATIONS.serve.at.x, STATIONS.serve.at.y - 40, '#7be495', 16);
    setMessage(state, `Served ${order.recipe.name} for $${pay}!`);
  }
}

// Pick up a finished item from a station (grill / fryer / chop).
function collect(state) {
  const id = nearestStation(state);
  if (id === 'grill') {
    const i = state.grill.findIndex((s) => s && s.t >= GRILL_COOK_SECONDS && s.t <= GRILL_BURN_SECONDS);
    if (i >= 0 && !state.chef.carry) {
      state.grill[i] = null;
      state.chef.carry = 'pattyCooked';
      sfx.grillDone();
      setMessage(state, 'Cooked patty — plate it fast!');
      return true;
    }
    const burnt = state.grill.findIndex((s) => s && s.t > GRILL_BURN_SECONDS);
    if (burnt >= 0) {
      state.grill[burnt] = null;
      sfx.fail();
      setMessage(state, 'Burnt patty binned — start another');
      return true;
    }
  }
  if (id === 'fryer' && state.fryer && state.fryer.t >= FRY_SECONDS && !state.chef.carry) {
    state.fryer = null;
    state.chef.carry = 'fries';
    sfx.grillDone();
    setMessage(state, 'Crispy fries — plate or serve!');
    return true;
  }
  if (id === 'chop' && state.chop && state.chop.t >= CHOP_SECONDS && !state.chef.carry) {
    state.chop = null;
    state.chef.carry = 'tomatoChopped';
    sfx.chop();
    setMessage(state, 'Chopped tomato — onto the plate!');
    return true;
  }
  return false;
}

export function update(state, dt) {
  if (state.phase !== 'playing') return;

  // Movement.
  const { dx, dy } = moveIntent(state);
  state.moving = dx !== 0 || dy !== 0;
  if (state.moving) {
    state.chef.x += dx * CHEF_SPEED * dt;
    state.chef.y += dy * CHEF_SPEED * dt;
    if (dx !== 0) state.chef.face = dx > 0 ? 1 : -1;
    clampToFloor(state.chef);
    state.chef.walk += dt;
  }

  // Interactions: E / Space / click-arrival, Q to serve.
  if (state.wantInteract) {
    state.wantInteract = false;
    if (!collect(state)) interact(state);
  }
  if (state.wantServe) {
    state.wantServe = false;
    if (nearStation(state, 'serve') || matchingOrder(state)) {
      state.interactStation = 'serve';
      interact(state);
    } else {
      setMessage(state, 'Walk to the serve window to ring the bell!');
    }
  }

  // Cooking timers. A burnt patty stays on the grill until the chef bins it.
  for (const slot of state.grill) {
    if (slot) slot.t += dt;
  }
  if (state.fryer) {
    state.fryer.t += dt;
    if (state.fryer.t > FRY_BURN_SECONDS + 2) state.fryer = null;
  }
  if (state.chop) state.chop.t += dt;

  // Clock, orders, rush.
  const before = state.orders.length;
  tickClock(state, dt);
  if (state.orders.length < before && state.phase === 'playing') sfx.fail();

  // Last-10-seconds tick.
  if (state.timeLeft <= 10 && state.timeLeft > 0) {
    const whole = Math.ceil(state.timeLeft);
    if (whole !== state.lastTick) { state.lastTick = whole; sfx.tick(); }
  }

  // Popups and particles.
  for (const p of state.popups) p.t -= dt;
  state.popups = state.popups.filter((p) => p.t > 0);
  for (const p of state.particles) {
    p.t -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
  }
  state.particles = state.particles.filter((p) => p.t > 0);
  if (state.bell > 0) state.bell -= dt;
  if (state.messageT > 0) state.messageT -= dt;
}
