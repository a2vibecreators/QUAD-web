"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Methodology types - what background does the user have?
export type MethodologyType = "none" | "waterfall" | "agile" | "kanban" | "spiral" | "devops" | "safe";

export interface MethodologyInfo {
  id: MethodologyType;
  name: string;
  icon: string;
  description: string;
  color: string;
}

// All supported methodologies
export const METHODOLOGIES: MethodologyInfo[] = [
  {
    id: "none",
    name: "New to All",
    icon: "🌱",
    description: "I'm learning software development methodologies for the first time",
    color: "emerald",
  },
  {
    id: "waterfall",
    name: "Waterfall",
    icon: "🌊",
    description: "I know traditional sequential development (Requirements → Design → Code → Test → Deploy)",
    color: "blue",
  },
  {
    id: "agile",
    name: "Agile/Scrum",
    icon: "🔄",
    description: "I know Sprints, User Stories, Standups, Retrospectives",
    color: "green",
  },
  {
    id: "kanban",
    name: "Kanban",
    icon: "📋",
    description: "I know pull-based flow, WIP limits, continuous delivery",
    color: "cyan",
  },
  {
    id: "spiral",
    name: "Spiral",
    icon: "🌀",
    description: "I know risk-driven iterative development",
    color: "purple",
  },
  {
    id: "devops",
    name: "DevOps",
    icon: "⚙️",
    description: "I know CI/CD, Infrastructure as Code, SRE practices",
    color: "amber",
  },
  {
    id: "safe",
    name: "SAFe",
    icon: "🏢",
    description: "I know Scaled Agile Framework, ARTs, PIs, Solution Trains",
    color: "indigo",
  },
];

// Get methodology info by ID
export function getMethodology(id: MethodologyType): MethodologyInfo {
  return METHODOLOGIES.find(m => m.id === id) || METHODOLOGIES[0];
}

interface MethodologyContextType {
  methodology: MethodologyType;
  setMethodology: (m: MethodologyType) => void;
  methodologyInfo: MethodologyInfo;
}

const MethodologyContext = createContext<MethodologyContextType | undefined>(undefined);

export function MethodologyProvider({ children }: { children: ReactNode }) {
  // Default to "agile" as most common background
  const [methodology, setMethodologyState] = useState<MethodologyType>("agile");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("quad-methodology-lens");
    if (stored && METHODOLOGIES.some(m => m.id === stored)) {
      setMethodologyState(stored as MethodologyType);
    }
  }, []);

  // Save to localStorage when changed
  const setMethodology = (m: MethodologyType) => {
    setMethodologyState(m);
    localStorage.setItem("quad-methodology-lens", m);
  };

  const methodologyInfo = getMethodology(methodology);

  return (
    <MethodologyContext.Provider value={{ methodology, setMethodology, methodologyInfo }}>
      {children}
    </MethodologyContext.Provider>
  );
}

export function useMethodology() {
  const context = useContext(MethodologyContext);
  if (!context) {
    throw new Error("useMethodology must be used within MethodologyProvider");
  }
  return context;
}
