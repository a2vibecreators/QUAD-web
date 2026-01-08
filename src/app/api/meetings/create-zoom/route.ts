import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/meetings/create-zoom
 *
 * Creates a Zoom meeting with automatic recording and waiting room enabled.
 *
 * Requirements:
 * - Zoom Server-to-Server OAuth app
 * - Environment variables: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
 *
 * Flow:
 * 1. Get Zoom OAuth token
 * 2. Create meeting via Zoom API
 * 3. Return meeting details (ID, join URL, password)
 */

// Zoom OAuth token cache (in production, use Redis or database)
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getZoomAccessToken(): Promise<string> {
  // Check if cached token is still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom credentials not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET in environment.");
  }

  // Get OAuth token
  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Zoom access token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Cache token (expires in 1 hour, we cache for 55 minutes)
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };

  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, autoRecording, waitingRoom, settings } = body;

    // Get Zoom access token
    const accessToken = await getZoomAccessToken();

    // Create meeting via Zoom API
    const createMeetingResponse = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: topic || "QUAD Demo Meeting",
        type: 2, // Scheduled meeting (can start anytime)
        settings: {
          host_video: settings?.host_video ?? true,
          participant_video: settings?.participant_video ?? true,
          join_before_host: settings?.join_before_host ?? false,
          mute_upon_entry: settings?.mute_upon_entry ?? true,
          waiting_room: waitingRoom ?? true,
          auto_recording: autoRecording || "cloud", // "cloud" or "local" or "none"
          approval_type: settings?.approval_type ?? 0, // 0 = manually approve, 1 = auto approve
          audio: "both", // telephony + voip
          watermark: false,
          use_pmi: false,
        },
      }),
    });

    if (!createMeetingResponse.ok) {
      const errorData = await createMeetingResponse.text();
      console.error("Zoom API error:", errorData);
      throw new Error(`Failed to create Zoom meeting: ${createMeetingResponse.status} ${createMeetingResponse.statusText}`);
    }

    const meetingData = await createMeetingResponse.json();

    // Return meeting details
    return NextResponse.json({
      meetingId: meetingData.id.toString(),
      joinUrl: meetingData.join_url,
      password: meetingData.password || "",
      startUrl: meetingData.start_url,
      hostEmail: meetingData.host_email,
      topic: meetingData.topic,
      startTime: meetingData.start_time,
      settings: meetingData.settings,
    });
  } catch (error: unknown) {
    console.error("Error creating Zoom meeting:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create Zoom meeting" },
      { status: 500 }
    );
  }
}
