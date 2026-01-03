"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QUAD_GLOSSARY } from "./Tooltip";

interface SearchResult {
  type: "page" | "term";
  title: string;
  description: string;
  href: string;
  category?: string;
  icon?: string;
}

// All pages in the site
const PAGES: SearchResult[] = [
  { type: "page", title: "Home", description: "QUAD Framework homepage", href: "/", icon: "◇" },
  { type: "page", title: "Discovery Assessment", description: "Evaluate if QUAD is right for your team", href: "/discovery", icon: "🔍" },
  { type: "page", title: "Value Proposition", description: "Why choose QUAD over traditional methodologies", href: "/pitch", icon: "💰" },
  { type: "page", title: "Source of Truth Flow", description: "Animated visualization of requirement flow", href: "/flow", icon: "🔄" },
  { type: "page", title: "Main Concept", description: "Complete QUAD methodology overview", href: "/concept", icon: "💡" },
  { type: "page", title: "Agent Architecture", description: "QACA - Agent communication patterns", href: "/architecture", icon: "🏗️" },
  { type: "page", title: "Technical Details", description: "Deep-dive into QUAD implementation", href: "/details", icon: "📋" },
  { type: "page", title: "Terminology", description: "QUAD jargon and vocabulary", href: "/jargons", icon: "📖" },
  { type: "page", title: "Executive Summary", description: "High-level overview for leadership", href: "/summary", icon: "📝" },
  { type: "page", title: "Case Study", description: "Agile vs QUAD comparison", href: "/case-study", icon: "🧮" },
  { type: "page", title: "Dashboard Demo", description: "Interactive QUAD dashboard", href: "/demo", icon: "🌐" },
  { type: "page", title: "Configure QUAD", description: "Configuration wizard", href: "/configure", icon: "⚙️" },
  { type: "page", title: "QUAD Platform", description: "Platform product overview", href: "/platform", icon: "🏢" },
  { type: "page", title: "QUAD Quiz", description: "Test your QUAD knowledge", href: "/quiz", icon: "🎯" },
  { type: "page", title: "Cheat Sheet", description: "Searchable terminology reference", href: "/cheatsheet", icon: "📄" },
  { type: "page", title: "Onboarding", description: "Getting started checklist", href: "/onboarding", icon: "🎯" },
  { type: "page", title: "Documentation", description: "Complete QUAD documentation", href: "/docs", icon: "📚" },
  { type: "page", title: "Enterprise Pitch", description: "Enterprise sales materials", href: "/mm-pitch", icon: "🏢" },
];

// Convert glossary to search results
const TERMS: SearchResult[] = Object.entries(QUAD_GLOSSARY).map(([key, entry]) => ({
  type: "term" as const,
  title: entry.term,
  description: entry.definition,
  href: `/cheatsheet?q=${encodeURIComponent(key)}`,
  category: entry.category,
}));

// All searchable items
const ALL_ITEMS = [...PAGES, ...TERMS];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Filter results based on query
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show featured pages when no query
      return PAGES.slice(0, 6);
    }

    const lowerQuery = query.toLowerCase();
    return ALL_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        (item.category && item.category.toLowerCase().includes(lowerQuery))
    ).slice(0, 10);
  }, [query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            router.push(results[selectedIndex].href);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, results, selectedIndex, router, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset query when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <span className="text-slate-500">🔍</span>
          <input
            type="text"
            placeholder="Search pages and terms..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div>
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.title}`}
                  onClick={() => {
                    router.push(result.href);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                    index === selectedIndex
                      ? "bg-blue-500/20"
                      : "hover:bg-slate-700/50"
                  }`}
                >
                  <span className="text-lg mt-0.5">
                    {result.type === "page" ? result.icon : "📝"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{result.title}</span>
                      {result.type === "term" && (
                        <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                          {result.category}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 truncate">
                      {result.description}
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <span className="text-xs text-slate-500 mt-1">↵</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded ml-1">↓</kbd>
              <span className="ml-1">to navigate</span>
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↵</kbd>
              <span className="ml-1">to select</span>
            </span>
          </div>
          <a href="/cheatsheet" className="text-blue-400 hover:text-blue-300">
            View all terms →
          </a>
        </div>
      </div>
    </div>
  );
}
