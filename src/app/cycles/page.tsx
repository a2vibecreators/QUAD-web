"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// In QUAD terminology, a "Sprint" is called a "Cycle" (Q-U-A-D cycle)
interface Cycle {
  id: string;
  cycle_number: number;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: string;
  velocity: number | null;
  capacity: number | null;
  domain?: {
    id: string;
    name: string;
    ticket_prefix: string | null;
  };
  milestone?: {
    id: string;
    title: string;
  } | null;
  tickets?: Array<{
    id: string;
    ticket_number: string;
    title: string;
    status: string;
    story_points: number | null;
  }>;
  metrics?: {
    total_tickets: number;
    total_points: number;
    completed_points: number;
    completion_percentage: number;
    tickets_by_status: Record<string, number>;
  };
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  planned: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  active: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  completed: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
};

export default function CyclesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [newCycleData, setNewCycleData] = useState({
    name: "",
    goal: "",
    start_date: "",
    end_date: "",
    capacity: 0,
  });

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

  // Fetch cycles
  const fetchCycles = useCallback(async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      let url = "/api/cycles";
      if (selectedDomain) url += `?domain_id=${selectedDomain}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCycles(data.cycles || []);
        setActiveCycle(data.active_cycle || null);
      } else if (res.status === 401) {
        router.push("/auth/login");
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to fetch cycles");
      }
    } catch (err) {
      console.error("Error fetching cycles:", err);
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
      fetchCycles();
    }
  }, [session?.accessToken, selectedDomain, fetchCycles]);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.accessToken || !selectedDomain) {
      alert("Please select a domain first");
      return;
    }

    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          domain_id: selectedDomain,
          name: newCycleData.name,
          goal: newCycleData.goal || null,
          start_date: newCycleData.start_date,
          end_date: newCycleData.end_date,
          capacity: newCycleData.capacity || null,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewCycleData({ name: "", goal: "", start_date: "", end_date: "", capacity: 0 });
        fetchCycles();
      } else {
        const errData = await res.json();
        alert(`Failed to create cycle: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error creating cycle:", err);
      alert("Network error. Please try again.");
    }
  };

  const handleCycleAction = async (cycleId: string, action: "start" | "complete" | "cancel") => {
    if (!session?.accessToken) return;

    const statusMap = {
      start: "active",
      complete: "completed",
      cancel: "cancelled",
    };

    try {
      const res = await fetch(`/api/cycles/${cycleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ status: statusMap[action] }),
      });

      if (res.ok) {
        fetchCycles();
      } else {
        const errData = await res.json();
        alert(`Failed to ${action} cycle: ${errData.error}`);
      }
    } catch (err) {
      console.error(`Error ${action}ing cycle:`, err);
      alert("Network error. Please try again.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">🔄 Cycle Management</h1>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Domains</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!selectedDomain}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Cycle
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={fetchCycles} className="ml-4 text-red-600 underline">Retry</button>
        </div>
      )}

      {/* Active Cycle Banner */}
      {activeCycle && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                🔄 ACTIVE CYCLE
              </span>
              <div>
                <span className="font-semibold text-green-800">
                  Cycle {activeCycle.cycle_number}: {activeCycle.name}
                </span>
                <span className="text-green-600 ml-2">
                  ({calculateDaysRemaining(activeCycle.end_date)} days remaining)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {activeCycle.metrics && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-700">
                    {activeCycle.metrics.completion_percentage}% complete
                  </span>
                  <div className="w-24 h-2 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{ width: `${activeCycle.metrics.completion_percentage}%` }}
                    />
                  </div>
                </div>
              )}
              <Link
                href={`/tickets?cycle_id=${activeCycle.id}`}
                className="text-green-700 hover:text-green-800 text-sm font-medium"
              >
                View Board →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Cycle Cards */}
      {!loading && (
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cycles.map((cycle) => (
              <div
                key={cycle.id}
                className={`bg-white rounded-xl shadow-sm border-2 ${
                  cycle.status === "active" ? "border-green-300" : "border-gray-200"
                } overflow-hidden hover:shadow-md transition-shadow`}
              >
                {/* Cycle Header */}
                <div className={`p-4 ${cycle.status === "active" ? "bg-green-50" : "bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Cycle {cycle.cycle_number}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      statusColors[cycle.status]?.bg
                    } ${statusColors[cycle.status]?.text}`}>
                      {cycle.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900">{cycle.name}</h3>
                  {cycle.goal && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{cycle.goal}</p>
                  )}
                </div>

                {/* Cycle Body */}
                <div className="p-4">
                  {/* Dates */}
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
                  </div>

                  {/* Progress */}
                  {cycle.metrics && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">
                          {cycle.metrics.completed_points} / {cycle.metrics.total_points} pts
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${cycle.status === "completed" ? "bg-blue-500" : "bg-green-500"}`}
                          style={{ width: `${cycle.metrics.completion_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Flow Stats */}
                  {cycle.metrics?.tickets_by_status && (
                    <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4">
                      <div className="bg-gray-100 rounded p-2">
                        <div className="font-bold text-gray-700">{cycle.metrics.tickets_by_status.todo || 0}</div>
                        <div className="text-gray-500">To Do</div>
                      </div>
                      <div className="bg-yellow-100 rounded p-2">
                        <div className="font-bold text-yellow-700">{cycle.metrics.tickets_by_status.in_progress || 0}</div>
                        <div className="text-yellow-600">WIP</div>
                      </div>
                      <div className="bg-purple-100 rounded p-2">
                        <div className="font-bold text-purple-700">{cycle.metrics.tickets_by_status.in_review || 0}</div>
                        <div className="text-purple-600">Review</div>
                      </div>
                      <div className="bg-green-100 rounded p-2">
                        <div className="font-bold text-green-700">{cycle.metrics.tickets_by_status.done || 0}</div>
                        <div className="text-green-600">Done</div>
                      </div>
                    </div>
                  )}

                  {/* Velocity (for completed cycles) */}
                  {cycle.status === "completed" && cycle.velocity !== null && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="text-sm text-blue-700">
                        <span className="font-medium">Velocity:</span> {cycle.velocity} story points
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {cycle.status === "planned" && (
                      <button
                        onClick={() => handleCycleAction(cycle.id, "start")}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Start Cycle
                      </button>
                    )}
                    {cycle.status === "active" && (
                      <>
                        <Link
                          href={`/tickets?cycle_id=${cycle.id}&domain_id=${cycle.domain?.id}`}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium text-center"
                        >
                          View Board
                        </Link>
                        <button
                          onClick={() => handleCycleAction(cycle.id, "complete")}
                          className="py-2 px-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          Complete
                        </button>
                      </>
                    )}
                    {cycle.status === "completed" && (
                      <Link
                        href={`/tickets?cycle_id=${cycle.id}`}
                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium text-center"
                      >
                        View History
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {cycles.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cycles yet</h3>
                <p className="text-gray-500 mb-4">Create your first cycle to start tracking work</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={!selectedDomain}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Cycle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Cycle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create New Cycle</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateCycle}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Name</label>
                <input
                  type="text"
                  placeholder="e.g., Authentication MVP"
                  value={newCycleData.name}
                  onChange={(e) => setNewCycleData({ ...newCycleData, name: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Goal</label>
                <textarea
                  placeholder="What do we want to achieve in this cycle?"
                  rows={2}
                  value={newCycleData.goal}
                  onChange={(e) => setNewCycleData({ ...newCycleData, goal: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newCycleData.start_date}
                    onChange={(e) => setNewCycleData({ ...newCycleData, start_date: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newCycleData.end_date}
                    onChange={(e) => setNewCycleData({ ...newCycleData, end_date: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (Story Points)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Team velocity / capacity"
                  value={newCycleData.capacity || ""}
                  onChange={(e) => setNewCycleData({ ...newCycleData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCycleData.name.trim() || !newCycleData.start_date || !newCycleData.end_date || !selectedDomain}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
