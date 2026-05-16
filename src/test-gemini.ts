/**
 * TruthForge Gemini Integration Tests (Optional)
 * Tests specifically for Gemini API functionality
 * These tests are skipped if GEMINI_API_KEY is not set
 */

import { runTest, skipTest, generateReport, TestResult, assertExists, assertOk } from './test-utils.js';

const results: TestResult[] = [];

/**
 * Check if Gemini API key is configured
 */
function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

/**
 * Run Gemini-specific tests
 */
async function runGeminiTests(): Promise<void> {
  console.log('\n🧪 TruthForge Gemini Integration Tests\n');

  const startTime = Date.now();

  if (!isGeminiConfigured()) {
    console.log('⚠️  Gemini API Key not configured\n');
    console.log('Skipping Gemini tests. Set GEMINI_API_KEY environment variable to enable.\n');

    results.push(
      skipTest('Test 1: Gemini connectivity check', 'GEMINI_API_KEY not configured'),
      skipTest('Test 2: Thesis generation', 'GEMINI_API_KEY not configured'),
      skipTest('Test 3: Antithesis generation', 'GEMINI_API_KEY not configured'),
      skipTest('Test 4: Evidence analysis', 'GEMINI_API_KEY not configured'),
      skipTest('Test 5: Verdict generation', 'GEMINI_API_KEY not configured')
    );
  } else {
    // Test 1: Gemini Connectivity
    results.push(
      await runTest('Test 1: Gemini API connectivity check', async () => {
        try {
          const { GeminiClient } = await import('./gemini-client.js');
          const client = new GeminiClient();
          assertExists(client, 'Gemini client should be created successfully');
        } catch (error) {
          throw new Error(`Failed to initialize Gemini client: ${error}`);
        }
      })
    );

    // Test 2: Thesis Generation
    results.push(
      await runTest('Test 2: Thesis generation via Gemini', async () => {
        try {
          const { GeminiClient } = await import('./gemini-client.js');
          const client = new GeminiClient();

          const result = await client.generateThesis(
            'Is artificial intelligence beneficial?',
            'Technology and Society'
          );

          assertExists(result.thesis, 'Should return thesis statement');
          assertOk(result.thesis.length > 0, 'Thesis should not be empty');
          assertExists(result.key_points, 'Should return key points');
          assertExists(result.strength, 'Should return strength score');
        } catch (error) {
          throw new Error(`Thesis generation failed: ${error}`);
        }
      })
    );

    // Test 3: Antithesis Generation
    results.push(
      await runTest('Test 3: Antithesis generation via Gemini', async () => {
        try {
          const { GeminiClient } = await import('./gemini-client.js');
          const client = new GeminiClient();

          const result = await client.generateAntithesis([
            'Artificial intelligence improves efficiency',
            'AI enables better decision-making',
          ]);

          assertExists(result.antithesis, 'Should return antithesis statement');
          assertOk(result.antithesis.length > 0, 'Antithesis should not be empty');
          assertExists(result.counter_points, 'Should return counter key points');
        } catch (error) {
          throw new Error(`Antithesis generation failed: ${error}`);
        }
      })
    );

    // Test 4: Evidence Analysis
    results.push(
      await runTest('Test 4: Evidence analysis via Gemini', async () => {
        try {
          const { GeminiClient } = await import('./gemini-client.js');
          const client = new GeminiClient();

          const result = await client.analyzeEvidence(
            'AI has improved medical diagnostics',
            'Artificial intelligence is beneficial to healthcare'
          );

          assertExists(result.credibility_score, 'Should return credibility score');
          assertExists(result.relevance_score, 'Should return relevance score');
          assertExists(result.key_findings, 'Should return key findings');
        } catch (error) {
          throw new Error(`Evidence analysis failed: ${error}`);
        }
      })
    );

    // Test 5: Verdict Generation
    results.push(
      await runTest('Test 5: Verdict generation via Gemini', async () => {
        try {
          const { GeminiClient } = await import('./gemini-client.js');
          const client = new GeminiClient();

          const result = await client.generateVerdict({
            thesis: 'Artificial intelligence is beneficial to society',
            antithesis: 'Artificial intelligence poses significant risks',
            evidence: [
              {
                credibility_score: 0.85,
                relevance_score: 0.90,
                key_findings: ['Medical benefits', 'Efficiency gains'],
                quality_assessment: 'Strong evidence for benefits',
              },
            ],
          });

          assertExists(result.evaluation, 'Should return evaluation');
          assertOk(result.evaluation.length > 0, 'Evaluation should not be empty');
          assertExists(result.overall_confidence, 'Should return confidence score');
        } catch (error) {
          throw new Error(`Verdict generation failed: ${error}`);
        }
      })
    );
  }

  const totalDuration = Date.now() - startTime;

  // Generate report
  generateReport(results, totalDuration);

  // Exit with appropriate code
  const failedTests = results.filter((r) => !r.passed && !r.skipped).length;
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runGeminiTests().catch((error) => {
  console.error('Gemini test runner failed:', error);
  process.exit(1);
});
