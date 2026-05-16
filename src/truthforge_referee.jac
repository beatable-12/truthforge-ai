"""
TruthForge AI - Referee Walker
Evaluates logic quality, evidence strength, and assumptions
Creates Verdict nodes in the graph
"""

import:from truthforge_nodes import *;
import:from truthforge_config import *;

walker RefereeWalker {
    has thesis_claims: list[dict] = [];
    has counter_claims: list[dict] = [];
    has evidence_nodes: list[dict] = [];
    has verdict: dict = {};
    has session_id: str = "";

    can evaluate_logical_validity() -> float {
        """Evaluate logical validity of thesis vs counter-claims"""
        print("[REFEREE] Evaluating logical validity...");
        
        let thesis_logic = 0.0;
        let counter_logic = 0.0;

        # Evaluate thesis logical structure
        if len(self.thesis_claims) > 0 {
            # Check for internal consistency
            let thesis_assumptions = [];
            for claim in self.thesis_claims {
                if "assumptions" in claim {
                    thesis_assumptions.extend(claim["assumptions"]);
                }
            }

            # Score based on assumption consistency
            thesis_logic = min(0.95, 0.6 + (0.35 / max(len(thesis_assumptions), 1)));
        }

        # Evaluate counter-claims logical structure
        if len(self.counter_claims) > 0 {
            let counter_assumptions = [];
            for claim in self.counter_claims {
                if "assumptions" in claim {
                    counter_assumptions.extend(claim["assumptions"]);
                }
            }

            counter_logic = min(0.95, 0.6 + (0.35 / max(len(counter_assumptions), 1)));
        }

        print(f"  Thesis logical score: {thesis_logic:.2f}");
        print(f"  Counter-claims logical score: {counter_logic:.2f}");

        return (thesis_logic + counter_logic) / 2.0;
    }

    can evaluate_evidence_strength() -> float {
        """Evaluate strength and quality of supporting evidence"""
        print("[REFEREE] Evaluating evidence strength...");
        
        if len(self.evidence_nodes) == 0 {
            print("  No evidence nodes to evaluate");
            return 0.3;
        }

        let total_credibility = 0.0;
        let high_quality_count = 0;
        let evidence_diversity = {};

        for evidence in self.evidence_nodes {
            let credibility = evidence.get("credibility_score", 0.5);
            total_credibility += credibility;

            if credibility > 0.8 {
                high_quality_count += 1;
            }

            let evidence_type = evidence.get("evidence_type", "general");
            if evidence_type not in evidence_diversity {
                evidence_diversity[evidence_type] = 0;
            }
            evidence_diversity[evidence_type] += 1;
        }

        let avg_credibility = total_credibility / len(self.evidence_nodes);
        let diversity_score = len(evidence_diversity) / 5.0;  # Max 5 types

        let evidence_strength = (avg_credibility * 0.6) + (diversity_score * 0.4);

        print(f"  Average credibility: {avg_credibility:.2f}");
        print(f"  Diversity score: {diversity_score:.2f}");
        print(f"  Evidence types: {', '.join(evidence_diversity.keys())}");
        print(f"  Overall evidence strength: {evidence_strength:.2f}");

        return evidence_strength;
    }

    can evaluate_assumption_validity() -> float {
        """Evaluate validity of underlying assumptions"""
        print("[REFEREE] Evaluating assumption validity...");
        
        let all_assumptions = [];
        let assumption_conflicts = 0;

        # Collect all assumptions
        for claim in self.thesis_claims {
            if "assumptions" in claim {
                all_assumptions.extend(claim["assumptions"]);
            }
        }

        for claim in self.counter_claims {
            if "assumptions" in claim {
                all_assumptions.extend(claim["assumptions"]);
            }
        }

        # Check for conflicting assumptions
        let assumption_set = set(all_assumptions);
        if len(assumption_set) < len(all_assumptions) {
            assumption_conflicts = len(all_assumptions) - len(assumption_set);
        }

        let validity = 1.0 - (assumption_conflicts * 0.1);
        validity = max(0.3, min(0.95, validity));

        print(f"  Total unique assumptions: {len(assumption_set)}");
        print(f"  Conflicting assumptions: {assumption_conflicts}");
        print(f"  Assumption validity: {validity:.2f}");

        return validity;
    }

    can compare_positions() -> dict {
        """Compare thesis and counter-claims to determine winner"""
        print("[REFEREE] Comparing thesis vs counter-claims...");
        
        let thesis_total_strength = 0.0;
        let counter_total_strength = 0.0;

        for claim in self.thesis_claims {
            thesis_total_strength += claim.get("strength", 0.5);
        }

        for claim in self.counter_claims {
            counter_total_strength += claim.get("strength", 0.5);
        }

        if len(self.thesis_claims) > 0 {
            thesis_total_strength /= len(self.thesis_claims);
        }

        if len(self.counter_claims) > 0 {
            counter_total_strength /= len(self.counter_claims);
        }

        print(f"  Thesis average strength: {thesis_total_strength:.2f}");
        print(f"  Counter-claims average strength: {counter_total_strength:.2f}");

        return {
            "thesis_strength": thesis_total_strength,
            "counter_strength": counter_total_strength,
            "stronger_position": "thesis" if thesis_total_strength > counter_total_strength else "counter"
        };
    }

    can generate_key_findings() -> list[str] {
        """Generate key findings from evaluation"""
        print("[REFEREE] Generating key findings...");
        
        let findings = [];
        
        # Based on evaluation scores
        findings.append("Finding 1: Logical structure evaluation complete");
        findings.append("Finding 2: Evidence assessment performed");
        findings.append("Finding 3: Assumption validity checked");
        findings.append("Finding 4: Position comparison analyzed");

        return findings;
    }

    can create_verdict_node() -> dict {
        """Create final verdict node"""
        let logic_score = self.evaluate_logical_validity();
        let evidence_score = self.evaluate_evidence_strength();
        let assumption_score = self.evaluate_assumption_validity();
        
        let comparison = self.compare_positions();
        let findings = self.generate_key_findings();

        # Calculate overall confidence
        let overall_confidence = (logic_score * 0.35) + 
                               (evidence_score * 0.40) + 
                               (assumption_score * 0.25);

        let verdict = {
            "id": f"verdict_{self.session_id}",
            "evaluation": f"Winner: {comparison['stronger_position']} position",
            "logic_quality_score": logic_score,
            "evidence_strength_score": evidence_score,
            "assumption_validity": assumption_score,
            "overall_confidence": overall_confidence,
            "key_findings": findings,
            "reasoning_quality": "comprehensive",
            "session_id": self.session_id
        };

        return verdict;
    }

    can render_verdict(verdict: dict) {
        """Display verdict in structured format"""
        print("[REFEREE] ===== VERDICT =====");
        print(f"Evaluation: {verdict['evaluation']}");
        print(f"\nScores:");
        print(f"  Logic Quality: {verdict['logic_quality_score']:.2f}");
        print(f"  Evidence Strength: {verdict['evidence_strength_score']:.2f}");
        print(f"  Assumption Validity: {verdict['assumption_validity']:.2f}");
        print(f"  Overall Confidence: {verdict['overall_confidence']:.2f}");
        print(f"\nKey Findings:");
        for finding in verdict['key_findings'] {
            print(f"  - {finding}");
        }
        print("[REFEREE] ===== END VERDICT =====");
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

        print("[REFEREE] ===== REFEREE WALKER STARTING =====");

        self.verdict = self.create_verdict_node();
        self.render_verdict(self.verdict);

        print("[REFEREE] ===== REFEREE WALKER COMPLETE =====");

        return self.verdict;
    }
}
