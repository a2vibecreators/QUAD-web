import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "QUAD Platform - MassMutual Partnership",
  description: "AI-powered development platform for enterprise teams. Transform your SDLC with 80% faster delivery.",
  openGraph: {
    title: "QUAD Platform - MassMutual Partnership",
    description: "AI-powered development platform for enterprise teams",
    url: "https://massmutual.quadframe.work",
    siteName: "QUAD Platform",
    type: "website",
  },
};

export default function MassMutualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* MassMutual + QUAD Co-branded Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logos - Stay in MassMutual context */}
            <div className="flex items-center gap-4">
              <Link href="/massmutual" className="flex items-center gap-2">
                <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  QUAD
                </span>
                <span className="text-xs text-slate-500">Platform</span>
              </Link>
              <span className="text-slate-600">×</span>
              <span className="text-lg font-semibold text-blue-400">MassMutual</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/massmutual"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/massmutual/pitch"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Pitch Deck
              </Link>
              <Link
                href="/massmutual/demo"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Live Demo
              </Link>
              <Link
                href="/massmutual/roi"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ROI Calculator
              </Link>
              <Link
                href="/massmutual/contact"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all"
              >
                Schedule Demo
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                QUAD
              </span>
              <span className="text-slate-600">×</span>
              <span className="text-blue-400 font-semibold">MassMutual Partnership</span>
            </div>
            <p className="text-sm text-slate-600">
              © 2025-2026 QUADFRAMEWORK LLC | Confidential
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
