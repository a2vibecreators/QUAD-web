# Zoom AI Summary Setup Guide

## Step 1: Add Required Scope to Zoom App

1. Go to **Zoom Marketplace**: https://marketplace.zoom.us/develop/apps
2. Find your Server-to-Server OAuth app: **"QUAD Platform"**
3. Click **Scopes** tab
4. Search for and add: `meeting_summary:read:admin`
5. Click **Continue** and **Activate** the app

## Step 2: Enable AI Companion for Your Account

1. Go to **Zoom Settings**: https://zoom.us/profile/setting
2. Navigate to **In Meeting (Advanced)** section
3. Enable **"AI Companion"**
4. Enable **"Meeting Summary with AI Companion"**

## Step 3: Implementation Details

### API Endpoint
```
GET https://api.zoom.us/v2/meetings/{meetingId}/meeting_summary
```

### Required Scope
- `meeting_summary:read:admin` (for account-level access)
- OR `meeting_summary:read` (for user-level access)

### Response Format
```json
{
  "meeting_host_id": "string",
  "meeting_host_email": "user@example.com",
  "meeting_uuid": "abc123==",
  "meeting_id": 123456789,
  "meeting_topic": "QUAD Demo - MassMutual",
  "meeting_start_time": "2026-01-08T14:30:00Z",
  "meeting_end_time": "2026-01-08T15:30:00Z",
  "summary_start_time": "2026-01-08T14:30:00Z",
  "summary_end_time": "2026-01-08T15:30:00Z",
  "summary_created_time": "2026-01-08T15:35:00Z",
  "summary_last_modified_time": "2026-01-08T15:35:00Z",
  "summary_title": "Meeting Summary",
  "summary_overview": "This is an overview of the meeting...",
  "summary_details": [
    {
      "summary_type": "overview",
      "summary_content": "..."
    },
    {
      "summary_type": "next_steps",
      "summary_content": "..."
    }
  ]
}
```

### Important Notes

1. **Summary Availability:** Summaries are generated after the meeting ends, typically within 5-10 minutes
2. **During Meeting:** API will return 404 if summary doesn't exist yet
3. **Polling Strategy:** Poll every 30 seconds after meeting ends until summary is available
4. **Rate Limit:** 100 requests per day for this endpoint

## Step 4: Feature Workflow

1. User clicks "Start Demo Call" → Meeting created with cloud recording enabled
2. During meeting: "Request AI Summary" button appears in green banner
3. User clicks button → Shows "AI summary generating... (~5-10 min)"
4. Backend polls Zoom API every 30 seconds
5. When summary ready → Display in modal popup
6. Optional: Save to database for later viewing

## Next Steps After Adding Scope

1. Restart quad-web container to pick up new token
2. Test summary generation with a short test meeting
3. Verify summary appears within 5-10 minutes after meeting ends

---

**Sources:**
- [Invalid access token scope discussion](https://devforum.zoom.us/t/invalid-access-token-does-not-contain-scopes-meeting-summary-read-meeting-summaryadmin/112668)
- [Retrieving meeting_summary via API](https://devforum.zoom.us/t/retrieving-meeting-summary-via-api/125166)
- [Zoom Meeting API Documentation](https://developers.zoom.us/docs/api/rest/reference/zoom-api/methods/)
