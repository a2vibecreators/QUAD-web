"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Member {
  id: string;
  user_id: string;
  role: string | null;
  allocation_pct: number | null;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    adoption_matrix?: {
      skill_level: number | null;
      trust_level: number | null;
    } | null;
  };
}

interface Circle {
  id: string;
  circle_number: number;
  circle_name: string;
  description: string | null;
  lead_user_id: string | null;
  is_active: boolean;
  domain?: {
    id: string;
    name: string;
  };
  lead?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  members: Member[];
  _count?: {
    members: number;
  };
}

const circleColors: Record<number, { bg: string; border: string; text: string; icon: string }> = {
  1: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m12 5.197v-1a6 6 0 00-6-6" },
  2: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  3: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  4: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" },
};

const defaultCircleDescriptions: Record<number, string> = {
  1: "Management Circle: Product owners, scrum masters, project managers who own the Q (Question) and A (Allocate) stages.",
  2: "Development Circle: Engineers, developers, architects who own the U (Understand) and D (Deliver) stages.",
  3: "QA Circle: Testers, quality engineers who support the D (Deliver) stage with validation.",
  4: "Infrastructure Circle: DevOps, SRE, platform engineers who support deployment and operations.",
};

export default function CirclesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Fetch domains
  const fetchDomains = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch("/api/domains/list", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
        if (data.domains?.length > 0 && !selectedDomain) {
          setSelectedDomain(data.domains[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching domains:", err);
    }
  }, [session?.accessToken, selectedDomain]);

  // Fetch circles from API
  const fetchCircles = useCallback(async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const url = selectedDomain
        ? `/api/circles?domain_id=${selectedDomain}`
        : "/api/circles";

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCircles(data.circles || []);
      } else if (res.status === 401) {
        router.push("/auth/login");
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to fetch circles");
      }
    } catch (err) {
      console.error("Error fetching circles:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, selectedDomain, router]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchDomains();
    }
  }, [session?.accessToken, fetchDomains]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchCircles();
    }
  }, [session?.accessToken, selectedDomain, fetchCircles]);

  const getTotalAllocation = (circle: Circle) => {
    return circle.members.reduce((sum, m) => sum + (m.allocation_pct || 0), 0);
  };

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect handled in useEffect, but show nothing while redirecting
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Circles</h1>
                <p className="text-sm text-gray-500">Organize your team into 4 specialized circles</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Domains</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <Link href="/flows" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                </svg>
                View Flow Board
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={fetchCircles} className="ml-4 text-red-600 underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Circle Overview */}
      {!loading && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Empty State */}
          {circles.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No circles found</h3>
              <p className="text-gray-500 mb-4">
                {selectedDomain ? "No circles in this domain yet." : "Select a domain to view circles."}
              </p>
            </div>
          )}

          {/* Circle Cards Grid */}
          {circles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {circles.map((circle) => {
                const colors = circleColors[circle.circle_number] || circleColors[1];
                return (
                  <div
                    key={circle.id}
                    className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer`}
                    onClick={() => setSelectedCircle(circle)}
                  >
                    {/* Circle Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${colors.text} bg-white flex items-center justify-center`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={colors.icon} />
                          </svg>
                        </div>
                        <div>
                          <h2 className={`text-xl font-bold ${colors.text}`}>
                            Circle {circle.circle_number}: {circle.circle_name}
                          </h2>
                          {circle.lead && (
                            <p className="text-sm text-gray-600">
                              Led by {circle.lead.full_name || circle.lead.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`${colors.text} bg-white px-3 py-1 rounded-full text-sm font-medium`}>
                        {circle.members?.length || circle._count?.members || 0} members
                      </span>
                    </div>

                    {/* Domain Badge */}
                    {circle.domain && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                          {circle.domain.name}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {circle.description || defaultCircleDescriptions[circle.circle_number]}
                    </p>

                    {/* Member Avatars */}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {(circle.members || []).slice(0, 5).map((member) => (
                          <div
                            key={member.id}
                            className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700"
                            title={member.user.full_name || member.user.email}
                          >
                            {member.user.full_name?.[0] || member.user.email[0].toUpperCase()}
                          </div>
                        ))}
                        {(circle.members?.length || 0) > 5 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                            +{circle.members.length - 5}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getTotalAllocation(circle)}% capacity
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* QUAD Stage Mapping */}
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Circle-Stage Responsibilities</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { stage: "Q", name: "Question", primary: "Management", support: "Development" },
                { stage: "U", name: "Understand", primary: "Development", support: "Management" },
                { stage: "A", name: "Allocate", primary: "Management", support: "Development" },
                { stage: "D", name: "Deliver", primary: "Development", support: "QA, Infrastructure" },
              ].map((mapping) => (
                <div key={mapping.stage} className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{mapping.stage}</div>
                  <div className="text-sm font-medium text-gray-700 mb-2">{mapping.name}</div>
                  <div className="text-xs text-gray-500">
                    <div><span className="font-medium">Primary:</span> {mapping.primary}</div>
                    <div><span className="font-medium">Support:</span> {mapping.support}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Circle Detail Modal */}
      {selectedCircle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`${circleColors[selectedCircle.circle_number]?.bg || "bg-gray-50"} p-6 rounded-t-xl`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold ${circleColors[selectedCircle.circle_number]?.text || "text-gray-700"}`}>
                  Circle {selectedCircle.circle_number}: {selectedCircle.circle_name}
                </h2>
                <button
                  onClick={() => setSelectedCircle(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 text-sm mt-2">
                {selectedCircle.description || defaultCircleDescriptions[selectedCircle.circle_number]}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Lead */}
              {selectedCircle.lead && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Circle Lead</h3>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {selectedCircle.lead.full_name?.[0] || selectedCircle.lead.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{selectedCircle.lead.full_name}</div>
                      <div className="text-sm text-gray-500">{selectedCircle.lead.email}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-500">Members ({selectedCircle.members?.length || 0})</h3>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Member
                  </button>
                </div>
                <div className="space-y-2">
                  {(selectedCircle.members || []).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                          {member.user.full_name?.[0] || member.user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{member.user.full_name || member.user.email}</div>
                          <div className="text-xs text-gray-500">{member.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {member.user.adoption_matrix && (
                          <span className="text-xs text-gray-400">
                            S{member.user.adoption_matrix.skill_level}/T{member.user.adoption_matrix.trust_level}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">{member.allocation_pct}%</span>
                        <button className="text-gray-400 hover:text-red-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!selectedCircle.members || selectedCircle.members.length === 0) && (
                    <p className="text-gray-400 text-center py-4">No members in this circle yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setSelectedCircle(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
