"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import SearchModal from "./SearchModal";

// Context for search state
interface SearchContextType {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return context;
}

// Provider component - wrap around app
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => setIsOpen(false), []);

  // Handle Cmd/Ctrl + K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SearchContext.Provider value={{ isOpen, openSearch, closeSearch }}>
      {children}
      {/* Modal rendered at root level for proper z-index */}
      <SearchModal isOpen={isOpen} onClose={closeSearch} />
    </SearchContext.Provider>
  );
}

// Search trigger button component
export function SearchButton() {
  const { openSearch } = useSearch();
  const [isMac, setIsMac] = useState(true); // Default to Mac for SSR

  // Detect OS on client
  useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes("mac"));
  }, []);

  const shortcut = isMac ? "⌘K" : "Ctrl+K";

  return (
    <button
      onClick={openSearch}
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-all"
      title={`Search (${shortcut})`}
    >
      <span>🔍</span>
      <span className="text-sm hidden lg:inline">Search...</span>
      <kbd className="hidden lg:inline text-xs px-1.5 py-0.5 bg-slate-700 rounded">{shortcut}</kbd>
    </button>
  );
}
