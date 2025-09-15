import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { Seeder } from './_types';
import { prisma, runInTransaction, log } from './_utils';

// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read seeders from this folder
const seedersDir = __dirname;

type LoadedSeeder = { seeder: Seeder; file: string };

function isSeeder(x: any): x is Seeder {
  return x && typeof x === 'object' && typeof x.name === 'string' && typeof x.run === 'function';
}

async function loadSeeders(): Promise<LoadedSeeder[]> {
  const entries = await fs.readdir(seedersDir);
  const files = entries.filter(
    // Match "NN_name.seeder.ts|js" (ignore .d.ts)
    (f) => /^\d+.*\.seeder\.(t|j)s$/.test(f) && !f.endsWith('.d.ts'),
  );

  const loaded: LoadedSeeder[] = [];

  for (const file of files) {
    const fullPath = path.join(seedersDir, file);

    try {
      // IMPORTANT: convert Windows path to file:// URL for ESM
      const mod = await import(pathToFileURL(fullPath).href);

      // Accept default or any named export that looks like a Seeder
      const cand =
        mod.default && isSeeder(mod.default)
          ? mod.default
          : Object.values(mod).find(isSeeder);

      if (!cand) {
        console.warn(`⚠️  ${file}: no valid { name, run } export found, skipping.`);
        continue;
      }

      loaded.push({ seeder: cand as Seeder, file });
    } catch (err) {
      console.warn(`⚠️  Failed to import ${file}, skipping.`, err);
    }
  }

  // Sort by filename so 01_* runs before 02_*
  loaded.sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }));

  return loaded;
}

async function run(target?: string) {
  const all = await loadSeeders();

  if (!all.length) {
    console.error('No seeders found in this folder.');
    process.exit(1);
  }

  const listForMsg = all.map((x) => `${x.seeder.name} (${x.file})`).join(', ');

  const selected = target
    ? all.filter(
        (x) =>
          x.seeder.name.toLowerCase() === target.toLowerCase() ||
          x.file.toLowerCase().startsWith(target.toLowerCase()),
      )
    : all;

  if (!selected.length) {
    console.error(`No seeder matched "${target}". Available: ${listForMsg}`);
    process.exit(1);
  }

  for (const { seeder, file } of selected) {
    log(`Seeding: ${seeder.name} [${file}]`);
    await runInTransaction((tx) => seeder.run(tx));
    log(`Done: ${seeder.name}`);
  }
}

const arg = process.argv[2]; // optional: run a single seeder by name or file prefix
run(arg)
  .then(async () => {
    console.log('✅ Seeding completed.');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
