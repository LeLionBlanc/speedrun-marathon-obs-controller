#!/usr/bin/env node

import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '../server/database/knexfile.ts');

async function runMigrations() {
  try {
    const config = (await import(configPath)).default;
    const dbDir = path.dirname(config.connection.filename);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    const db = knex(config);
    const [batchNo, log] = await db.migrate.latest();

    if (log.length === 0) {
      console.log('Already up to date');
    } else {
      console.log(`Batch ${batchNo}: ${log.length} migrations run`);
    }

    await db.destroy();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();