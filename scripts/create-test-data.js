#!/usr/bin/env node

const testIncentives = [
  {
    name: "Charity Donation Goal",
    description: "Help us reach our donation goal for the local animal shelter",
    target_amount: 1000,
    current_amount: 250
  },
  {
    name: "New Gaming PC",
    description: "Help fund a new streaming setup",
    target_amount: 2500,
    current_amount: 750
  },
  {
    name: "24-Hour Stream Goal",
    description: "If we reach this goal, I'll do a 24-hour stream next month",
    target_amount: 1500,
    current_amount: 1200
  }
];

const testUpdates = [
  { amount: 50, notes: "Donation from JohnDoe123" },
  { amount: 100, notes: "Donation from StreamSupporter" },
  { amount: 75, notes: "Donation from AnimalLover" },
  { amount: 25, notes: "Donation from NewSubscriber" }
];

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `http://localhost:3000${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} ${response.statusText} - ${errorText}`);
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error with ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

async function createTestData() {
  try {
    const createdIncentives = [];
    for (const incentive of testIncentives) {
      const created = await apiRequest('/api/incentives', 'POST', incentive);
      createdIncentives.push(created);
      console.log(`Created: ${created.name} (ID: ${created.id})`);
    }

    if (createdIncentives.length > 0) {
      const firstId = createdIncentives[0].id;
      for (const update of testUpdates) {
        await apiRequest(`/api/incentives/${firstId}/amount`, 'POST', update);
      }
    }

    const all = await apiRequest('/api/incentives');
    console.log(JSON.stringify(all, null, 2));
  } catch (error) {
    console.error('Test data creation failed:', error);
  }
}

async function run() {
  await new Promise(r => setTimeout(r, 2000));
  await createTestData();
}

run();
