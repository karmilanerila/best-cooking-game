// Sizzle & Serve — game state: orders, plates, stations, score.
// One clear job: the shape of a run and the pure rules that change it.

import {
  SHIFT_SECONDS,
  ORDER_PATIENCE,
  ORDER_SPAWN_EVERY,
  MAX_ORDERS,
  RECIPES,
  STATIONS,
} from './config.js';

let nextOrderId = 1;

export function newOrder(recipe, patience = ORDER_PATIENCE) {
  return {
    id: nextOrderId++,
    recipe,
    patience,
    maxPatience: patience,
    // progress 0..1 of the plate built for this order, shown on the ticket.
    built: 0,
  };
}

export function pickRecipe(rng) {
  return RECIPES[Math.floor(rng() * RECIPES.length)];
}

// A tiny seeded RNG so a staged screenshot scene is identical every run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createState() {
  return {
    phase: 'playing', // 'playing' | 'over'
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    spawnIn: 6,
    orders: [],
    score: 0,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    // The chef: position, facing, what the hands hold (ingredient id or null).
    chef: { x: 640, y: 470, face: 1, carry: null, walk: 0 },
    // Plate stack on the plating station, bottom to top.
    plate: [],
    // Grill slots: { item, t } where t counts seconds on the heat.
    grill: [null, null],
    fryer: null, // { t }
    chop: null, // { item, t }
    bell: 0, // bell ring animation timer
    popups: [], // { x, y, text, color, t }
    particles: [], // { x, y, vx, vy, t, color, size }
    rush: false,
    message: '',
    messageT: 0,
    keys: {},
    // Click-to-move target, null when the chef is player-driven.
    target: null,
    targetStation: null,
  };
}

export function resetRunId() {
  nextOrderId = 1;
}

export function spawnOrder(state, rng) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const order = newOrder(pickRecipe(rng));
  state.orders.push(order);
  return order;
}

// The plate matches an order when its stack equals the recipe stack exactly.
export function matchingOrder(state) {
  const key = state.plate.join('|');
  return state.orders.find((o) => o.recipe.stack.join('|') === key) || null;
}

export function serveOrder(state, order) {
  const rushBonus = state.rush ? 2 : 1;
  const pay = order.recipe.price * rushBonus + Math.min(state.combo, 5);
  state.coins += pay;
  state.score += pay * 10 + Math.round(order.patience) * 2;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.plate = [];
  state.bell = 0.6;
  addPopup(state, STATIONS.serve.at.x - 40, STATIONS.serve.at.y - 60,
    `+$${pay} SERVED!`, '#3e9e4d');
  return pay;
}

export function failOrder(state, order) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.combo = 0;
  addPopup(state, 640, 120, 'ORDER WALKED OUT…', '#d63c2f');
}

export function addPopup(state, x, y, text, color) {
  state.popups.push({ x, y, text, color, t: 1.4 });
}

export function addParticles(state, x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 30 + Math.random() * 70;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
      t: 0.6 + Math.random() * 0.4, color, size: 3 + Math.random() * 4,
    });
  }
}

// Advance order patience and the shift clock. Returns 'over' at 0:00.
export function tickClock(state, dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  state.rush = state.timeLeft <= 30 && state.timeLeft > 0;
  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) failOrder(state, order);
  }
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    spawnOrder(state, Math.random);
    state.spawnIn = ORDER_SPAWN_EVERY * (state.rush ? 0.7 : 1);
  }
  if (state.timeLeft <= 0) state.phase = 'over';
}
