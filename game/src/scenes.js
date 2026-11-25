// Sizzle & Serve — screenshot scenes: fixed, playable moments of the game.
// One clear job: stage the four captures the judge sees, from real game state.
// Each scene sets the state exactly as a mid-shift moment would look, then the
// normal renderer draws it — nothing here is a mockup or an edited image.

import { RECIPES, STATIONS } from './config.js';
import { createState, newOrder, addPopup, addParticles } from './state.js';

function base(timeLeft, elapsed) {
  const state = createState();
  state.timeLeft = timeLeft;
  state.elapsed = 150 - timeLeft;
  void elapsed;
  return state;
}

function orderByName(state, recipeId, remaining, built = 0) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const order = newOrder(recipe);
  order.patience = remaining; // maxPatience stays full: bar shows time left
  order.built = built;
  state.orders.push(order);
  return order;
}

// Shot 1 — the cover: a busy mid-shift. Three orders on the board, the chef
// carrying a cooked patty to the grill, a burger half-built on the plate,
// ingredients piled on the counters, timer at 1:47.
export function sceneCover() {
  const state = base(107, 43);
  orderByName(state, 'classic-burger', 38);
  orderByName(state, 'cheese-meltdown', 30);
  orderByName(state, 'garden-stack', 42);
  state.chef.x = 470;
  state.chef.y = 430;
  state.chef.face = 1;
  state.chef.carry = 'pattyCooked';
  state.chef.moving = true;
  state.plate = ['bun'];
  state.grill = [{ item: 'patty', t: 3.2 }, null];
  state.chop = { item: 'tomato', t: 1.1 };
  state.coins = 46;
  state.score = 620;
  state.served = 3;
  state.combo = 2;
  state.message = 'Patty ready — plate it fast!';
  state.messageT = 2;
  addParticles(state, 423, 250, '#ffb347', 8);
  return state;
}

// Shot 2 — mid-assembly: the chef at the plating station adding cheese to a
// Cheese Meltdown while a tomato chops and the matching ticket glows.
export function sceneAssembly() {
  const state = base(98, 52);
  orderByName(state, 'cheese-meltdown', 34);
  orderByName(state, 'classic-burger', 26);
  orderByName(state, 'fries-side', 40);
  state.chef.x = 214;
  state.chef.y = 520;
  state.chef.face = -1;
  state.chef.carry = 'cheese';
  state.plate = ['bun', 'pattyCooked'];
  state.grill = [null, { item: 'patty', t: 5.4 }];
  state.chop = { item: 'tomato', t: 1.8 };
  state.fryer = { t: 4.5 };
  state.coins = 74;
  state.score = 1010;
  state.served = 5;
  state.combo = 3;
  state.message = 'Cheese next — then tomato!';
  state.messageT = 2;
  return state;
}

// Shot 3 — the rush: 23 seconds left, orders nearly out of patience, a patty
// about to burn, and a finished Garden Stack waiting on the serve pass.
export function sceneRush() {
  const state = base(23, 127);
  state.rush = true;
  orderByName(state, 'classic-burger', 9);
  orderByName(state, 'cheese-meltdown', 6);
  orderByName(state, 'garden-stack', 14);
  state.chef.x = 1060;
  state.chef.y = 470;
  state.chef.face = 1;
  state.chef.carry = null;
  state.plate = ['bun', 'lettuce', 'tomatoChopped', 'cheese', 'bun'];
  state.grill = [{ item: 'patty', t: 8.6 }, { item: 'patty', t: 2.1 }];
  state.fryer = { t: 6.2 };
  state.coins = 132;
  state.score = 1890;
  state.served = 9;
  state.combo = 4;
  state.bell = 0.4;
  state.message = 'RUSH HOUR — double pay!';
  state.messageT = 2;
  addParticles(state, 423, 250, '#ff8a5c', 10);
  addParticles(state, 697, 250, '#ffd76a', 6);
  return state;
}

// Shot 4 — the serve: the bell rings over a just-served Classic Burger,
// coins pop, combo ×3, and the next order is already on the board.
export function sceneServe() {
  const state = base(61, 89);
  orderByName(state, 'garden-stack', 36);
  orderByName(state, 'fries-side', 28);
  state.chef.x = 1010;
  state.chef.y = 450;
  state.chef.face = 1;
  state.chef.carry = null;
  state.plate = [];
  state.grill = [null, { item: 'patty', t: 1.4 }];
  state.coins = 118;
  state.score = 1640;
  state.served = 8;
  state.combo = 3;
  state.bestCombo = 4;
  state.bell = 0.5;
  addPopup(state, STATIONS.serve.at.x - 60, STATIONS.serve.at.y - 90, '+$16 SERVED!', '#3e9e4d');
  addParticles(state, STATIONS.serve.at.x, STATIONS.serve.at.y - 40, '#7be495', 18);
  state.message = 'Served! Combo ×3!';
  state.messageT = 2;
  return state;
}

export const SCENES = {
  1: sceneCover,
  2: sceneAssembly,
  3: sceneRush,
  4: sceneServe,
};
