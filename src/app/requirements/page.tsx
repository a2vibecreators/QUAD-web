"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  source_type: string;
  source_file_name: string | null;
  status: string;
  ai_processed: boolean;
  created_at: string;
  domain?: {
    id: string;
    name: string;
  };
  milestones?: Milestone[];
  _count?: {
    milestones: number;
    tickets: number;
  };
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  sequence_order: number;
  ai_confidence: number | null;
  status: string;
}

interface GeneratedTicket {
  title: string;
  description: string;
  ticket_type: string;
  priority: string;
  story_points: number;
  acceptance_criteria: string[];
  ai_confidence: number;
}

interface BRDDocument {
  title: string;
  version: string;
  generatedAt: string;
  sections: {
    overview: string;
    objectives: string[];
    scope: {
      inScope: string[];
      outOfScope: string[];
    };
    functionalRequirements: {
      id: string;
      title: string;
      description: string;
      priority: string;
    }[];
    nonFunctionalRequirements: string[];
    milestones: Milestone[];
    assumptions: string[];
    constraints: string[];
  };
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  processing: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  analyzed: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  approved: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  archived: { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-300" },
};

const sourceTypeIcons: Record<string, string> = {
  MANUAL: "✏️",
  UPLOAD: "📄",
  MEETING_TRANSCRIPT: "🎙️",
};

export default function RequirementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [showBRDModal, setShowBRDModal] = useState(false);
  const [showTicketPreviewModal, setShowTicketPreviewModal] = useState(false);

  // Selected requirement
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>("");

  // Analysis results
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [generatedBRD, setGeneratedBRD] = useState<BRDDocument | null>(null);
  const [generatedTickets, setGeneratedTickets] = useState<GeneratedTicket[]>([]);
  const [generatingTickets, setGeneratingTickets] = useState(false);

