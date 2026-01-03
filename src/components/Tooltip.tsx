"use client";

import React, { useState, useRef, useEffect } from "react";

// QUAD Glossary - All jargon terms with definitions
export const QUAD_GLOSSARY: Record<string, { term: string; definition: string; category: string }> = {
  // Adoption Levels (0D-4D)
  "0D": {
    term: "0D Origin",
    definition: "No AI agents. Pure human QUAD with all methodology benefits but manual execution.",
    category: "Adoption Level",
  },
  "1D": {
    term: "1D Vector",
    definition: "Sequential AI agents. One agent runs at a time with human approval between each step.",
    category: "Adoption Level",
  },
  "2D": {
    term: "2D Plane",
    definition: "Parallel AI agents within phases. UI and API agents work simultaneously, human gates between phases.",
    category: "Adoption Level",
  },
  "3D": {
    term: "3D Space",
    definition: "Full pipeline automation. Agents chain automatically, humans only at start and end.",
    category: "Adoption Level",
  },
  "4D": {
    term: "4D Hyperspace",
    definition: "Self-improving AI. Agents learn from outcomes and optimize themselves. Exception-only human involvement.",
    category: "Adoption Level",
  },
  // Circles
  "Circle 1": {
    term: "Circle 1: Management",
    definition: "Business-focused team (80% business, 20% technical). Includes BA, PM, Tech Lead. Uses Story Agent.",
    category: "Circle",
  },
  "Circle 2": {
    term: "Circle 2: Development",
    definition: "Code-focused team (30% business, 70% technical). Full Stack, Backend, UI, Mobile devs. Uses Dev Agents.",
    category: "Circle",
  },
  "Circle 3": {
    term: "Circle 3: QA",
    definition: "Quality-focused team (30% business, 70% technical). QA Engineers, Automation, Security. Uses Test Agents.",
    category: "Circle",
  },
  "Circle 4": {
    term: "Circle 4: Infrastructure",
    definition: "Ops-focused team (20% business, 80% technical). DevOps, SRE, Cloud, DBA. Uses Deploy/Monitor Agents.",
    category: "Circle",
  },
  // Time Units
  "Cycle": {
    term: "Cycle",
    definition: "4-week development period (replaces Sprint). Contains 4 Pulses. Major deliverable at end.",
    category: "Time Unit",
  },
  "Pulse": {
    term: "Pulse",
    definition: "1-week work unit within a Cycle. Contains daily Checkpoints. Minor deliverables.",
    category: "Time Unit",
  },
  "Checkpoint": {
    term: "Checkpoint",
    definition: "Daily sync point. AI generates status report, humans review async. Replaces standup meetings.",
    category: "Time Unit",
  },
  "Trajectory": {
    term: "Trajectory",
    definition: "3-month planning horizon (3 Cycles). Quarterly roadmap alignment.",
    category: "Time Unit",
  },
  // Methodology
  "QUAD": {
    term: "QUAD",
    definition: "Quick Unified Agentic Development. AI-powered methodology with 4 Circles, documentation-first approach.",
    category: "Core",
  },
  "Flow Document": {
    term: "Flow Document",
    definition: "Living specification that travels with a feature. Contains requirements, design, tests, deployment info.",
    category: "Artifact",
  },
  "Human Gate": {
    term: "Human Gate",
    definition: "Approval checkpoint where humans review AI output before proceeding. Critical for quality control.",
    category: "Process",
  },
  "Docs-First": {
    term: "Docs-First",
    definition: "Write specs before code. AI reads docs to generate code. Docs are always up-to-date.",
    category: "Principle",
  },
  // Agents
  "Story Agent": {
    term: "Story Agent",
    definition: "AI that expands user stories with acceptance criteria, edge cases, and technical considerations.",
    category: "AI Agent",
  },
  "Dev Agent": {
    term: "Dev Agent",
    definition: "AI that generates code from Flow Documents. Variants: Dev Agent (UI), Dev Agent (API).",
    category: "AI Agent",
  },
  "Test Agent": {
    term: "Test Agent",
    definition: "AI that generates test cases from acceptance criteria. Variants: UI Test Agent, API Test Agent.",
    category: "AI Agent",
  },
  "Deploy Agent": {
    term: "Deploy Agent",
    definition: "AI that handles CI/CD pipelines, deployments, and rollbacks. Integrates with GitHub Actions, etc.",
    category: "AI Agent",
  },
  // Estimation
  "Tetrahedron": {
    term: "Tetrahedron (4)",
    definition: "Small complexity. Simple feature, 1-2 day effort.",
    category: "Estimation",
  },
  "Cube": {
    term: "Cube (6)",
    definition: "Medium complexity. Standard feature, 3-5 day effort.",
    category: "Estimation",
  },
  "Octahedron": {
    term: "Octahedron (8)",
    definition: "Large complexity. Complex feature, 1-2 week effort.",
    category: "Estimation",
  },
  "Dodecahedron": {
    term: "Dodecahedron (12)",
    definition: "Extra large complexity. Major feature, 2-3 week effort. Consider breaking down.",
    category: "Estimation",
  },
  "Icosahedron": {
    term: "Icosahedron (20)",
    definition: "Epic complexity. Too large for single story. Must be split into smaller stories.",
    category: "Estimation",
  },
};

