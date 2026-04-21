import { initDatabase } from '~/server/database/db';

let dbInitPromise: Promise<any> | null = null;

if (process.server) {
  dbInitPromise = initDatabase().catch((error) => {
    console.error('Failed to initialize database:', error);
    throw error;
  });
}

export default defineNuxtPlugin(async () => {
  if (process.server && dbInitPromise) {
    await dbInitPromise.catch((error) => {
      console.error('Database initialization failed:', error);
    });
  }
});