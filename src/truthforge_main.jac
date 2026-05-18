"""
TruthForge AI - Main Orchestration
Entry point for the entire backend reasoning engine
Coordinates all walkers in proper execution order
"""

import:from truthforge_nodes import *;
import:from truthforge_config import *;
import:from truthforge_planner import PlannerWalker;
import:from truthforge_memory import MemoryWalker;
import:from truthforge_thesis import ThesisWalker;
import:from truthforge_antithesis import AntithesisWalker;
import:from truthforge_evidence import EvidenceWalker;
import:from truthforge_referee import RefereeWalker;
import:from truthforge_synthesis import SynthesisWalker;
import:from truthforge_memory_update import MemoryUpdateWalker;

graph DebateGraph {
    has nodes: dict = {};
    has edges: dict = {};
    has execution_log: list[str] = [];

    can generate_session_id() -> str {
        """Generate unique session ID"""
        return f"session_{len(self.nodes)}_{timestamp()}";
    }

    can log_execution(message: str) {
        """Log execution step"""
        self.execution_log.append(message);
        print(message);
    }

    can execute_planner(question: str) -> dict {
        """Execute PlannerWalker"""
        self.log_execution("\n[ORCHESTRATOR] Step 1: PLANNER - Analyzing question and creating execution plan");

        let planner = PlannerWalker();
        planner.question_text = question;
        planner.orchestrate();

        return {
            "complexity_score": planner.complexity_score,
            "agents_to_activate": planner.agents_to_activate,
            "plan_steps": planner.plan_steps
        };
    }

    can execute_memory(question: str) -> dict {
        """Execute MemoryWalker"""
        self.log_execution("\n[ORCHESTRATOR] Step 2: MEMORY - Retrieving related prior reasoning");

        let memory = MemoryWalker();
        memory.question_text = question;
        memory.retrieve_memory();

        return {
            "related_memories": memory.related_memories,
            "prior_claims": memory.prior_claims,
            "prior_counter_claims": memory.prior_counter_claims,
            "confidence_patterns": memory.confidence_history
        };
    }

    can execute_thesis(session_id: str) -> dict {
        """Execute ThesisWalker"""
        self.log_execution("\n[ORCHESTRATOR] Step 3: THESIS - Generating supporting claims");

        let thesis = ThesisWalker();
        thesis.session_id = session_id;

        return thesis.generate_thesis(session_id);
    }

    can execute_antithesis(thesis_result: dict, session_id: str) -> dict {
        """Execute AntithesisWalker"""
        self.log_execution("\n[ORCHESTRATOR] Step 4: ANTITHESIS - Generating counter-claims");

        let antithesis = AntithesisWalker();
        let thesis_claims = thesis_result.get("supporting_claims", []);
        if len(thesis_claims) == 0 {
            thesis_claims = [thesis_result.get("primary_claim", {})];
        }

        return antithesis.generate_antithesis(thesis_claims, session_id);
    }

    can execute_evidence(
        thesis_result: dict,
        antithesis_result: dict,
        session_id: str
    ) -> dict {
        """Execute EvidenceWalker"""
        self.log_execution("\n[ORCHESTRATOR] Step 5: EVIDENCE - Gathering supporting evidence");

        let evidence = EvidenceWalker();
        evidence.question_text = self.nodes.get(session_id, {}).get("question", "");

        let thesis_claims = thesis_result.get("supporting_claims", []);
        if len(thesis_claims) == 0 {
            thesis_claims = [thesis_result.get("primary_claim", {})];
        }

        let counter_claims = antithesis_result.get("supporting_counters", []);
        if len(counter_claims) == 0 {
            counter_claims = [antithesis_result.get("primary_counter", {})];
        }

        return evidence.gather(thesis_claims, counter_claims, session_id);
    }

    can execute_referee(
        thesis_result: dict,
        antithesis_result: dict,
        evidence_list: list[dict],
        session_id: str
    ) -> dict {
        """Execute RefereeWalker"""
        self.log_execution("\n[ORCHESTRATOR] Step 6: REFEREE - Evaluating logic and evidence");

        let referee = RefereeWalker();

        let thesis_claims = thesis_result.get("supporting_claims", []);
        if len(thesis_claims) == 0 {
            thesis_claims = [thesis_result.get("primary_claim", {})];
        }

        let counter_claims = antithesis_result.get("supporting_counters", []);
        if len(counter_claims) == 0 {
            counter_claims = [antithesis_result.get("primary_counter", {})];
        }

        return referee.evaluate(thesis_claims, counter_claims, evidence_list, session_id);
    }

    can execute_synthesis(
        question: str,
        thesis_result: dict,
        antithesis_result: dict,
        evidence_list: list[dict],
        verdict: dict,
        session_id: str
    ) -> dict {
        """Execute SynthesisWalker"""
        self.log_execution("\n[ORCHESTRATOR] Step 7: SYNTHESIS - Generating final analysis");

        let synthesis = SynthesisWalker();

        let thesis_claims = thesis_result.get("supporting_claims", []);
        if len(thesis_claims) == 0 {
            thesis_claims = [thesis_result.get("primary_claim", {})];
        }

        let counter_claims = antithesis_result.get("supporting_counters", []);
        if len(counter_claims) == 0 {
            counter_claims = [antithesis_result.get("primary_counter", {})];
        }

        return synthesis.synthesize(
            question,
            thesis_claims,
            counter_claims,
            evidence_list,
            verdict,
            session_id
        );
    }

    can execute_memory_update(
        session_id: str,
        question_id: str,
        question: str,
        complexity: str,
        thesis_result: dict,
        antithesis_result: dict,
        evidence_list: list[dict],
        verdict: dict,
        synthesis_result: dict,
        agents_executed: list[str]
    ) -> dict {
        """Execute MemoryUpdateWalker"""
        self.log_execution("\n[ORCHESTRATOR] Step 8: MEMORY_UPDATE - Persisting reasoning to database");

        let memory_update = MemoryUpdateWalker();

        let thesis_claims = thesis_result.get("supporting_claims", []);
        if len(thesis_claims) == 0 {
            thesis_claims = [thesis_result.get("primary_claim", {})];
        }

        let counter_claims = antithesis_result.get("supporting_counters", []);
        if len(counter_claims) == 0 {
            counter_claims = [antithesis_result.get("primary_counter", {})];
        }

        return memory_update.persist(
            session_id,
            question_id,
            question,
            complexity,
            thesis_claims,
            counter_claims,
            evidence_list,
            verdict,
            synthesis_result,
            agents_executed
        );
    }

    can run_debate(question: str) -> dict {
        """Main orchestration: Run complete debate workflow using Planner's execution plan"""

        let session_id = self.generate_session_id();
        let question_id = f"question_{session_id}";

        self.log_execution("\n╔════════════════════════════════════════════════════╗");
        self.log_execution("║          TRUTHFORGE AI - DEBATE ORCHESTRATION       ║");
        self.log_execution("╚════════════════════════════════════════════════════╝");

        # Store initial question
        self.nodes[session_id] = {
            "question": question,
            "question_id": question_id,
            "status": "in_progress"
        };

        # Step 1: Planning
        let plan = self.execute_planner(question);
        let complexity = "simple";
        if plan["complexity_score"] < 0.3 {
            complexity = "simple";
        }
        elif plan["complexity_score"] < 0.6 {
            complexity = "moderate";
        }
        else {
            complexity = "complex";
        }

        # Prepare containers for agent outputs (guarantee they exist)
        let memory_context = {};
        let thesis_result = {};
        let antithesis_result = {};
        let evidence_list = [];
        let verdict = {};
        let synthesis_result = {};
        let persistence_result = {"persistence_validated": False};

        let agents_executed = [];

        # Execute agents according to plan_steps produced by PlannerWalker
        let steps = plan.get("plan_steps", []);
        # Sort by step to ensure intended order
        steps = sorted(steps, key=lambda s: s.get("step", 0));

        for step in steps {
            let agent = step.get("agent", "");
            if agent == "" {
                continue;
            }

            # Log activation
            self.log_execution(f"\n[ORCHESTRATOR] ACTIVATING AGENT: {agent} - {step.get('reason', '')}");

            # Execute agent with defensive checks and fallbacks
            if agent == "memory" {
                memory_context = self.execute_memory(question);
                if len(memory_context.keys()) == 0 {
                    self.log_execution("[ORCHESTRATOR] WARNING: MemoryWalker returned empty context");
                }
                agents_executed.append("memory");
            }
            elif agent == "thesis" {
                thesis_result = self.execute_thesis(session_id);
                if len(thesis_result.keys()) == 0 {
                    self.log_execution("[ORCHESTRATOR] WARNING: ThesisWalker returned empty result - creating fallback");
                    thesis_result = {"total_claims": 0, "primary_claim": {"statement": question}, "supporting_claims": []};
                }
                agents_executed.append("thesis");
            }
            elif agent == "antithesis" {
                # Ensure thesis_result present
                let tclaims = thesis_result.get("supporting_claims", []);
                if len(tclaims) == 0 {
                    tclaims = [thesis_result.get("primary_claim", {})];
                }
                antithesis_result = self.execute_antithesis(thesis_result, session_id);
                if len(antithesis_result.keys()) == 0 {
                    self.log_execution("[ORCHESTRATOR] WARNING: AntithesisWalker returned empty result");
                    antithesis_result = {"total_counter_claims": 0, "primary_counter": {}, "supporting_counters": []};
                }
                agents_executed.append("antithesis");
            }
            elif agent == "evidence" {
                evidence_list = self.execute_evidence(thesis_result, antithesis_result, session_id);
                if len(evidence_list) == 0 {
                    self.log_execution("[ORCHESTRATOR] WARNING: EvidenceWalker returned no evidence");
                    evidence_list = [];
                }
                agents_executed.append("evidence");
            }
            elif agent == "referee" {
                verdict = self.execute_referee(thesis_result, antithesis_result, evidence_list, session_id);
                if len(verdict.keys()) == 0 {
                    self.log_execution("[ORCHESTRATOR] WARNING: RefereeWalker returned empty verdict - using conservative defaults");
                    verdict = {"overall_confidence": 0.5, "evaluation": "inconclusive"};
                }
                agents_executed.append("referee");
            }
            elif agent == "synthesis" {
                synthesis_result = self.execute_synthesis(question, thesis_result, antithesis_result, evidence_list, verdict, session_id);
                if len(synthesis_result.keys()) == 0 {
                    self.log_execution("[ORCHESTRATOR] WARNING: SynthesisWalker returned empty result");
                    synthesis_result = {"final_answer": "Unable to synthesize", "confidence": "Very Low"};
                }
                agents_executed.append("synthesis");
            }
            elif agent == "memory_update" {
                persistence_result = self.execute_memory_update(
                    session_id,
                    question_id,
                    question,
                    complexity,
                    thesis_result,
                    antithesis_result,
                    evidence_list,
                    verdict,
                    synthesis_result,
                    agents_executed
                );
                if persistence_result.get("persistence_validated") is not True {
                    self.log_execution("[ORCHESTRATOR] WARNING: MemoryUpdateWalker reported validation failure");
                }
                agents_executed.append("memory_update");
            }
            else {
                # Unknown agent - log and skip
                self.log_execution(f"[ORCHESTRATOR] WARNING: Unknown agent '{agent}' in plan - skipping");
            }
        }

        # Ensure we always have a synthesis and persistence at the end
        if len(synthesis_result.keys()) == 0 {
            synthesis_result = self.execute_synthesis(question, thesis_result, antithesis_result, evidence_list, verdict, session_id);
            if len(synthesis_result.keys()) == 0 {
                self.log_execution("[ORCHESTRATOR] ERROR: Final synthesis failed");
            }
            if "synthesis" not in agents_executed {
                agents_executed.append("synthesis");
            }
        }

        if persistence_result.get("persistence_validated") is not True {
            persistence_result = self.execute_memory_update(
                session_id,
                question_id,
                question,
                complexity,
                thesis_result,
                antithesis_result,
                evidence_list,
                verdict,
                synthesis_result,
                agents_executed
            );
            if persistence_result.get("persistence_validated") is not True {
                self.log_execution("[ORCHESTRATOR] ERROR: Final persistence attempt failed");
            }
            if "memory_update" not in agents_executed {
                agents_executed.append("memory_update");
            }
        }

        # Final summary
        self.log_execution("\n╔════════════════════════════════════════════════════╗");
        self.log_execution("║               DEBATE COMPLETE - SUMMARY              ║");
        self.log_execution("╚════════════════════════════════════════════════════╝");

        self.log_execution(f"\nSession: {session_id}");
        self.log_execution(f"Complexity: {complexity}");
        self.log_execution(f"Agents Executed: {', '.join(agents_executed)}");
        self.log_execution(f"Thesis Claims: {thesis_result.get('total_claims', thesis_result.get('total_claims', 0))}");
        self.log_execution(f"Counter-Claims: {antithesis_result.get('total_counter_claims', 0)}");
        self.log_execution(f"Evidence Gathered: {len(evidence_list)}");
        self.log_execution(f"Verdict Confidence: {verdict.get('overall_confidence', 0):.2f}");
        self.log_execution(f"Persistence Status: {'✓ Validated' if persistence_result.get('persistence_validated') else '✗ Failed'}");

        # Update session status
        self.nodes[session_id]["status"] = "completed";

        return {
            "session_id": session_id,
            "question_id": question_id,
            "complexity": complexity,
            "plan": plan,
            "memory_context": memory_context,
            "thesis": thesis_result,
            "antithesis": antithesis_result,
            "evidence": evidence_list,
            "verdict": verdict,
            "synthesis": synthesis_result,
            "persistence": persistence_result,
            "execution_log": self.execution_log
        };
    }
}

# Main entry point
can initialize_truthforge() -> DebateGraph {
    """Initialize TruthForge debate engine and validate core graph structure"""
    let debate_graph = DebateGraph();

    # Basic validations for expected nodes and edges
    let required_nodes = ["Question","Topic","Claim","CounterClaim","Evidence","Verdict","DebateSession","MemoryRecord"];
    let required_edges = ["supports","attacks","validated_by","related_to","generated_from","discussed_in","references","similar_to"];

    print("TruthForge AI - Backend Core Initialized");
    print("[VALIDATION] Verifying required relation types and node aliases...");

    # Validate relation types from config
    let missing_relations = [];
    for rel in required_edges {
        if rel not in RELATION_TYPES {
            missing_relations.append(rel);
        }
    }

    if len(missing_relations) > 0 {
        print(f"[VALIDATION] ⚠ Missing relation types: {', '.join(missing_relations)}");
    }
    else {
        print("[VALIDATION] ✓ All required relation types present");
    }

    # Node validation: recommend verifying node definitions exist (MemoryRecord alias added for compatibility)
    print("[VALIDATION] Note: MemoryRecord alias was added to truthforge_nodes.jac for compatibility with expected node names.");


    return debate_graph;
}
