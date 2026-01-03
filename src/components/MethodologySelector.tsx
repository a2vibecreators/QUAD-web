"use client";

import { useState, useRef, useEffect } from "react";
import { useMethodology, METHODOLOGIES, MethodologyType } from "@/context/MethodologyContext";

export default function MethodologySelector() {
  const { methodology, setMethodology, methodologyInfo } = useMethodology();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Color classes for each methodology
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30" },
  };

  const currentColors = colorClasses[methodologyInfo.color] || colorClasses.emerald;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
          isOpen
            ? `${currentColors.bg} ${currentColors.border} ${currentColors.text}`
            : "border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white"
        }`}
        title="Select your methodology background to see QUAD through familiar terms"
      >
        <span className="text-sm">
          {methodologyInfo.icon}
        </span>
        <span className="text-xs font-medium hidden lg:inline">
          I know {methodologyInfo.name}
        </span>
        <span className="text-xs hidden sm:inline lg:hidden">
          {methodologyInfo.icon} Lens
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-[100]">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-700">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Methodology Lens</div>
            <div className="text-sm text-white mt-0.5">Learn QUAD from your background</div>
          </div>

          {/* Options */}
          <div className="py-2 max-h-80 overflow-y-auto">
            {METHODOLOGIES.map((m) => {
              const isSelected = methodology === m.id;
              const colors = colorClasses[m.color] || colorClasses.emerald;

              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMethodology(m.id as MethodologyType);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-all ${
                    isSelected
                      ? `${colors.bg} ${colors.text}`
                      : "hover:bg-slate-700/50 text-slate-300"
                  }`}
                >
                  <span className="text-lg mt-0.5">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isSelected ? colors.text : "text-white"}`}>
                      {m.name}
                      {isSelected && <span className="ml-2 text-xs opacity-70">(Active)</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {m.description}
                    </div>
                  </div>
                  {isSelected && (
                    <span className={`text-sm ${colors.text}`}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 bg-slate-700/30 border-t border-slate-700">
            <div className="text-xs text-slate-500">
              Content will show QUAD terms alongside equivalent {methodologyInfo.name} terms
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
