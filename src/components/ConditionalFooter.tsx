"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Conditional Footer Component
 *
 * Hides the main QUAD footer when on Customer pages
 * since they have their own footer in the Customer layout.
 */
export default function ConditionalFooter() {
  const pathname = usePathname();
  const [isCustomerSubdomain, setIsCustomerSubdomain] = useState(false);

  useEffect(() => {
    // Check if we're on a customer subdomain (customer.quadframe.work)
    const hostname = window.location.hostname;
    setIsCustomerSubdomain(hostname.startsWith("customer"));
  }, []);

  // Hide main footer on Customer pages OR Customer subdomain
  if (pathname.startsWith("/customer") || isCustomerSubdomain) {
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
