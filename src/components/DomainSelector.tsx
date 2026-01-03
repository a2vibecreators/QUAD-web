"use client";

import { useState, useRef, useEffect } from "react";
import { useDomain, domainConfigs, DomainType } from "@/contexts/DomainContext";

export default function DomainSelector() {
  const { domain, setDomain, config } = useDomain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const domains = Object.values(domainConfigs);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Selection Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm transition-all"
      >
        <span>{config.icon}</span>
        <span className="hidden sm:inline text-slate-300">{config.name}</span>
        <span className="text-slate-500 text-xs">▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-[100] overflow-hidden">
          <div className="p-2 border-b border-slate-700">
            <div className="text-xs text-slate-500 px-2">Select your industry</div>
          </div>
          <div className="p-1">
            {domains.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDomain(d.id as DomainType);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  domain === d.id
                    ? "bg-blue-600/20 text-blue-300"
                    : "hover:bg-slate-700 text-slate-300"
                }`}
              >
                <span className="text-xl">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{d.name}</div>
                  <div className="text-xs text-slate-500 truncate">{d.description}</div>
                </div>
                {domain === d.id && (
                  <span className="text-blue-400">✓</span>
                )}
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-slate-700 bg-slate-900/50">
            <div className="text-xs text-slate-500 px-2">
              Content adapts to your selected industry
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
