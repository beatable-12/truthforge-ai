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
        """Main orchestration: Run complete debate workflow"""

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

        let agents_executed = plan["agents_to_activate"];

        # Step 2: Memory Retrieval
        let memory_context = {};
        if "memory" in agents_executed {
            memory_context = self.execute_memory(question);
        }
        else {
            self.log_execution("\n[ORCHESTRATOR] Step 2: MEMORY - Skipped (not required for simple questions)");
        }

        # Step 3: Thesis Generation
        let thesis_result = self.execute_thesis(session_id);

        # Step 4: Antithesis Generation
        let antithesis_result = self.execute_antithesis(thesis_result, session_id);

        # Step 5: Evidence Gathering
        let evidence_list = [];
        if "evidence" in agents_executed {
            evidence_list = self.execute_evidence(thesis_result, antithesis_result, session_id);
        }
        else {
            self.log_execution("\n[ORCHESTRATOR] Step 5: EVIDENCE - Skipped (minimal evidence needed for simple questions)");
        }

        # Step 6: Referee Evaluation
        let verdict = self.execute_referee(thesis_result, antithesis_result, evidence_list, session_id);

        # Step 7: Synthesis
        let synthesis_result = self.execute_synthesis(
            question,
            thesis_result,
            antithesis_result,
            evidence_list,
            verdict,
            session_id
        );

        # Step 8: Memory Update (Persistence)
        let persistence_result = self.execute_memory_update(
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

        # Final summary
        self.log_execution("\n╔════════════════════════════════════════════════════╗");
        self.log_execution("║               DEBATE COMPLETE - SUMMARY              ║");
        self.log_execution("╚════════════════════════════════════════════════════╝");

        self.log_execution(f"\nSession: {session_id}");
        self.log_execution(f"Complexity: {complexity}");
        self.log_execution(f"Agents Executed: {', '.join(agents_executed)}");
        self.log_execution(f"Thesis Claims: {thesis_result.get('total_claims', 0)}");
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
    """Initialize TruthForge debate engine"""
    let debate_graph = DebateGraph();
    print("TruthForge AI - Backend Core Initialized");
    return debate_graph;
}
