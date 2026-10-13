import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function resolveAssetPath(subPath: string): string {
  const p1 = join(__dirname, subPath);
  if (existsSync(p1)) return p1;
  const p2 = join(__dirname, '..', 'src', subPath);
  if (existsSync(p2)) return p2;
  return p1;
}

export interface MigrationOptions {
  connectionString?: string;
  isStandaloneTest?: boolean;
}

export async function applyStandaloneAuthFixture(client: pg.Client): Promise<void> {
  const check = await client.query(`
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'
  `);
  if (check.rows.length === 0) {
    const fixturePath = resolveAssetPath(join('fixtures', 'standalone_auth_stub.sql'));
    const sql = await readFile(fixturePath, 'utf-8');
    await client.query(sql);
  }
}

export async function runMigrations(options?: MigrationOptions): Promise<string[]> {
  const connStr =
    options?.connectionString ||
    process.env.MIGRATOR_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (!connStr) {
    throw new Error('Migration requires MIGRATOR_DATABASE_URL or DATABASE_URL');
  }

  const client = new pg.Client({ connectionString: connStr });
  await client.connect();

  const appliedMigrations: string[] = [];

  try {
    // In standalone PostgreSQL test environments (outside Supabase), apply auth fixture stub if needed
    if (options?.isStandaloneTest || process.env.STANDALONE_POSTGRES_FIXTURES === 'true') {
      await applyStandaloneAuthFixture(client);
    }

    // Ensure migrations ledger table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = resolveAssetPath('migrations');
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      const check = await client.query(
        'SELECT 1 FROM public._migrations WHERE name = $1',
        [file]
      );
      if (check.rows.length > 0) {
        continue;
      }

      const sqlContent = await readFile(join(migrationsDir, file), 'utf-8');
      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO public._migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        appliedMigrations.push(file);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    return appliedMigrations;
  } finally {
    await client.end();
  }
}

// Allow direct CLI execution: node dist/migrate.js
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations({
    isStandaloneTest: process.env.STANDALONE_POSTGRES_FIXTURES === 'true',
  })
    .then((applied) => {
      console.log(`Migrations complete. Applied: ${applied.length > 0 ? applied.join(', ') : 'none (already up to date)'}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
