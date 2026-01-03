"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbProps {
  onFlowClick?: (flowId: string) => void;
}

// Flow detection mapping
const FLOW_MAP: Record<string, { id: string; name: string; color: string }> = {
  // EXPLORE flow (blue)
  "/discovery": { id: "explore", name: "EXPLORE", color: "blue" },
  "/pitch": { id: "explore", name: "EXPLORE", color: "blue" },
  "/flow": { id: "explore", name: "EXPLORE", color: "blue" },
  "/concept": { id: "explore", name: "EXPLORE", color: "blue" },
  "/architecture": { id: "explore", name: "EXPLORE", color: "blue" },
  "/details": { id: "explore", name: "EXPLORE", color: "blue" },
  "/jargons": { id: "explore", name: "EXPLORE", color: "blue" },
  "/summary": { id: "explore", name: "EXPLORE", color: "blue" },

  // TRY flow (green)
  "/case-study": { id: "try", name: "TRY", color: "green" },
  "/demo": { id: "try", name: "TRY", color: "green" },
  "/configure": { id: "try", name: "TRY", color: "green" },
  "/platform": { id: "try", name: "TRY", color: "green" },
  "/quiz": { id: "try", name: "TRY", color: "green" },

  // RESOURCES flow (purple)
  "/cheatsheet": { id: "resources", name: "RESOURCES", color: "purple" },
  "/onboarding": { id: "resources", name: "RESOURCES", color: "purple" },
  "/docs": { id: "resources", name: "RESOURCES", color: "purple" },
  "/mm-pitch": { id: "resources", name: "RESOURCES", color: "purple" },
};

// Page title mapping
const PAGE_TITLES: Record<string, string> = {
  // EXPLORE pages
  "/discovery": "Discovery Assessment",
  "/pitch": "Value Proposition",
  "/flow": "Source of Truth Flow",
  "/concept": "Main Concept",
  "/architecture": "Agent Architecture",
  "/details": "Technical Details",
  "/jargons": "Terminology",
  "/summary": "Executive Summary",

  // TRY pages
  "/case-study": "Case Study",
  "/demo": "Dashboard Demo",
  "/configure": "Configure QUAD",
  "/platform": "QUAD Platform",
  "/quiz": "QUAD Quiz",

  // RESOURCES pages
  "/cheatsheet": "Cheat Sheet",
  "/onboarding": "Onboarding Requirements",
  "/docs": "Documentation",
  "/mm-pitch": "Enterprise Pitch",
};

export default function Breadcrumb({ onFlowClick }: BreadcrumbProps) {
  const pathname = usePathname();

  // Don't show breadcrumb on homepage, dashboard, auth, or admin pages
  if (
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/domain-config") ||
    pathname.startsWith("/blueprint-agent")
  ) {
    return null;
  }

  // Normalize pathname - remove .html extension and trailing slashes
  const normalizedPath = pathname.replace(/\.html$/, "").replace(/\/$/, "");

  const flow = FLOW_MAP[normalizedPath];
  const pageTitle = PAGE_TITLES[normalizedPath];

  // If no flow found, just show Home > Page Title
  if (!flow) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors hover:underline">
              Home
            </Link>
            <span className="text-slate-500 opacity-50">›</span>
            <span className="font-semibold text-white truncate">{pageTitle || "Page"}</span>
          </div>
        </div>
      </div>
    );
  }

  // Get color classes based on flow
  const colorClasses = {
    blue: "text-blue-400 hover:text-blue-300",
    green: "text-green-400 hover:text-green-300",
    purple: "text-purple-400 hover:text-purple-300",
  };

  const flowColorClass = colorClasses[flow.color as keyof typeof colorClasses] || "text-slate-400";

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/30">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Desktop: Full breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          {/* Home link */}
          <Link href="/" className="text-slate-400 hover:text-white transition-colors hover:underline">
            Home
          </Link>

          <span className="text-slate-500 opacity-50">›</span>

          {/* Flow name - clickable to open menu */}
          <button
            onClick={() => onFlowClick?.(flow.id)}
            className={`${flowColorClass} transition-colors hover:underline font-medium`}
            aria-label={`Open ${flow.name} menu`}
            title={`Click to see all ${flow.name} pages`}
          >
            {flow.name}
          </button>

          <span className="text-slate-500 opacity-50">›</span>

          {/* Current page - not clickable */}
          <span className="font-semibold text-white truncate">
            {pageTitle}
          </span>
        </div>

        {/* Mobile: Abbreviated breadcrumb */}
        <div className="flex md:hidden items-center gap-2 text-sm">
          {/* Home icon */}
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            ◇
          </Link>

          <span className="text-slate-500 opacity-50">›</span>

          {/* Flow name */}
          <button
            onClick={() => onFlowClick?.(flow.id)}
            className={`${flowColorClass} transition-colors hover:underline font-medium`}
            title={`Click to see all ${flow.name} pages`}
          >
            {flow.name}
          </button>

          <span className="text-slate-500 opacity-50">›</span>

          {/* Current page - abbreviated */}
          <span className="font-semibold text-white truncate">
            {pageTitle}
          </span>
        </div>
      </div>
    </div>
  );
}
