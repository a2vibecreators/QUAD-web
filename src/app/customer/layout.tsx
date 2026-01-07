import type { Metadata } from "next";
import CustomerHeader from "@/components/CustomerHeader";

export const metadata: Metadata = {
  title: "QUAD Platform - Customer Demo",
  description: "AI-powered development platform for enterprise teams. Transform your SDLC with 80% faster delivery.",
  openGraph: {
    title: "QUAD Platform - Customer Demo",
    description: "AI-powered development platform for enterprise teams",
    url: "https://customer.quadframe.work",
    siteName: "QUAD Platform",
    type: "website",
  },
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Customer + QUAD Co-branded Header */}
      <CustomerHeader />

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
              <span className="text-blue-400 font-semibold">Customer Demo</span>
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
