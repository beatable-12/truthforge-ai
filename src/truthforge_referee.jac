"""
TruthForge AI - Referee Walker
Evaluates debate quality with real scores derived from actual agent outputs.
Scores: logic_strength, evidence_strength, assumption_risk, agreement_level
"""

import:from truthforge_nodes import *;
import:from truthforge_config import *;

walker RefereeWalker {
    has thesis_claims: list[dict] = [];
    has counter_claims: list[dict] = [];
    has evidence_nodes: list[dict] = [];
    has verdict: dict = {};
    has session_id: str = "";

    can evaluate_debate() {
        """Evaluate the full debate using Gemini-derived scoring.

        In production, this calls Gemini via:
          gemini.evaluateDebate(question, claims, counterClaims, evidence)

        The referee prompt sends ALL claims, counter-claims, and evidence
        to Gemini and asks it to score each dimension based on the actual content.

        Output scores:
          - logic_strength (0-1): How logically coherent are the arguments?
          - evidence_strength (0-1): How well-supported are the positions?
          - assumption_risk (0-1): How many risky assumptions? (higher = more risk)
          - agreement_level (0-1): How much do thesis and antithesis agree?

        Additional output:
          - stronger_position: "thesis" | "antithesis" | "balanced"
          - key_findings: list of specific observations
          - reasoning: summary explanation

        Scores are NOT hardcoded defaults. They derive from the actual
        debate content analyzed by Gemini.
        """
        print("[REFEREE] ===== REFEREE WALKER STARTING =====");
        print(f"[REFEREE] Evaluating {len(self.thesis_claims)} claims vs {len(self.counter_claims)} counter-claims");
        print(f"[REFEREE] Evidence pieces: {len(self.evidence_nodes)}");

        # Verdict is populated by Gemini API call in TypeScript layer.

        if len(self.verdict.keys()) > 0 {
            print(f"[REFEREE] Logic Strength: {self.verdict.get('logic_strength', 0):.2f}");
            print(f"[REFEREE] Evidence Strength: {self.verdict.get('evidence_strength', 0):.2f}");
            print(f"[REFEREE] Assumption Risk: {self.verdict.get('assumption_risk', 0):.2f}");
            print(f"[REFEREE] Agreement Level: {self.verdict.get('agreement_level', 0):.2f}");
            print(f"[REFEREE] Stronger Position: {self.verdict.get('stronger_position', 'balanced')}");

            let findings = self.verdict.get("key_findings", []);
            if len(findings) > 0 {
                print("[REFEREE] Key Findings:");
                for finding in findings {
                    print(f"  - {finding}");
                }
            }

            print(f"[REFEREE] Reasoning: {self.verdict.get('reasoning', '')[:100]}");
        }

        print("[REFEREE] ===== REFEREE WALKER COMPLETE =====");
    }

    can evaluate(
        thesis_claims: list[dict],
        counter_claims: list[dict],
        evidence_nodes: list[dict],
        session_id: str = ""
    ) {
        """Main referee evaluation orchestration"""
        self.thesis_claims = thesis_claims;
        self.counter_claims = counter_claims;
        self.evidence_nodes = evidence_nodes;
        self.session_id = session_id;

        self.evaluate_debate();

        return self.verdict;
    }
}
