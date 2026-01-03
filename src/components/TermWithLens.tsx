"use client";

import React from "react";
import { useMethodology, MethodologyType } from "@/context/MethodologyContext";

// Methodology comparison mappings (shared with MethodologyLens)
interface TermMapping {
  quad: string;
  waterfall: string;
  agile: string;
  kanban: string;
  spiral: string;
  devops: string;
  safe: string;
}

// Exported mappings for common QUAD terms
export const TERM_MAPPINGS: Record<string, TermMapping> = {
  "Cycle": {
    quad: "Cycle",
    waterfall: "Phase",
    agile: "Sprint",
    kanban: "Flow",
    spiral: "Iteration",
    devops: "Release cycle",
    safe: "PI / Iteration",
  },
  "Pulse": {
    quad: "Pulse",
    waterfall: "Milestone",
    agile: "Sprint week",
    kanban: "Weekly review",
    spiral: "Mini-iteration",
    devops: "Weekly deploy",
    safe: "Iteration week",
  },
  "Checkpoint": {
    quad: "Checkpoint",
    waterfall: "Status meeting",
    agile: "Daily Standup",
    kanban: "Daily standup",
    spiral: "Risk review",
    devops: "Daily sync",
    safe: "Daily Standup",
  },
  "Trajectory": {
    quad: "Trajectory",
    waterfall: "Project plan",
    agile: "Quarterly planning",
    kanban: "Continuous flow",
    spiral: "Spiral cycle",
    devops: "Roadmap quarter",
    safe: "Program Increment",
  },
  "Circle 1": {
    quad: "Circle 1",
    waterfall: "Requirements team",
    agile: "PO + SM",
    kanban: "Service Manager",
    spiral: "Risk analysts",
    devops: "Product team",
    safe: "PM + RTE",
  },
  "Circle 2": {
    quad: "Circle 2",
    waterfall: "Development team",
    agile: "Dev team",
    kanban: "Dev team",
    spiral: "Engineering",
    devops: "Dev team",
    safe: "Agile Team",
  },
  "Circle 3": {
    quad: "Circle 3",
    waterfall: "Testing team",
    agile: "QA",
    kanban: "QA (embedded)",
    spiral: "Verification",
    devops: "QA + SDET",
    safe: "System Team",
  },
  "Circle 4": {
    quad: "Circle 4",
    waterfall: "Operations",
    agile: "DevOps",
    kanban: "Ops",
    spiral: "Support",
    devops: "SRE + Platform",
    safe: "Platform Team",
  },
  "Flow Document": {
    quad: "Flow Document",
    waterfall: "Requirements spec",
    agile: "User Story",
    kanban: "Work item",
    spiral: "Risk spec",
    devops: "Runbook",
    safe: "Feature",
  },
  "Human Gate": {
    quad: "Human Gate",
    waterfall: "Phase gate",
    agile: "Sprint review",
    kanban: "Pull review",
    spiral: "Go/No-go",
    devops: "Deploy approval",
    safe: "System Demo",
  },
};

// Helper function to get the equivalent term
function getEquivalentTerm(quadTerm: string, methodology: MethodologyType): string | null {
  const mapping = TERM_MAPPINGS[quadTerm];
  if (!mapping || methodology === "none") {
    return null;
  }

  switch (methodology) {
    case "waterfall": return mapping.waterfall;
    case "agile": return mapping.agile;
    case "kanban": return mapping.kanban;
    case "spiral": return mapping.spiral;
    case "devops": return mapping.devops;
    case "safe": return mapping.safe;
    default: return null;
  }
}

interface TermWithLensProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

/**
 * Component that displays a QUAD term with its methodology equivalent inline
 *
 * Example usage:
 *   <TermWithLens term="Cycle">Cycle</TermWithLens>
 *
 * Output (when Agile selected):
 *   "Cycle = Sprint"
 *
 * Output (when "New to All" selected):
 *   "Cycle"
 */
export default function TermWithLens({ term, children, className = "", showIcon = false }: TermWithLensProps) {
  const { methodology, methodologyInfo } = useMethodology();

  const equivalent = getEquivalentTerm(term, methodology);
  const displayTerm = children || term;

  if (!equivalent) {
    // No methodology selected or no mapping found - just show the QUAD term
    return <span className={className}>{displayTerm}</span>;
  }

  // Show both terms: "QUAD term = Equivalent"
  return (
    <span className={className}>
      {displayTerm}
      {showIcon && <span className="mx-1 opacity-50">{methodologyInfo.icon}</span>}
      <span className="opacity-60"> = </span>
      <span className="text-blue-300">{equivalent}</span>
    </span>
  );
}

/**
 * Hook version for use in text without JSX
 */
export function useTermWithLens(term: string): string {
  const { methodology } = useMethodology();
  const equivalent = getEquivalentTerm(term, methodology);

  if (!equivalent) {
    return term;
  }

  return `${term} = ${equivalent}`;
}
