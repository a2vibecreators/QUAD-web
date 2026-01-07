"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CustomerHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/customer", label: "Overview" },
    { href: "/customer/pitch", label: "Pitch" },
    { href: "/customer/demo", label: "Demo" },
    { href: "/customer/roi", label: "ROI" },
    { href: "/customer/features", label: "Features" },
    { href: "/customer/about", label: "About Us" },
  ];

  const isActive = (href: string) => {
    if (href === "/customer") {
      return pathname === "/customer";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logos - Stay in Customer context */}
          <div className="flex items-center gap-4">
            <Link href="/customer" className="flex items-center gap-2">
              <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                QUAD
              </span>
              <span className="text-xs text-slate-500">Platform</span>
            </Link>
            <span className="text-slate-600">×</span>
            <span className="text-lg font-semibold text-blue-400">Customer</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  isActive(link.href)
                    ? "text-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/customer/contact"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all"
            >
              Contact
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/98 border-t border-slate-700/50">
          <nav className="px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive(link.href)
                    ? "bg-slate-800 text-white font-medium"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/customer/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg text-center transition-all"
            >
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
