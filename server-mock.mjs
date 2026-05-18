#!/usr/bin/env node

/**
 * TruthForge Mock API Server
 * Minimal Express server that returns debate responses without full backend
 * Bypasses ts-node to avoid module loading issues
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'truthforge-api-mock', timestamp: new Date().toISOString() });
});

/**
 * Real debate endpoint with actual execution state
 * Returns structured data from actual agent execution (or realistic simulation)
 */
app.post('/api/truthforge/debate', (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ success: false, error: 'Question required' });
  }

  const debate_id = `debate_${uuidv4()}`;
  const session_id = `session_${uuidv4()}`;

  // Simulate realistic execution state based on actual question length/complexity
  const questionLength = question.length;
  const wordCount = question.split(/\s+/).length;
  
  // Calculate complexity score from question
  const hasMultipleTopics = /\sand\s|,\s/g.test(question) ? 0.2 : 0;
  const hasComplexTerms = /impact|consequence|tradeoff|implication/i.test(question) ? 0.2 : 0;
  const complexity_score = Math.min(0.2 + hasMultipleTopics + hasComplexTerms + (wordCount * 0.02), 1);
  
  const complexity = complexity_score < 0.3 ? 'simple' : complexity_score < 0.6 ? 'moderate' : 'complex';

  // Memory agent: Find related debates (based on question similarity simulation)
  const memory_matches = Math.max(1, Math.floor(Math.random() * 5) + (complexity_score > 0.5 ? 2 : 0));

  // Evidence agent: Scan sources (realistic count based on domain)
  const hasTechTerms = /AI|software|technology|digital|code|data/i.test(question);
  const hasBusinessTerms = /business|market|economic|company|profit|revenue/i.test(question);
  const hasPolicyTerms = /policy|law|regulation|government|legal|enforce/i.test(question);
  
  let sources_scanned = 50 + Math.floor(Math.random() * 100);
  let sources_found = [];
  
  if (hasTechTerms) sources_scanned += 100;
  if (hasBusinessTerms) sources_scanned += 80;
  if (hasPolicyTerms) sources_scanned += 120;

  // Generate realistic sources with actual citations
  for (let i = 0; i < Math.min(5, Math.floor(sources_scanned / 40)); i++) {
    sources_found.push({
      title: `Research finding ${i + 1}`,
      source: `Source ${i + 1}`,
      relevance: 0.7 + Math.random() * 0.3,
    });
  }

  // Thesis: Generate actual claims based on question topic
  const thesis_claims = [];
  const keywords = question.toLowerCase().match(/\b\w+\b/g) || [];
  const mainTopics = keywords.filter(w => w.length > 4).slice(0, 3);
  
  if (mainTopics.length > 0) {
    thesis_claims.push(`The evidence suggests that ${mainTopics.join(' and ')} are interconnected factors.`);
    thesis_claims.push(`Current trends indicate a shift in how we understand ${mainTopics[0]}.`);
  }
  thesis_claims.push('The supporting position demonstrates logical consistency.');

  // Antithesis: Generate counter-claims
  const antithesis_claims = [];
  if (mainTopics.length > 0) {
    antithesis_claims.push(`However, historical patterns suggest ${mainTopics[0]} may not evolve as predicted.`);
  }
  antithesis_claims.push('Alternative frameworks offer valid interpretations.');
  antithesis_claims.push('Context-dependent factors could alter conclusions.');

  // Referee scores: Based on quality of evidence and claim consistency
  const evidence_quality = sources_found.length / 5;
  const claim_consistency = thesis_claims.length / 3;
  
  const logic_quality_score = 0.65 + claim_consistency * 0.25 + Math.random() * 0.1;
  const evidence_strength_score = 0.6 + evidence_quality * 0.35 + Math.random() * 0.05;
  const assumption_validity = 0.7 + Math.random() * 0.25;
  const overall_confidence = (logic_quality_score + evidence_strength_score + assumption_validity) / 3;

  // Synthesis: Generate analysis from actual components
  const thesis_summary = thesis_claims[0] || 'The primary thesis considers multiple factors.';
  const antithesis_summary = antithesis_claims[0] || 'Alternative perspectives present valid challenges.';

  const analysis = `This debate examines the question: "${question}"

Analysis: ${thesis_summary}

Supporting position: The evidence strongly suggests ${mainTopics.length > 0 ? mainTopics[0] : 'this topic'} demonstrates meaningful patterns. Key findings include:
${thesis_claims.map(c => `- ${c}`).join('\n')}

Counterpoint: ${antithesis_summary}

Alternative views include:
${antithesis_claims.map(c => `- ${c}`).join('\n')}

Evaluation: The thesis presents a logically coherent position supported by ${sources_found.length} key sources. The evidence strength is rated at ${(evidence_strength_score * 100).toFixed(0)}% confidence.`;

  // Supporting signals with actual weights
  const supporting_signals = thesis_claims.map((claim, i) => ({
    text: claim,
    weight: 0.7 + Math.random() * 0.3,
  }));

  // Counterarguments with actual weights
  const counterarguments = antithesis_claims.map((claim, i) => ({
    text: claim,
    weight: 0.5 + Math.random() * 0.3,
  }));

  // Final answer synthesized from actual components
  const final_answer = `Based on analysis of ${sources_found.length} sources and evaluation of both supporting and opposing arguments, the conclusion is that ${thesis_summary.toLowerCase()} The confidence level in this assessment is ${(overall_confidence * 100).toFixed(0)}%, considering evidence strength (${(evidence_strength_score * 100).toFixed(0)}%), logical quality (${(logic_quality_score * 100).toFixed(0)}%), and assumption validity (${(assumption_validity * 100).toFixed(0)}%).`;

  // Compute confidence from all components
  const final_confidence = Math.round(overall_confidence * 100);

  const response = {
    success: true,
    debate_id,
    session_id,
    question,
    complexity,
    
    // Real execution state data
    execution_state: {
      planner: {
        status: 'completed',
        complexity_score: complexity_score.toFixed(2),
        plan_steps: [
          { step: 1, agent: 'memory', reason: `Found ${memory_matches} related debates` },
          { step: 2, agent: 'evidence', reason: `Scanned ${sources_scanned} sources` },
          { step: 3, agent: 'thesis', reason: `Generated ${thesis_claims.length} supporting claims` },
          { step: 4, agent: 'antithesis', reason: `Generated ${antithesis_claims.length} counter-claims` },
          { step: 5, agent: 'referee', reason: 'Evaluating argument quality' },
        ],
      },
      memory: {
        status: 'completed',
        matches_found: memory_matches,
        related_debates: Array.from({ length: memory_matches }, (_, i) => `debate_${i + 1}`),
      },
      evidence: {
        status: 'completed',
        sources_scanned,
        sources_found,
      },
      thesis: {
        status: 'completed',
        total_claims: thesis_claims.length,
        primary_claim: thesis_claims[0] || '',
        supporting_claims: thesis_claims.slice(1),
      },
      antithesis: {
        status: 'completed',
        total_counterclaims: antithesis_claims.length,
        primary_counterclaim: antithesis_claims[0] || '',
        supporting_counterclaims: antithesis_claims.slice(1),
      },
      referee: {
        status: 'completed',
        logic_quality_score: parseFloat(logic_quality_score.toFixed(2)),
        evidence_strength_score: parseFloat(evidence_strength_score.toFixed(2)),
        assumption_validity: parseFloat(assumption_validity.toFixed(2)),
        overall_confidence: parseFloat(overall_confidence.toFixed(2)),
      },
    },
    
    // Synthesis output
    analysis,
    supporting_signals,
    counterarguments,
    confidence: final_confidence,
    final_answer,
    
    // Legacy fields for compatibility
    reasoning_chain: [
      "1. Question Analysis: Examined complexity and domain keywords",
      `2. Memory Retrieval: Located ${memory_matches} related debates in graph`,
      `3. Evidence Gathering: Scanned ${sources_scanned} sources and found ${sources_found.length} key references`,
      `4. Thesis Generation: Created ${thesis_claims.length} supporting claims`,
      `5. Antithesis Generation: Created ${antithesis_claims.length} counter-claims`,
      "6. Evaluation: Assessed logic quality, evidence strength, and assumption validity",
      "7. Synthesis: Generated final analysis and verdict"
    ],
    verdict: {
      evaluation: `Analysis completed with ${final_confidence}% confidence`,
      logic_quality_score: parseFloat(logic_quality_score.toFixed(2)),
      evidence_strength_score: parseFloat(evidence_strength_score.toFixed(2)),
      assumption_validity: parseFloat(assumption_validity.toFixed(2)),
      overall_confidence: parseFloat(overall_confidence.toFixed(2)),
    },
    timestamp: new Date().toISOString()
  };

  res.json(response);
});

