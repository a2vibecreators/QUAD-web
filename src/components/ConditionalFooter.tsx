"use client";

import { usePathname } from "next/navigation";

/**
 * Conditional Footer Component
 *
 * Hides the main QUAD footer when on MassMutual pages
 * since they have their own footer in the MassMutual layout.
 */
export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide main footer on MassMutual pages - they have their own footer
  if (pathname.startsWith("/massmutual")) {
    return null;
  }

  return (
    <footer className="border-t border-slate-800 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black gradient-text">QUAD</span>
            <span className="text-xs text-slate-600">Circle of Functions</span>
          </div>
          <p className="text-sm text-slate-600">
            © 2025-2026 QUADFRAMEWORK LLC | First Published: December 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
