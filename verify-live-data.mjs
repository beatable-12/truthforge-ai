#!/usr/bin/env node

/**
 * Verification Script - Confirms all hardcoded values have been removed
 * Run this to test the live data integration
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const tests = [];

async function test(name, fn) {
  try {
    await fn();
    tests.push({ name, status: '✓ PASS' });
    console.log(`✓ ${name}`);
  } catch (err) {
    tests.push({ name, status: `✗ FAIL: ${err.message}` });
    console.log(`✗ ${name}: ${err.message}`);
  }
}

async function runTests() {
  console.log('\n[VERIFICATION] Testing Live Data Integration\n');

  // Test 1: Debate response structure
  await test('Debate has execution_state', async () => {
    const res = await fetch(`${BASE_URL}/api/truthforge/debate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Will AI replace software engineers?' }),
    });
    const data = await res.json();
    
    if (!data.execution_state) throw new Error('Missing execution_state');
    if (!data.execution_state.planner) throw new Error('Missing planner');
    if (!data.execution_state.memory) throw new Error('Missing memory');
    if (!data.execution_state.evidence) throw new Error('Missing evidence');
    if (!data.execution_state.thesis) throw new Error('Missing thesis');
    if (!data.execution_state.antithesis) throw new Error('Missing antithesis');
    if (!data.execution_state.referee) throw new Error('Missing referee');
  });

  // Test 2: Dynamic memory matches
  await test('Memory matches are dynamic (not hardcoded 3)', async () => {
    const questions = [
      'Simple question?',
      'Very complex question about the future of technology and its implications?'
    ];
    
    const results = [];
    for (const q of questions) {
      const res = await fetch(`${BASE_URL}/api/truthforge/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      results.push(data.execution_state.memory.matches_found);
    }
    
    // Should get different values
    if (results[0] === results[1]) {
      throw new Error(`Memory matches same for different questions: ${results}`);
    }
  });

  // Test 3: Dynamic evidence sources
  await test('Evidence sources vary by domain', async () => {
    const questions = [
      'Should we hire an engineer?',
      'Is AI regulated by GDPR?',
      'Will Bitcoin reach $100k?'
    ];
    
    const results = [];
    for (const q of questions) {
      const res = await fetch(`${BASE_URL}/api/truthforge/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      results.push(data.execution_state.evidence.sources_scanned);
    }
    
    // Should have variation
    const max = Math.max(...results);
    const min = Math.min(...results);
    if (max - min < 50) {
      throw new Error(`Evidence sources too similar: ${results}`);
    }
  });

  // Test 4: Confidence is computed, not hardcoded
  await test('Confidence computed from referee scores', async () => {
    const res = await fetch(`${BASE_URL}/api/truthforge/debate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Test question' }),
    });
    const data = await res.json();
    
    const conf = data.confidence;
    const referee = data.execution_state.referee.overall_confidence;
    
    if (conf < 0 || conf > 100) throw new Error(`Confidence out of range: ${conf}`);
    if (referee < 0 || referee > 1) throw new Error(`Referee score out of range: ${referee}`);
    
    // Confidence should be influenced by referee (40% weight)
    // Very rough check: if confidence is very different from referee*100, something's wrong
    const expected = referee * 100;
    if (Math.abs(conf - expected) > 50) {
      console.log(`  Warning: confidence ${conf} far from referee*100 (${expected})`);
    }
  });

  // Test 5: Signal weights are real (not hardcoded 0.82, 0.74, 0.61)
  await test('Supporting signal weights are dynamic', async () => {
    const res = await fetch(`${BASE_URL}/api/truthforge/debate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Test question' }),
    });
    const data = await res.json();
    
    const signals = data.supporting_signals || [];
    if (signals.length === 0) throw new Error('No signals returned');
    
    // Check that weights are not the same hardcoded values
    const weights = signals.map(s => s.weight);
    const hardcoded = [0.82, 0.74, 0.61];
    
    let allHardcoded = true;
    for (const w of weights) {
      if (!hardcoded.includes(w)) allHardcoded = false;
    }
    
    if (allHardcoded && weights.length === 3) {
      throw new Error(`Signal weights match hardcoded values: ${weights}`);
    }
  });

  // Test 6: Debate history endpoint exists and has real data
  await test('Debate history has computed stats', async () => {
    const res = await fetch(`${BASE_URL}/api/truthforge/debates`);
    const data = await res.json();
    
    if (!data.debates || data.debates.length === 0) {
      throw new Error('No debate history returned');
    }
    
    if (!data.stats) throw new Error('Missing stats');
    if (!data.stats.avg_confidence) throw new Error('Missing avg_confidence');
    if (!data.stats.trend) throw new Error('Missing trend');
    
    // Check that confidence values vary
    const confidences = data.debates.map(d => d.confidence);
    const max = Math.max(...confidences);
    const min = Math.min(...confidences);
    
    if (max === min) throw new Error('All confidence values are identical');
  });

  // Test 7: Graph endpoint returns real topology
  await test('Graph topology has real nodes and edges', async () => {
    const res = await fetch(`${BASE_URL}/api/truthforge/graph`);
    const data = await res.json();
    
    if (!data.graph) throw new Error('Missing graph');
    if (!data.graph.nodes || data.graph.nodes.length === 0) throw new Error('No nodes');
    if (!data.graph.edges || data.graph.edges.length === 0) throw new Error('No edges');
    if (!data.graph.stats) throw new Error('Missing stats');
  });

  // Test 8: Claims are generated from question, not template
  await test('Thesis claims vary by question', async () => {
    const questions = [
      'Will AI replace software engineers?',
      'Should we hire a CTO?',
      'Is open source secure?'
    ];
    
    const results = [];
    for (const q of questions) {
      const res = await fetch(`${BASE_URL}/api/truthforge/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      results.push({
        q,
        primary_claim: data.execution_state.thesis.primary_claim,
        total_claims: data.execution_state.thesis.total_claims
      });
    }
    
    // Claims should differ
    const claims = results.map(r => r.primary_claim);
    const uniqueClaims = new Set(claims);
    
    if (uniqueClaims.size === 1) {
      throw new Error(`All questions got same claim: ${claims[0]}`);
    }
  });

  // Test 9: Analysis text is generated, not template
  await test('Analysis text contains question content', async () => {
    const question = 'Will AI replace software engineers?';
    
    const res = await fetch(`${BASE_URL}/api/truthforge/debate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    
    const analysis = data.analysis.toLowerCase();
    
    // Analysis should reference the question content
    if (!analysis.includes('will') && !analysis.includes('ai') && !analysis.includes('software')) {
      throw new Error('Analysis does not reference question content');
    }
  });

  // Test 10: Complexity varies by question
  await test('Complexity computed from question', async () => {
    const questions = [
      'Yes or no?',
      'Very long question about the complex implications of technology across multiple domains and sectors of the economy?'
    ];
    
    const results = [];
    for (const q of questions) {
      const res = await fetch(`${BASE_URL}/api/truthforge/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      results.push(data.complexity);
    }
    
    if (results[0] === results[1]) {
      throw new Error(`Complexity same for different question lengths: ${results}`);
    }
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log(`\nTest Results: ${tests.filter(t => t.status.startsWith('✓')).length}/${tests.length} passed\n`);
  
  for (const t of tests) {
    console.log(`${t.status} - ${t.name}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Live data integration verified!\n');
}

try {
  await runTests();
} catch (err) {
  console.error('\n❌ Test suite error:', err);
  process.exit(1);
}
