#!/usr/bin/env node

const {
  createIncentive,
  getAllIncentives,
  getIncentiveById,
  updateIncentive,
  deleteIncentive,
  updateIncentiveAmount,
  getIncentiveUpdates
} = require('../server/database/incentiveService');

const { initDatabase, closeDatabase } = require('../server/database/db');

let createdIncentiveId = null;

const testIncentive = {
  name: "Test Donation Goal",
  description: "A test donation goal for service testing",
  target_amount: 1000,
  current_amount: 0
};

const updatedIncentive = {
  name: "Updated Donation Goal",
  description: "Updated description for testing",
  target_amount: 1500
};

async function runTests() {
  try {
    await initDatabase();

    const initial = await getAllIncentives();
    console.log(`getAllIncentives: ${initial.length} incentives`);

    const created = await createIncentive(testIncentive);
    createdIncentiveId = created.id;
    console.log(`createIncentive: ID ${createdIncentiveId}`);

    const retrieved = await getIncentiveById(createdIncentiveId);
    console.log(`getIncentiveById:`, retrieved);

    const updated = await updateIncentive(createdIncentiveId, updatedIncentive);
    console.log(`updateIncentive:`, updated);

    const amountResult = await updateIncentiveAmount(createdIncentiveId, 250, "Test donation");
    console.log(`updateIncentiveAmount:`, amountResult);

    const updates = await getIncentiveUpdates(createdIncentiveId);
    console.log(`getIncentiveUpdates: ${updates.length} updates`);

    await deleteIncentive(createdIncentiveId);
    console.log(`deleteIncentive: done`);

    const final = await getAllIncentives();
    console.log(`getAllIncentives: ${final.length} incentives`);
  } catch (error) {
    console.error('Test failed:', error);
    if (createdIncentiveId) {
      await deleteIncentive(createdIncentiveId).catch(() => {});
    }
  } finally {
    await closeDatabase().catch(() => {});
  }
}

runTests();
