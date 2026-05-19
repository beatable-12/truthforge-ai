#!/usr/bin/env node

// Simple synchronous test script to debug startup
console.log('[TEST] Starting TruthForge startup test...');

try {
  console.log('[TEST] Node version:', process.version);
  console.log('[TEST] CWD:', process.cwd());
  
  // Test 1: Check dotenv
  console.log('[TEST] Testing dotenv import...');
  require('dotenv').config();
  console.log('[TEST] ✓ dotenv loaded');
  
  // Test 2: Check if files exist
  const fs = require('fs');
  const path = require('path');
  
  const schemaPath = path.join(__dirname, 'src', 'truthforge_schema.sql');
  if (fs.existsSync(schemaPath)) {
    console.log('[TEST] ✓ Schema file found');
  } else {
    console.log('[TEST] ✗ Schema file NOT found at:', schemaPath);
  }
  
  // Test 3: Try importing db-init
  console.log('[TEST] Attempting to import db-init...');
  const { initializeDatabase } = require('./src/db-init.ts');
  console.log('[TEST] ✓ db-init imported');
  
  console.log('[TEST] All basic checks passed!');
  
} catch (error) {
  console.error('[TEST] Error:', error.message || error);
  console.error('[TEST] Stack:', error.stack);
  process.exit(1);
}
