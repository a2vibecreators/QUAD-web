"use client";

import React, { useState } from "react";
import { useMethodology, MethodologyType, METHODOLOGIES } from "@/context/MethodologyContext";

// Methodology comparison mappings
interface TermMapping {
  quad: string;
  waterfall: string;
  agile: string;
  kanban: string;
  spiral: string;
  devops: string;
  safe: string;
  explanation: string;
}

const METHODOLOGY_MAPPINGS: TermMapping[] = [
  // Time Units
  {
    quad: "Cycle (4 weeks)",
    waterfall: "Phase (variable)",
    agile: "Sprint (2-4 weeks)",
    kanban: "N/A (continuous)",
    spiral: "Iteration (variable)",
    devops: "Release cycle",
    safe: "PI (10 weeks) / Iteration",
    explanation: "QUAD uses fixed 4-week Cycles for predictability. Unlike Waterfall phases that vary, or Sprints that are often 2 weeks.",
  },
  {
    quad: "Pulse (1 week)",
    waterfall: "Milestone checkpoint",
    agile: "Sprint week",
    kanban: "Weekly review",
    spiral: "Mini-iteration",
    devops: "Weekly deploy window",
    safe: "Iteration (2 weeks)",
    explanation: "Pulses are weekly units within a Cycle. 4 Pulses = 1 Cycle. Allows weekly deliverables.",
  },
  {
    quad: "Checkpoint (daily)",
    waterfall: "Status meeting",
    agile: "Daily Standup",
    kanban: "Daily standup",
    spiral: "Risk review",
    devops: "Daily sync",
    safe: "Daily Standup",
    explanation: "AI generates daily status. Humans review async. No 15-minute meetings - read when convenient.",
  },
  {
    quad: "Trajectory (3 months)",
    waterfall: "Project plan",
    agile: "Quarterly planning",
    kanban: "Continuous flow",
    spiral: "Spiral cycle",
    devops: "Roadmap quarter",
    safe: "Program Increment (PI)",
    explanation: "3 Cycles form a Trajectory. Maps to quarterly OKRs and roadmap planning.",
  },
  // Team Structure
  {
    quad: "Circle 1: Management",
    waterfall: "Requirements team",
    agile: "Product Owner + Scrum Master",
    kanban: "Service Delivery Manager",
    spiral: "Risk analysts",
    devops: "Product team",
    safe: "Product Management + RTE",
    explanation: "BA, PM, Tech Lead. 80% business focus. Writes specs, manages backlog.",
  },
  {
    quad: "Circle 2: Development",
    waterfall: "Development team",
    agile: "Dev team",
    kanban: "Dev team (cross-functional)",
    spiral: "Engineering team",
    devops: "Dev team",
    safe: "Agile Team (devs)",
    explanation: "Full Stack, Backend, UI, Mobile devs. 70% technical. Writes code from Flow Docs.",
  },
  {
    quad: "Circle 3: QA",
    waterfall: "Testing team",
    agile: "QA (often same team)",
    kanban: "QA (embedded)",
    spiral: "Verification team",
    devops: "QA + SDET",
    safe: "System Team (QA)",
    explanation: "QA Engineers, Automation, Security. 70% technical. Often shared across projects.",
  },
  {
    quad: "Circle 4: Infrastructure",
    waterfall: "Operations team",
    agile: "DevOps (external)",
    kanban: "Ops (flow enablers)",
    spiral: "Support team",
    devops: "SRE + Platform",
    safe: "Platform Team",
    explanation: "DevOps, SRE, Cloud, DBA. 80% technical. Always shared. Handles deploy/monitoring.",
  },
  // Artifacts
  {
    quad: "Flow Document",
    waterfall: "Requirements spec (SRS)",
    agile: "User Story + Acceptance Criteria",
    kanban: "Work item + Service Class",
    spiral: "Risk-adjusted spec",
    devops: "Runbook + IaC",
    safe: "Feature + Enabler",
    explanation: "Living doc that travels with feature: requirements → design → tests → deploy. Single source of truth.",
  },
  {
    quad: "Human Gate",
    waterfall: "Phase gate review",
    agile: "Sprint review",
    kanban: "Pull review / WIP limit",
    spiral: "Go/No-go decision",
    devops: "Deploy approval",
    safe: "System Demo / PI Review",
    explanation: "Human approval checkpoint. AI suggests, humans approve. Prevents runaway automation.",
  },
  // Workflow
  {
    quad: "Backlog → In Progress → Review → Done",
    waterfall: "Requirements → Design → Code → Test",
    agile: "To Do → In Progress → Done",
    kanban: "Backlog → Ready → WIP → Done",
    spiral: "Plan → Risk → Develop → Evaluate",
    devops: "Plan → Code → Build → Test → Deploy",
    safe: "Funnel → Analyzing → Backlog → Implementing → Done",
    explanation: "QUAD workflow matches common patterns but adds AI assistance at each stage.",
  },
  // AI Adoption
  {
    quad: "0D Origin",
    waterfall: "Traditional (no AI)",
    agile: "Traditional Scrum",
    kanban: "Classic Kanban",
    spiral: "Traditional Spiral",
    devops: "Manual ops",
    safe: "SAFe without AI",
    explanation: "No AI agents. Pure human QUAD. Great for learning methodology before adding AI.",
  },
  {
    quad: "2D Plane (recommended)",
    waterfall: "N/A",
    agile: "AI-assisted Scrum",
    kanban: "AI-assisted flow",
    spiral: "N/A",
    devops: "CI/CD automation",
    safe: "AI-enhanced SAFe",
    explanation: "Parallel AI agents within phases. UI + API work together. Human gates between phases.",
  },
  {
    quad: "4D Hyperspace",
    waterfall: "N/A",
    agile: "N/A",
    kanban: "Autonomous flow",
    spiral: "N/A",
    devops: "AIOps + MLOps",
    safe: "N/A",
    explanation: "Self-improving AI. Agents learn and optimize. Humans only handle exceptions.",
  },
  // Estimation
  {
    quad: "Platonic Solids (4-6-8-12-20)",
    waterfall: "Hours/Days estimate",
    agile: "Story Points (1-2-3-5-8-13)",
    kanban: "Cycle time prediction",
    spiral: "Risk-weighted estimate",
    devops: "T-shirt sizes (S/M/L/XL)",
    safe: "Story Points + Capacity",
    explanation: "Geometric shapes: Tetrahedron(4), Cube(6), Octahedron(8), Dodecahedron(12), Icosahedron(20).",
  },
  // Key Principles
  {
    quad: "Docs-First",
    waterfall: "Requirements-first",
    agile: "Working software over docs",
    kanban: "Visualize flow first",
    spiral: "Risk-first",
    devops: "Automate-first",
    safe: "Architectural runway",
    explanation: "Write specs before code. AI reads docs to generate code. Docs stay current because they ARE the source.",
  },
  {
    quad: "AI Agents",
    waterfall: "Manual everything",
    agile: "Tooling (Jira, etc.)",
    kanban: "Board + WIP limits",
    spiral: "Risk tools",
    devops: "CI/CD pipelines",
    safe: "ARTs + System Teams",
    explanation: "AI assistants at every step: Story Agent, Dev Agent, Test Agent, Deploy Agent, Monitor Agent.",
  },
  {
    quad: "WIP Limits per Circle",
    waterfall: "Sequential (no parallel)",
    agile: "Sprint capacity",
    kanban: "WIP limits per column",
    spiral: "Risk capacity",
    devops: "Pipeline throughput",
    safe: "Team capacity planning",
    explanation: "Each Circle has WIP limits. Prevents bottlenecks. AI monitors and alerts when limits exceeded.",
  },
];

