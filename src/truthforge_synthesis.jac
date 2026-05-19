"""
TruthForge AI - Synthesis Walker
Generates the final structured output shown to the user.
Output format: Analysis → Perspective Exploration → Supporting Factors →
               Counterarguments → Historical Context → Confidence Assessment → Final Answer

NEVER uses template phrases like "The evidence suggests X and Y are interconnected"
"""

import:from truthforge_nodes import *;
import:from truthforge_config import *;

walker SynthesisWalker {
    has question_text: str;
    has question_type: str = "factual";
    has thesis_claims: list[dict] = [];
    has counter_claims: list[dict] = [];
    has evidence_nodes: list[dict] = [];
    has verdict: dict = {};
    has session_id: str = "";

    can build_synthesis() -> dict {
        """Build the final structured synthesis using Gemini.

        In production, this calls Gemini via:
          gemini.generateFinalSynthesis({
              question, questionType, claims, counterClaims, evidence, scores
          })

        The synthesis prompt explicitly forbids:
          - "The evidence suggests X and Y are interconnected"
          - "Based on comprehensive analysis, the primary position is supported"
          - Any generic template language

        Required output structure:
          analysis: 3-4 sentence overview integrating all perspectives
          perspective_exploration: different angles and stakeholder viewpoints
          supporting_factors: concrete factors from thesis claims
          counterarguments: concrete factors from antithesis claims
          historical_context: relevant historical precedent
          confidence_assessment: confidence level and what could change
          final_answer: DIRECT answer first, THEN nuance

        Example final_answer:
          "Interest rates are likely to remain above 4% through most of 2026,
           though this is far from certain. Persistent services inflation and
           tight labor markets give the Fed little reason to cut aggressively,
           but a sharper-than-expected economic slowdown could force the Fed's
           hand. The balance of evidence tilts toward 'higher for longer,' but
           with meaningful downside risk."
        """
        print("[SYNTHESIS] Building structured final analysis...");
        print(f"[SYNTHESIS] Question: {self.question_text[:50]}...");
        print(f"[SYNTHESIS] Integrating {len(self.thesis_claims)} claims, {len(self.counter_claims)} counter-claims, {len(self.evidence_nodes)} evidence items");

        # Synthesis result is populated by Gemini API call in TypeScript layer.
        # The result dict will contain all sections listed above.

        return {};
    }

    can render_synthesis(result: dict) {
        """Display the synthesis result"""
        print("[SYNTHESIS] ===== FINAL SYNTHESIS =====");

        if "analysis" in result {
            print(f"\nANALYSIS:\n{result['analysis']}");
        }

        if "perspective_exploration" in result and result["perspective_exploration"] != "" {
            print(f"\nPERSPECTIVE EXPLORATION:\n{result['perspective_exploration']}");
        }

        if "supporting_factors" in result {
            print("\nSUPPORTING FACTORS:");
            for factor in result["supporting_factors"] {
                print(f"  ✓ {factor}");
            }
        }

        if "counterarguments" in result {
            print("\nCOUNTERARGUMENTS:");
            for counter in result["counterarguments"] {
                print(f"  ✗ {counter}");
            }
        }

        if "historical_context" in result and result["historical_context"] != "" {
            print(f"\nHISTORICAL CONTEXT:\n{result['historical_context']}");
        }

        if "confidence_assessment" in result and result["confidence_assessment"] != "" {
            print(f"\nCONFIDENCE ASSESSMENT:\n{result['confidence_assessment']}");
        }

        if "final_answer" in result {
            print(f"\nFINAL ANSWER:\n{result['final_answer']}");
        }

        print(f"\nCONFIDENCE: {result.get('confidence', 'Moderate')}");
        print("[SYNTHESIS] ===== END SYNTHESIS =====");
    }

    can synthesize(
        question_text: str,
        thesis_claims: list[dict],
        counter_claims: list[dict],
        evidence_nodes: list[dict],
        verdict: dict,
        session_id: str = ""
    ) {
        """Main synthesis orchestration"""
        self.question_text = question_text;
        self.thesis_claims = thesis_claims;
        self.counter_claims = counter_claims;
        self.evidence_nodes = evidence_nodes;
        self.verdict = verdict;
        self.session_id = session_id;

        print("[SYNTHESIS] ===== SYNTHESIS WALKER STARTING =====");

        let result = self.build_synthesis();
        self.render_synthesis(result);

        print("[SYNTHESIS] ===== SYNTHESIS WALKER COMPLETE =====");

        return result;
    }
}