  // Create form
  const [newRequirement, setNewRequirement] = useState({
    title: "",
    description: "",
    source_type: "MANUAL",
    domain_id: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchRequirements();
      fetchDomains();
    }
  }, [session]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDomain) params.append("domain_id", selectedDomain);

      const res = await fetch(`/api/requirements?${params}`);
      if (!res.ok) throw new Error("Failed to fetch requirements");
      const data = await res.json();
      setRequirements(data.requirements || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requirements");
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const res = await fetch("/api/domains");
      if (!res.ok) throw new Error("Failed to fetch domains");
      const data = await res.json();
      setDomains(data.domains || []);
    } catch (err) {
      console.error("Failed to fetch domains:", err);
    }
  };

  const handleCreateRequirement = async () => {
    if (!newRequirement.title.trim() || !newRequirement.domain_id) {
      setError("Title and domain are required");
      return;
    }

    try {
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequirement),
      });

      if (!res.ok) throw new Error("Failed to create requirement");

      const data = await res.json();
      setRequirements([data.requirement, ...requirements]);
      setShowCreateModal(false);
      setNewRequirement({ title: "", description: "", source_type: "MANUAL", domain_id: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create requirement");
    }
  };

  const handleAnalyze = async (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    setAnalyzingId(requirement.id);
    setShowAnalyzeModal(true);

    try {
      // Call analyze endpoint - generates milestones and BRD
      const res = await fetch(`/api/requirements/${requirement.id}/analyze`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();

      // Update requirement with milestones
      setSelectedRequirement({
        ...requirement,
        milestones: data.milestones,
        status: "analyzed",
        ai_processed: true,
      });

      // Generate BRD document structure
      setGeneratedBRD({
        title: `BRD: ${requirement.title}`,
        version: "1.0",
        generatedAt: new Date().toISOString(),
        sections: {
          overview: requirement.description || "",
          objectives: data.objectives || ["Implement the described functionality"],
          scope: {
            inScope: data.inScope || ["All features described in requirements"],
            outOfScope: data.outOfScope || ["Future enhancements not in current scope"],
          },
          functionalRequirements: data.functionalRequirements || [{
            id: "FR-001",
            title: requirement.title,
            description: requirement.description || "",
            priority: "High",
          }],
          nonFunctionalRequirements: data.nonFunctionalRequirements || [
            "System should be responsive",
            "Support standard browsers",
          ],
          milestones: data.milestones || [],
          assumptions: data.assumptions || ["Team has access to required resources"],
          constraints: data.constraints || ["Timeline as per project schedule"],
        },
      });

      // Refresh requirements list
      fetchRequirements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleGenerateTickets = async () => {
    if (!selectedRequirement) return;

    setGeneratingTickets(true);
    try {
      const res = await fetch(`/api/requirements/${selectedRequirement.id}/generate-tickets`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to generate tickets");

      const data = await res.json();
      setGeneratedTickets(data.tickets || []);
      setShowTicketPreviewModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate tickets");
    } finally {
      setGeneratingTickets(false);
    }
  };

  const handleGoToTickets = () => {
    setShowTicketPreviewModal(false);
    setShowAnalyzeModal(false);
    setGeneratedTickets([]);
    router.push("/tickets");
  };

  const handleViewBRD = (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    // If already analyzed, show the BRD
    if (requirement.ai_processed && requirement.milestones) {
      setGeneratedBRD({
        title: `BRD: ${requirement.title}`,
        version: "1.0",
        generatedAt: requirement.created_at,
        sections: {
          overview: requirement.description || "",
          objectives: ["Implement the described functionality"],
          scope: {
            inScope: ["All features described in requirements"],
            outOfScope: ["Future enhancements"],
          },
          functionalRequirements: [{
            id: "FR-001",
            title: requirement.title,
            description: requirement.description || "",
            priority: "High",
          }],
          nonFunctionalRequirements: ["System responsiveness", "Browser compatibility"],
          milestones: requirement.milestones,
          assumptions: ["Team availability"],
          constraints: ["Project timeline"],
        },
      });
      setShowBRDModal(true);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requirements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Requirements</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage requirements, generate BRDs, and create tickets
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Domain filter */}
            <select
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value);
                fetchRequirements();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Domains</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <span>+</span>
              <span>New Requirement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      {/* Requirements List */}
      <div className="p-6">
        {requirements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900">No requirements yet</h3>
            <p className="text-gray-500 mt-2">
              Create your first requirement to get started with BRD generation
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Requirement
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {requirements.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{sourceTypeIcons[req.source_type] || "📄"}</span>
                      <h3 className="text-lg font-medium text-gray-900">{req.title}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${statusColors[req.status]?.bg || "bg-gray-100"} ${statusColors[req.status]?.text || "text-gray-700"} ${statusColors[req.status]?.border || "border-gray-200"} border`}
                      >
                        {req.status}
                      </span>
                      {req.ai_processed && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                          🤖 AI Analyzed
                        </span>
                      )}
                    </div>

                    {req.description && (
                      <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                        {req.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      {req.domain && (
                        <span className="flex items-center gap-1">
                          📁 {req.domain.name}
                        </span>
                      )}
                      {req._count && (
                        <>
                          <span>{req._count.milestones} milestones</span>
                          <span>{req._count.tickets} tickets</span>
                        </>
                      )}
                      <span>
                        Created {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!req.ai_processed ? (
                      <button
                        onClick={() => handleAnalyze(req)}
                        disabled={analyzingId === req.id}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {analyzingId === req.id ? (
                          <>
                            <span className="animate-spin">⚙️</span>
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <span>🤖</span>
                            <span>Analyze & Generate BRD</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleViewBRD(req)}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                        >
                          📄 View BRD
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequirement(req);
                            handleGenerateTickets();
                          }}
                          disabled={generatingTickets}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {generatingTickets ? "Generating..." : "🎫 Generate Tickets"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Requirement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">New Requirement</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain *
                </label>
                <select
                  value={newRequirement.domain_id}
                  onChange={(e) => setNewRequirement({ ...newRequirement, domain_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a domain</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newRequirement.title}
                  onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                  placeholder="e.g., User Authentication Module"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description / Requirements Text
                </label>
                <textarea
                  value={newRequirement.description}
                  onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                  rows={8}
                  placeholder="Paste your requirements here. Be as detailed as possible - this will be used to generate the BRD and tickets.

Example:
- User should be able to login with email and password
- Support social login (Google, GitHub)
- Password reset via email
- Session management with JWT tokens
- Remember me functionality"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Type
                </label>
                <div className="flex gap-4">
                  {[
                    { value: "MANUAL", label: "✏️ Manual Entry", desc: "Type or paste requirements" },
                    { value: "UPLOAD", label: "📄 Document Upload", desc: "Coming soon" },
                    { value: "MEETING_TRANSCRIPT", label: "🎙️ Meeting Notes", desc: "Coming soon" },
                  ].map((type) => (
                    <label
                      key={type.value}
                      className={`flex-1 p-3 border rounded-lg cursor-pointer transition-colors ${
                        newRequirement.source_type === type.value
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      } ${type.value !== "MANUAL" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name="source_type"
                        value={type.value}
                        checked={newRequirement.source_type === type.value}
                        onChange={(e) => setNewRequirement({ ...newRequirement, source_type: e.target.value })}
                        disabled={type.value !== "MANUAL"}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRequirement}
                disabled={!newRequirement.title.trim() || !newRequirement.domain_id}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create Requirement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis / BRD Generation Modal */}
      {showAnalyzeModal && selectedRequirement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    🤖 AI Analysis: {selectedRequirement.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Business Requirements Document generated from your input
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAnalyzeModal(false);
                    setGeneratedBRD(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {analyzingId ? (
              <div className="p-12 text-center">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <p className="text-gray-600">Analyzing requirements and generating BRD...</p>
                <p className="text-sm text-gray-400 mt-2">This may take a few seconds</p>
              </div>
            ) : generatedBRD ? (
              <div className="p-6">
                {/* BRD Preview */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                  <div className="text-center border-b pb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{generatedBRD.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Version {generatedBRD.version} • Generated {new Date(generatedBRD.generatedAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Overview */}
                  <section>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">1. Overview</h4>
                    <p className="text-gray-700">{generatedBRD.sections.overview || "No overview provided"}</p>
                  </section>

                  {/* Objectives */}
                  <section>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">2. Objectives</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {generatedBRD.sections.objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </section>

                  {/* Scope */}
                  <section>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">3. Scope</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-2">✅ In Scope</h5>
                        <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                          {generatedBRD.sections.scope.inScope.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h5 className="font-medium text-red-800 mb-2">❌ Out of Scope</h5>
                        <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                          {generatedBRD.sections.scope.outOfScope.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Functional Requirements */}
                  <section>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">4. Functional Requirements</h4>
                    <div className="space-y-3">
                      {generatedBRD.sections.functionalRequirements.map((fr) => (
                        <div key={fr.id} className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{fr.id}</span>
                            <span className="font-medium">{fr.title}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              fr.priority === "High" ? "bg-red-100 text-red-700" :
                              fr.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {fr.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{fr.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Milestones */}
                  {generatedBRD.sections.milestones.length > 0 && (
                    <section>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">5. Milestones</h4>
                      <div className="space-y-2">
                        {generatedBRD.sections.milestones.map((milestone, i) => (
                          <div key={milestone.id} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                            <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full font-bold">
                              {i + 1}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium">{milestone.title}</div>
                              {milestone.description && (
                                <p className="text-sm text-gray-500">{milestone.description}</p>
                              )}
                            </div>
                            {milestone.ai_confidence && (
                              <span className="text-xs text-gray-400">
                                {Math.round(milestone.ai_confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => {
                      // TODO: Export BRD as PDF/Word
                      alert("Export feature coming soon!");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    📥 Export BRD
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAnalyzeModal(false);
                        setGeneratedBRD(null);
                      }}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleGenerateTickets}
                      disabled={generatingTickets}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {generatingTickets ? (
                        <>
                          <span className="animate-spin">⚙️</span>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span>🎫</span>
                          <span>Generate Tickets from BRD</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* View BRD Modal */}
      {showBRDModal && generatedBRD && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{generatedBRD.title}</h2>
              <button onClick={() => setShowBRDModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6">
              {/* Same BRD content as above */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <section>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Overview</h4>
                  <p className="text-gray-700">{generatedBRD.sections.overview}</p>
                </section>
                {/* ... other sections ... */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Preview Modal */}
      {showTicketPreviewModal && generatedTickets.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    🎫 Tickets Created Successfully!
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {generatedTickets.length} tickets have been added to the backlog for review.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTicketPreviewModal(false);
                    setGeneratedTickets([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {generatedTickets.map((ticket, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {ticket.ticket_type === "epic" ? "📦" :
                         ticket.ticket_type === "story" ? "📖" :
                         ticket.ticket_type === "task" ? "✅" : "🐛"}
                      </span>
                      <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        ticket.priority === "critical" ? "bg-red-100 text-red-700" :
                        ticket.priority === "high" ? "bg-orange-100 text-orange-700" :
                        ticket.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {ticket.story_points} pts
                      </span>
                      <span className="text-xs text-purple-600">
                        {Math.round(ticket.ai_confidence * 100)}% AI
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{ticket.description}</p>
                  {ticket.acceptance_criteria.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Acceptance Criteria:</p>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {ticket.acceptance_criteria.slice(0, 3).map((ac, j) => (
                          <li key={j}>{ac}</li>
                        ))}
                        {ticket.acceptance_criteria.length > 3 && (
                          <li className="text-gray-400">+{ticket.acceptance_criteria.length - 3} more...</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTicketPreviewModal(false);
                  setGeneratedTickets([]);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Close
              </button>
              <button
                onClick={handleGoToTickets}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <span>✅</span>
                <span>View {generatedTickets.length} Tickets in Backlog</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
