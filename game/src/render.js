// Sizzle & Serve — rendering: every pixel of the kitchen, drawn on canvas.
// One clear job: turn the state into a readable, high-contrast picture.

import {
  CANVAS_W, CANVAS_H, INGREDIENTS, RECIPES, STATIONS, FLOOR, MAX_ORDERS,
  COLORS, GRILL_COOK_SECONDS, GRILL_BURN_SECONDS, FRY_SECONDS,
  CHOP_SECONDS, SHIFT_SECONDS,
} from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ---- food drawing (all vector shapes, no images) ----

export function drawIngredient(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id];
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(0, 2, s, Math.PI, 0); ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-s, 2, s * 2, s * 0.28);
    ctx.fillStyle = '#fff2cf';
    for (const [sx, sy] of [[-s * 0.5, -s * 0.45], [0, -s * 0.7], [s * 0.5, -s * 0.45]]) {
      ctx.beginPath(); ctx.arc(sx, sy, s * 0.1, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'patty' || id === 'pattyCooked') {
    ctx.fillStyle = ing.color;
    rr(ctx, -s, -s * 0.42, s * 2, s * 0.84, s * 0.4);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.arc(i * s * 0.36, 0, s * 0.09, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const r = s * (i % 2 === 0 ? 1 : 0.72);
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r * 0.7;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = ing.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-s * 0.7, 0); ctx.lineTo(s * 0.7, 0); ctx.stroke();
  } else if (id === 'tomato' || id === 'tomatoChopped') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f8a08f';
    ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.3, s * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath(); ctx.arc(0, -s * 0.75, s * 0.22, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'cheese') {
    ctx.save();
    ctx.rotate(-0.12);
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.6); ctx.lineTo(s, s * 0.6); ctx.lineTo(s, -s * 0.3); ctx.lineTo(0, -s * 0.7); ctx.lineTo(-s, -s * 0.3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [hx, hy] of [[-s * 0.4, 0.1], [s * 0.35, -0.1], [0, 0.35]]) {
      ctx.beginPath(); ctx.arc(hx * s, hy * s, s * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (id === 'fries') {
    ctx.fillStyle = '#d63c2f';
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, -s * 0.2); ctx.lineTo(s * 0.8, -s * 0.2);
    ctx.lineTo(s * 0.6, s * 0.9); ctx.lineTo(-s * 0.6, s * 0.9);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = ing.color;
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(i * s * 0.32 - s * 0.11, -s * 1.05 - (Math.abs(i) % 2) * s * 0.18, s * 0.22, s * 1.0);
    }
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, stack, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath(); ctx.ellipse(0, 0, 46, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b9bec6'; ctx.lineWidth = 2; ctx.stroke();
  let layerY = -6;
  for (const item of stack) {
    drawIngredient(ctx, item, 0, layerY, 20);
    layerY -= 13;
  }
  ctx.restore();
}

// ---- header ----

function drawHeader(ctx, state) {
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, 0, CANVAS_W, 64);
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, 64, CANVAS_W, 4);
  text(ctx, 'SIZZLE & SERVE', 24, 26, 26, COLORS.headerText);
  text(ctx, 'Lunch Rush  ·  Day 1', 24, 50, 13, '#c9a06a', 'bold');
  // shift timer, centre
  const urgent = state.timeLeft <= 30;
  const pulse = urgent ? 1 + 0.06 * Math.sin(state.elapsed * 8) : 1;
  ctx.save();
  ctx.translate(CANVAS_W / 2, 28);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = urgent ? COLORS.bad : '#fff3d6';
  rr(ctx, -78, -22, 156, 44, 22);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#ff8a7a' : COLORS.wallTrim;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, '⏱ ' + fmtTime(state.timeLeft), 0, 1, 26, urgent ? '#ffffff' : COLORS.ink, 'bold', 'center');
  ctx.restore();
  text(ctx, state.rush ? 'RUSH HOUR ×2 PAY!' : 'SHIFT TIMER', CANVAS_W / 2, 58, 11, urgent ? '#ff9d8f' : '#c9a06a', 'bold', 'center');
  // coins + score, right
  text(ctx, `$ ${state.coins}`, CANVAS_W - 230, 26, 24, '#ffd76a', 'bold', 'right');
  text(ctx, `SCORE ${state.score}`, CANVAS_W - 24, 26, 18, COLORS.headerText, 'bold', 'right');
  text(ctx, `SERVED ${state.served}   COMBO ×${state.combo}`, CANVAS_W - 24, 50, 13, '#c9a06a', 'bold', 'right');
}

