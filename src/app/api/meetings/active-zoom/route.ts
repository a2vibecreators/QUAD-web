import { NextResponse } from "next/server";

/**
 * GET /api/meetings/active-zoom
 *
 * Checks for active meetings on the Zoom account.
 * Returns the first active/in-progress meeting if any.
 *
 * Use case: When page reloads, check if there's an active call in progress
 */

// Zoom OAuth token cache (shared with create-zoom)
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
    throw new Error("Zoom credentials not configured");
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
    throw new Error(`Failed to get Zoom access token: ${response.status}`);
  }

  const data = await response.json();

  // Cache token (expires in 1 hour, we cache for 55 minutes)
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };

  return data.access_token;
}

export async function GET() {
  try {
    // Get Zoom access token
    const accessToken = await getZoomAccessToken();

    // List meetings for the user
    const listMeetingsResponse = await fetch(
      "https://api.zoom.us/v2/users/me/meetings?type=live&page_size=10",
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    if (!listMeetingsResponse.ok) {
      throw new Error(`Failed to list meetings: ${listMeetingsResponse.status}`);
    }

    const meetingsData = await listMeetingsResponse.json();

    // Find first active/live meeting
    const activeMeeting = meetingsData.meetings?.find(
      (m: { status: string }) => m.status === "started" || m.status === "live"
    );

    if (activeMeeting) {
      return NextResponse.json({
        hasActiveMeeting: true,
        meetingId: activeMeeting.id.toString(),
        joinUrl: activeMeeting.join_url,
        password: activeMeeting.password || "",
        topic: activeMeeting.topic,
        startTime: activeMeeting.start_time,
        duration: activeMeeting.duration,
      });
    }

    // No active meetings
    return NextResponse.json({
      hasActiveMeeting: false,
    });
  } catch (error: unknown) {
    console.error("Error checking active meetings:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message, hasActiveMeeting: false },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to check active meetings", hasActiveMeeting: false },
      { status: 500 }
    );
  }
}
