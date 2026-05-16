"""
TruthForge AI - Planner Walker
Orchestrates workflow based on question complexity
Dynamically decides which agents activate and in what order
"""

import:from truthforge_nodes import *;
import:from truthforge_config import *;

walker PlannerWalker {
    has question_text: str;
    has complexity_score: float = 0.0;
    has agents_to_activate: list[str] = [];
    has plan_steps: list[dict] = [];

    can analyze_question() {
        """Analyze question to extract domain and estimate complexity"""
        # Estimate complexity based on question characteristics
        let keywords = ["why", "how", "what if", "compare", "debate", "complex", "controversial"];
        let complexity = 0.3;

        for keyword in keywords {
            if keyword in self.question_text.lower() {
                complexity += 0.15;
            }
        }

        # Check for question length (longer = more complex)
        let word_count = len(self.question_text.split());
        if word_count > 20 {
            complexity += 0.1;
        }

        # Cap complexity at 1.0
        self.complexity_score = min(complexity, 1.0);
    }

    can detect_domain() -> str {
        """Detect question domain to inform agent selection"""
        let question_lower = self.question_text.lower();
        
        let domain_keywords = {
            "science": ["physics", "biology", "chemistry", "scientist", "research", "experiment"],
            "politics": ["government", "policy", "political", "election", "law", "legal"],
            "ethics": ["moral", "ethics", "right", "wrong", "should", "value", "principle"],
            "technology": ["ai", "software", "code", "tech", "digital", "computer", "algorithm"],
            "economics": ["economy", "market", "price", "business", "trade", "finance"],
            "philosophy": ["philosophy", "existence", "being", "knowledge", "truth", "meaning"]
        };

        for domain, keywords in domain_keywords {
            for keyword in keywords {
                if keyword in question_lower {
                    return domain;
                }
            }
        }
        
        return "general";
    }

    can determine_agents_needed() {
        """Decide which agents to activate based on complexity"""
        let domain = self.detect_domain();

        if self.complexity_score < 0.3 {
            # Simple question - minimal agents
            self.agents_to_activate = ["thesis", "antithesis", "referee", "synthesis"];
        }
        elif self.complexity_score < 0.6 {
            # Moderate complexity
            self.agents_to_activate = [
                "memory", "thesis", "antithesis", 
                "evidence", "referee", "synthesis"
            ];
        }
        else {
            # Complex question - full team
            self.agents_to_activate = [
                "memory", "thesis", "antithesis", 
                "evidence", "referee", "synthesis"
            ];

            # Add specialized agents for certain domains
            if domain == "science" or domain == "technology" {
                if "evidence" not in self.agents_to_activate {
                    self.agents_to_activate.append("evidence");
                }
            }
        }
    }

    can create_execution_plan() {
        """Create ordered execution plan for activated agents"""
        let step_number = 1;
        let dependencies = {};

        # Memory should run first to fetch prior context
        if "memory" in self.agents_to_activate {
            self.plan_steps.append({
                "step": step_number,
                "agent": "memory",
                "reason": "Retrieve related prior reasoning",
                "dependencies": [],
                "priority": 1.0
            });
            step_number += 1;
            dependencies["memory"] = step_number - 1;
        }

        # Thesis and Antithesis can run in parallel after memory
        let thesis_step = step_number;
        if "thesis" in self.agents_to_activate {
            self.plan_steps.append({
                "step": step_number,
                "agent": "thesis",
                "reason": "Generate supporting claims",
                "dependencies": ["memory"] if "memory" in self.agents_to_activate else [],
                "priority": 0.9
            });
            step_number += 1;
        }

        let antithesis_step = step_number;
        if "antithesis" in self.agents_to_activate {
            self.plan_steps.append({
                "step": step_number,
                "agent": "antithesis",
                "reason": "Generate counter-claims",
                "dependencies": ["memory"] if "memory" in self.agents_to_activate else [],
                "priority": 0.9
            });
            step_number += 1;
        }

        # Evidence can run after thesis/antithesis
        if "evidence" in self.agents_to_activate {
            self.plan_steps.append({
                "step": step_number,
                "agent": "evidence",
                "reason": "Gather supporting evidence",
                "dependencies": ["thesis", "antithesis"],
                "priority": 0.8
            });
            step_number += 1;
        }

        # Referee needs thesis, antithesis, and evidence
        if "referee" in self.agents_to_activate {
            let referee_deps = [];
            if "thesis" in self.agents_to_activate {
                referee_deps.append("thesis");
            }
            if "antithesis" in self.agents_to_activate {
                referee_deps.append("antithesis");
            }
            if "evidence" in self.agents_to_activate {
                referee_deps.append("evidence");
            }

            self.plan_steps.append({
                "step": step_number,
                "agent": "referee",
                "reason": "Evaluate logic and evidence quality",
                "dependencies": referee_deps,
                "priority": 0.7
            });
            step_number += 1;
        }

        # Synthesis needs referee
        if "synthesis" in self.agents_to_activate {
            self.plan_steps.append({
                "step": step_number,
                "agent": "synthesis",
                "reason": "Generate final structured output",
                "dependencies": ["referee"],
                "priority": 0.6
            });
            step_number += 1;
        }
    }

    can orchestrate() {
        """Main orchestration method"""
        print(f"[PLANNER] Analyzing question: {self.question_text[:60]}...");
        
        # Execute planning steps
        self.analyze_question();
        let domain = self.detect_domain();
        self.determine_agents_needed();
        self.create_execution_plan();

        print(f"[PLANNER] Complexity Score: {self.complexity_score:.2f}");
        print(f"[PLANNER] Domain: {domain}");
        print(f"[PLANNER] Activated Agents: {', '.join(self.agents_to_activate)}");
        print(f"[PLANNER] Execution Plan Steps: {len(self.plan_steps)}");

        for step in self.plan_steps {
            print(f"  Step {step['step']}: {step['agent']} - {step['reason']}");
        }
    }
}
