import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { PrismaClient } from '@prisma/client';
import type { DataMigration } from './_types';
// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const migDir = __dirname;

function isDataMigration(x: any): x is DataMigration {
  return x && typeof x === 'object' && typeof x.name === 'string' && typeof x.up === 'function';
}

async function loadMigrations(): Promise<Array<{ file: string; mig: DataMigration }>> {
  const entries = await fs.readdir(migDir);
  const files = entries.filter(
    (f) => /^\d+.*\.migration\.(t|j)s$/.test(f) && !f.endsWith('.d.ts')
  );

  const loaded: Array<{ file: string; mig: DataMigration }> = [];
  for (const file of files) {
    const full = path.join(migDir, file);
    try {
      const mod = await import(pathToFileURL(full).href);
      const cand =
        (mod.default && isDataMigration(mod.default) && mod.default) ||
        (Object.values(mod).find(isDataMigration) as DataMigration | undefined);
      if (!cand) {
        console.warn(`⚠️  ${file}: no valid DataMigration export, skipping.`);
        continue;
      }
      loaded.push({ file, mig: cand });
    } catch (e) {
      console.warn(`⚠️  Failed to import ${file}, skipping.`, e);
    }
  }

  // Sort by filename: 001_... before 002_...
  loaded.sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }));
  return loaded;
}

async function getAppliedSet(): Promise<Set<string>> {
  const rows = await prisma.app_data_migration.findMany({ select: { name: true } });
  return new Set(rows.map((r: { name: any; }) => r.name));
}

async function markApplied(name: string, durationMs: number, note?: string) {
  await prisma.app_data_migration.create({
    data: { name, duration_ms: durationMs, success: true, note },
  });
}

async function removeApplied(name: string) {
  await prisma.app_data_migration.delete({ where: { name } }).catch(() => {});
}

async function runSingle(mig: DataMigration, redo = false) {
  const start = Date.now();
  try {
    await prisma.$transaction(async (tx: any) => {
      if (redo) {
        // Attempt down() if present (optional)
        if (typeof mig.down === 'function') {
          await mig.down(tx);
        }
        await removeApplied(mig.name);
      }
      await mig.up(tx);
    });
    await markApplied(mig.name, Date.now() - start);
    console.log(`✅ ${mig.name} applied in ${Date.now() - start}ms`);
  } catch (e) {
    console.error(`❌ ${mig.name} failed:`, e);
    throw e;
  }
}

async function main() {
  const all = await loadMigrations();
  if (!all.length) {
    console.error('No data migrations found.');
    process.exit(1);
  }

  // CLI args:
  //   index.ts                 → run all pending
  //   index.ts 001_backfill... → run just that migration (if pending)
  //   index.ts 001_backfill... --redo → re-run (down then up)
  const target = process.argv[2]; // migration name or filename prefix (optional)
  const redo = process.argv.includes('--redo');

  const applied = await getAppliedSet();
  const listForMsg = all.map((x) => `${x.mig.name} (${x.file})`).join(', ');

  let selected = all;

  if (target) {
    const low = target.toLowerCase();
    selected = all.filter(
      (x) => x.mig.name.toLowerCase() === low || x.file.toLowerCase().startsWith(low)
    );
    if (!selected.length) {
      console.error(`No migration matched "${target}". Available: ${listForMsg}`);
      process.exit(1);
    }
  }

  for (const { mig, file } of selected) {
    const isApplied = applied.has(mig.name);
    if (isApplied && !redo && !target) {
      // Running “all pending” → skip already applied
      console.log(`↪︎  Skip (already applied): ${mig.name} [${file}]`);
      continue;
    }
    console.log(`▶︎  Running: ${mig.name} [${file}]${redo ? ' (redo)' : ''}`);
    await runSingle(mig, redo && (target ? true : false));
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('🎉 Data migrations complete.');
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    process.exit(1);
  });
