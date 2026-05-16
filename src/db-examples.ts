/**
 * TruthForge AI - Database Usage Examples
 * 
 * This file demonstrates common database operations.
 * For production use, adapt these patterns to your needs.
 */

import TruthForgeStore from './truthforge_store';
import { v4 as uuidv4 } from 'uuid';

/**
 * Example 1: Initialize database and create question
 */
export async function exampleCreateQuestion() {
  const store = new TruthForgeStore();
  store.initializeSchema();

  const question = store.createQuestion({
    id: `question_${uuidv4()}`,
    text: 'Will artificial intelligence replace software engineers?',
    complexity: 0.78,
    domain: 'technology',
    subtopics: JSON.stringify(['AI', 'jobs', 'automation']),
  });

  console.log('Created question:', question);
  store.close();
}

/**
 * Example 2: Create complete debate flow
 */
export async function exampleCreateDebateFlow() {
  const store = new TruthForgeStore();
  store.initializeSchema();

  // Create question
  const question = store.createQuestion({
    id: `question_${uuidv4()}`,
    text: 'Should AI be regulated by government?',
    complexity: 0.75,
    domain: 'policy',
    subtopics: JSON.stringify(['regulation', 'AI', 'governance']),
  });

  // Create debate session
  const debate = store.createDebate({
    id: `debate_${uuidv4()}`,
    question_id: question.id,
    status: 'in_progress',
    complexity_level: 'high',
    agents_activated: JSON.stringify(['planner', 'thesis', 'antithesis']),
    stage: 1,
    total_stages: 5,
  });

  // Add supporting claim
  const claim = store.createClaim({
    id: `claim_${uuidv4()}`,
    debate_id: debate.id,
    statement: 'Government regulation ensures AI safety and fairness',
    strength: 0.82,
    reasoning: 'Unregulated AI could cause significant harm',
    key_points: JSON.stringify([
      'Safety standards prevent accidents',
      'Fairness requirements reduce bias',
      'Accountability ensures responsibility',
    ]),
    assumptions: JSON.stringify([
      'Government can create effective regulations',
      'Regulations will be enforced',
    ]),
    supporting_count: 3,
  });

  // Add counter claim
  const counterClaim = store.createClaim({
    id: `counter_${uuidv4()}`,
    debate_id: debate.id,
    statement: 'Regulation stifles AI innovation and development',
    strength: 0.71,
    reasoning: 'Excessive regulation creates barriers to entry',
    key_points: JSON.stringify([
      'Compliance costs slow development',
      'Innovation moves to less regulated jurisdictions',
      'Market forces provide incentives for safety',
    ]),
    assumptions: JSON.stringify([
      'Market incentives are sufficient',
      'Innovation is essential for progress',
    ]),
    supporting_count: 2,
  });

  // Add evidence
  const evidence = store.createEvidence({
    id: `evidence_${uuidv4()}`,
    debate_id: debate.id,
    content: 'Studies show safety regulations increase public trust',
    source: 'Nature AI Research 2024',
    credibility_score: 0.85,
    evidence_type: 'peer-reviewed-research',
    date_published: '2024-01-15',
    retrieval_method: 'academic-database',
  });

  console.log('Created debate:', debate.id);
  console.log('Added claim:', claim.id);
  console.log('Added counter-claim:', counterClaim.id);
  console.log('Added evidence:', evidence.id);

  store.close();
}

/**
 * Example 3: Query and retrieve data
 */
export async function exampleQueryData() {
  const store = new TruthForgeStore();
  store.initializeSchema();

  // Get a specific question
  const question = store.getQuestion('question_123');
  if (question) {
    console.log('Question:', question.text);
  }

  // Get debate with all related data
  const debate = store.getDebate('debate_456');
  if (debate) {
    console.log('Debate status:', debate.status);

    // Get all claims for this debate
    const claims = store.getClaimsByDebate(debate.id);
    console.log(`Found ${claims.length} claims`);

    // Get all evidence
    const evidence = store.getEvidenceByDebate(debate.id);
    console.log(`Found ${evidence.length} pieces of evidence`);

    // Get verdict if exists
    const verdict = store.getVerdictByDebate(debate.id);
    if (verdict) {
      console.log('Verdict:', verdict.evaluation);
    }
  }

  store.close();
}

/**
 * Example 4: Use transactions for consistency
 */
