#!/usr/bin/env node

/**
 * Quick test of the mock API server
 */

import fetch from 'node-fetch';

async function test() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('[TEST] Starting mock API test...\n');

  try {
    // Test 1: Health check
    console.log('[TEST 1] Testing /health endpoint...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.status}`);
    const health = await healthRes.json();
    console.log('[TEST 1 ✓] Health:', health);
    console.log();

    // Test 2: Debate endpoint
    console.log('[TEST 2] Testing /api/truthforge/debate endpoint...');
    const debateRes = await fetch(`${BASE_URL}/api/truthforge/debate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Will AI replace software engineers?' }),
    });
    if (!debateRes.ok) throw new Error(`Debate call failed: ${debateRes.status}`);
    const debate = await debateRes.json();
    console.log('[TEST 2 ✓] Debate response:');
    console.log(`  - Question: ${debate.question}`);
    console.log(`  - Analysis length: ${debate.analysis?.length || 0} chars`);
    console.log(`  - Supporting signals: ${debate.supporting_signals?.length || 0}`);
    console.log(`  - Counterarguments: ${debate.counterarguments?.length || 0}`);
    console.log(`  - Confidence: ${debate.confidence}`);
    console.log();

    console.log('[SUCCESS] All mock API tests passed! ✓');
    console.log('\nThe mock API is ready for frontend integration.');
    console.log('Visit http://localhost:5173/dashboard and click "Forge"');
    
    process.exit(0);
  } catch (err) {
    console.error('[ERROR]', err instanceof Error ? err.message : err);
    console.error('\nMake sure the mock API server is running:');
    console.error('  node server-mock.mjs');
    process.exit(1);
  }
}

test();
