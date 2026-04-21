#!/usr/bin/env node

const API_BASE = 'http://localhost:3000';
let createdIncentiveId = null;

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE}${endpoint}`;
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

const testIncentive = {
  name: "Test Donation Goal",
  description: "A test donation goal for API testing",
  target_amount: 1000,
  current_amount: 0
};

const updatedIncentive = {
  name: "Updated Donation Goal",
  description: "Updated description for testing",
  target_amount: 1500
};

const amountUpdate = {
  amount: 250,
  notes: "Test donation from API test"
};

async function runTests() {
  try {
    await new Promise(r => setTimeout(r, 2000));

    const initial = await apiRequest('/api/incentives');
    console.log(`GET /api/incentives: ${initial.length} incentives`);

    const created = await apiRequest('/api/incentives', 'POST', testIncentive);
    createdIncentiveId = created.id;
    console.log(`POST /api/incentives: ID ${createdIncentiveId}`);

    const retrieved = await apiRequest(`/api/incentives/${createdIncentiveId}`);
    console.log(`GET /api/incentives/${createdIncentiveId}:`, retrieved);

    const updated = await apiRequest(`/api/incentives/${createdIncentiveId}`, 'PUT', updatedIncentive);
    console.log(`PUT /api/incentives/${createdIncentiveId}:`, updated);

    const amountResult = await apiRequest(`/api/incentives/${createdIncentiveId}/amount`, 'POST', amountUpdate);
    console.log(`POST amount:`, amountResult);

    const updates = await apiRequest(`/api/incentives/${createdIncentiveId}/updates`);
    console.log(`GET updates: ${updates.length} updates`);

    await apiRequest(`/api/incentives/${createdIncentiveId}`, 'DELETE');
    console.log(`DELETE /api/incentives/${createdIncentiveId}: done`);

    const final = await apiRequest('/api/incentives');
    console.log(`GET /api/incentives: ${final.length} incentives`);
  } catch (error) {
    console.error('Test failed:', error);
    if (createdIncentiveId) {
      await apiRequest(`/api/incentives/${createdIncentiveId}`, 'DELETE').catch(() => {});
    }
  }
}

runTests();