export async function exampleTransaction() {
  const store = new TruthForgeStore();
  store.initializeSchema();

  try {
    // Start transaction
    store.beginTransaction();

    // Perform multiple operations
    const debate = store.createDebate({
      id: `debate_${uuidv4()}`,
      question_id: `question_${uuidv4()}`,
      status: 'pending',
      complexity_level: 'medium',
      agents_activated: JSON.stringify([]),
      stage: 0,
      total_stages: 5,
    });

    // Add related data
    for (let i = 0; i < 3; i++) {
      store.createClaim({
        id: `claim_${uuidv4()}`,
        debate_id: debate.id,
        statement: `Claim ${i + 1}`,
        strength: 0.7 + i * 0.1,
        reasoning: 'Sample reasoning',
        key_points: JSON.stringify([]),
        assumptions: JSON.stringify([]),
        supporting_count: 0,
      });
    }

    // Commit transaction
    store.commitTransaction();
    console.log('Transaction committed successfully');
  } catch (error) {
    // Rollback on error
    store.rollbackTransaction();
    console.error('Transaction failed and rolled back:', error);
  } finally {
    store.close();
  }
}

/**
 * Example 5: Create memory entry for long-term storage
 */
export async function exampleCreateMemory() {
  const store = new TruthForgeStore();
  store.initializeSchema();

  const memory = store.createMemoryEntry({
    id: `memory_${uuidv4()}`,
    question: 'What are the main arguments for AI regulation?',
    summary: 'Key arguments include safety, fairness, accountability, and job protection',
    claims: JSON.stringify([
      'Safety standards prevent accidents',
      'Fairness requirements reduce bias',
      'Accountability ensures responsibility',
    ]),
    counter_claims: JSON.stringify([
      'Regulation stifles innovation',
      'Market forces sufficient',
      'Compliance costs too high',
    ]),
    verdict: 'Moderate regulation likely beneficial with careful design',
    confidence: 0.78,
    timestamp: new Date().toISOString(),
    relevance_score: 0.82,
  });

  console.log('Created memory entry:', memory.id);

  // Later, search for related memories
  const relatedMemories = store.searchMemoryByQuestion('AI regulation arguments');
  console.log(`Found ${relatedMemories.length} related memories`);

  store.close();
}

/**
 * Example 6: Create graph relationships
 */
export async function exampleCreateRelationships() {
  const store = new TruthForgeStore();
  store.initializeSchema();

  // Create relationship between claims
  const rel1 = store.createRelationship({
    id: `rel_${uuidv4()}`,
    source_id: 'claim_1',
    target_id: 'claim_2',
    relation_type: 'supports',
    weight: 0.85,
    strength: 0.82,
    explanation: 'This claim provides additional evidence for the first claim',
    metadata: JSON.stringify({ context: 'logical_support' }),
  });

  // Get relationships
  const outgoing = store.getRelationshipsBySource('claim_1');
  const incoming = store.getRelationshipsByTarget('claim_2');

  console.log(`Outgoing relationships from claim_1: ${outgoing.length}`);
  console.log(`Incoming relationships to claim_2: ${incoming.length}`);

  store.close();
}

/**
 * Example 7: Update existing data
 */
export async function exampleUpdateDebate() {
  const store = new TruthForgeStore();
  store.initializeSchema();

  // Create a debate
  const debate = store.createDebate({
    id: `debate_${uuidv4()}`,
    question_id: `question_${uuidv4()}`,
    status: 'pending',
    complexity_level: 'unknown',
    agents_activated: JSON.stringify([]),
    stage: 0,
    total_stages: 5,
  });

  // Update the debate
  store.updateDebate(debate.id, {
    status: 'in_progress',
    complexity_level: 'high',
    agents_activated: JSON.stringify(['planner', 'thesis']),
    stage: 1,
    total_stages: 5,
  });

  // Retrieve updated debate
  const updated = store.getDebate(debate.id);
  console.log('Updated debate status:', updated?.status);

  store.close();
}

/**
 * Example 8: Check database health
 */
export async function exampleHealthCheck() {
  import { checkDatabaseHealth } from './db-init';

  const health = checkDatabaseHealth();
  console.log('Database health:', health);

  if (health.healthy) {
    console.log('✓ Database is operational');
  } else {
    console.log('✗ Database has issues');
  }
}
