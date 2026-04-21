import knex from 'knex';
type Knex = any;
import path from 'path';
import fs from 'fs';
import config from './knexfile';

const dbPath = (config as any)?.connection?.filename as string | undefined;

let db: Knex | null = null;
let initPromise: Promise<Knex> | null = null;

export async function initDatabase(): Promise<Knex> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!dbPath) {
      throw new Error('Database path is not configured in knexfile connection.filename');
    }

    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const knexInstance = knex(config);

    try {
      await knexInstance.migrate.latest();
    } catch (error) {
      await knexInstance.destroy().catch(() => undefined);
      throw error;
    }

    db = knexInstance;
    return db;
  })();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

export function getDatabase(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  initPromise = null;
  if (db) {
    await db.destroy();
    db = null;
  }
}