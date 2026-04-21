import { getDatabase } from './db';
import { Incentive, IncentiveUpdate, BidWarOption } from './types';
type Knex = any;

export async function createIncentive(incentive: Omit<Incentive, 'id' | 'created_at' | 'updated_at'>): Promise<Incentive> {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const [id] = await db('incentives').insert({
    ...incentive,
    type: incentive.type ?? 'goal',
    created_at: now,
    updated_at: now
  });
  
  return getIncentiveById(id);
}

export async function getAllIncentives(): Promise<Incentive[]> {
  const db = getDatabase();
  return db('incentives').select('*').orderBy('id', 'asc');
}

export async function getActiveIncentives(): Promise<Incentive[]> {
  const db = getDatabase();
  return db('incentives').where({ is_active: true }).select('*').orderBy('id', 'asc');
}

export async function toggleIncentiveActive(id: number): Promise<Incentive> {
  const db = getDatabase();
  const incentive = await getIncentiveById(id);
  await db('incentives')
    .where({ id })
    .update({ is_active: !incentive.is_active, updated_at: new Date().toISOString() });
  return getIncentiveById(id);
}

export async function getIncentiveById(id: number): Promise<Incentive> {
  const db = getDatabase();
  const incentive = await db('incentives').where({ id }).first();
  
  if (!incentive) {
    throw new Error(`Incentive with ID ${id} not found`);
  }
  
  return incentive;
}

export async function updateIncentive(id: number, updates: Partial<Omit<Incentive, 'id' | 'created_at' | 'updated_at'>>): Promise<Incentive> {
  const db = getDatabase();
  
  await db('incentives')
    .where({ id })
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    });
  
  return getIncentiveById(id);
}

export async function deleteIncentive(id: number): Promise<void> {
  const db = getDatabase();
  await db('incentives').where({ id }).delete();
}

export async function updateIncentiveAmount(
  incentiveId: number, 
  amount: number, 
  notes?: string
): Promise<Incentive> {
  const db = getDatabase();
  
  return db.transaction(async (trx: Knex) => {
    const incentive = await trx('incentives').where({ id: incentiveId }).first();
    
    if (!incentive) {
      throw new Error(`Incentive with ID ${incentiveId} not found`);
    }
    
    const newAmount = Number(incentive.current_amount) + Number(amount);
    
    await trx('incentives')
      .where({ id: incentiveId })
      .update({ current_amount: newAmount, updated_at: new Date().toISOString() });
    
    await trx('incentive_updates').insert({
      incentive_id: incentiveId,
      amount,
      notes,
      timestamp: new Date().toISOString()
    });
    
    return trx('incentives').where({ id: incentiveId }).first();
  });
}

export async function getIncentiveUpdates(incentiveId: number): Promise<IncentiveUpdate[]> {
  const db = getDatabase();
  return db('incentive_updates')
    .where({ incentive_id: incentiveId })
    .orderBy('timestamp', 'desc');
}

// ─── Bid War ────────────────────────────────────────────────────────────────

export async function getBidWarOptions(incentiveId: number): Promise<BidWarOption[]> {
  const db = getDatabase();
  return db('bid_war_options')
    .where({ incentive_id: incentiveId })
    .orderBy('amount', 'desc');
}

export async function createBidWarOption(option: Omit<BidWarOption, 'id' | 'created_at' | 'updated_at'> & { hashtag?: string }): Promise<BidWarOption> {
  const db = getDatabase();
  const now = new Date().toISOString();
  const [id] = await db('bid_war_options').insert({ ...option, created_at: now, updated_at: now });
  return db('bid_war_options').where({ id }).first();
}

export async function deleteBidWarOption(optionId: number): Promise<void> {
  const db = getDatabase();
  await db('bid_war_options').where({ id: optionId }).delete();
}

export async function addBidWarVote(
  incentiveId: number,
  optionId: number,
  amount: number,
  notes?: string
): Promise<{ incentive: Incentive; options: BidWarOption[] }> {
  const db = getDatabase();

  return db.transaction(async (trx: Knex) => {
    const incentive = await trx('incentives').where({ id: incentiveId }).first();
    if (!incentive) throw new Error(`Incentive with ID ${incentiveId} not found`);

    const option = await trx('bid_war_options').where({ id: optionId, incentive_id: incentiveId }).first();
    if (!option) throw new Error(`Option with ID ${optionId} not found`);

    const now = new Date().toISOString();

    // Update option amount
    await trx('bid_war_options')
      .where({ id: optionId })
      .update({ amount: Number(option.amount) + Number(amount), updated_at: now });

    // Update parent incentive total
    await trx('incentives')
      .where({ id: incentiveId })
      .update({ current_amount: Number(incentive.current_amount) + Number(amount), updated_at: now });

    // Record update
    await trx('incentive_updates').insert({
      incentive_id: incentiveId,
      amount,
      notes: notes ?? `Vote for option: ${option.name}`,
      timestamp: now
    });

    const updatedIncentive = await trx('incentives').where({ id: incentiveId }).first();
    const updatedOptions = await trx('bid_war_options')
      .where({ incentive_id: incentiveId })
      .orderBy('amount', 'desc');

    return { incentive: updatedIncentive, options: updatedOptions };
  });
}
