// Sizzle & Serve — configuration: recipes, ingredients, stations, timings.
// One clear job: every tunable number and name of the game lives here.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const SHIFT_SECONDS = 150;
export const RUSH_SECONDS = 30;
export const ORDER_PATIENCE = 45;
export const ORDER_SPAWN_EVERY = 14;
export const MAX_ORDERS = 3;

export const CHEF_SPEED = 250; // pixels per second
export const CHEF_RADIUS = 22;

export const GRILL_COOK_SECONDS = 5;
export const GRILL_BURN_SECONDS = 9;
export const CHOP_SECONDS = 2;
export const FRY_SECONDS = 6;
export const FRY_BURN_SECONDS = 10;

// Ingredient catalogue. `kind` is what the plate stack holds; `label` is the
// word the order ticket and the pantry show; `color` is the drawn swatch.
export const INGREDIENTS = {
  bun:     { label: 'Bun',     color: '#e8a94e', dark: '#b97a24' },
  patty:   { label: 'Patty',   color: '#8a5a33', dark: '#5d3a1e' },
  pattyCooked: { label: 'Patty', color: '#6e4423', dark: '#4a2c14', cooked: true },
  lettuce: { label: 'Lettuce', color: '#69b455', dark: '#3e7d31' },
  tomato:  { label: 'Tomato',  color: '#e14b3a', dark: '#a92c20' },
  tomatoChopped: { label: 'Tomato', color: '#ef6a55', dark: '#b03a28', chopped: true },
  cheese:  { label: 'Cheese',  color: '#f5c542', dark: '#c1911d' },
  fries:   { label: 'Fries',   color: '#f2c14e', dark: '#c08a1e' },
};

// Recipes: the exact stack (bottom to top) a plate must hold to serve.
// `price` is the coins a served dish pays; `bonus` is the rush multiplier.
export const RECIPES = [
  {
    id: 'classic-burger',
    name: 'Classic Burger',
    stack: ['bun', 'pattyCooked', 'lettuce', 'bun'],
    price: 14,
  },
  {
    id: 'cheese-meltdown',
    name: 'Cheese Meltdown',
    stack: ['bun', 'pattyCooked', 'cheese', 'tomatoChopped', 'bun'],
    price: 18,
  },
  {
    id: 'garden-stack',
    name: 'Garden Stack',
    stack: ['bun', 'lettuce', 'tomatoChopped', 'cheese', 'bun'],
    price: 12,
  },
  {
    id: 'fries-side',
    name: 'Crispy Fries',
    stack: ['fries'],
    price: 8,
  },
];

// Kitchen stations. `rect` is the counter block; `at` is where the chef
// stands to use it; `gives` is what the pantry hands out.
export const STATIONS = {
  pantry: {
    label: 'PANTRY',
    sub: 'Bun · Lettuce · Tomato · Cheese',
    rect: { x: 24, y: 216, w: 250, h: 84 },
    at: { x: 149, y: 322 },
    gives: ['bun', 'lettuce', 'tomato', 'cheese'],
  },
  grill: {
    label: 'GRILL',
    sub: 'Patty · 5s to cook',
    rect: { x: 298, y: 216, w: 250, h: 84 },
    at: { x: 423, y: 322 },
  },
  fryer: {
    label: 'FRYER',
    sub: 'Fries · 6s to crisp',
    rect: { x: 572, y: 216, w: 250, h: 84 },
    at: { x: 697, y: 322 },
  },
  chop: {
    label: 'CHOPPING BOARD',
    sub: 'Tomato · 2s to chop',
    rect: { x: 846, y: 216, w: 250, h: 84 },
    at: { x: 971, y: 322 },
  },
  plate: {
    label: 'PLATING',
    sub: 'Build the dish here',
    rect: { x: 24, y: 596, w: 380, h: 84 },
    at: { x: 214, y: 574 },
  },
  serve: {
    label: 'SERVE WINDOW',
    sub: 'Ring the bell!',
    rect: { x: 1120, y: 300, w: 136, h: 300 },
    at: { x: 1098, y: 450 },
  },
};

// Walkable floor bounds (inside the counters).
export const FLOOR = { x: 24, y: 316, w: 1232, h: 264 };

// Palette: warm diner kitchen, high contrast so every element reads small.
export const COLORS = {
  wall: '#f6e3c2',
  wallTrim: '#d9a05b',
  floor: '#e9c795',
  floorDark: '#dfb57e',
  header: '#3a2a1a',
  headerText: '#ffe9b8',
  counterTop: '#8a5a33',
  counterFront: '#6e4423',
  steel: '#c8ccd2',
  steelDark: '#9aa0a8',
  ticket: '#fff8e7',
  ticketEdge: '#d9a05b',
  good: '#3e9e4d',
  warn: '#e8a13a',
  bad: '#d63c2f',
  ink: '#2b1d10',
  cream: '#fff3d6',
};
