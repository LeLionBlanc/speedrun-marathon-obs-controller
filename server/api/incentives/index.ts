import { createIncentive, getAllIncentives, getActiveIncentives } from '~/server/database/incentiveService';
import { initDatabase } from '~/server/database/db';
import type { Incentive } from '~/server/database/types';

export default defineEventHandler(async (event) => {
  const method = event.method;
  await initDatabase();

  if (method === 'GET') {
    const query = getQuery(event);
    const activeOnly = query.active === 'true';
    return activeOnly ? await getActiveIncentives() : await getAllIncentives();
  }

  if (method === 'POST') {
    const body = await readBody(event) as Omit<Incentive, 'id' | 'created_at' | 'updated_at'>;
    if (!body.name || body.target_amount === undefined) {
      throw createError({ statusCode: 400, message: 'Name and target_amount are required' });
    }
    return await createIncentive(body);
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' });
});