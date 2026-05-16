/**
 * TruthForge AI - Database Seeding
 * Populates database with sample data for development and testing
 */

import { v4 as uuidv4 } from 'uuid';
import TruthForgeStore from './truthforge_store';

export interface SeedOptions {
  includeDebates: boolean;
  includeMemory: boolean;
  includeRelationships: boolean;
}

/**
 * Seed database with sample data
 */
export async function seedDatabase(
  store: TruthForgeStore,
  options: SeedOptions = {
    includeDebates: true,
    includeMemory: true,
    includeRelationships: true,
  }
): Promise<{
  questionsCreated: number;
  debatesCreated: number;
  claimsCreated: number;
  relationshipsCreated: number;
  memoryEntriesCreated: number;
}> {
  const stats = {
    questionsCreated: 0,
    debatesCreated: 0,
    claimsCreated: 0,
    relationshipsCreated: 0,
    memoryEntriesCreated: 0,
  };

  try {
    console.log('[Seed] Starting database seeding...');
    store.beginTransaction();

    // Sample questions
    const sampleQuestions = [
      {
        id: `question_${uuidv4()}`,
        text: 'Will artificial intelligence replace software engineers in the next 5 years?',
        complexity: 0.78,
        domain: 'technology',
        subtopics: JSON.stringify(['AI', 'software engineering', 'automation', 'job displacement']),
      },
      {
        id: `question_${uuidv4()}`,
        text: 'Should open-source AI models be freely available to everyone?',
        complexity: 0.72,
        domain: 'policy',
        subtopics: JSON.stringify(['AI safety', 'open source', 'regulation', 'access']),
      },
      {
        id: `question_${uuidv4()}`,
        text: 'Is the European Union AI Act effectively enforceable globally?',
        complexity: 0.81,
        domain: 'regulation',
        subtopics: JSON.stringify(['EU regulation', 'AI governance', 'international law', 'enforcement']),
      },
    ];

    for (const question of sampleQuestions) {
      store.createQuestion(question);
      stats.questionsCreated++;
    }

    if (options.includeDebates) {
      // Sample debates
      for (let i = 0; i < sampleQuestions.length; i++) {
        const debate = {
          id: `debate_${uuidv4()}`,
          question_id: sampleQuestions[i].id,
          status: 'completed',
          complexity_level: 'high',
          agents_activated: JSON.stringify(['planner', 'memory', 'thesis', 'antithesis', 'referee']),
          stage: 5,
          total_stages: 5,
        };
        store.createDebate(debate);
        stats.debatesCreated++;

        // Add sample claims
        const claim = {
          id: `claim_${uuidv4()}`,
          debate_id: debate.id,
          statement: `Strong support for the thesis: ${sampleQuestions[i].text}`,
          strength: 0.78,
          reasoning: 'Based on market trends and technological advancement rates',
          key_points: JSON.stringify([
            'GitHub Copilot shows 55% faster task completion',
            'Job postings correlate with AI adoption',
          ]),
          assumptions: JSON.stringify([
            'Current AI trajectory continues',
            'No major regulatory barriers emerge',
          ]),
          supporting_count: 3,
        };
        store.createClaim(claim);
        stats.claimsCreated++;

        // Add counter-claim
        const counterClaim = {
          id: `counter_claim_${uuidv4()}`,
          debate_id: debate.id,
          statement: `Counter-thesis: ${sampleQuestions[i].text}`,
          strength: 0.64,
          reasoning: 'Historical automation predictions have consistently over-estimated displacement',
          key_points: JSON.stringify([
            'Previous automation cycles created new roles',
            'Human oversight remains critical',
          ]),
          assumptions: JSON.stringify([
            'Humans adapt to AI tools',
            'New roles emerge as others are automated',
          ]),
          attacks_count: 2,
        };
        store.createClaim({
          ...counterClaim,
          id: `counter_claim_${uuidv4()}`,
        } as any);
        stats.claimsCreated++;
      }
    }

    if (options.includeMemory) {
      // Sample memory entries
      const memoryEntries = [
        {
          id: `memory_${uuidv4()}`,
          question: 'What is the current state of AI adoption in enterprise?',
          summary: 'Enterprise AI adoption is accelerating with focus on LLMs for productivity',
          claims: JSON.stringify(['Most enterprises see ROI within 6 months', 'Generative AI is priority']),
          counter_claims: JSON.stringify(['Integration challenges remain', 'Security concerns persist']),
          verdict: 'AI adoption is real but still in early stages',
          confidence: 0.82,
          timestamp: new Date().toISOString(),
          relevance_score: 0.89,
        },
        {
          id: `memory_${uuidv4()}`,
          question: 'How does AI performance scale with model size?',
          summary: 'Scaling laws show predictable improvements up to current limits',
          claims: JSON.stringify(['Larger models perform better', 'Scaling laws are predictable']),
          counter_claims: JSON.stringify(['Plateaus may exist', 'Other factors matter']),
          verdict: 'Scaling is effective but efficiency matters',
          confidence: 0.76,
          timestamp: new Date().toISOString(),
          relevance_score: 0.81,
        },
      ];

      for (const entry of memoryEntries) {
        store.createMemoryEntry(entry);
        stats.memoryEntriesCreated++;
      }
    }

    if (options.includeRelationships && stats.claimsCreated > 0) {
      // Sample relationships (graph edges)
      const claims = sampleQuestions.slice(0, 2);
      if (claims.length > 1) {
        const relationship = {
          id: `rel_${uuidv4()}`,
          source_id: `claim_${uuidv4()}`,
          target_id: `claim_${uuidv4()}`,
          relation_type: 'supports',
          weight: 0.82,
          strength: 0.78,
          explanation: 'This claim provides additional support for the thesis',
          metadata: JSON.stringify({ context: 'market_analysis' }),
        };
        store.createRelationship(relationship);
        stats.relationshipsCreated++;
      }
    }

    store.commitTransaction();
    console.log('[Seed] ✓ Database seeding completed');
    console.log(
      `[Seed] Created: ${stats.questionsCreated} questions, ${stats.debatesCreated} debates, ` +
      `${stats.claimsCreated} claims, ${stats.memoryEntriesCreated} memory entries`
    );

    return stats;
  } catch (error) {
    store.rollbackTransaction();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Seed] Failed to seed database: ${errorMessage}`);
    throw error;
  }
}

/**
 * Clear all data from database (development only)
 */
export async function clearDatabase(store: TruthForgeStore): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clear database in production');
  }

  try {
    console.log('[Seed] Clearing all data...');
    store.beginTransaction();

    const tables = [
      'memory_entries',
      'relationships',
      'reasonings',
      'verdicts',
      'evidence',
      'counter_claims',
      'claims',
      'plan_steps',
      'debates',
      'questions',
    ];

    for (const table of tables) {
      store.deleteAll(table);
    }

    store.commitTransaction();
    console.log('[Seed] ✓ Database cleared');
  } catch (error) {
    store.rollbackTransaction();
    throw error;
  }
}
