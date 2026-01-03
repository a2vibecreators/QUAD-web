"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Flow {
  id: string;
  title: string;
  description: string | null;
  quad_stage: "Q" | "U" | "A" | "D";
  stage_status: string | null;
  priority: string | null;
  assigned_to: string | null;
  assignee?: {
    full_name: string | null;
    email: string;
  };
  domain?: {
    id: string;
    name: string;
  };
  flow_type: string | null;
  created_at: string;
}

interface Stage {
  key: "Q" | "U" | "A" | "D";
  name: string;
  fullName: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const stages: Stage[] = [
  {
    key: "Q",
    name: "Question",
    fullName: "Question",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  {
    key: "U",
    name: "Understand",
    fullName: "Understand",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  },
  {
    key: "A",
    name: "Allocate",
    fullName: "Allocate",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  },
  {
    key: "D",
    name: "Deliver",
    fullName: "Deliver",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
];

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function FlowsBoard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<"Q" | "U" | "A" | "D" | null>(null);
  const [draggedFlow, setDraggedFlow] = useState<Flow | null>(null);
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [newFlowData, setNewFlowData] = useState({
    title: "",
    description: "",
    priority: "medium",
    flow_type: "feature",
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

  // Fetch flows from API
  const fetchFlows = useCallback(async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const url = selectedDomain
        ? `/api/flows?domain_id=${selectedDomain}`
        : "/api/flows";

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFlows(data.flows || []);
      } else if (res.status === 401) {
        router.push("/auth/login");
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to fetch flows");
      }
    } catch (err) {
      console.error("Error fetching flows:", err);
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
      fetchFlows();
    }
  }, [session?.accessToken, selectedDomain, fetchFlows]);

  const getFlowsByStage = (stage: "Q" | "U" | "A" | "D") => {
    return flows.filter((flow) => flow.quad_stage === stage);
  };

  const handleDragStart = (flow: Flow) => {
    setDraggedFlow(flow);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: "Q" | "U" | "A" | "D") => {
    if (!draggedFlow || draggedFlow.quad_stage === stage || !session?.accessToken) {
      setDraggedFlow(null);
      return;
    }

    // Optimistic update
    setFlows((prev) =>
      prev.map((f) =>
        f.id === draggedFlow.id ? { ...f, quad_stage: stage, stage_status: "pending" } : f
      )
    );

    try {
      const res = await fetch(`/api/flows/${draggedFlow.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          quad_stage: stage,
          stage_status: "pending",
        }),
      });

      if (!res.ok) {
        // Revert on failure
        fetchFlows();
        const errData = await res.json();
        alert(`Failed to move flow: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error updating flow:", err);
      fetchFlows();
      alert("Network error. Please try again.");
    }

    setDraggedFlow(null);
  };

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.accessToken || !selectedDomain) {
      alert("Please select a domain first");
      return;
    }

    try {
      const res = await fetch("/api/flows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          domain_id: selectedDomain,
          title: newFlowData.title,
          description: newFlowData.description || null,
          priority: newFlowData.priority,
          flow_type: newFlowData.flow_type,
          quad_stage: selectedStage || "Q",
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewFlowData({ title: "", description: "", priority: "medium", flow_type: "feature" });
        setSelectedStage(null);
        fetchFlows();
      } else {
        const errData = await res.json();
        alert(`Failed to create flow: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error creating flow:", err);
      alert("Network error. Please try again.");
    }
  };

  const getStageCount = (stage: "Q" | "U" | "A" | "D") => {
    return flows.filter((f) => f.quad_stage === stage).length;
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">QUAD Flow Board</h1>
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
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!selectedDomain}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Flow
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={fetchFlows} className="ml-4 text-red-600 underline">
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

      {/* Stage Explanation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-full mx-auto flex items-center gap-6 text-sm">
          <span className="text-gray-500">Q-U-A-D Stages:</span>
          {stages.map((stage) => (
            <div key={stage.key} className="flex items-center gap-2">
              <span className={`font-bold ${stage.color}`}>{stage.key}</span>
              <span className="text-gray-600">{stage.fullName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-4 min-h-[calc(100vh-180px)]">
          {stages.map((stage) => (
            <div
              key={stage.key}
              className={`${stage.bgColor} ${stage.borderColor} border-2 rounded-xl p-4`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.key)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${stage.color}`}>{stage.key}</span>
                  <span className={`font-semibold ${stage.color}`}>{stage.name}</span>
                </div>
                <span className={`${stage.color} bg-white px-2 py-1 rounded-full text-sm font-medium`}>
                  {getStageCount(stage.key)}
                </span>
              </div>

              {/* Flow Cards */}
              <div className="space-y-3">
                {getFlowsByStage(stage.key).map((flow) => (
                  <div
                    key={flow.id}
                    draggable
                    onDragStart={() => handleDragStart(flow)}
                    className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow ${
                      draggedFlow?.id === flow.id ? "opacity-50" : ""
                    }`}
                  >
                    {/* Priority Badge */}
                    {flow.priority && (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${
                          priorityColors[flow.priority] || priorityColors.medium
                        }`}
                      >
                        {flow.priority.toUpperCase()}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className="font-medium text-gray-900 mb-1">{flow.title}</h3>

                    {/* Description */}
                    {flow.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{flow.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      {/* Type Badge */}
                      <span className="text-xs text-gray-400 uppercase">{flow.flow_type}</span>

                      {/* Assignee */}
                      {flow.assignee ? (
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
                            {flow.assignee.full_name?.[0] || flow.assignee.email[0].toUpperCase()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Unassigned</span>
                      )}
                    </div>

                    {/* Status Badge */}
                    {flow.stage_status && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            flow.stage_status === "completed"
                              ? "bg-green-100 text-green-700"
                              : flow.stage_status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {flow.stage_status.replace("_", " ")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Empty State */}
                {getFlowsByStage(stage.key).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No flows in {stage.name}</p>
                    <button
                      onClick={() => {
                        setSelectedStage(stage.key);
                        setShowCreateModal(true);
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      + Add a flow
                    </button>
                  </div>
                )}
              </div>

              {/* Add Flow Button */}
              {getFlowsByStage(stage.key).length > 0 && (
                <button
                  onClick={() => {
                    setSelectedStage(stage.key);
                    setShowCreateModal(true);
                  }}
                  className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                >
                  + Add flow
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Flow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create New Flow</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedStage(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateFlow}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={newFlowData.title}
                  onChange={(e) => setNewFlowData({ ...newFlowData, title: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Add details..."
                  rows={3}
                  value={newFlowData.description}
                  onChange={(e) => setNewFlowData({ ...newFlowData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={selectedStage || "Q"}
                    onChange={(e) => setSelectedStage(e.target.value as "Q" | "U" | "A" | "D")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {stages.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.key} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newFlowData.priority}
                    onChange={(e) => setNewFlowData({ ...newFlowData, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newFlowData.flow_type}
                  onChange={(e) => setNewFlowData({ ...newFlowData, flow_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="feature">Feature</option>
                  <option value="bug">Bug Fix</option>
                  <option value="improvement">Improvement</option>
                  <option value="design">Design</option>
                  <option value="infrastructure">Infrastructure</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedStage(null);
                    setNewFlowData({ title: "", description: "", priority: "medium", flow_type: "feature" });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFlowData.title.trim() || !selectedDomain}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
