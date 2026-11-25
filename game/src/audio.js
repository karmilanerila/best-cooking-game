// Sizzle & Serve — sound: tiny synthesized effects, no audio files.
// One clear job: every beep, chop, sizzle and bell the game makes.

let ctx = null;

function audio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
  const ac = audio();
  if (!ac) return;
  try {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, ac.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
    o.connect(g).connect(ac.destination);
    o.start(ac.currentTime + when);
    o.stop(ac.currentTime + when + dur);
  } catch {
    /* headless or blocked: the game plays silent */
  }
}

function noise(dur, gain = 0.1, freq = 1200) {
  const ac = audio();
  if (!ac) return;
  try {
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = ac.createGain();
    g.gain.value = gain;
    src.connect(f).connect(g).connect(ac.destination);
    src.start();
  } catch {
    /* silent */
  }
}

export const sfx = {
  pickup() { tone(520, 0.08, 'triangle', 0.1); },
  drop() { tone(300, 0.08, 'triangle', 0.1); },
  chop() { noise(0.09, 0.16, 2400); tone(180, 0.06, 'square', 0.06); },
  sizzle() { noise(0.35, 0.08, 3800); },
  grillDone() { tone(880, 0.12, 'sine', 0.12); tone(1174, 0.16, 'sine', 0.1, 0.1); },
  bell() { tone(1567, 0.35, 'sine', 0.16); tone(2093, 0.4, 'sine', 0.1, 0.02); },
  served() { tone(523, 0.12, 'triangle', 0.14); tone(659, 0.12, 'triangle', 0.14, 0.09); tone(784, 0.2, 'triangle', 0.16, 0.18); },
  fail() { tone(220, 0.25, 'sawtooth', 0.08); tone(165, 0.3, 'sawtooth', 0.08, 0.12); },
  tick() { tone(980, 0.05, 'square', 0.05); },
  click() { tone(700, 0.05, 'triangle', 0.08); },
};
