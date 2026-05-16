# TruthForge AI Integration Tests

This document describes the comprehensive integration test suite for the TruthForge AI system.

## Overview

The integration test suite verifies the complete end-to-end flow: **question → Gemini reasoning → database persistence → API response**

### Test Files

- **`src/test-utils.ts`** - Shared test utilities and helpers
- **`src/test-integration.ts`** - Main integration test suite (15 tests)
- **`src/test-gemini.ts`** - Optional Gemini-specific tests

## Running Tests

### Prerequisites

1. **API Server must be running** on port 3000
2. **Dependencies installed**: `npm install`
3. **Database initialized**: Runs automatically on server startup

### Running Integration Tests

#### Option 1: Run in Terminal (Windows)

```bash
# Terminal 1: Start the API server
npm run api

# Terminal 2: Run integration tests
npm run test:integration
```

#### Option 2: Run Using Batch File

```bash
# Automatically starts server and runs tests
run_tests.bat
```

#### Option 3: Using npm commands directly

```bash
# Run the main integration tests
npm run test:api
# or
npm run test:integration

# Run Gemini-specific tests (if GEMINI_API_KEY is set)
npm run test:gemini
```

## Test Suite Details

### Main Integration Tests (15 tests)

#### Test 1: Server Health Check
- **Endpoint**: `GET /health`
- **Validates**: Server is running and healthy
- **Expected**: Status 200 with `status: 'healthy'`

#### Test 2: API Health Check
- **Endpoint**: `GET /api/truthforge/health`
- **Validates**: API service is operational
- **Expected**: Status 200 with `success: true` and `status: 'healthy'`

#### Test 3: Error Handling - Missing Question
- **Endpoint**: `POST /api/truthforge/debate`
- **Validates**: API rejects requests without questions
- **Expected**: Status 400 with error message

#### Test 4: Error Handling - Empty Question
- **Endpoint**: `POST /api/truthforge/debate`
- **Validates**: API rejects empty question strings
- **Expected**: Status 400 with `success: false`

#### Test 5: Simple Question Processing
- **Endpoint**: `POST /api/truthforge/debate`
- **Validates**: Core debate processing works
- **Expected**: Status 200 with debate_id, question, answer, and timestamp
- **Side Effect**: Stores debate_id for later tests

#### Test 6: Get Debate Details
- **Endpoint**: `GET /api/truthforge/debate/:debateId`
- **Validates**: Retrieving processed debates
- **Expected**: Status 200 with debate details
- **Precondition**: Requires debate_id from Test 5

#### Test 7: Get Recent Debates
- **Endpoint**: `GET /api/truthforge/debates`
- **Validates**: Debate listing works
- **Expected**: Status 200 with debates array

#### Test 8: Rate Limiting Verification
- **Endpoint**: `POST /api/truthforge/debate` (multiple requests)
- **Validates**: Rate limiting is in place or requests are handled
- **Expected**: Either 429 status or successful processing up to limit

#### Test 9: Invalid Debate ID Handling
- **Endpoint**: `GET /api/truthforge/debate/invalid_id_12345`
- **Validates**: Proper error handling for invalid IDs
- **Expected**: Status 400, 404, or 500

#### Test 10: Feedback Submission
- **Endpoint**: `POST /api/truthforge/feedback`
- **Validates**: Feedback submission works
- **Expected**: Status 200 with `success: true` and feedback_id

#### Test 11: Error Handling - Missing Feedback Debate ID
- **Endpoint**: `POST /api/truthforge/feedback` (without debate_id)
- **Validates**: Feedback validation
- **Expected**: Status 400 with `success: false`

#### Test 12: Multiple Question Processing
- **Endpoint**: `POST /api/truthforge/debate` (multiple times)
- **Validates**: Processing multiple questions sequentially
- **Expected**: All requests succeed with valid debate_ids

#### Test 13: Memory Retrieval
- **Endpoint**: `GET /api/truthforge/memory/:id`
- **Validates**: Memory/history retrieval
- **Expected**: Status 200 with memory field
- **Precondition**: Requires debate_id from Test 5

#### Test 14: Concurrent Request Handling
- **Endpoint**: `POST /api/truthforge/debate` (concurrent requests)
- **Validates**: System handles concurrent requests
- **Expected**: At least some requests succeed

#### Test 15: Response Schema Validation
- **Endpoint**: `GET /api/truthforge/health`
- **Validates**: Response structure compliance
- **Expected**: All required fields present (success, service, status, timestamp)

