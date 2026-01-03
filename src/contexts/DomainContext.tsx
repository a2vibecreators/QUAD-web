"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Domain types
export type DomainType = "software" | "education" | "healthcare" | "construction" | "finance" | "other";

// Domain configuration
export interface DomainConfig {
  id: DomainType;
  name: string;
  icon: string;
  description: string;
  circles: {
    circle1: { name: string; description: string };
    circle2: { name: string; description: string };
    circle3: { name: string; description: string };
    circle4: { name: string; description: string };
  };
  readinessQuestions: {
    id: string;
    text: string;
    critical: boolean;
  }[];
  painCategories: {
    id: string;
    icon: string;
    title: string;
    symptoms: { id: string; text: string; weight: number }[];
    rootCauses: string[];
    quadSolution: string;
  }[];
}

// Domain-specific configurations
export const domainConfigs: Record<DomainType, DomainConfig> = {
  software: {
    id: "software",
    name: "Software Development",
    icon: "💻",
    description: "Build better software with AI-assisted development",
    circles: {
      circle1: { name: "Business Analyst", description: "Requirements & Documentation" },
      circle2: { name: "Developer", description: "Code & Implementation" },
      circle3: { name: "QA Engineer", description: "Testing & Quality" },
      circle4: { name: "DevOps", description: "Deployment & Infrastructure" },
    },
    readinessQuestions: [
      { id: "r1", text: "Do you use JIRA or similar project management tool?", critical: true },
      { id: "r2", text: "Do you use Git for source control?", critical: true },
      { id: "r3", text: "Do you have defined sprints or iterations?", critical: false },
      { id: "r4", text: "Is leadership committed to process change?", critical: true },
      { id: "r5", text: "Do you have at least one dedicated BA or Product Owner?", critical: false },
      { id: "r6", text: "Are you open to AI-assisted development?", critical: false },
    ],
    painCategories: [
      {
        id: "delivery",
        icon: "🚀",
        title: "Delivery & Timeline Issues",
        symptoms: [
          { id: "d1", text: "Projects are always late", weight: 3 },
          { id: "d2", text: "Estimates are wildly inaccurate", weight: 2 },
          { id: "d3", text: "Scope creep is constant", weight: 2 },
          { id: "d4", text: "Sprint commitments never met", weight: 3 },
        ],
        rootCauses: [
          "No standardized estimation process",
          "Requirements change mid-sprint",
          "Hidden complexity discovered late",
          "Dependencies not tracked",
        ],
        quadSolution: "QUAD's Documentation-First approach ensures requirements are crystal clear BEFORE development. AI agents assist with accurate estimation using historical data.",
      },
      {
        id: "quality",
        icon: "🐛",
        title: "Quality & Rework Problems",
        symptoms: [
          { id: "q1", text: "Too many production bugs", weight: 3 },
          { id: "q2", text: "Lots of time spent on rework", weight: 3 },
          { id: "q3", text: "QA finds issues late in cycle", weight: 2 },
          { id: "q4", text: "Technical debt keeps growing", weight: 2 },
        ],
        rootCauses: [
          "Inadequate test coverage",
          "QA involved too late",
          "No code review standards",
          "Documentation not maintained",
        ],
        quadSolution: "Circle 3 (QA) is involved from Day 1 in QUAD. Test Agent writes tests as specs are created. Review Agent catches issues before they reach QA.",
      },
      {
        id: "communication",
        icon: "💬",
        title: "Communication & Alignment",
        symptoms: [
          { id: "c1", text: "Business and dev don't understand each other", weight: 3 },
          { id: "c2", text: "Same questions asked repeatedly", weight: 2 },
          { id: "c3", text: "Knowledge lost when people leave", weight: 3 },
          { id: "c4", text: "Status updates take too long to prepare", weight: 1 },
        ],
        rootCauses: [
          "No single source of truth",
          "Documentation scattered/outdated",
          "No standardized terminology",
          "Information silos between teams",
        ],
        quadSolution: "QUAD's Source of Truth flow ensures all knowledge lives in JIRA. Auto-generated documentation means nothing gets outdated. AI agents provide instant status.",
      },
    ],
  },
  education: {
    id: "education",
    name: "Education",
    icon: "🎓",
    description: "Transform learning with AI-enhanced curriculum delivery",
    circles: {
      circle1: { name: "Curriculum Designer", description: "Course Design & Standards" },
      circle2: { name: "Course Developer", description: "Content Creation" },
      circle3: { name: "Academic Reviewer", description: "Quality & Assessment" },
      circle4: { name: "LMS Admin", description: "Platform & Delivery" },
    },
    readinessQuestions: [
      { id: "r1", text: "Do you use an LMS (Canvas, Moodle, Blackboard)?", critical: true },
      { id: "r2", text: "Do you have defined curriculum standards?", critical: true },
      { id: "r3", text: "Do you have structured academic terms?", critical: false },
      { id: "r4", text: "Is administration committed to process change?", critical: true },
      { id: "r5", text: "Do you have dedicated curriculum designers?", critical: false },
      { id: "r6", text: "Are you open to AI-assisted learning tools?", critical: false },
    ],
    painCategories: [
      {
        id: "delivery",
        icon: "📚",
        title: "Course Delivery Issues",
        symptoms: [
          { id: "d1", text: "Courses are never ready on time", weight: 3 },
          { id: "d2", text: "Content updates take too long", weight: 2 },
          { id: "d3", text: "Curriculum changes disrupt everything", weight: 2 },
          { id: "d4", text: "Term deadlines always missed", weight: 3 },
        ],
        rootCauses: [
          "No standardized course development process",
          "Requirements change mid-term",
          "Multiple stakeholder approvals needed",
          "Dependencies between courses not tracked",
        ],
        quadSolution: "QUAD's Documentation-First approach ensures curriculum is designed before development. AI agents assist with content generation and scheduling.",
      },
      {
        id: "quality",
        icon: "📝",
        title: "Content Quality Problems",
        symptoms: [
          { id: "q1", text: "Student feedback is consistently negative", weight: 3 },
          { id: "q2", text: "Lots of time fixing errors in materials", weight: 3 },
          { id: "q3", text: "Assessment issues found after release", weight: 2 },
          { id: "q4", text: "Outdated content keeps piling up", weight: 2 },
        ],
        rootCauses: [
          "No peer review process",
          "Quality review done too late",
          "No content standards",
          "No systematic content updates",
        ],
        quadSolution: "Circle 3 (Academic Reviewer) validates content before release. AI agents check for consistency and generate assessments aligned with learning objectives.",
      },
      {
        id: "communication",
        icon: "💬",
        title: "Coordination Challenges",
        symptoms: [
          { id: "c1", text: "Faculty and admin don't align on goals", weight: 3 },
          { id: "c2", text: "Same curriculum questions asked repeatedly", weight: 2 },
          { id: "c3", text: "Institutional knowledge lost with turnover", weight: 3 },
          { id: "c4", text: "Reporting to stakeholders is painful", weight: 1 },
        ],
        rootCauses: [
          "No central curriculum repository",
          "Documentation scattered across systems",
          "No standard terminology",
          "Siloed departments",
        ],
        quadSolution: "QUAD's Source of Truth ensures all curriculum lives in one system. AI agents auto-generate reports and maintain documentation.",
      },
    ],
  },
  healthcare: {
    id: "healthcare",
    name: "Healthcare",
    icon: "🏥",
    description: "Improve patient care with AI-optimized workflows",
    circles: {
      circle1: { name: "Clinical Analyst", description: "Requirements & Compliance" },
      circle2: { name: "Implementation Specialist", description: "System Configuration" },
      circle3: { name: "Quality Assurance", description: "Validation & Testing" },
      circle4: { name: "IT Operations", description: "Deployment & Support" },
    },
    readinessQuestions: [
      { id: "r1", text: "Do you use an EHR/EMR system?", critical: true },
      { id: "r2", text: "Do you have documented clinical workflows?", critical: true },
      { id: "r3", text: "Do you have defined improvement cycles?", critical: false },
      { id: "r4", text: "Is leadership committed to process change?", critical: true },
      { id: "r5", text: "Do you have clinical informatics staff?", critical: false },
      { id: "r6", text: "Are you open to AI-assisted clinical tools?", critical: false },
    ],
    painCategories: [
      {
        id: "delivery",
        icon: "⏰",
        title: "Implementation Delays",
        symptoms: [
          { id: "d1", text: "System go-lives are always delayed", weight: 3 },
          { id: "d2", text: "Change requests take months", weight: 2 },
          { id: "d3", text: "Scope creep from clinical staff", weight: 2 },
          { id: "d4", text: "Training never completed on time", weight: 3 },
        ],
        rootCauses: [
          "No standardized implementation process",
          "Clinical requirements keep changing",
          "Complex approval workflows",
          "Dependencies not well mapped",
        ],
        quadSolution: "QUAD's Documentation-First captures clinical requirements upfront. AI agents help translate clinical needs to technical specs.",
      },
      {
        id: "quality",
        icon: "⚠️",
        title: "Quality & Compliance Issues",
        symptoms: [
          { id: "q1", text: "Post-go-live issues affect patient care", weight: 3 },
          { id: "q2", text: "Constant rework on configurations", weight: 3 },
          { id: "q3", text: "Compliance issues found late", weight: 2 },
          { id: "q4", text: "Technical debt in clinical systems", weight: 2 },
        ],
        rootCauses: [
          "Inadequate testing before go-live",
          "QA involved too late",
          "No compliance checkpoints",
          "Configuration drift over time",
        ],
        quadSolution: "Circle 3 (Quality Assurance) validates compliance at every step. AI agents run automated compliance checks and testing.",
      },
      {
        id: "communication",
        icon: "💬",
        title: "Clinical-IT Communication Gap",
        symptoms: [
          { id: "c1", text: "Clinicians and IT don't understand each other", weight: 3 },
          { id: "c2", text: "Same workflow questions asked repeatedly", weight: 2 },
          { id: "c3", text: "Knowledge lost when staff leaves", weight: 3 },
          { id: "c4", text: "Status updates to leadership are painful", weight: 1 },
        ],
        rootCauses: [
          "No shared vocabulary",
          "Documentation in different systems",
          "Clinical workflows not documented",
          "Information silos",
        ],
        quadSolution: "QUAD bridges clinical and IT with shared documentation. AI agents translate clinical terminology and generate reports.",
      },
    ],
  },
  construction: {
    id: "construction",
    name: "Construction",
    icon: "🏗️",
    description: "Build projects on time with AI-coordinated teams",
    circles: {
      circle1: { name: "Project Planner", description: "Plans & Specifications" },
      circle2: { name: "Site Manager", description: "Execution & Coordination" },
      circle3: { name: "Quality Inspector", description: "Inspections & Compliance" },
      circle4: { name: "Operations Manager", description: "Resources & Logistics" },
    },
    readinessQuestions: [
      { id: "r1", text: "Do you use project management software (Procore, Buildertrend)?", critical: true },
      { id: "r2", text: "Do you have documented project plans?", critical: true },
      { id: "r3", text: "Do you have defined project phases?", critical: false },
      { id: "r4", text: "Is leadership committed to process change?", critical: true },
      { id: "r5", text: "Do you have dedicated project planners?", critical: false },
      { id: "r6", text: "Are you open to AI-assisted project tools?", critical: false },
    ],
    painCategories: [
      {
        id: "delivery",
        icon: "🚧",
        title: "Project Delays",
        symptoms: [
          { id: "d1", text: "Projects are always over schedule", weight: 3 },
          { id: "d2", text: "Cost estimates are wildly inaccurate", weight: 2 },
          { id: "d3", text: "Change orders are constant", weight: 2 },
          { id: "d4", text: "Phase deadlines never met", weight: 3 },
        ],
        rootCauses: [
          "No standardized scheduling process",
          "Weather and site conditions unpredictable",
          "Subcontractor dependencies not tracked",
          "Material delays not anticipated",
        ],
        quadSolution: "QUAD's Documentation-First ensures all plans are detailed upfront. AI agents help with scheduling and dependency tracking.",
      },
      {
        id: "quality",
        icon: "🔨",
        title: "Quality & Rework",
        symptoms: [
          { id: "q1", text: "Too many punch list items", weight: 3 },
          { id: "q2", text: "Lots of rework on site", weight: 3 },
          { id: "q3", text: "Inspections fail frequently", weight: 2 },
          { id: "q4", text: "Safety issues pile up", weight: 2 },
        ],
        rootCauses: [
          "No quality checkpoints during build",
          "Inspections scheduled too late",
          "No standardized quality criteria",
          "Safety documentation lacking",
        ],
        quadSolution: "Circle 3 (Quality Inspector) validates work at each phase. AI agents generate inspection checklists and track defects.",
      },
      {
        id: "communication",
        icon: "📋",
        title: "Coordination Problems",
        symptoms: [
          { id: "c1", text: "Subcontractors and GC don't coordinate", weight: 3 },
          { id: "c2", text: "Same RFIs submitted repeatedly", weight: 2 },
          { id: "c3", text: "Lessons learned never captured", weight: 3 },
          { id: "c4", text: "Owner updates are painful", weight: 1 },
        ],
        rootCauses: [
          "No central project hub",
          "Documentation scattered",
          "No standard RFI process",
          "Tribal knowledge in crews",
        ],
        quadSolution: "QUAD's Source of Truth keeps all project docs in one place. AI agents track RFIs and generate owner reports.",
      },
    ],
  },
  finance: {
    id: "finance",
    name: "Finance",
    icon: "💼",
    description: "Streamline financial processes with AI-driven automation",
    circles: {
      circle1: { name: "Business Analyst", description: "Requirements & Regulations" },
      circle2: { name: "System Developer", description: "Implementation" },
      circle3: { name: "Compliance Officer", description: "Audit & Validation" },
      circle4: { name: "IT Operations", description: "Infrastructure & Security" },
    },
    readinessQuestions: [
      { id: "r1", text: "Do you use financial management software?", critical: true },
      { id: "r2", text: "Do you have documented compliance procedures?", critical: true },
      { id: "r3", text: "Do you have defined reporting cycles?", critical: false },
      { id: "r4", text: "Is leadership committed to process change?", critical: true },
      { id: "r5", text: "Do you have dedicated analysts?", critical: false },
      { id: "r6", text: "Are you open to AI-assisted financial tools?", critical: false },
    ],
    painCategories: [
      {
        id: "delivery",
        icon: "📊",
        title: "Reporting Delays",
        symptoms: [
          { id: "d1", text: "Reports are always late", weight: 3 },
          { id: "d2", text: "Forecasts are inaccurate", weight: 2 },
          { id: "d3", text: "Regulatory changes cause scramble", weight: 2 },
          { id: "d4", text: "Quarter-end is always a crisis", weight: 3 },
        ],
        rootCauses: [
          "No standardized reporting process",
          "Data from multiple systems",
          "Manual consolidation steps",
          "Last-minute changes common",
        ],
        quadSolution: "QUAD's Documentation-First ensures reporting templates are ready. AI agents automate data collection and report generation.",
      },
      {
        id: "quality",
        icon: "⚠️",
        title: "Accuracy & Compliance Issues",
        symptoms: [
          { id: "q1", text: "Too many reconciliation errors", weight: 3 },
          { id: "q2", text: "Audit findings require rework", weight: 3 },
          { id: "q3", text: "Compliance gaps found late", weight: 2 },
          { id: "q4", text: "Manual processes cause errors", weight: 2 },
        ],
        rootCauses: [
          "No automated validation",
          "Audit prep done at last minute",
          "No compliance checkpoints",
          "Manual data entry errors",
        ],
        quadSolution: "Circle 3 (Compliance Officer) validates at every step. AI agents run automated reconciliation and compliance checks.",
      },
      {
        id: "communication",
        icon: "💬",
        title: "Cross-team Coordination",
        symptoms: [
          { id: "c1", text: "Business and finance don't align", weight: 3 },
          { id: "c2", text: "Same data requested multiple times", weight: 2 },
          { id: "c3", text: "Process knowledge lost with turnover", weight: 3 },
          { id: "c4", text: "Executive reporting is painful", weight: 1 },
        ],
        rootCauses: [
          "No single source of truth for data",
          "Spreadsheets everywhere",
          "No documented processes",
          "Siloed teams",
        ],
        quadSolution: "QUAD's Source of Truth centralizes all financial data and processes. AI agents generate executive dashboards automatically.",
      },
    ],
  },
  other: {
    id: "other",
    name: "Other Industry",
    icon: "📦",
    description: "🚧 Beta - Industry-specific content coming soon. Use Software as template.",
    circles: {
      circle1: { name: "Analyst", description: "Requirements & Planning" },
      circle2: { name: "Executor", description: "Implementation" },
      circle3: { name: "Reviewer", description: "Quality & Validation" },
      circle4: { name: "Operations", description: "Delivery & Support" },
    },
    readinessQuestions: [
      { id: "r1", text: "Do you use project/workflow management tools?", critical: true },
      { id: "r2", text: "Do you have documented processes?", critical: true },
      { id: "r3", text: "Do you have defined work cycles?", critical: false },
      { id: "r4", text: "Is leadership committed to process change?", critical: true },
      { id: "r5", text: "Do you have dedicated process owners?", critical: false },
      { id: "r6", text: "Are you open to AI-assisted tools?", critical: false },
    ],
    painCategories: [
      {
        id: "delivery",
        icon: "🚀",
        title: "Delivery Issues",
        symptoms: [
          { id: "d1", text: "Work is always behind schedule", weight: 3 },
          { id: "d2", text: "Estimates are unreliable", weight: 2 },
          { id: "d3", text: "Scope changes constantly", weight: 2 },
          { id: "d4", text: "Deadlines rarely met", weight: 3 },
        ],
        rootCauses: [
          "No standardized process",
          "Requirements keep changing",
          "Dependencies not tracked",
          "Resource constraints",
        ],
        quadSolution: "QUAD's Documentation-First approach applies to any domain. AI agents help with planning and tracking.",
      },
      {
        id: "quality",
        icon: "⚠️",
        title: "Quality Problems",
        symptoms: [
          { id: "q1", text: "Too many errors in deliverables", weight: 3 },
          { id: "q2", text: "Lots of rework required", weight: 3 },
          { id: "q3", text: "Issues found late in process", weight: 2 },
          { id: "q4", text: "Backlog of improvements grows", weight: 2 },
        ],
        rootCauses: [
          "No quality checkpoints",
          "Reviews done too late",
          "No standards defined",
          "Continuous improvement lacking",
        ],
        quadSolution: "Circle 3 (Reviewer) validates at each step. AI agents can automate quality checks.",
      },
      {
        id: "communication",
        icon: "💬",
        title: "Communication Gaps",
        symptoms: [
          { id: "c1", text: "Teams don't communicate well", weight: 3 },
          { id: "c2", text: "Same questions asked repeatedly", weight: 2 },
          { id: "c3", text: "Knowledge lost when people leave", weight: 3 },
          { id: "c4", text: "Status reporting is painful", weight: 1 },
        ],
        rootCauses: [
          "No central repository",
          "Documentation scattered",
          "No shared vocabulary",
          "Information silos",
        ],
        quadSolution: "QUAD's Source of Truth keeps all docs in one place. AI agents generate reports and maintain knowledge.",
      },
    ],
  },
};

// Context type
interface DomainContextType {
  domain: DomainType;
  setDomain: (domain: DomainType) => void;
  config: DomainConfig;
  allDomains: DomainConfig[];
}

// Create context
const DomainContext = createContext<DomainContextType | undefined>(undefined);

// Provider component
export function DomainProvider({ children }: { children: ReactNode }) {
  const [domain, setDomainState] = useState<DomainType>("software");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("quad-domain");
    if (saved && saved in domainConfigs) {
      setDomainState(saved as DomainType);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when domain changes
  const setDomain = (newDomain: DomainType) => {
    setDomainState(newDomain);
    localStorage.setItem("quad-domain", newDomain);
  };

  const config = domainConfigs[domain];
  const allDomains = Object.values(domainConfigs);

  // Don't render children until we've loaded from localStorage
  if (!isLoaded) {
    return null;
  }

  return (
    <DomainContext.Provider value={{ domain, setDomain, config, allDomains }}>
      {children}
    </DomainContext.Provider>
  );
}

// Hook to use the domain context
export function useDomain() {
  const context = useContext(DomainContext);
  if (context === undefined) {
    throw new Error("useDomain must be used within a DomainProvider");
  }
  return context;
}
