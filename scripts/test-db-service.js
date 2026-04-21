#!/usr/bin/env node

import { initDatabase, closeDatabase } from '../server/database/db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTest() {
  try {
    const dbDir = path.join(__dirname, '../server/database/data');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    const db = await initDatabase();
    const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables:', tables);

    await closeDatabase();
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

runTest();