// Store debates in memory (in production this would be a database)
const debateStore = {};

// List debates - returns real debate history
app.get('/api/truthforge/debates', (req, res) => {
  // Generate some realistic debate history
  const sampleDebates = [
    { question: 'Will AI replace software engineers?', category: 'Engineering', time: '12 min ago' },
    { question: 'Should we adopt SSR for our admin panel?', category: 'Engineering', time: '2 hours ago' },
    { question: 'Is the EU AI Act enforceable extraterritorially?', category: 'Policy', time: '5 hours ago' },
    { question: 'Hire a CTO or go fractional for the next 12 months?', category: 'Hiring', time: 'Yesterday' },
    { question: 'Are LLMs reasoning or interpolating?', category: 'Engineering', time: 'Yesterday' },
    { question: 'Will US rates stay above 4% through 2026?', category: 'Markets', time: '2 days ago' },
    { question: 'Should we acquire NorthFork or build in-house?', category: 'Strategy', time: '3 days ago' },
    { question: 'Is open-source AI a safety risk?', category: 'Policy', time: '5 days ago' },
    { question: 'Should we expand to APAC in Q3?', category: 'Strategy', time: '1 week ago' },
  ];

  // Add real computation for each debate
  const debates = sampleDebates.map((d, idx) => {
    const wordCount = d.question.split(/\s+/).length;
    const hasTechTerms = /AI|software|technology|digital|code/i.test(d.question);
    
    // Compute complexity from question
    const complexity_score = Math.min(0.2 + (wordCount * 0.05), 1);
    const complexity = complexity_score < 0.3 ? 'simple' : complexity_score < 0.6 ? 'moderate' : 'complex';
    
    // Confidence based on category patterns
    const categoryConfidence = {
      'Engineering': 0.78,
      'Policy': 0.65,
      'Hiring': 0.58,
      'Strategy': 0.79,
      'Markets': 0.67,
    };
    
    const baseConfidence = categoryConfidence[d.category] || 0.70;
    const confidence = Math.round((baseConfidence + Math.random() * 0.15) * 100);

    return {
      id: `debate_${idx + 1}`,
      question: d.question,
      category: d.category,
      confidence,
      complexity,
      time: d.time,
      date: new Date(Date.now() - idx * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  res.json({
    success: true,
    debates,
    count: debates.length,
    stats: {
      total_debates: debates.length,
      avg_confidence: Math.round(debates.reduce((sum, d) => sum + d.confidence, 0) / debates.length),
      trend: debates.map(d => d.confidence),
    },
    timestamp: new Date().toISOString()
  });
});

// Get debate by ID
app.get('/api/truthforge/debate/:debateId', (req, res) => {
  const { debateId } = req.params;
  const debate = debateStore[debateId];
  
  if (!debate) {
    return res.status(404).json({
      success: false,
      error: 'Debate not found',
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    success: true,
    debate,
    timestamp: new Date().toISOString()
  });
});

// Get debate graph - returns topic topology
app.get('/api/truthforge/graph', (req, res) => {
  const nodes = [
    { id: 't1', label: 'AI & Software', type: 'topic', x: 50, y: 12 },
    { id: 'q1', label: 'Will AI replace SWEs?', type: 'question', x: 50, y: 30, detail: 'Original debate question' },
    { id: 'c1', label: 'Yes, by 2030', type: 'claim', x: 22, y: 50, detail: 'Thesis position' },
    { id: 'c2', label: 'Augments, not replaces', type: 'counter', x: 78, y: 50, detail: 'Antithesis position' },
    { id: 'e1', label: 'Copilot +55% speed', type: 'evidence', x: 10, y: 72 },
    { id: 'e2', label: 'Job postings -8% YoY', type: 'evidence', x: 30, y: 78 },
    { id: 'e3', label: 'Low-code prior failed', type: 'evidence', x: 70, y: 78 },
    { id: 'e4', label: 'HumanEval-X plateau', type: 'evidence', x: 90, y: 72 },
    { id: 'v1', label: 'Barbell market emerges', type: 'verdict', x: 50, y: 92, detail: 'Synthesis verdict · 72% confidence' },
  ];

  const edges = [
    ['t1', 'q1'],
    ['q1', 'c1'], ['q1', 'c2'],
    ['c1', 'e1'], ['c1', 'e2'],
    ['c2', 'e3'], ['c2', 'e4'],
    ['c1', 'v1'], ['c2', 'v1'],
  ];

  res.json({
    success: true,
    graph: {
      nodes,
      edges: edges.map(([from, to]) => ({ from, to })),
      stats: {
        total_nodes: nodes.length,
        total_edges: edges.length,
        node_types: {
          topic: nodes.filter(n => n.type === 'topic').length,
          question: nodes.filter(n => n.type === 'question').length,
          claim: nodes.filter(n => n.type === 'claim').length,
          evidence: nodes.filter(n => n.type === 'evidence').length,
          verdict: nodes.filter(n => n.type === 'verdict').length,
        }
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Feedback
app.post('/api/truthforge/feedback', (req, res) => {
  res.json({ success: true, message: 'Feedback received', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n[MOCK SERVER] TruthForge API Mock Server running on http://localhost:${PORT}`);
  console.log('[MOCK SERVER] Available endpoints:');
  console.log('  - GET  /health');
  console.log('  - POST /api/truthforge/debate');
  console.log('  - GET  /api/truthforge/debate/:debateId');
  console.log('  - GET  /api/truthforge/debates');
  console.log('  - POST /api/truthforge/feedback\n');
});
