import { getIncentiveById, updateIncentive, deleteIncentive, toggleIncentiveActive } from '~/server/database/incentiveService';
import { initDatabase } from '~/server/database/db';
import type { Incentive } from '~/server/database/types';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const id = parseInt(event.context.params?.id || '0');
  await initDatabase();

  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid incentive ID' });
  }

  if (method === 'GET') {
    try {
      return await getIncentiveById(id);
    } catch {
      throw createError({ statusCode: 404, message: `Incentive with ID ${id} not found` });
    }
  }

  if (method === 'PUT') {
    const body = await readBody(event) as Partial<Omit<Incentive, 'id' | 'created_at' | 'updated_at'>>;
    try {
      return await updateIncentive(id, body);
    } catch {
      throw createError({ statusCode: 404, message: `Incentive with ID ${id} not found` });
    }
  }

  if (method === 'PATCH') {
    try {
      return await toggleIncentiveActive(id);
    } catch {
      throw createError({ statusCode: 404, message: `Incentive with ID ${id} not found` });
    }
  }

  if (method === 'DELETE') {
    try {
      await deleteIncentive(id);
      return { success: true };
    } catch {
      throw createError({ statusCode: 404, message: `Incentive with ID ${id} not found` });
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' });
});