### Optional Gemini Tests

If `GEMINI_API_KEY` environment variable is set, additional tests run:

- **Test 1**: Gemini API connectivity
- **Test 2**: Thesis generation
- **Test 3**: Antithesis generation
- **Test 4**: Evidence analysis
- **Test 5**: Verdict generation

## Test Report

After running tests, a formatted report is printed showing:

```
═══════════════════════════════════════════════════════════════════════════
                  TruthForge Integration Test Report
═══════════════════════════════════════════════════════════════════════════

📊 Test Summary:

  Total Tests:        15
  Passed:             14 ✓
  Failed:             1 ✗
  Average Time:       234ms
  Total Duration:     3.51s

───────────────────────────────────────────────────────────────────────────

❌ Failed Tests:

  ✗ Test 6: Get debate details
    Error: Expected status 200, got 404
═══════════════════════════════════════════════════════════════════════════
```

## Test Colors

- 🟢 **Green** (`✓`): Test passed
- 🔴 **Red** (`✗`): Test failed
- 🟡 **Yellow** (`⊘`): Test skipped

## Troubleshooting

### Tests fail with "Server is not running"

1. Ensure API server is started: `npm run api`
2. Wait for it to initialize (look for "Server running on port 3000")
3. Run tests in a separate terminal

### "Cannot find module" errors

1. Ensure dependencies are installed: `npm install`
2. Check that `ts-node` and `node-fetch` are available
3. Verify the Node.js version: `node --version` (v16+ required)

### Rate limiting tests fail

- Rate limiting may be disabled in development mode
- Tests handle this gracefully and verify the endpoint is responsive

### Database errors

1. Ensure SQLite database file can be created
2. Check `TRUTHFORGE_DB_PATH` environment variable if set
3. Default location is `./truthforge.db`

### Gemini tests skip

- Gemini tests are skipped if `GEMINI_API_KEY` is not set
- Set the environment variable to run them: `set GEMINI_API_KEY=your_key`

## Performance Expectations

- Individual tests: 5-1500ms (depending on Gemini API)
- Total suite: 3-30 seconds (depending on question complexity and API availability)
- Average response time per debate: 1-10 seconds

## Exit Codes

- **0**: All tests passed
- **1**: One or more tests failed

## Database Persistence

Tests verify that:

1. Debates are stored in the `debates` table
2. Questions are stored in the `questions` table
3. Claims are stored in the `claims` table
4. Counter-claims are stored in the `counter_claims` table
5. Verdicts are stored in the `verdicts` table
6. Evidence is stored in the `evidence` table
7. Reasonings are stored in the `reasonings` table

## Example Test Session

```bash
PS> npm run test:integration

🧪 TruthForge AI Integration Tests

Initializing tests...

⏳ Waiting for server to be ready...
✓ Server is ready

✓ Test 1: Server health check (23ms)
✓ Test 2: API health check (14ms)
✓ Test 3: Error handling - Missing question (8ms)
✓ Test 4: Error handling - Empty question (6ms)
✓ Test 5: Simple question processing (2341ms)
✓ Test 6: Get debate details (12ms)
✓ Test 7: Get recent debates (9ms)
✓ Test 8: Rate limiting verification (45ms)
✓ Test 9: Invalid debate ID handling (7ms)
✓ Test 10: Feedback submission (11ms)
✓ Test 11: Error handling - Missing feedback debate_id (6ms)
✓ Test 12: Multiple question processing (3421ms)
✓ Test 13: Memory retrieval (8ms)
✓ Test 14: Concurrent request handling (1234ms)
✓ Test 15: Response schema validation (5ms)

═══════════════════════════════════════════════════════════════════════════
                  TruthForge Integration Test Report
═══════════════════════════════════════════════════════════════════════════

📊 Test Summary:

  Total Tests:        15
  Passed:             15 ✓
  Average Time:       356ms
  Total Duration:     7.13s

───────────────────────────────────────────────────────────────────────────

✅ All tests passed!

═══════════════════════════════════════════════════════════════════════════
```

## Continuous Integration

To use these tests in CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Start API Server
  run: npm run api &
  timeout-minutes: 1

- name: Wait for Server
  run: sleep 5

- name: Run Integration Tests
  run: npm run test:integration
  timeout-minutes: 5
```

## Future Enhancements

- Add stress testing for high request volumes
- Add database snapshot/restore for test isolation
- Add test data cleanup between runs
- Add performance benchmarking
- Add load testing scenarios