// ---- order board ----

function drawOrderBoard(ctx, state) {
  text(ctx, 'ORDER BOARD', 24, 84, 15, COLORS.ink);
  text(ctx, 'Serve before patience runs out — match the stack exactly', 150, 84, 12, '#7a5c38');
  const w = 400;
  const gap = 16;
  for (let i = 0; i < MAX_ORDERS; i++) {
    const x = 24 + i * (w + gap);
    const y = 96;
    const order = state.orders[i];
    ctx.fillStyle = order ? COLORS.ticket : '#efe3c8';
    rr(ctx, x, y, w, 66, 10);
    ctx.fill();
    ctx.strokeStyle = order ? COLORS.ticketEdge : '#d8c49a';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!order) {
      text(ctx, '— waiting for the next order —', x + w / 2, y + 33, 14, '#a98f66', 'bold', 'center');
      continue;
    }
    const frac = Math.max(0, order.patience / order.maxPatience);
    const pColor = frac > 0.5 ? COLORS.good : frac > 0.25 ? COLORS.warn : COLORS.bad;
    text(ctx, `#${order.id}  ${order.recipe.name.toUpperCase()}`, x + 14, y + 16, 15, COLORS.ink);
    text(ctx, `$${order.recipe.price}${state.rush ? ' ×2' : ''}`, x + w - 14, y + 16, 15, COLORS.good, 'bold', 'right');
    // ingredient chips
    let cx = x + 16;
    for (const item of order.recipe.stack) {
      drawIngredient(ctx, item, cx + 9, y + 38, 9);
      cx += 26;
    }
    text(ctx, order.recipe.stack.map((s) => INGREDIENTS[s].label).join(' + '), cx + 4, y + 38, 12, '#5d4423');
    // patience bar
    ctx.fillStyle = '#e5d3ae';
    rr(ctx, x + 14, y + 54, w - 28, 7, 3);
    ctx.fill();
    ctx.fillStyle = pColor;
    rr(ctx, x + 14, y + 54, Math.max(8, (w - 28) * frac), 7, 3);
    ctx.fill();
  }
}

// ---- stations ----

function drawCounter(ctx, rect, label, sub, top = COLORS.counterTop) {
  ctx.fillStyle = COLORS.counterFront;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.fillStyle = top;
  rr(ctx, rect.x, rect.y, rect.w, 18, 8);
  ctx.fill();
  ctx.fillRect(rect.x, rect.y + 10, rect.w, 8);
  text(ctx, label, rect.x + rect.w / 2, rect.y + 40, 17, '#fff3d6', 'bold', 'center');
  text(ctx, sub, rect.x + rect.w / 2, rect.y + 62, 11, '#e8c9a0', 'bold', 'center');
}

function drawPantry(ctx, state) {
  const r = STATIONS.pantry.rect;
  drawCounter(ctx, r, 'PANTRY', 'Take ingredients — press E');
  const piles = [
    ['bun', r.x + 42], ['lettuce', r.x + 100], ['tomato', r.x + 158], ['cheese', r.x + 214],
  ];
  for (const [id, px] of piles) {
    drawIngredient(ctx, id, px, r.y + 8, 13);
  }
}

