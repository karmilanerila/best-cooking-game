// Sizzle & Serve — entry program for make.fun's best cooking game bounty.
// Copies game/ and screenshots/ into the output directory and writes the
// dossier with the kit's buildDossier, byte for byte as the scorer rebuilds
// it. Node 22 standard library only; no network, no temp files, no deletes.

import { cpSync, existsSync, mkdirSync, writeFileSync, chmodSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// The entry is only the game, its screenshots and the dossier: refuse to
// hand in a half-built tree instead of writing a partial /output.
for (const name of ['game', 'screenshots']) {
  if (!existsSync(join(repoDir, name))) {
    throw new Error(`main.ts: missing ${name}/ next to main.ts`);
  }
}
if (!existsSync(join(repoDir, 'game', 'index.html'))) {
  throw new Error('main.ts: game/index.html is missing');
}

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

// Copy one tree, then fix modes so the collector (user 65534) can read it.
function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) {
        chmodSync(p, 0o755);
        walk(p);
      } else {
        chmodSync(p, 0o644);
      }
    }
  };
  chmodSync(dest, 0o755);
  walk(dest);
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoDir, 'game'), join(outDir, 'game'));
copyTree(join(repoDir, 'screenshots'), join(outDir, 'screenshots'));

const dossier = buildDossier(outDir, DOSSIER_CAPS);
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
chmodSync(dossierPath, 0o644);

// The gate refuses a dossier over 1.5 MiB; fail here, loudly, instead of
// handing in an entry the scorer would refuse.
if (dossier.length > 1572864) {
  throw new Error(`main.ts: dossier.json is ${dossier.length} bytes, over the 1.5 MiB cap`);
}
console.log(`Sizzle & Serve: wrote ${outDir} (dossier.json ${dossier.length} bytes)`);
