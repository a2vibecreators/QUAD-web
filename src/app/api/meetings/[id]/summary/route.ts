import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/meetings/[id]/summary
 *
 * Fetches the AI-generated meeting summary from Zoom.
 *
 * Requirements:
 * - Zoom Server-to-Server OAuth app with scope: meeting_summary:read:admin
 * - AI Companion enabled in Zoom account settings
 * - Meeting Summary with AI Companion enabled
 *
 * Flow:
 * 1. Get Zoom OAuth token
 * 2. Fetch meeting summary from Zoom API
 * 3. Handle error codes:
 *    - 404: Summary not ready yet (meeting still generating)
 *    - 403: Missing required scope
 *    - 200: Summary available
 */

// Zoom OAuth token cache (shared across API routes)
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
    throw new Error(
      "Zoom credentials not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET in environment."
    );
  }

  // Get OAuth token
  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get Zoom access token: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Cache token (expires in 1 hour, we cache for 55 minutes)
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };

  return data.access_token;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;

    // Get Zoom access token
    const accessToken = await getZoomAccessToken();

    // Fetch meeting summary from Zoom API
    const summaryResponse = await fetch(
      `https://api.zoom.us/v2/meetings/${meetingId}/meeting_summary`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Handle 404: Summary not available yet
    if (summaryResponse.status === 404) {
      return NextResponse.json(
        {
          success: false,
          error: "Summary not available yet. Please wait a few minutes after meeting ends.",
          code: "NOT_READY",
        },
        { status: 404 }
      );
    }

    // Handle 403: Missing required scope
    if (summaryResponse.status === 403) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required scope 'meeting_summary:read:admin'. Please add this scope to your Zoom app. See ZOOM_AI_SUMMARY_SETUP.md",
          code: "MISSING_SCOPE",
        },
        { status: 403 }
      );
    }

    // Handle other error statuses
    if (!summaryResponse.ok) {
      const errorText = await summaryResponse.text();
      console.error("[Zoom Summary API] Error:", summaryResponse.status, errorText);
      throw new Error(`Zoom API error: ${summaryResponse.status}`);
    }

    // Success: Parse and return summary
    const summaryData = await summaryResponse.json();

    return NextResponse.json({
      success: true,
      summary: {
        meeting_id: summaryData.meeting_id,
        meeting_topic: summaryData.meeting_topic,
        summary_overview: summaryData.summary_overview || "",
        summary_details: summaryData.summary_details || [],
        created_time: summaryData.summary_created_time,
        meeting_start_time: summaryData.meeting_start_time,
        meeting_end_time: summaryData.meeting_end_time,
      },
    });
  } catch (error: unknown) {
    console.error("[Zoom Summary API] Error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch meeting summary" },
      { status: 500 }
    );
  }
}
