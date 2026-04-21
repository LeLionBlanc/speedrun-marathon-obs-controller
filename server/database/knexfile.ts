import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const projectRoot = process.cwd();
const dbDir = path.join(projectRoot, 'server/database/data');
const migrationsDir = path.join(projectRoot, 'server/database/migrations');

const config = {
  client: 'better-sqlite3',
  connection: {
    filename: path.join(dbDir, 'incentives.sqlite3')
  },
  useNullAsDefault: true,
  migrations: {
    directory: migrationsDir
  },
  seeds: {
    directory: path.join(__dirname, 'seeds')
  }
};

export default config;