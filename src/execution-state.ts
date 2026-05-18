/**
 * ExecutionState - Real-time state tracking for TruthForge debate execution
 * Replaces hardcoded mock values with actual runtime execution data
 */

export interface ExecutionEvent {
  timestamp: number;
  agent: string;
  event: 'started' | 'completed' | 'error';
  data?: Record<string, any>;
}

export interface ExecutionState {
  debate_id: string;
  session_id: string;
  question: string;
  status: 'pending' | 'planning' | 'executing' | 'completed' | 'error';
  complexity: 'simple' | 'moderate' | 'complex';
  
  // Real agent execution data
  planner: {
    status: 'pending' | 'completed' | 'error';
    plan_steps: Array<{ step: number; agent: string; reason: string }>;
    complexity_score: number;
  };
  
  memory: {
    status: 'pending' | 'completed' | 'error';
    matches_found: number;
    related_debates: string[];
  };
  
  evidence: {
    status: 'pending' | 'completed' | 'error';
    sources_scanned: number;
    sources_found: any[];
  };
  
  thesis: {
    status: 'pending' | 'completed' | 'error';
    total_claims: number;
    primary_claim: string;
    supporting_claims: string[];
  };
  
  antithesis: {
    status: 'pending' | 'completed' | 'error';
    total_counterclaims: number;
    primary_counterclaim: string;
    supporting_counterclaims: string[];
  };
  
  referee: {
    status: 'pending' | 'completed' | 'error';
    logic_quality_score: number;
    evidence_strength_score: number;
    assumption_validity: number;
    overall_confidence: number;
  };
  
  synthesis: {
    status: 'pending' | 'completed' | 'error';
    analysis: string;
    supporting_signals: Array<{ text: string; weight: number }>;
    counterarguments: Array<{ text: string; weight: number }>;
    final_answer: string;
  };
  
  // Computed confidence from all components
  confidence: number;
  
  // Event log for UI animation
  execution_log: ExecutionEvent[];
  
  timestamp: string;
}

export function createEmptyExecutionState(
  debate_id: string,
  session_id: string,
  question: string
): ExecutionState {
  return {
    debate_id,
    session_id,
    question,
    status: 'pending',
    complexity: 'moderate',
    
    planner: {
      status: 'pending',
      plan_steps: [],
      complexity_score: 0,
    },
    
    memory: {
      status: 'pending',
      matches_found: 0,
      related_debates: [],
    },
    
    evidence: {
      status: 'pending',
      sources_scanned: 0,
      sources_found: [],
    },
    
    thesis: {
      status: 'pending',
      total_claims: 0,
      primary_claim: '',
      supporting_claims: [],
    },
    
    antithesis: {
      status: 'pending',
      total_counterclaims: 0,
      primary_counterclaim: '',
      supporting_counterclaims: [],
    },
    
    referee: {
      status: 'pending',
      logic_quality_score: 0,
      evidence_strength_score: 0,
      assumption_validity: 0,
      overall_confidence: 0,
    },
    
    synthesis: {
      status: 'pending',
      analysis: '',
      supporting_signals: [],
      counterarguments: [],
      final_answer: '',
    },
    
    confidence: 0,
    execution_log: [],
    timestamp: new Date().toISOString(),
  };
}

export function computeConfidence(state: ExecutionState): number {
  if (state.status !== 'completed') return 0;
  
  const weights = {
    referee: 0.4,      // Referee evaluation is most important
    evidence: 0.25,    // Evidence quality
    thesis: 0.15,      // Thesis coherence
    antithesis: 0.1,   // Antithesis consideration
    memory: 0.1,       // Memory context
  };
  
  let totalConfidence = 0;
  
  // Referee contribution (most important)
  if (state.referee.status === 'completed') {
    totalConfidence += state.referee.overall_confidence * weights.referee;
  }
  
  // Evidence contribution
  if (state.evidence.status === 'completed' && state.evidence.sources_found.length > 0) {
    const evidenceScore = Math.min(state.evidence.sources_found.length / 10, 1);
    totalConfidence += evidenceScore * weights.evidence;
  }
  
  // Thesis quality
  if (state.thesis.status === 'completed' && state.thesis.total_claims > 0) {
    const thesisScore = Math.min(state.thesis.total_claims / 5, 1);
    totalConfidence += thesisScore * weights.thesis;
  }
  
  // Antithesis consideration
  if (state.antithesis.status === 'completed' && state.antithesis.total_counterclaims > 0) {
    const antithesisScore = Math.min(state.antithesis.total_counterclaims / 5, 1);
    totalConfidence += antithesisScore * weights.antithesis;
  }
  
  // Memory context
  if (state.memory.status === 'completed' && state.memory.matches_found > 0) {
    const memoryScore = Math.min(state.memory.matches_found / 5, 1);
    totalConfidence += memoryScore * weights.memory;
  }
  
  return Math.min(Math.round(totalConfidence * 100), 100);
}

export function addExecutionEvent(
  state: ExecutionState,
  agent: string,
  event: 'started' | 'completed' | 'error',
  data?: Record<string, any>
): ExecutionState {
  return {
    ...state,
    execution_log: [
      ...state.execution_log,
      {
        timestamp: Date.now(),
        agent,
        event,
        data,
      },
    ],
  };
}
