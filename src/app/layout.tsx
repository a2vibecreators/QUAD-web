import type { Metadata } from "next";
import "./globals.css";
import { MethodologyProvider } from "@/context/MethodologyContext";
import { SearchProvider } from "@/components/SearchProvider";
import SessionProvider from "@/components/SessionProvider";
import { DomainProvider } from "@/contexts/DomainContext";
import { ZoomProvider } from "@/context/ZoomContext";
import ConditionalNav from "@/components/ConditionalNav";
import ConditionalFooter from "@/components/ConditionalFooter";
import ZoomHeader from "@/components/ZoomHeader";

export const metadata: Metadata = {
  title: "QUAD Framework - Circle of Functions",
  description: "Quick Unified Agentic Development - A modern software development methodology for the AI era",
  keywords: ["QUAD", "software development", "methodology", "AI", "agile alternative", "documentation-first"],
  authors: [{ name: "QUADFRAMEWORK LLC", url: "https://quadframe.work" }],
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
        <ZoomProvider>
          {/* Conditional Navigation - Hidden for MassMutual pages */}
          <ConditionalNav />

          {/* Zoom Call Header - Visible on all pages */}
          <ZoomHeader />

          {/* Main content with padding for fixed nav */}
          <main className="pt-16">
            {children}
          </main>

          {/* Conditional Footer - Hidden for MassMutual pages */}
          <ConditionalFooter />
        </ZoomProvider>
        </MethodologyProvider>
        </SearchProvider>
        </DomainProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
