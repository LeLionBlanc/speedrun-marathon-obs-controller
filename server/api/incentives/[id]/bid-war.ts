import {
  getBidWarOptions,
  createBidWarOption,
  deleteBidWarOption,
  addBidWarVote,
  getIncentiveById
} from '~/server/database/incentiveService';
import { initDatabase } from '~/server/database/db';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const id = parseInt(event.context.params?.id || '0');

  await initDatabase();

  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid incentive ID' });
  }

  // GET /api/incentives/:id/bid-war  → list options
  if (method === 'GET') {
    const incentive = await getIncentiveById(id);
    if (incentive.type !== 'bid_war') {
      throw createError({ statusCode: 400, message: 'Incentive is not a bid war' });
    }
    return getBidWarOptions(id);
  }

  // POST /api/incentives/:id/bid-war  → add option OR cast vote
  if (method === 'POST') {
    const body = await readBody(event);

    // Vote: { option_id, amount, notes? }
    if (body.option_id !== undefined) {
      const { option_id, amount, notes } = body;
      if (amount === undefined || amount === null || amount === 0) {
        throw createError({ statusCode: 400, message: 'amount must be non-zero' });
      }
      return addBidWarVote(id, Number(option_id), Number(amount), notes);
    }

    // Create option: { name, hashtag? }
    if (!body.name) {
      throw createError({ statusCode: 400, message: 'name is required' });
    }
    return createBidWarOption({ incentive_id: id, name: body.name, amount: 0, hashtag: body.hashtag ?? null });
  }

  // DELETE /api/incentives/:id/bid-war?option_id=X  → remove option
  if (method === 'DELETE') {
    const query = getQuery(event);
    const optionId = parseInt(String(query.option_id || '0'));
    if (!optionId) {
      throw createError({ statusCode: 400, message: 'option_id query param required' });
    }
    await deleteBidWarOption(optionId);
    return { success: true };
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' });
});
