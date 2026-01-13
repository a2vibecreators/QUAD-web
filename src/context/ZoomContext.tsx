"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

interface ZoomSummary {
  meeting_id: string;
  meeting_topic: string;
  summary_overview: string;
  summary_details: Array<{
    summary_type: "overview" | "next_steps" | "action_items";
    summary_content: string;
  }>;
  created_time: string;
  meeting_start_time: string;
  meeting_end_time: string;
}

interface ZoomMeeting {
  meetingId: string;
  joinUrl: string;
  password: string;
  topic: string;
  status: "idle" | "creating" | "active" | "ended";
  // AI Summary fields
  summaryStatus: "not_requested" | "waiting" | "polling" | "ready" | "error" | "unavailable";
  summaryData: ZoomSummary | null;
  summaryError: string | null;
  summaryRequestedAt: number | null;
  summaryNextPollAt: number | null;
}

interface ZoomContextType {
  meeting: ZoomMeeting | null;
  showWidget: boolean;
  showSummaryModal: boolean;
  startMeeting: (orgName: string) => Promise<void>;
  joinMeeting: (passcode: string) => Promise<boolean>;
  endMeeting: () => void;
  setShowWidget: (show: boolean) => void;
  checkActiveMeeting: () => Promise<void>;
  requestSummary: () => Promise<void>;
  setShowSummaryModal: (show: boolean) => void;
}

const ZoomContext = createContext<ZoomContextType | undefined>(undefined);

export function ZoomProvider({ children }: { children: ReactNode }) {
  const [meeting, setMeeting] = useState<ZoomMeeting | null>(null);
  const [showWidget, setShowWidget] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const summaryPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for active meetings on mount
  useEffect(() => {
    checkActiveMeeting();
  }, []);

  const checkActiveMeeting = async () => {
    try {
      const response = await fetch("/api/meetings/active-zoom");
      const data = await response.json();

      if (data.hasActiveMeeting) {
        setMeeting({
          meetingId: data.meetingId,
          joinUrl: data.joinUrl,
          password: data.password || "",
          topic: data.topic,
          status: "active",
          summaryStatus: "not_requested",
          summaryData: null,
          summaryError: null,
          summaryRequestedAt: null,
          summaryNextPollAt: null,
        });
        setShowWidget(true);
      }
    } catch (error) {
      console.error("Failed to check active meetings:", error);
    }
  };

  const startMeeting = async (orgName: string) => {
    setMeeting({
      meetingId: "",
      joinUrl: "",
      password: "",
      topic: "",
      status: "creating",
      summaryStatus: "not_requested",
      summaryData: null,
      summaryError: null,
      summaryRequestedAt: null,
      summaryNextPollAt: null,
    });
    setShowWidget(true);

    try {
      const response = await fetch("/api/meetings/create-zoom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `QUAD Demo - ${orgName}`,
          autoRecording: "cloud",
          waitingRoom: true,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: true,
            waiting_room: true,
            auto_recording: "cloud",
            approval_type: 0,
          },
        }),
      });

      const data = await response.json();

      if (data.meetingId) {
        setMeeting({
          meetingId: data.meetingId,
          joinUrl: data.joinUrl,
          password: data.password,
          topic: data.topic,
          status: "active",
          summaryStatus: "not_requested",
          summaryData: null,
          summaryError: null,
          summaryRequestedAt: null,
          summaryNextPollAt: null,
        });

        // Auto-open Zoom app
        window.open(data.joinUrl, "_blank");
      } else {
        throw new Error("Failed to create meeting");
      }
    } catch (error) {
      console.error("Failed to create Zoom meeting:", error);
      setMeeting(null);
      setShowWidget(false);
      alert("Failed to create Zoom meeting. Please check your Zoom API configuration.");
    }
  };

  const joinMeeting = async (passcode: string): Promise<boolean> => {
    // Validate passcode
    if (passcode !== "1218") {
      return false;
    }

    // Fetch active meeting if not already loaded
    if (!meeting) {
      await checkActiveMeeting();
    }

    // Open Zoom with join URL
    if (meeting?.joinUrl) {
      window.open(meeting.joinUrl, "_blank");
      setShowWidget(true);
      return true;
    }

    return false;
  };

  const endMeeting = () => {
    if (meeting) {
      setMeeting({
        ...meeting,
        status: "ended",
        summaryStatus: "not_requested",
        summaryData: null,
        summaryError: null,
        summaryRequestedAt: null,
        summaryNextPollAt: null,
      });
    }

    // Clean up polling interval
    if (summaryPollIntervalRef.current) {
      clearInterval(summaryPollIntervalRef.current);
      summaryPollIntervalRef.current = null;
    }
  };

  const requestSummary = async () => {
    if (!meeting || meeting.status !== "active") return;

    // Set status to "waiting" (5-minute delay before first poll)
    setMeeting({
      ...meeting,
      summaryStatus: "waiting",
      summaryRequestedAt: Date.now(),
      summaryNextPollAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    });

    // Schedule first poll after 5 minutes
    setTimeout(() => {
      startSummaryPolling();
    }, 5 * 60 * 1000);
  };

  const startSummaryPolling = async () => {
    if (!meeting) return;

    setMeeting((prev) => (prev ? { ...prev, summaryStatus: "polling" } : null));

    let pollCount = 0;
    const maxPolls = 40; // 40 × 30s = 20 minutes max

    const interval = setInterval(async () => {
      pollCount++;

      try {
        const response = await fetch(`/api/meetings/${meeting.meetingId}/summary`);
        const data = await response.json();

        if (response.ok && data.success) {
          // Summary ready!
          clearInterval(interval);
          setMeeting((prev) =>
            prev
              ? {
                  ...prev,
                  summaryStatus: "ready",
                  summaryData: data.summary,
                }
              : null
          );
          setShowSummaryModal(true); // Auto-open modal
        } else if (response.status === 404) {
          // Not ready yet, continue polling
          setMeeting((prev) =>
            prev
              ? {
                  ...prev,
                  summaryNextPollAt: Date.now() + 30 * 1000,
                }
              : null
          );
        } else if (response.status === 403) {
          // Missing scope
          clearInterval(interval);
          setMeeting((prev) =>
            prev
              ? {
                  ...prev,
                  summaryStatus: "error",
                  summaryError: data.error || "Missing required Zoom scope",
                }
              : null
          );
        } else {
          throw new Error(data.error || "Failed to fetch summary");
        }
      } catch (error) {
        console.error("[Zoom Summary] Poll error:", error);
        // Continue polling on network errors
      }

      // Timeout after 20 minutes
      if (pollCount >= maxPolls) {
        clearInterval(interval);
        setMeeting((prev) =>
          prev
            ? {
                ...prev,
                summaryStatus: "unavailable",
                summaryError: "Summary generation timed out after 20 minutes.",
              }
            : null
        );
      }
    }, 30 * 1000); // Poll every 30 seconds

    summaryPollIntervalRef.current = interval;
  };

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (summaryPollIntervalRef.current) {
        clearInterval(summaryPollIntervalRef.current);
      }
    };
  }, []);

  return (
    <ZoomContext.Provider
      value={{
        meeting,
        showWidget,
        showSummaryModal,
        startMeeting,
        joinMeeting,
        endMeeting,
        setShowWidget,
        checkActiveMeeting,
        requestSummary,
        setShowSummaryModal,
      }}
    >
      {children}
    </ZoomContext.Provider>
  );
}

export function useZoom() {
  const context = useContext(ZoomContext);
  if (context === undefined) {
    throw new Error("useZoom must be used within a ZoomProvider");
  }
  return context;
}
