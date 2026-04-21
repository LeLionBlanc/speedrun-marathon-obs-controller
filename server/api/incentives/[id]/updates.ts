import { getIncentiveUpdates } from '~/server/database/incentiveService';
import { initDatabase } from '~/server/database/db';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const id = parseInt(event.context.params?.id || '0');
  await initDatabase();

  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid incentive ID' });
  }

  if (method === 'GET') {
    try {
      return await getIncentiveUpdates(id);
    } catch {
      throw createError({ statusCode: 404, message: `Updates for incentive with ID ${id} not found` });
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' });
});