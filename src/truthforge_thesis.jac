"""
TruthForge AI - Thesis Walker
Generates 2-4 CONCRETE supporting claims from the question.
All claims come from Gemini API — no hardcoded placeholders.
"""

import:from truthforge_nodes import *;
import:from truthforge_config import *;

walker ThesisWalker {
    has question_text: str;
    has question_type: str = "factual";
    has domain: str = "general";
    has memory_context: str = "";
    has generated_claims: list[dict] = [];
    has session_id: str = "";

    can generate_claims() {
        """Generate 2-4 concrete, question-specific supporting claims.

        In production, this calls Gemini via:
          gemini.generateThesisClaims(question, questionType, domain, memoryContext)

        The prompt explicitly forbids placeholder text like:
          - "Point 1: Logical foundation of the argument"
          - "Primary supporting position for the question"

        Example for "Will rates stay above 4% in 2026?":
          Claim 1: "Persistent inflation in services and housing keeps the Fed's
                    preferred PCE measure above their 2% target"
          Claim 2: "Labor markets remain historically tight with unemployment
                    below 4%, giving central banks little pressure to ease"
          Claim 3: "Federal deficit spending continues to expand, increasing
                    treasury supply and putting upward pressure on yields"
        """
        print(f"[THESIS] Generating concrete claims for: {self.question_text[:50]}...");
        print(f"[THESIS] Question type: {self.question_type}, Domain: {self.domain}");

        # Claims are populated by Gemini API call in TypeScript layer.
        # Each claim has: statement, reasoning, strength
        # The prompt demands specificity and forbids template language.

        print(f"[THESIS] Generated {len(self.generated_claims)} claims");
        for i, claim in enumerate(self.generated_claims) {
            print(f"  Claim {i+1}: {claim.get('statement', '')[:80]}...");
            print(f"    Reasoning: {claim.get('reasoning', '')[:60]}");
            print(f"    Strength: {claim.get('strength', 0):.2f}");
        }
    }

    can synthesize_thesis() -> dict {
        """Package claims into structured output"""
        return {
            "total_claims": len(self.generated_claims),
            "claims": self.generated_claims,
            "primary_claim": self.generated_claims[0] if len(self.generated_claims) > 0 else {},
            "supporting_claims": self.generated_claims[1:] if len(self.generated_claims) > 1 else []
        };
    }

    can generate_thesis(session_id: str = "") {
        """Main thesis generation orchestration"""
        self.session_id = session_id;

        print("[THESIS] ===== THESIS WALKER STARTING =====");

        self.generate_claims();
        let result = self.synthesize_thesis();

        print(f"[THESIS] Total claims: {result['total_claims']}");
        print("[THESIS] ===== THESIS WALKER COMPLETE =====");

        return result;
    }
}