// List of terms to auto-detect in text
export const GLOSSARY_TERMS = Object.keys(QUAD_GLOSSARY);

interface TooltipProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
}

export function Tooltip({ term, children, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const glossaryEntry = QUAD_GLOSSARY[term];

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // Position above the term by default
      let top = triggerRect.top - tooltipRect.height - 8;
      let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);

      // Keep within viewport
      if (top < 10) top = triggerRect.bottom + 8;
      if (left < 10) left = 10;
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }

      setPosition({ top, left });
    }
  }, [isVisible]);

  if (!glossaryEntry) {
    return <span className={className}>{children || term}</span>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={`relative cursor-help border-b border-dashed border-blue-400/50 hover:border-blue-400 transition-colors ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children || term}
      </span>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[100] max-w-xs p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-xl"
          style={{ top: position.top, left: position.left }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">
              {glossaryEntry.category}
            </span>
          </div>
          <div className="font-semibold text-white text-sm mb-1">
            {glossaryEntry.term}
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            {glossaryEntry.definition}
          </div>
        </div>
      )}
    </>
  );
}

// Quick reference card component - shows all terms in a category
interface GlossaryCardProps {
  category: string;
  className?: string;
}

export function GlossaryCard({ category, className = "" }: GlossaryCardProps) {
  const terms = Object.entries(QUAD_GLOSSARY).filter(
    ([, entry]) => entry.category === category
  );

  if (terms.length === 0) return null;

  const categoryColors: Record<string, string> = {
    "Adoption Level": "border-purple-500/30 bg-purple-500/5",
    "Circle": "border-blue-500/30 bg-blue-500/5",
    "Time Unit": "border-green-500/30 bg-green-500/5",
    "AI Agent": "border-amber-500/30 bg-amber-500/5",
    "Estimation": "border-pink-500/30 bg-pink-500/5",
    "Core": "border-cyan-500/30 bg-cyan-500/5",
    "Artifact": "border-emerald-500/30 bg-emerald-500/5",
    "Process": "border-orange-500/30 bg-orange-500/5",
    "Principle": "border-indigo-500/30 bg-indigo-500/5",
  };

  return (
    <div className={`rounded-xl border p-4 ${categoryColors[category] || "border-slate-700 bg-slate-800/50"} ${className}`}>
      <h4 className="font-semibold text-white mb-3 text-sm">{category}</h4>
      <div className="space-y-2">
        {terms.map(([key, entry]) => (
          <div key={key} className="text-xs">
            <span className="font-medium text-slate-200">{entry.term}</span>
            <span className="text-slate-400 ml-2">— {entry.definition}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export categories for iteration
export const GLOSSARY_CATEGORIES = [
  "Adoption Level",
  "Circle",
  "Time Unit",
  "AI Agent",
  "Estimation",
  "Core",
  "Artifact",
  "Process",
  "Principle",
];
