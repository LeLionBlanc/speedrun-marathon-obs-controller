#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import knex from 'knex';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '../.nuxt/dev/data');
const dbPath = path.join(dbDir, 'incentives.sqlite3');

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = knex({
  client: 'better-sqlite3',
  connection: { filename: dbPath },
  useNullAsDefault: true
});

async function createTables() {
  try {
    if (await db.schema.hasTable('incentives')) {
      console.log('Tables already exist');
      return;
    }

    await db.schema.createTable('incentives', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.decimal('target_amount', 14, 2).notNullable();
      table.decimal('current_amount', 14, 2).notNullable().defaultTo(0);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });

    await db.schema.createTable('incentive_updates', (table) => {
      table.increments('id').primary();
      table.integer('incentive_id').unsigned().notNullable();
      table.decimal('amount', 14, 2).notNullable();
      table.timestamp('timestamp').defaultTo(db.fn.now());
      table.text('notes');
      table.foreign('incentive_id').references('id').inTable('incentives').onDelete('CASCADE');
    });

    console.log('Tables created');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await db.destroy();
  }
}

createTables();