function drawGrill(ctx, state) {
  const r = STATIONS.grill.rect;
  ctx.fillStyle = '#3c3f45';
  rr(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();
  ctx.fillStyle = '#565b63';
  for (let i = 1; i < 6; i++) {
    ctx.fillRect(r.x + (i * r.w) / 6 - 2, r.y + 6, 4, r.h - 12);
  }
  text(ctx, 'GRILL', r.x + r.w / 2, r.y + 15, 14, '#ffd9a0', 'bold', 'center');
  state.grill.forEach((slot, i) => {
    const cx = r.x + 70 + i * 110;
    const cy = r.y + 54;
    if (!slot) {
      ctx.strokeStyle = '#7d838d';
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'empty', cx, cy, 10, '#9aa0a8', 'bold', 'center');
      return;
    }
    const frac = Math.min(1, slot.t / GRILL_COOK_SECONDS);
    const burnt = slot.t > GRILL_BURN_SECONDS;
    drawIngredient(ctx, 'pattyCooked', cx, cy, 18);
    if (burnt) {
      text(ctx, 'BURNT!', cx, cy - 24, 11, '#ff6b5e', 'bold', 'center');
    } else {
      ctx.fillStyle = '#2b2e33';
      rr(ctx, cx - 24, cy + 22, 48, 6, 3);
      ctx.fill();
      ctx.fillStyle = frac >= 1 ? COLORS.good : '#f5a623';
      rr(ctx, cx - 24, cy + 22, 48 * frac, 6, 3);
      ctx.fill();
      if (frac >= 1) text(ctx, 'READY', cx, cy - 24, 11, '#7be495', 'bold', 'center');
    }
  });
}

