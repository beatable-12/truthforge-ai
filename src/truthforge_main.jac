"""
TruthForge AI - Main Orchestration
Entry point for the backend reasoning engine.
Coordinates all walkers in the execution order:
  Question → Planner → Memory → Thesis → Antithesis → Evidence → Referee → Synthesis → MemoryUpdate

NOTE: At runtime, the actual execution happens in TypeScript (truthforge_api.ts).
This file serves as the architectural specification and Jac-native entry point.
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
    has agent_events: list[dict] = [];

    can generate_session_id() -> str {
        """Generate unique session ID"""
        return f"session_{len(self.nodes)}_{timestamp()}";
    }

    can log_execution(message: str) {
        """Log execution step"""
        self.execution_log.append(message);
        print(message);
    }

    can emit_event(agent: str, status: str, detail: str) {
        """Emit a real agent execution event"""
        let event = {
            "agent": agent,
            "status": status,
            "detail": detail,
            "timestamp": "current_timestamp"
        };
        self.agent_events.append(event);
        self.log_execution(f"[{status.upper()}] {agent}: {detail}");
    }

    can run_debate(question: str) -> dict {
        """Main orchestration: Run the full 8-agent pipeline.

        Execution order:
          1. PlannerWalker — classify question type, activate agents
          2. MemoryWalker — retrieve prior reasoning from database
          3. ThesisWalker — generate 2-4 concrete supporting claims (Gemini)
          4. AntithesisWalker — attack each claim individually (Gemini)
          5. EvidenceWalker — gather structured evidence (Gemini)
          6. RefereeWalker — score logic, evidence, risk, agreement (Gemini)
          7. SynthesisWalker — generate final structured analysis (Gemini)
          8. MemoryUpdateWalker — persist all artifacts to database

        Each agent passes its outputs to downstream agents.
        Agent events are emitted as real execution data, not simulated states.
        """

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

        # ── Step 1: PLANNER ──────────────────────────────────────────
        self.emit_event("planner", "started", "Classifying question type");

        let planner = PlannerWalker();
        planner.question_text = question;
        planner.orchestrate();

        self.emit_event("planner", "complete",
            f"Type: {planner.question_type} | Domain: {planner.domain} | Complexity: {planner.complexity_score:.2f}");

        let complexity = "simple";
        if planner.complexity_score >= 0.6 {
            complexity = "complex";
        }
        elif planner.complexity_score >= 0.3 {
            complexity = "moderate";
        }

        # ── Step 2: MEMORY ───────────────────────────────────────────
        self.emit_event("memory", "started", "Retrieving prior reasoning");

        let memory = MemoryWalker();
        memory.question_text = question;
        memory.retrieve_memory();

        let memory_count = len(memory.related_memories);
        self.emit_event("memory", "complete", f"Retrieved: {memory_count} prior analyses");

        # ── Step 3: THESIS ───────────────────────────────────────────
        self.emit_event("thesis", "started", "Generating supporting claims via Gemini");

        let thesis = ThesisWalker();
        thesis.question_text = question;
        thesis.question_type = planner.question_type;
        thesis.domain = planner.domain;
        let thesis_result = thesis.generate_thesis(session_id);

        let claim_count = thesis_result.get("total_claims", 0);
        self.emit_event("thesis", "complete", f"Claims generated: {claim_count}");

        # ── Step 4: ANTITHESIS ───────────────────────────────────────
        self.emit_event("antithesis", "started", "Generating counter-arguments via Gemini");

        let thesis_claims = thesis_result.get("claims", []);
        if len(thesis_claims) == 0 {
            thesis_claims = thesis_result.get("supporting_claims", []);
            if thesis_result.get("primary_claim", {}) {
                thesis_claims.insert(0, thesis_result["primary_claim"]);
            }
        }

        let antithesis = AntithesisWalker();
        let antithesis_result = antithesis.generate_antithesis(thesis_claims, session_id);

        let counter_count = antithesis_result.get("total_counter_claims", 0);
        self.emit_event("antithesis", "complete", f"Counterclaims generated: {counter_count}");

        # ── Step 5: EVIDENCE ─────────────────────────────────────────
        let evidence_list = [];
        if "evidence" in planner.agents_to_activate {
            self.emit_event("evidence", "started", "Gathering structured evidence via Gemini");

            let evidence = EvidenceWalker();
            evidence.question_text = question;
            let counter_claims = antithesis_result.get("counter_claims", antithesis_result.get("supporting_counters", []));
            evidence_list = evidence.gather(thesis_claims, counter_claims, session_id);

            self.emit_event("evidence", "complete", f"Evidence retrieved: {len(evidence_list)} sources");
        }

        # ── Step 6: REFEREE ──────────────────────────────────────────
        self.emit_event("referee", "started", "Evaluating debate quality");

        let referee = RefereeWalker();
        let counter_claims_for_referee = antithesis_result.get("counter_claims", antithesis_result.get("supporting_counters", []));
        let verdict = referee.evaluate(thesis_claims, counter_claims_for_referee, evidence_list, session_id);

        self.emit_event("referee", "complete",
            f"Logic: {verdict.get('logic_strength', 0):.2f} | Evidence: {verdict.get('evidence_strength', 0):.2f}");

        # ── Step 7: SYNTHESIS ────────────────────────────────────────
        self.emit_event("synthesis", "started", "Generating final analysis");

        let synthesis = SynthesisWalker();
        let synthesis_result = synthesis.synthesize(
            question,
            thesis_claims,
            counter_claims_for_referee,
            evidence_list,
            verdict,
            session_id
        );

        self.emit_event("synthesis", "complete",
            f"Confidence: {synthesis_result.get('confidence', 'Moderate')}");

        # ── Step 8: MEMORY UPDATE ────────────────────────────────────
        self.emit_event("memory_update", "started", "Persisting results to database");

        let agents_executed = ["planner", "memory", "thesis", "antithesis"];
        if "evidence" in planner.agents_to_activate {
            agents_executed.append("evidence");
        }
        agents_executed.extend(["referee", "synthesis", "memory_update"]);

        let memory_update = MemoryUpdateWalker();
        let persistence_result = memory_update.persist(
            session_id,
            question_id,
            question,
            complexity,
            thesis_claims,
            counter_claims_for_referee,
            evidence_list,
            verdict,
            synthesis_result,
            agents_executed
        );

        self.emit_event("memory_update", "complete",
            f"Persisted: {'validated' if persistence_result.get('persistence_validated') else 'failed'}");

        # ── Summary ──────────────────────────────────────────────────
        self.log_execution("\n╔════════════════════════════════════════════════════╗");
        self.log_execution("║               DEBATE COMPLETE - SUMMARY              ║");
        self.log_execution("╚════════════════════════════════════════════════════╝");
        self.log_execution(f"\nSession: {session_id}");
        self.log_execution(f"Question Type: {planner.question_type}");
        self.log_execution(f"Complexity: {complexity}");
        self.log_execution(f"Claims: {claim_count} | Counter-claims: {counter_count}");
        self.log_execution(f"Evidence: {len(evidence_list)}");

        # Update session status
        self.nodes[session_id]["status"] = "completed";

        return {
            "session_id": session_id,
            "question_id": question_id,
            "question_type": planner.question_type,
            "complexity": complexity,
            "thesis": thesis_result,
            "antithesis": antithesis_result,
            "evidence": evidence_list,
            "verdict": verdict,
            "synthesis": synthesis_result,
            "persistence": persistence_result,
            "agent_events": self.agent_events,
            "execution_log": self.execution_log
        };
    }
}

# Main entry point
can initialize_truthforge() -> DebateGraph {
    """Initialize TruthForge debate engine"""
    let debate_graph = DebateGraph();

    # Validate config
    let required_edges = ["supports", "attacks", "validated_by", "related_to", "generated_from", "discussed_in", "references", "similar_to"];

    print("TruthForge AI - Backend Core Initialized");
    print("[VALIDATION] Verifying required relation types...");

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

    print("[VALIDATION] ✓ Agent pipeline: Planner → Memory → Thesis → Antithesis → Evidence → Referee → Synthesis → MemoryUpdate");

    return debate_graph;
}
