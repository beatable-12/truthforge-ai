/**
 * TruthForge AI - Prompt Templates
 * Carefully crafted prompts for Gemini API calls
 * All prompts are designed to elicit structured JSON responses
 */

export const THESIS_PROMPT = (question: string, topic: string): string => `You are an expert debater and analyst tasked with generating the strongest supporting position for a complex question.

Question: ${question}
Topic Domain: ${topic}

Generate a comprehensive and compelling thesis that STRONGLY SUPPORTS the position implied by this question. Your response MUST be valid JSON with exactly this structure:
{
  "thesis": "A clear, concise statement of your supporting position (2-3 sentences)",
  "key_points": [
    "First supporting argument with specific details",
    "Second supporting argument with specific details", 
    "Third supporting argument with specific details",
    "Fourth supporting argument with specific details",
    "Fifth supporting argument with specific details"
  ],
  "reasoning": "Detailed logical reasoning explaining why this position is sound (3-5 sentences)",
  "strength": 0.85,
  "assumptions": ["Assumption 1", "Assumption 2", "Assumption 3"]
}

Requirements:
- The thesis must be logically sound and well-reasoned
- Key points must be specific, detailed, and compelling
- Provide 0-1 strength score for this position
- Include any underlying assumptions
- Format MUST be valid JSON`;

export const ANTITHESIS_PROMPT = (claims: string[]): string => {
  const claimsText = claims.map((c, i) => `${i + 1}. ${c}`).join('\n');

  return `You are an expert debater tasked with generating strong counter-arguments to a set of claims.

Original Claims:
${claimsText}

Generate compelling counter-arguments that present the strongest possible OPPOSING position. Your response MUST be valid JSON with exactly this structure:
{
  "antithesis": "A clear, concise statement of your counter-position (2-3 sentences)",
  "counter_points": [
    "First counter-argument addressing the claims",
    "Second counter-argument with alternative perspective",
    "Third counter-argument highlighting limitations",
    "Fourth counter-argument presenting contrary evidence",
    "Fifth counter-argument exploring implications"
  ],
  "reasoning": "Detailed logical reasoning for this opposing position (3-5 sentences)",
  "strength": 0.80,
  "assumptions": ["Assumption 1", "Assumption 2"]
}

Requirements:
- Counter-arguments must directly address the original claims
- Each point should be specific and logically valid
- Provide 0-1 strength score for this opposing position
- Include alternative frameworks or perspectives
- Format MUST be valid JSON`;
};

export const EVIDENCE_ANALYSIS_PROMPT = (evidence: string, claim: string): string => `You are an expert evidence analyst tasked with evaluating the quality, credibility, and relevance of evidence supporting or refuting a claim.

Claim: ${claim}

Evidence to Analyze:
${evidence}

Evaluate this evidence comprehensively. Your response MUST be valid JSON with exactly this structure:
{
  "credibility_score": 0.85,
  "relevance_score": 0.90,
  "key_findings": [
    "Key finding 1 from this evidence",
    "Key finding 2 from this evidence",
    "Key finding 3 from this evidence"
  ],
  "quality_assessment": "Detailed assessment of evidence quality, methodology, and reliability",
  "limitations": "Specific limitations, biases, or caveats to consider",
  "source_type": "Type of source (e.g., peer-reviewed study, journalistic report, expert opinion)",
  "recency": "Assessment of whether this evidence is current and relevant"
}

Scoring Guidelines:
- Credibility (0-1): Assess the trustworthiness of the source and methodology
- Relevance (0-1): Assess how directly this evidence addresses the claim

Requirements:
- Provide detailed analysis, not just scores
- Identify specific strengths and weaknesses
- Consider source bias and potential limitations
- Assess methodological rigor if applicable
- Format MUST be valid JSON`;

export const SYNTHESIS_PROMPT = (data: {
  question: string;
  thesis: string;
  antithesis: string;
  evidence_summary: string;
}): string => `You are an expert synthesizer tasked with integrating multiple perspectives and evidence into a comprehensive analysis.

Original Question: ${data.question}

Supporting Position: ${data.thesis}

Opposing Position: ${data.antithesis}

Evidence Summary:
${data.evidence_summary}

Create a comprehensive synthesis integrating all perspectives. Your response MUST be valid JSON with exactly this structure:
{
  "analysis": "Comprehensive narrative analysis integrating thesis, antithesis, and evidence (4-6 sentences)",
  "supporting_signals": [
    "Strong signal supporting the primary position",
    "Another supporting signal with evidence",
    "Third supporting evidence or logic"
  ],
  "counterarguments": [
    "Significant counter-argument to address",
    "Alternative perspective that deserves consideration",
    "Potential weakness in the primary position"
  ],
  "confidence": "High|Medium|Low",
  "final_answer": "Your well-reasoned final assessment addressing the original question (3-4 sentences)",
  "reasoning_chain": [
    "Step 1 in logical reasoning",
    "Step 2 in logical reasoning",
    "Step 3 in logical reasoning",
    "Step 4 in logical reasoning",
    "Step 5 concluding reasoning"
  ]
}

Requirements:
- Provide balanced analysis considering all perspectives
- Be explicit about confidence level
- Support final answer with logical chain of reasoning
- Acknowledge limitations and alternative views
- Format MUST be valid JSON`;

export const VERDICT_PROMPT = (data: {
  thesis: string;
  antithesis: string;
  average_credibility: number;
  average_relevance: number;
}): string => `You are an expert judge tasked with evaluating the overall quality of reasoning and evidence in a debate.

Thesis (Supporting Position): ${data.thesis}

Antithesis (Counter-Position): ${data.antithesis}

Evidence Quality Summary:
- Average Credibility Score: ${data.average_credibility.toFixed(2)}/1.0
- Average Relevance Score: ${data.average_relevance.toFixed(2)}/1.0

Provide your comprehensive verdict. Your response MUST be valid JSON with exactly this structure:
{
  "evaluation": "Which position has stronger foundation and why (2-3 sentences)",
  "logic_quality_score": 0.82,
  "evidence_strength_score": 0.80,
  "assumption_validity": 0.78,
  "overall_confidence": 0.80,
  "key_findings": [
    "Key finding about thesis strength",
    "Key finding about evidence quality",
    "Key finding about logical coherence"
  ],
  "reasoning_quality": "Assessment of overall reasoning quality and rigor"
}

Scoring Guidelines (all 0-1):
- Logic Quality: Assess logical validity, coherence, and soundness
- Evidence Strength: Assess quality and relevance of supporting evidence
- Assumption Validity: Assess whether underlying assumptions are reasonable
- Overall Confidence: Provide your overall confidence in the analysis

Requirements:
- Be objective and fair to both positions
- Provide detailed scoring rationale
- Identify logical fallacies or weak assumptions
- Consider evidence quality in your scoring
- Format MUST be valid JSON`;

export const prompts = {
  THESIS_PROMPT,
  ANTITHESIS_PROMPT,
  EVIDENCE_ANALYSIS_PROMPT,
  SYNTHESIS_PROMPT,
  VERDICT_PROMPT
};

export default prompts;