function drawFryer(ctx, state) {
  const r = STATIONS.fryer.rect;
  ctx.fillStyle = COLORS.steelDark;
  rr(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();
  ctx.fillStyle = '#f7c948';
  rr(ctx, r.x + 30, r.y + 26, r.w - 60, 30, 6);
  ctx.fill();
  text(ctx, 'FRYER', r.x + r.w / 2, r.y + 18, 15, '#fff3d6', 'bold', 'center');
  if (state.fryer) {
    const frac = Math.min(1, state.fryer.t / FRY_SECONDS);
    drawIngredient(ctx, 'fries', r.x + r.w / 2, r.y + 41, 15);
    ctx.fillStyle = '#2b2e33';
    rr(ctx, r.x + 60, r.y + 66, r.w - 120, 6, 3);
    ctx.fill();
    ctx.fillStyle = frac >= 1 ? COLORS.good : '#f5a623';
    rr(ctx, r.x + 60, r.y + 66, (r.w - 120) * frac, 6, 3);
    ctx.fill();
  } else {
    text(ctx, 'drop fries — press E', r.x + r.w / 2, r.y + 72, 12, '#e8ecf0', 'bold', 'center');
  }
}

function drawChop(ctx, state) {
  const r = STATIONS.chop.rect;
  ctx.fillStyle = COLORS.counterFront;
  rr(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();
  ctx.fillStyle = '#a9713f';
  rr(ctx, r.x, r.y, r.w, 18, 8);
  ctx.fill();
  ctx.fillRect(r.x, r.y + 10, r.w, 8);
  text(ctx, 'CHOPPING BOARD', r.x + r.w / 2, r.y + 32, 15, '#fff3d6', 'bold', 'center');
  const cx = r.x + r.w / 2;
  const cy = r.y + 58;
  ctx.fillStyle = '#e8c9a0';
  rr(ctx, cx - 70, cy - 13, 140, 26, 6);
  ctx.fill();
  if (state.chop) {
    const frac = Math.min(1, state.chop.t / CHOP_SECONDS);
    drawIngredient(ctx, 'tomato', cx - 18, cy, 12);
    ctx.strokeStyle = '#8a8f98';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx + 30, cy - 11); ctx.lineTo(cx + 52, cy + 8); ctx.stroke();
    ctx.fillStyle = '#2b2e33';
    rr(ctx, cx - 70, cy + 16, 140, 5, 2);
    ctx.fill();
    ctx.fillStyle = COLORS.good;
    rr(ctx, cx - 70, cy + 16, 140 * frac, 5, 2);
    ctx.fill();
  } else {
    text(ctx, 'place a tomato — press E', r.x + r.w / 2, cy, 12, '#5d4423', 'bold', 'center');
  }
}

function drawServeWindow(ctx, state) {
  const r = STATIONS.serve.rect;
  ctx.fillStyle = '#4a3220';
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.fillStyle = '#2b1d10';
  rr(ctx, r.x + 12, r.y + 12, r.w - 24, 150, 8);
  ctx.fill();
  text(ctx, 'SERVE', r.x + r.w / 2, r.y + 40, 18, '#ffd76a', 'bold', 'center');
  text(ctx, 'WINDOW', r.x + r.w / 2, r.y + 62, 18, '#ffd76a', 'bold', 'center');
  // bell
  const bx = r.x + r.w / 2;
  const by = r.y + 120;
  const ring = state.bell > 0 ? Math.sin(state.bell * 30) * 3 : 0;
  ctx.save();
  ctx.translate(bx + ring, by);
  ctx.fillStyle = '#f5c542';
  ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0); ctx.fill();
  ctx.fillRect(-22, 0, 44, 6);
  ctx.fillStyle = '#c1911d';
  ctx.beginPath(); ctx.arc(0, 10, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  text(ctx, 'ring the bell — Q', bx, r.y + 150, 11, '#e8c9a0', 'bold', 'center');
  // The pass shows a ready badge only when a plate on the plating station
  // matches an open order — the plate itself stays on the plating station.
  const ready = state.plate.length > 0 &&
    state.orders.some((o) => o.recipe.stack.join('|') === state.plate.join('|'));
  if (ready) {
    ctx.fillStyle = '#3e9e4d';
    ctx.beginPath(); ctx.arc(bx, r.y + 205, 24, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(bx - 11, r.y + 205); ctx.lineTo(bx - 3, r.y + 213); ctx.lineTo(bx + 12, r.y + 196); ctx.stroke();
    text(ctx, 'DISH READY!', bx, r.y + 252, 13, '#7be495', 'bold', 'center');
  } else {
    text(ctx, 'no dish on the pass', bx, r.y + 210, 12, '#a98f66', 'bold', 'center');
  }
}

function drawPlateStation(ctx, state) {
  const r = STATIONS.plate.rect;
  ctx.fillStyle = COLORS.counterFront;
  rr(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();
  ctx.fillStyle = '#a9713f';
  rr(ctx, r.x, r.y, r.w, 18, 8);
  ctx.fill();
  ctx.fillRect(r.x, r.y + 10, r.w, 8);
  text(ctx, 'PLATING', r.x + r.w / 2, r.y + 24, 14, '#fff3d6', 'bold', 'center');
  drawPlate(ctx, r.x + 62, r.y + 62, state.plate, 1.0);
  const next = nextNeeded(state);
  if (state.plate.length === 0) {
    text(ctx, 'empty plate — bring ingredients', r.x + 130, r.y + 62, 13, '#e8c9a0', 'bold', 'left');
  } else {
    text(ctx, next ? `next: ${INGREDIENTS[next].label}` : 'dish complete — serve it!',
      r.x + 130, r.y + 50, 13, next ? '#e8c9a0' : '#7be495', 'bold', 'left');
    text(ctx, state.plate.map((s) => INGREDIENTS[s].label).join('  ›  '),
      r.x + 130, r.y + 70, 12, '#fff3d6', 'bold', 'left');
  }
}

function nextNeeded(state) {
  // First recipe whose stack starts with the current plate contents.
  for (const order of state.orders) {
    const stack = order.recipe.stack;
    if (state.plate.length < stack.length &&
        stack.slice(0, state.plate.length).join('|') === state.plate.join('|')) {
      return stack[state.plate.length];
    }
  }
  return null;
}

// ---- chef ----

function drawChef(ctx, state) {
  const c = state.chef;
  const bob = Math.sin(state.elapsed * 10) * (state.moving ? 2 : 0);
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
  // body (chef coat)
  ctx.fillStyle = '#f8f8f4';
  ctx.beginPath(); ctx.arc(0, 2, 20, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9c9c2'; ctx.lineWidth = 2; ctx.stroke();
  // apron
  ctx.fillStyle = '#3e7d31';
  rr(ctx, -12, -2, 24, 18, 5);
  ctx.fill();
  // head
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(0, -22, 13, 0, Math.PI * 2); ctx.fill();
  // chef hat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-8, -32, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -36, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -32, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-13, -34, 26, 7);
  // eyes look where the chef faces
  ctx.fillStyle = '#2b1d10';
  ctx.beginPath(); ctx.arc(-4 + c.face * 2, -22, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4 + c.face * 2, -22, 1.8, 0, Math.PI * 2); ctx.fill();
  // carried item above the hat
  if (c.carry) {
    ctx.fillStyle = 'rgba(255,248,231,0.95)';
    ctx.beginPath(); ctx.arc(0, -58, 17, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.ticketEdge; ctx.lineWidth = 2; ctx.stroke();
    drawIngredient(ctx, c.carry, 0, -58, 11);
  }
  ctx.restore();
}

// ---- floor, bottom bar, overlays ----

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
  ctx.fillStyle = COLORS.floorDark;
  const tile = 44;
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += tile) {
    for (let x = FLOOR.x + ((Math.floor((y - FLOOR.y) / tile) % 2) * tile) / 2; x < FLOOR.x + FLOOR.w; x += tile) {
      ctx.fillRect(x, y, tile - 2, 2);
      ctx.fillRect(x, y, 2, tile - 2);
    }
  }
  // wall band above the floor
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 170, CANVAS_W, 40);
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, 206, CANVAS_W, 6);
  text(ctx, 'KITCHEN', 24, 190, 15, '#7a5c38');
  text(ctx, 'WASD / arrows to move · E to grab & use · Q to serve · click a station to walk there',
    130, 190, 12, '#a98f66');
}

function drawBottomBar(ctx, state) {
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, 688, CANVAS_W, 32);
  let x = 24;
  text(ctx, 'RECIPES:', x, 704, 12, '#ffd76a');
  x += 72;
  const short = {
    'classic-burger': 'Burger',
    'cheese-meltdown': 'Cheese',
    'garden-stack': 'Garden',
    'fries-side': 'Fries',
  };
  for (const recipe of RECIPES) {
    const label = `${short[recipe.id]}: ${recipe.stack.map((s) => INGREDIENTS[s].label).join('·')}  $${recipe.price}`;
    text(ctx, label, x, 704, 12, COLORS.headerText);
    x += ctx.measureText(label).width + 26;
  }
  if (state.messageT > 0) {
    // Right-aligned toast, truncated so it never collides with the recipes.
    ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
    const maxW = CANVAS_W - 24 - (x + 10);
    let msg = state.message;
    while (msg.length > 1 && ctx.measureText(msg).width > maxW) {
      msg = msg.slice(0, -1);
    }
    if (msg !== state.message) msg = msg.slice(0, -1) + '…';
    text(ctx, msg, CANVAS_W - 24, 704, 13, '#ffd76a', 'bold', 'right');
  }
}

