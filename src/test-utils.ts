/**
 * TruthForge Test Utilities
 * Helper functions for integration testing
 */

import fetch from 'node-fetch';

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * ANSI color codes for terminal output
 */
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Create a test client for making HTTP requests
 */
export function createTestClient(baseUrl: string) {
  return {
    async get(endpoint: string): Promise<{ status: number; data: unknown; duration: number }> {
      const startTime = Date.now();
      const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        const duration = Date.now() - startTime;

        return { status: response.status, data, duration };
      } catch (error) {
        const duration = Date.now() - startTime;
        throw { status: 0, duration, error };
      }
    },

    async post(
      endpoint: string,
      body?: Record<string, unknown>
    ): Promise<{ status: number; data: unknown; duration: number }> {
      const startTime = Date.now();
      const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();
        const duration = Date.now() - startTime;

        return { status: response.status, data, duration };
      } catch (error) {
        const duration = Date.now() - startTime;
        throw { status: 0, duration, error };
      }
    },

    async put(
      endpoint: string,
      body?: Record<string, unknown>
    ): Promise<{ status: number; data: unknown; duration: number }> {
      const startTime = Date.now();
      const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();
        const duration = Date.now() - startTime;

        return { status: response.status, data, duration };
      } catch (error) {
        const duration = Date.now() - startTime;
        throw { status: 0, duration, error };
      }
    },

    async delete(endpoint: string): Promise<{ status: number; data: unknown; duration: number }> {
      const startTime = Date.now();
      const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

      try {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        const duration = Date.now() - startTime;

        return { status: response.status, data, duration };
      } catch (error) {
        const duration = Date.now() - startTime;
        throw { status: 0, duration, error };
      }
    },
  };
}

/**
 * Sleep/delay utility
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Report test passed
 */
export function testPassed(name: string, duration: number): void {
  console.log(`${colors.green}✓${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}`);
}

/**
 * Report test failed
 */
export function testFailed(name: string, error: string, duration: number): void {
  console.log(
    `${colors.red}✗${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}`
  );
  console.log(`  ${colors.red}Error: ${error}${colors.reset}`);
}

/**
 * Report test skipped
 */
export function testSkipped(name: string, reason: string): void {
  console.log(`${colors.yellow}⊘${colors.reset} ${name} ${colors.gray}(${reason})${colors.reset}`);
}

/**
 * Format duration in milliseconds to readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Assertion helpers
 */
export function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

export function assertOk(value: unknown, message: string): void {
  if (!value) {
    throw new Error(message);
  }
}

export function assertStatusCode(status: number, expected: number | number[], message: string): void {
  const expectedCodes = Array.isArray(expected) ? expected : [expected];
  if (!expectedCodes.includes(status)) {
    throw new Error(
      `${message}: expected status ${expectedCodes.join(' or ')}, got ${status}`
    );
  }
}

export function assertExists(value: unknown, message: string): void {
  if (value === null || value === undefined) {
    throw new Error(`${message}: value is null or undefined`);
  }
}

export function assertIsArray(value: unknown, message: string): void {
  if (!Array.isArray(value)) {
    throw new Error(`${message}: expected array, got ${typeof value}`);
  }
}

/**
 * Run a single test
 */
export async function runTest(
  name: string,
  fn: () => Promise<void>
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    await fn();
    const duration = Date.now() - startTime;
    testPassed(name, duration);
    return { name, passed: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    testFailed(name, errorMessage, duration);
    return { name, passed: false, duration, error: errorMessage };
  }
}

/**
 * Skip a test
 */
export function skipTest(name: string, reason: string): TestResult {
  testSkipped(name, reason);
  return { name, passed: true, duration: 0, skipped: true, skipReason: reason };
}

/**
 * Generate test report
 */
export function generateReport(results: TestResult[], totalDuration: number): void {
  const passed = results.filter((r) => r.passed && !r.skipped).length;
  const failed = results.filter((r) => !r.passed && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const total = results.length;

  console.log('\n' + colors.bright);
  console.log('═'.repeat(70));
  console.log('                  TruthForge Integration Test Report');
  console.log('═'.repeat(70));
  console.log(colors.reset);

  console.log('\n📊 Test Summary:\n');

  console.log(`  Total Tests:        ${total}`);
  console.log(
    `  ${colors.green}Passed:${colors.reset}           ${passed} ✓`
  );
  if (failed > 0) {
    console.log(`  ${colors.red}Failed:${colors.reset}           ${failed} ✗`);
  }
  if (skipped > 0) {
    console.log(`  ${colors.yellow}Skipped:${colors.reset}          ${skipped} ⊘`);
  }

  const avgDuration = total > 0 ? Math.round(results.reduce((a, r) => a + r.duration, 0) / total) : 0;
  console.log(`  Average Time:       ${formatDuration(avgDuration)}`);
  console.log(`  Total Duration:     ${formatDuration(totalDuration)}`);

  console.log('\n' + colors.bright);
  console.log('─'.repeat(70));
  console.log(colors.reset);

  if (failed > 0) {
    console.log(`\n${colors.red}❌ Failed Tests:${colors.reset}\n`);
    results
      .filter((r) => !r.passed && !r.skipped)
      .forEach((r) => {
        console.log(`  ${colors.red}✗${colors.reset} ${r.name}`);
        if (r.error) {
          console.log(`    ${colors.red}${r.error}${colors.reset}`);
        }
      });
  } else if (passed > 0) {
    console.log(`\n${colors.green}✅ All tests passed!${colors.reset}`);
  }

  if (skipped > 0) {
    console.log(`\n${colors.yellow}⊘ Skipped Tests:${colors.reset}\n`);
    results
      .filter((r) => r.skipped)
      .forEach((r) => {
        console.log(`  ${colors.yellow}⊘${colors.reset} ${r.name}`);
        if (r.skipReason) {
          console.log(`    ${colors.yellow}${r.skipReason}${colors.reset}`);
        }
      });
  }

  console.log('\n' + colors.bright);
  console.log('═'.repeat(70));
  console.log(colors.reset);
  console.log('');
}

/**
 * Check if server is running
 */
export async function isServerRunning(url: string, timeout: number = 5000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, { method: 'GET' });
      return response.ok || response.status === 200;
    } catch {
      await delay(100);
    }
  }
  return false;
}

/**
 * Wait for server to be ready
 */
export async function waitForServer(
  baseUrl: string,
  healthEndpoint: string = '/health',
  maxAttempts: number = 50
): Promise<boolean> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const url = `${baseUrl}${healthEndpoint}`;
      const response = await fetch(url, {
        method: 'GET',
      });
      if (response.ok || response.status === 200) {
        return true;
      }
    } catch {
      // Continue trying
    }
    await delay(100);
    attempts++;
  }
  return false;
}

/**
 * Test data generators
 */
export const TEST_QUESTIONS = [
  'What is 2+2?',
  'Is artificial intelligence beneficial to society?',
  'Should we use renewable energy?',
  'What causes climate change?',
  'Is remote work better than office work?',
];

export const TEST_INVALID_INPUTS = [
  '',
  '   ',
  null,
  undefined,
];
