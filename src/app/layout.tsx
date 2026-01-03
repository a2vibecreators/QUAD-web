import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { MethodologyProvider } from "@/context/MethodologyContext";
import MethodologySelector from "@/components/MethodologySelector";
import { SearchProvider, SearchButton } from "@/components/SearchProvider";
import SessionProvider from "@/components/SessionProvider";
import { DomainProvider } from "@/contexts/DomainContext";
import DomainSelector from "@/components/DomainSelector";

export const metadata: Metadata = {
  title: "QUAD Framework - Circle of Functions",
  description: "Quick Unified Agentic Development - A modern software development methodology for the AI era",
  keywords: ["QUAD", "software development", "methodology", "AI", "agile alternative", "documentation-first"],
  authors: [{ name: "Suman Addanki", url: "mailto:suman.addanki@gmail.com" }],
  openGraph: {
    title: "QUAD Framework",
    description: "Quick Unified Agentic Development - A modern software development methodology for the AI era",
    url: "https://quadframe.work",
    siteName: "QUAD Framework",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-900">
        <SessionProvider>
        <DomainProvider>
        <SearchProvider>
        <MethodologyProvider>
          {/* Navigation */}
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

          {/* Main content with padding for fixed nav */}
          <main className="pt-16">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800 py-8 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black gradient-text">QUAD</span>
                  <span className="text-xs text-slate-600">Circle of Functions</span>
                </div>
                <p className="text-sm text-slate-600">
                  A methodology by{" "}
                  <a href="mailto:suman.addanki@gmail.com" className="text-blue-400 hover:text-blue-300">
                    Suman Addanki
                  </a>
                  {" "}| First Published: December 2025
                </p>
              </div>
            </div>
          </footer>
        </MethodologyProvider>
        </SearchProvider>
        </DomainProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