function drawPopups(ctx, state) {
  for (const p of state.popups) {
    ctx.globalAlpha = Math.min(1, p.t);
    text(ctx, p.text, p.x, p.y - (1.4 - p.t) * 30, 20, p.color, 'bold', 'center');
    ctx.globalAlpha = 1;
  }
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.min(1, p.t * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(43,29,16,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'SHIFT OVER!', CANVAS_W / 2, 260, 54, '#ffe9b8', 'bold', 'center');
  text(ctx, `Served ${state.served} dishes  ·  Earned $${state.coins}  ·  Score ${state.score}  ·  Best combo ×${state.bestCombo}`,
    CANVAS_W / 2, 330, 22, '#ffffff', 'bold', 'center');
  text(ctx, 'Press R to run another shift', CANVAS_W / 2, 390, 16, '#ffd76a', 'bold', 'center');
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawHeader(ctx, state);
  drawOrderBoard(ctx, state);
  drawFloor(ctx);
  drawPantry(ctx, state);
  drawGrill(ctx, state);
  drawFryer(ctx, state);
  drawChop(ctx, state);
  drawPlateStation(ctx, state);
  drawServeWindow(ctx, state);
  drawChef(ctx, state);
  drawParticles(ctx, state);
  drawPopups(ctx, state);
  drawBottomBar(ctx, state);
  if (state.phase === 'over') drawGameOver(ctx, state);
}

export { fmtTime, SHIFT_SECONDS };