export default function MethodologyLens() {
  const { methodology: selectedLens, methodologyInfo } = useMethodology();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const getComparisonValue = (mapping: TermMapping, lens: MethodologyType): string => {
    switch (lens) {
      case "waterfall": return mapping.waterfall;
      case "agile": return mapping.agile;
      case "kanban": return mapping.kanban;
      case "spiral": return mapping.spiral;
      case "devops": return mapping.devops;
      case "safe": return mapping.safe;
      default: return "—";
    }
  };

  const colorClasses: Record<string, string> = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    green: "border-green-500/30 bg-green-500/10 text-green-300",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  };

  // Get all methodologies except "none" for the comparison
  const methodologiesToCompare = METHODOLOGIES.filter(m => m.id !== "none");

  return (
    <div className="space-y-6">
      {/* Current Lens Indicator */}
      <div className={`rounded-xl border p-4 ${colorClasses[methodologyInfo.color]}`}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">{methodologyInfo.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-white">
                Viewing as: {methodologyInfo.name} background
              </h4>
              <span className="text-xs opacity-60">(Change in nav dropdown)</span>
            </div>
            <p className="text-sm opacity-80">
              {selectedLens === "agile" && (
                "Think of QUAD as Scrum with AI superpowers. Cycles replace Sprints, Flow Docs replace wikis, and AI Agents replace manual coding of tests and deployment scripts."
              )}
              {selectedLens === "waterfall" && (
                "QUAD keeps your love of documentation but makes it iterative. Instead of one massive spec upfront, Flow Docs evolve with the feature. Each 4-week Cycle delivers working software."
              )}
              {selectedLens === "kanban" && (
                "QUAD adopts your flow-based thinking. WIP limits apply per Circle. AI monitors bottlenecks. The difference: time-boxed Cycles add predictability without sacrificing continuous delivery."
              )}
              {selectedLens === "spiral" && (
                "QUAD shares your risk-aware mindset. Human Gates are like go/no-go decisions. The 0D-4D adoption levels let you control how much AI risk you take on."
              )}
              {selectedLens === "devops" && (
                "QUAD extends DevOps into the full SDLC. Your CI/CD pipelines become AI-powered. Docs-First means IaC patterns apply to requirements too."
              )}
              {selectedLens === "safe" && (
                "QUAD is SAFe for smaller teams. Trajectories map to PIs, Cycles to Iterations. AI Agents replace heavy ceremony. No ARTs needed - AI handles coordination."
              )}
              {selectedLens === "none" && (
                "Welcome! Start with the 4 Circles (teams), then understand time units (Cycle → Pulse → Checkpoint), then add AI agents gradually from 0D to 4D."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-white">
            QUAD ↔ {methodologyInfo.name} Comparison
          </h3>
          <span className="text-xs text-slate-500">
            Click any row for details
          </span>
        </div>

        <div className="divide-y divide-slate-700/50">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-slate-700/30 text-xs font-semibold">
            <div className="text-blue-300">QUAD Term</div>
            <div className={colorClasses[methodologyInfo.color].split(" ").find(c => c.startsWith("text-")) || "text-slate-300"}>
              {selectedLens === "none" ? "Explanation" : `${methodologyInfo.name} Equivalent`}
            </div>
            <div className="text-slate-400">Why QUAD Does This</div>
          </div>

          {/* Rows */}
          {METHODOLOGY_MAPPINGS.map((mapping, idx) => (
            <div key={idx}>
              <div
                className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-slate-700/30 cursor-pointer transition-colors"
                onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
              >
                <div className="font-medium text-white text-sm flex items-center gap-2">
                  <span className={`transition-transform ${expandedRow === idx ? "rotate-90" : ""}`}>
                    ▶
                  </span>
                  {mapping.quad}
                </div>
                <div className="text-slate-300 text-sm">
                  {selectedLens === "none"
                    ? mapping.explanation.slice(0, 60) + "..."
                    : getComparisonValue(mapping, selectedLens)
                  }
                </div>
                <div className="text-slate-500 text-xs line-clamp-2">
                  {mapping.explanation.slice(0, 80)}...
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRow === idx && (
                <div className="px-4 py-4 bg-slate-900/50 border-t border-slate-700/50">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* All Methodology Comparisons */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                        Cross-Methodology Comparison
                      </h4>
                      <div className="space-y-2">
                        {methodologiesToCompare.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 text-sm">
                            <span className="text-lg">{m.icon}</span>
                            <span className="text-slate-500 w-24 shrink-0">{m.name}:</span>
                            <span className={`text-slate-300 ${selectedLens === m.id ? "font-semibold" : ""}`}>
                              {getComparisonValue(mapping, m.id)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Full Explanation */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                        Why QUAD Does It This Way
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {mapping.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
