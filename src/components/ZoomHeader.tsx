"use client";

import { useState } from "react";
import { useZoom } from "@/context/ZoomContext";

export default function ZoomHeader() {
  const { meeting, showWidget, setShowWidget, joinMeeting, startMeeting, requestSummary, showSummaryModal, setShowSummaryModal } = useZoom();
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  const handleJoinClick = () => {
    setShowPasscodeModal(true);
    setPasscode("");
    setPasscodeError(false);
  };

  const handlePasscodeSubmit = async () => {
    const success = await joinMeeting(passcode);
    if (success) {
      setShowPasscodeModal(false);
      setPasscode("");
    } else {
      setPasscodeError(true);
    }
  };

  const handleStartCall = async () => {
    await startMeeting("QUAD Demo Presentation");
  };

  const formatCountdown = (timestamp: number | null): string => {
    if (!timestamp) return "...";
    const seconds = Math.max(0, Math.floor((timestamp - Date.now()) / 1000));
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}` : "<1";
  };

  const formatSummaryAsText = (summary: any): string => {
    let text = `AI MEETING SUMMARY\n`;
    text += `Meeting: ${summary.meeting_topic}\n\n`;
    text += `OVERVIEW\n${summary.summary_overview}\n\n`;
    summary.summary_details.forEach((section: any) => {
      text += `${section.summary_type.toUpperCase()}\n${section.summary_content}\n\n`;
    });
    return text;
  };

  // Show Start Call button when no meeting is active
  if (!meeting || meeting.status === "ended") {
    return (
      <>
        {/* Start Demo Call Button in Header */}
        <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📹</span>
              <span className="text-white font-medium text-sm">
                Ready to start demo call
              </span>
            </div>
            <button
              onClick={handleStartCall}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📹</span>
              <span>Start Demo Call</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Call Status Banner */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
            <span className="text-white font-medium text-sm">
              {meeting.status === "creating" ? "Creating meeting..." : "Call in Progress"}
            </span>
            {meeting.status === "active" && (
              <span className="text-white/80 text-sm">• {meeting.topic}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {meeting.status === "active" && (
              <button
                onClick={handleJoinClick}
                className="px-4 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded transition-colors"
              >
                Join Call
              </button>
            )}

            {/* AI Summary Button and Status Indicators */}
            {meeting.status === "active" && meeting.summaryStatus === "not_requested" && (
              <button
                onClick={requestSummary}
                className="px-4 py-1 bg-purple-500/30 hover:bg-purple-500/40 text-white text-sm rounded transition-colors flex items-center gap-1"
              >
                <span>✨</span>
                <span>Request AI Summary</span>
              </button>
            )}

            {meeting.summaryStatus === "waiting" && (
              <div className="px-4 py-1 bg-purple-500/20 text-purple-200 text-sm rounded flex items-center gap-2">
                <span className="animate-pulse">⏳</span>
                <span>Generating... (~{formatCountdown(meeting.summaryNextPollAt)} min)</span>
              </div>
            )}

            {meeting.summaryStatus === "polling" && (
              <div className="px-4 py-1 bg-purple-500/20 text-purple-200 text-sm rounded flex items-center gap-2">
                <span className="animate-spin">🔄</span>
                <span>Checking...</span>
              </div>
            )}

            {meeting.summaryStatus === "ready" && (
              <button
                onClick={() => setShowSummaryModal(true)}
                className="px-4 py-1 bg-green-500/30 hover:bg-green-500/40 text-white text-sm rounded transition-colors flex items-center gap-1"
              >
                <span>✅</span>
                <span>Summary Ready!</span>
              </button>
            )}

            {meeting.summaryStatus === "error" && (
              <div className="px-4 py-1 bg-red-500/20 text-red-200 text-sm rounded flex items-center gap-2">
                <span>⚠️</span>
                <span>Error</span>
              </div>
            )}

            {meeting.summaryStatus === "unavailable" && (
              <div className="px-4 py-1 bg-gray-500/20 text-gray-300 text-sm rounded flex items-center gap-2">
                <span>⏱️</span>
                <span>Timeout</span>
              </div>
            )}

            <button
              onClick={() => setShowWidget(!showWidget)}
              className="px-4 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded transition-colors"
            >
              {showWidget ? "Hide Details" : "Show Details"}
            </button>
          </div>
        </div>
      </div>

      {/* Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 w-96 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Join Demo Call</h3>
            <p className="text-slate-400 text-sm mb-6">
              Enter the passcode to join the call
            </p>

            <input
              type="text"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setPasscodeError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePasscodeSubmit()}
              placeholder="Enter passcode"
              className={`w-full px-4 py-3 bg-slate-800 text-white rounded-lg outline-none focus:ring-2 ${
                passcodeError ? "ring-2 ring-red-500" : "focus:ring-blue-500"
              }`}
              autoFocus
            />

            {passcodeError && (
              <p className="text-red-400 text-sm mt-2">
                Incorrect passcode. Please try again.
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasscodeModal(false)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasscodeSubmit}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Details Widget */}
      {showWidget && meeting.status === "active" && (
        <div className="fixed top-28 right-4 z-50 w-96 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📹</span>
                <div>
                  <h3 className="font-bold text-white text-lg">Active Call</h3>
                  <p className="text-xs text-green-100">{meeting.topic}</p>
                </div>
              </div>
              <button
                onClick={() => setShowWidget(false)}
                className="text-white hover:text-green-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-400 font-medium text-sm">Meeting Active</span>
              </div>
              <p className="text-xs text-slate-400">Cloud recording in progress</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Meeting ID</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-sm text-white font-mono">
                    {meeting.meetingId}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(meeting.meetingId)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
                  >
                    📋
                  </button>
                </div>
              </div>

              {meeting.password && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Password</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-sm text-white font-mono">
                      {meeting.password}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(meeting.password)}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Join URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={meeting.joinUrl}
                    readOnly
                    className="flex-1 bg-slate-800 px-3 py-2 rounded text-xs text-white font-mono truncate"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(meeting.joinUrl)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.open(meeting.joinUrl, "_blank")}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Open Zoom
            </button>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {showSummaryModal && meeting?.summaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>✨</span>
                  <span>AI Meeting Summary</span>
                </h3>
                <p className="text-purple-100 text-sm mt-1">{meeting.summaryData.meeting_topic}</p>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-white hover:text-purple-200 transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Overview */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span>📝</span>
                  <span>Overview</span>
                </h4>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {meeting.summaryData.summary_overview}
                </p>
              </div>

              {/* Summary Details */}
              {meeting.summaryData.summary_details.map((section, i) => (
                <div key={i} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    {section.summary_type === "next_steps" ? (
                      <>
                        <span>🎯</span>
                        <span>Next Steps</span>
                      </>
                    ) : section.summary_type === "action_items" ? (
                      <>
                        <span>✅</span>
                        <span>Action Items</span>
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        <span>{section.summary_type}</span>
                      </>
                    )}
                  </h4>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {section.summary_content}
                  </p>
                </div>
              ))}

              {/* Meeting Metadata */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Meeting Start:</span>
                    <p className="text-white font-medium">
                      {new Date(meeting.summaryData.meeting_start_time).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Meeting End:</span>
                    <p className="text-white font-medium">
                      {new Date(meeting.summaryData.meeting_end_time).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Summary Created:</span>
                    <p className="text-white font-medium">
                      {new Date(meeting.summaryData.created_time).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Meeting ID:</span>
                    <p className="text-white font-medium font-mono">{meeting.summaryData.meeting_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-800 border-t border-slate-700 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Generated by Zoom AI Companion
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(formatSummaryAsText(meeting.summaryData!));
                    // Optional: Show toast notification
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>📋</span>
                  <span>Copy to Clipboard</span>
                </button>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
