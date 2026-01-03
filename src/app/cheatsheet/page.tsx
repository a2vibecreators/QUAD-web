"use client";

import { useState, useMemo } from "react";
import PageNavigation from "@/components/PageNavigation";
import { QUAD_GLOSSARY, GLOSSARY_CATEGORIES } from "@/components/Tooltip";
import { useMethodology, METHODOLOGIES } from "@/context/MethodologyContext";

// Extended glossary with all QUAD concepts
const EXTENDED_GLOSSARY = {
  ...QUAD_GLOSSARY,
  // Add more terms
  "Flow Document": {
    term: "Flow Document",
    definition: "Living specification that travels with a feature. Contains requirements, design, tests, deployment info. Single source of truth.",
    category: "Artifact",
  },
  "Platonic Solids": {
    term: "Platonic Solids",
    definition: "Estimation system using geometric shapes: Tetrahedron(4), Cube(6), Octahedron(8), Dodecahedron(12), Icosahedron(20).",
    category: "Estimation",
  },
  "Monitor Agent": {
    term: "Monitor Agent",
    definition: "AI that watches production systems, detects anomalies, and alerts or auto-heals issues.",
    category: "AI Agent",
  },
  "Review Agent": {
    term: "Review Agent",
    definition: "AI that reviews code, checks for patterns, security issues, and suggests improvements.",
    category: "AI Agent",
  },
  "WIP Limit": {
    term: "WIP Limit",
    definition: "Work-In-Progress limit per Circle. Prevents overload. AI monitors and alerts when exceeded.",
    category: "Process",
  },
  "Phase": {
    term: "Phase",
    definition: "Major workflow stage: Plan, Develop, Test, Deploy, Monitor. Each phase has specialized agents.",
    category: "Process",
  },
  "Backlog": {
    term: "Backlog",
    definition: "Prioritized list of work items. Managed by Circle 1 (Management). AI assists with prioritization.",
    category: "Artifact",
  },
  "Sprint Velocity": {
    term: "Cycle Velocity",
    definition: "Average story points completed per Cycle. Used for planning. AI tracks and predicts trends.",
    category: "Process",
  },
};

// All glossary entries as array for easier filtering
const ALL_TERMS = Object.entries(EXTENDED_GLOSSARY).map(([key, entry]) => ({
  key,
  ...entry,
}));

export default function CheatSheetPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { methodology, methodologyInfo } = useMethodology();

  // Filter terms based on search and category
  const filteredTerms = useMemo(() => {
    return ALL_TERMS.filter((term) => {
      const matchesSearch =
        searchQuery === "" ||
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.key.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === null || term.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Group filtered terms by category
  const groupedTerms = useMemo(() => {
    const groups: Record<string, typeof filteredTerms> = {};
    for (const term of filteredTerms) {
      if (!groups[term.category]) {
        groups[term.category] = [];
      }
      groups[term.category].push(term);
    }
    return groups;
  }, [filteredTerms]);

  // Category colors
  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    "Adoption Level": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    "Circle": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    "Time Unit": { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
    "AI Agent": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
    "Estimation": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30" },
    "Core": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
    "Artifact": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    "Process": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
    "Principle": { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30" },
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <PageNavigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">QUAD Cheat Sheet</h1>
          <p className="text-slate-400">
            Quick reference for all QUAD terminology. Search or filter by category.
          </p>
          <div className="mt-2 text-sm text-slate-500">
            Currently viewing as: <span className={`font-medium`}>{methodologyInfo.icon} {methodologyInfo.name}</span>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search terms, definitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === null
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
              }`}
            >
              All ({ALL_TERMS.length})
            </button>
            {GLOSSARY_CATEGORIES.map((category) => {
              const count = ALL_TERMS.filter((t) => t.category === category).length;
              const colors = categoryColors[category] || { bg: "bg-slate-800", text: "text-slate-400", border: "border-slate-700" };
              const isSelected = selectedCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(isSelected ? null : category)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    isSelected
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : "bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-slate-500">
          Showing {filteredTerms.length} of {ALL_TERMS.length} terms
          {searchQuery && ` matching "${searchQuery}"`}
          {selectedCategory && ` in ${selectedCategory}`}
        </div>

        {/* Terms Grid */}
        {Object.keys(groupedTerms).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-slate-400">No terms found matching your search.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
              }}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTerms).map(([category, terms]) => {
              const colors = categoryColors[category] || { bg: "bg-slate-800", text: "text-slate-400", border: "border-slate-700" };

              return (
                <div key={category}>
                  {/* Category Header */}
                  <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${colors.border}`}>
                    <div className={`w-2 h-2 rounded-full ${colors.bg.replace("/10", "")}`}></div>
                    <h2 className={`font-semibold ${colors.text}`}>{category}</h2>
                    <span className="text-xs text-slate-500">({terms.length})</span>
                  </div>

                  {/* Terms Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {terms.map((term) => (
                      <div
                        key={term.key}
                        className={`p-4 rounded-xl border ${colors.border} ${colors.bg} hover:bg-opacity-20 transition-all`}
                      >
                        <h3 className="font-semibold text-white mb-1">{term.term}</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {term.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-12 text-center text-xs text-slate-600">
          <span className="bg-slate-800 px-2 py-1 rounded">Ctrl/Cmd + F</span> to search browser •
          <span className="bg-slate-800 px-2 py-1 rounded ml-2">Esc</span> to clear search
        </div>
      </div>
    </div>
  );
}
