"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useVersion, VERSIONS } from "@/context/VersionContext";

export default function VersionBadge() {
  const { versionInfo, allVersions } = useVersion();
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

  return (
    <div ref={dropdownRef} className="relative">
      {/* Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
          isOpen
            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600"
        }`}
        title="QUAD Framework Version"
      >
        <span className="text-blue-400">v{versionInfo.displayVersion}</span>
        {versionInfo.isLatest && (
          <span className="px-1 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded">
            Latest
          </span>
        )}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-700">
            <div className="text-xs text-slate-400 uppercase tracking-wide">QUAD Framework</div>
            <div className="text-sm text-white mt-0.5">Version History</div>
          </div>

          {/* Versions List */}
          <div className="py-2">
            {allVersions.map((v) => (
              <div
                key={v.version}
                className={`px-4 py-3 ${
                  v.version === versionInfo.version
                    ? "bg-blue-500/10 border-l-2 border-blue-500"
                    : "hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">v{v.displayVersion}</span>
                    {v.isLatest && (
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded">
                        Latest
                      </span>
                    )}
                    {v.version === versionInfo.version && (
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{v.releaseDate}</span>
                </div>
                {v.changelog && v.changelog.length > 0 && (
                  <ul className="text-xs text-slate-400 mt-2 space-y-1">
                    {v.changelog.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-slate-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                    {v.changelog.length > 3 && (
                      <li className="text-slate-500 italic">
                        +{v.changelog.length - 3} more changes
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-700/30 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                First published: December 2025
              </span>
              <Link
                href="/docs#changelog"
                className="text-blue-400 hover:text-blue-300"
                onClick={() => setIsOpen(false)}
              >
                Full changelog →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
