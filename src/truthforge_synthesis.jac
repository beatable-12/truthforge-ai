"""
TruthForge AI - Synthesis Walker
Generates final structured output with analysis, signals, counterarguments
Creates SynthesisResult node
"""

import:from truthforge_nodes import *;
import:from truthforge_config import *;

walker SynthesisWalker {
    has question_text: str;
    has thesis_claims: list[dict] = [];
    has counter_claims: list[dict] = [];
    has evidence_nodes: list[dict] = [];
    has verdict: dict = {};
    has session_id: str = "";

    can extract_supporting_signals() -> list[str] {
        """Extract key supporting signals from thesis and evidence"""
        print("[SYNTHESIS] Extracting supporting signals...");
        
        let signals = [];

        # Extract from thesis claims
        for claim in self.thesis_claims {
            if "statement" in claim {
                signals.append(f"Signal: {claim['statement'][:60]}...");
            }
            if "key_points" in claim {
                for point in claim["key_points"][:2] {
                    signals.append(f"  - {point}");
                }
            }
        }

        # Extract from high-credibility evidence
        for evidence in self.evidence_nodes {
            if evidence.get("credibility_score", 0) > 0.75 {
                if "content" in evidence {
                    signals.append(f"Evidence: {evidence['content'][:50]}...");
                }
            }
        }

        print(f"  Extracted {len(signals)} supporting signals");
        return signals;
    }

    can extract_counterarguments() -> list[str] {
        """Extract key counter-arguments and alternative views"""
        print("[SYNTHESIS] Extracting counter-arguments...");
        
        let counterargs = [];

        # Extract from counter-claims
        for claim in self.counter_claims {
            if "statement" in claim {
                counterargs.append(f"Counter: {claim['statement'][:60]}...");
            }
            if "key_points" in claim {
                for point in claim["key_points"][:2] {
                    counterargs.append(f"  - {point}");
                }
            }
        }

        # Extract counter-evidence
        let counter_evidence = [];
        for evidence in self.evidence_nodes {
            if evidence.get("evidence_type", "") in ["anecdotal", "alternative"] {
                counter_evidence.append(evidence);
            }
        }

        for ev in counter_evidence {
            if "content" in ev {
                counterargs.append(f"Alternative: {ev['content'][:50]}...");
            }
        }

        print(f"  Extracted {len(counterargs)} counter-arguments");
        return counterargs;
    }

    can determine_confidence_level() -> str {
        """Determine confidence level based on verdict scores"""
        print("[SYNTHESIS] Determining confidence level...");
        
        let overall_conf = self.verdict.get("overall_confidence", 0.5);

        if overall_conf >= 0.85 {
            return "Very High";
        }
        elif overall_conf >= 0.70 {
            return "High";
        }
        elif overall_conf >= 0.55 {
            return "Moderate";
        }
        elif overall_conf >= 0.40 {
            return "Low";
        }
        else {
            return "Very Low";
        }
    }

    can formulate_final_answer() -> str {
        """Formulate final synthesized answer"""
        print("[SYNTHESIS] Formulating final answer...");
        
        let stronger = self.verdict.get("evaluation", "");
        let confidence = self.determine_confidence_level();

        let answer = f"Based on comprehensive analysis, ";

        if "thesis" in stronger.lower() {
            answer += "the supporting position is stronger. ";
        }
        else {
            answer += "the counter-position offers valid alternatives. ";
        }

        answer += f"Confidence level: {confidence}.";

        return answer;
    }

    can create_reasoning_chain() -> list[str] {
        """Create chain of reasoning steps"""
        let chain = [
            "1. Question Analysis: Examined question complexity",
            "2. Memory Retrieval: Located related prior reasoning",
            "3. Thesis Generation: Created supporting claims",
            "4. Antithesis Generation: Created counter-claims",
            "5. Evidence Gathering: Collected supporting evidence",
            "6. Evaluation: Assessed logic, evidence, and assumptions",
            "7. Synthesis: Generated final analysis"
        ];

        return chain;
    }

    can build_synthesis_result() -> dict {
        """Build complete synthesis result node"""
        print("[SYNTHESIS] Building synthesis result...");
        
        let supporting_signals = self.extract_supporting_signals();
        let counterarguments = self.extract_counterarguments();
        let confidence = self.determine_confidence_level();
        let final_answer = self.formulate_final_answer();
        let chain = self.create_reasoning_chain();

        # Build comprehensive analysis
        let analysis = f"""
ANALYSIS OF QUESTION: '{self.question_text}'

Supporting Position: {len(self.thesis_claims)} claims generated
Counter-Position: {len(self.counter_claims)} arguments presented
Evidence Examined: {len(self.evidence_nodes)} pieces of evidence

Evaluation Scores:
  - Logic Quality: {self.verdict.get('logic_quality_score', 0):.2f}
  - Evidence Strength: {self.verdict.get('evidence_strength_score', 0):.2f}
  - Assumption Validity: {self.verdict.get('assumption_validity', 0):.2f}

Winning Position: {self.verdict.get('evaluation', 'Not determined')}
""";

        let result = {
            "id": f"synthesis_{self.session_id}",
            "analysis": analysis,
            "supporting_signals": supporting_signals,
            "counterarguments": counterarguments,
            "confidence": confidence,
            "final_answer": final_answer,
            "reasoning_chain": chain,
            "session_id": self.session_id,
            "verdict_scores": {
                "logic": self.verdict.get("logic_quality_score", 0),
                "evidence": self.verdict.get("evidence_strength_score", 0),
                "assumptions": self.verdict.get("assumption_validity", 0),
                "overall": self.verdict.get("overall_confidence", 0)
            }
        };

        return result;
    }

    can render_synthesis(result: dict) {
        """Display synthesis result"""
        print("[SYNTHESIS] ===== SYNTHESIS RESULT =====");
        print(result["analysis"]);
        print("\nSUPPORTING SIGNALS:");
        for signal in result["supporting_signals"][:5] {
            print(f"  ✓ {signal}");
        }
        print("\nCOUNTER-ARGUMENTS:");
        for counter in result["counterarguments"][:5] {
            print(f"  ✗ {counter}");
        }
        print(f"\nCONFIDENCE: {result['confidence']}");
        print(f"\nFINAL ANSWER: {result['final_answer']}");
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

        let result = self.build_synthesis_result();
        self.render_synthesis(result);

        print("[SYNTHESIS] ===== SYNTHESIS WALKER COMPLETE =====");

        return result;
    }
}
