"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import MethodologySelector from "@/components/MethodologySelector";
import { SearchButton } from "@/components/SearchProvider";
import DomainSelector from "@/components/DomainSelector";

/**
 * Conditional Navigation Component
 *
 * Hides the main QUAD navigation when on MassMutual pages
 * to create a focused, isolated pitch experience.
 */
export default function ConditionalNav() {
  const pathname = usePathname();

  // Hide main nav on MassMutual pages - they have their own layout
  if (pathname.startsWith("/massmutual")) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[60] bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black gradient-text">QUAD</span>
              <span className="text-xs text-slate-500">Framework</span>
            </Link>
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">v1.0</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/concept" className="text-sm text-slate-400 hover:text-white transition-colors">
              Concept
            </Link>
            <Link href="/details" className="text-sm text-slate-400 hover:text-white transition-colors">
              Details
            </Link>
            <Link href="/jargons" className="text-sm text-slate-400 hover:text-white transition-colors">
              Terminology
            </Link>
            <Link href="/cheatsheet" className="text-sm text-slate-400 hover:text-white transition-colors">
              Cheat Sheet
            </Link>
            <Link href="/quiz" className="text-sm text-green-400 hover:text-green-300 transition-colors">
              Quiz
            </Link>
            {/* Search */}
            <div className="border-l border-slate-700 pl-4">
              <SearchButton />
            </div>
            {/* Methodology Lens Dropdown */}
            <div className="border-l border-slate-700 pl-4">
              <MethodologySelector />
            </div>
            {/* Domain Selector */}
            <div className="border-l border-slate-700 pl-4">
              <DomainSelector />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
