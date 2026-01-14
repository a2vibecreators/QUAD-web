#!/usr/bin/env python3
"""
QUAD Context Hook for Claude Code
==================================

Intercepts quad-* commands and injects org context from the QUAD API.

Usage:
  Add to Claude Code hooks config:

  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "^quad-",
        "command": "python3 /path/to/quad-context-hook.py \"$PROMPT\""
      }
    ]
  }

Copyright (c) 2026 Gopi Suman Addanke. All Rights Reserved.
"""

import sys
import os
import json
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime

# Configuration
LOG_REQUESTS = os.getenv("QUAD_LOG_REQUESTS", "true").lower() == "true"
REQUEST_LOG_FILE = Path.home() / ".quad" / "request-log.jsonl"
# Default to production API (friends/external users)
# For local dev, set QUAD_API_URL=http://localhost:3000
API_URL = os.getenv("QUAD_API_URL", "https://api.quadframe.work")
API_KEY = os.getenv("QUAD_API_KEY", "")  # Required - get from quadframe.work
DOMAIN_SLUG = os.getenv("QUAD_DOMAIN", None)


def estimate_tokens(text: str) -> int:
    """Rough token estimate (4 chars = 1 token on average)"""
    return len(text) // 4


def log_request(user_prompt: str, enhanced_prompt: str, command: str = None, phase: str = "pre", is_quad: bool = False):
    """Log request to ~/.quad/request-log.jsonl for tracking"""
    if not LOG_REQUESTS:
        return

    REQUEST_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    if phase == "pre":
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "phase": "pre",
            "is_quad": is_quad,
            "command": command or "unknown",
            "user_prompt": {
                "text": user_prompt[:200] + "..." if len(user_prompt) > 200 else user_prompt,
                "chars": len(user_prompt),
                "tokens_est": estimate_tokens(user_prompt)
            },
            "enhanced_prompt": {
                "chars": len(enhanced_prompt),
                "tokens_est": estimate_tokens(enhanced_prompt)
            },
            "context_added": {
                "chars": len(enhanced_prompt) - len(user_prompt),
                "tokens_est": estimate_tokens(enhanced_prompt) - estimate_tokens(user_prompt)
            }
        }
    else:  # post
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "phase": "post",
            "command": command or "response",
            "response": {
                "chars": len(enhanced_prompt),
                "tokens_est": estimate_tokens(enhanced_prompt)
            }
        }

    with open(REQUEST_LOG_FILE, "a") as f:
        f.write(json.dumps(log_entry) + "\n")


def load_config():
    """Load config from ~/.quad/config.json if exists"""
    config_path = Path.home() / ".quad" / "config.json"
    if config_path.exists():
        try:
            with open(config_path) as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def get_context(question: str, domain_slug: str = None) -> dict:
    """Call QUAD API to get context for the question"""
    # Check for API key first
    api_key = API_KEY or load_config().get("api_key", "")
    if not api_key:
        return {
            "success": False,
            "error": "No API key configured. Get one at https://quadframe.work/signup or set QUAD_API_KEY"
        }

    url = f"{API_URL}/context"

    payload = {
        "question": question
    }
    if domain_slug:
        payload["domain_slug"] = domain_slug

    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result
    except urllib.error.HTTPError as e:
        return {"success": False, "error": f"API error: {e.code}"}
    except urllib.error.URLError as e:
        return {"success": False, "error": f"Connection error: {e.reason}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_visualization(endpoint: str, domain_slug: str) -> dict:
    """Call QUAD API visualization endpoints"""
    # Check for API key first
    api_key = API_KEY or load_config().get("api_key", "")
    if not api_key:
        return {
            "success": False,
            "error": "No API key configured. Get one at https://quadframe.work/signup or set QUAD_API_KEY"
        }

    url = f"{API_URL}{endpoint}/{domain_slug}"

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {api_key}"
        },
        method="GET"
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode("utf-8"))
            return {"success": True, "data": result}
    except urllib.error.HTTPError as e:
        return {"success": False, "error": f"API error: {e.code}"}
    except urllib.error.URLError as e:
        return {"success": False, "error": f"Connection error: {e.reason}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def process_command(prompt: str) -> str:
    """
    Process a quad-* command and return enhanced prompt.

    Commands:
      quad-question <question>  - Ask with org context
      quad-team                 - Show team info
      quad-status               - Show project status
      quad-availability         - Show availability
    """
    parts = prompt.strip().split(maxsplit=1)
    command = parts[0].lower()
    args = parts[1] if len(parts) > 1 else ""

    # Load config
    config = load_config()
    domain = DOMAIN_SLUG or config.get("domain_slug")

    # Handle different commands
    if command == "quad-question":
        if not args:
            return "Error: Please provide a question. Usage: quad-question <your question>"
        result = get_context(args, domain)

    elif command == "quad-team":
        result = get_context("Who is on the team?", domain)

    elif command == "quad-status":
        result = get_context("What is the project status?", domain)

    elif command == "quad-availability":
        result = get_context("Who has availability?", domain)

    # ─────────────────────────────────────────────────────────────
    # LOCAL COMMANDS (No API needed - work offline)
    # ─────────────────────────────────────────────────────────────

    elif command == "quad-init":
        # quad-init ProjectName - Initialize new QUAD project
        project_name = args.strip() if args else "NewProject"
        project_slug = project_name.lower().replace(" ", "-")

        return f"""[QUAD Project Initialization: {project_name}]

You are initializing a new QUAD project. Follow these steps EXACTLY:

═══════════════════════════════════════════════════════════════════
STEP 1: ASK QUESTIONS
═══════════════════════════════════════════════════════════════════
Ask the user these questions (use AskUserQuestion tool if available):

1. Project Type:
   - API (Spring Boot + PostgreSQL)
   - Full Stack (API + Next.js + PostgreSQL)
   - Mobile (Android + iOS + API)
   - Web Only (Next.js with external API)

2. Core Features (select all that apply):
   - User Authentication
   - Dashboard
   - CRUD Operations
   - Reports/Analytics
   - Notifications
   - File Upload
   - Payment Integration

3. Authentication Type:
   - OAuth (Google, Microsoft, GitHub)
   - JWT (email/password)
   - Simple (popup name/role selection)
   - None

═══════════════════════════════════════════════════════════════════
STEP 2: CREATE .quad FOLDER STRUCTURE
═══════════════════════════════════════════════════════════════════
After gathering answers, create this folder structure:

```
.quad/
├── project.json          # Project configuration (create in STEP 3)
├── session-summary.md    # Empty file for session context
├── features/             # Empty folder for feature specs
├── stories/              # Empty folder for user stories
└── tickets/              # Empty folder for dev tickets
```

Commands to run:
```bash
mkdir -p .quad/features .quad/stories .quad/tickets
touch .quad/session-summary.md
```

═══════════════════════════════════════════════════════════════════
STEP 3: CREATE project.json
═══════════════════════════════════════════════════════════════════
Create .quad/project.json with this structure (fill based on user answers):

```json
{{
  "name": "{project_name}",
  "slug": "{project_slug}",
  "version": "0.1.0",
  "created": "YYYY-MM-DD",
  "methodology": "QUAD",
  "stack": {{
    "type": "full_stack|api|mobile|web",
    "backend": "spring-boot|node-express|none",
    "frontend": "nextjs|react|android|ios|none",
    "database": "postgresql|mysql|mongodb|none",
    "auth": "oauth|jwt|simple|none"
  }},
  "features": [],
  "build_order": [],
  "team": []
}}
```

═══════════════════════════════════════════════════════════════════
STEP 4: CALCULATE PGCE & SET BUILD ORDER
═══════════════════════════════════════════════════════════════════
For each feature, calculate PGCE score:

PGCE Formula: P = (D × 0.5) + (I × 0.3) + (C⁻¹ × 0.2)

Where (all values 0-10, normalized to 0-1):
- D = Dependency score (how many features depend on this)
- I = Impact score (business value)
- C⁻¹ = Inverse complexity (simpler = higher score)

Standard QUAD Build Order:
1. Database Schema (foundation)
2. Backend Models/Entities
3. Backend API Endpoints
4. Authentication
5. Frontend Components
6. Frontend Pages
7. Advanced Features (reports, notifications)

═══════════════════════════════════════════════════════════════════
STEP 5: CONFIRM WITH USER
═══════════════════════════════════════════════════════════════════
Show the user:
1. Created folder structure
2. project.json contents
3. Calculated build order
4. Next command to run: `quad-plan` to generate feature specs

[End QUAD Project Initialization]"""

    elif command == "quad-plan":
        # quad-plan - Generate feature specifications
        return """[QUAD Feature Planning]

Read .quad/project.json and generate detailed feature specifications.

═══════════════════════════════════════════════════════════════════
FOR EACH FEATURE, CREATE: .quad/features/F00X-feature-name.md
═══════════════════════════════════════════════════════════════════

Template:
```markdown
# F001 - Feature Name

## Overview
- **ID**: F001
- **Status**: planned
- **PGCE Score**: X.XX

## Description
What this feature does...

## PGCE Calculation
- Dependency (D): X/10 - [reason]
- Impact (I): X/10 - [reason]
- Complexity (C): X/10 - [reason]
- Score: (D×0.5) + (I×0.3) + (C⁻¹×0.2) = X.XX

## Dependencies
- Requires: [list features this depends on]
- Enables: [list features that depend on this]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Requirements
### API Endpoints (if applicable)
- POST /api/v1/resource
- GET /api/v1/resource/:id

### Database Schema (if applicable)
- Table: resource_name
- Fields: id, name, created_at

### UI Components (if applicable)
- ResourceList
- ResourceForm
```

═══════════════════════════════════════════════════════════════════
BUILD ORDER
═══════════════════════════════════════════════════════════════════
Sort features by PGCE score (highest first) and output:
1. Update .quad/project.json with calculated scores
2. Update build_order array
3. Show user the ordered list

Next command: `quad-story` to generate user stories

[End QUAD Feature Planning]"""

    elif command == "quad-story":
        # quad-story - Generate user stories
        return """[QUAD User Story Generation]

Read .quad/features/ and generate user stories.

═══════════════════════════════════════════════════════════════════
FOR EACH FEATURE, CREATE: .quad/stories/S00X-story-name.md
═══════════════════════════════════════════════════════════════════

Template:
```markdown
# S001 - Story Title

## User Story
As a [role], I want [feature], so that [benefit].

## Feature Reference
- Feature: F001 - Feature Name
- PGCE Priority: X.XX

## Acceptance Criteria
**Given** [precondition]
**When** [action]
**Then** [expected result]

## Story Points
- Estimate: X points
- Complexity: Low/Medium/High

## Dependencies
- Blocked by: [story IDs]
- Blocks: [story IDs]

## Technical Notes
- Implementation hints
- Edge cases to consider
```

═══════════════════════════════════════════════════════════════════
GROUPING
═══════════════════════════════════════════════════════════════════
- Group stories by feature
- Maintain PGCE order within groups
- Number stories sequentially: S001, S002, etc.

Next command: `quad-ticket` to create dev tickets

[End QUAD User Story Generation]"""

    elif command == "quad-ticket":
        # quad-ticket - Create development tickets
        return """[QUAD Ticket Creation]

Read .quad/stories/ and generate development tickets.

═══════════════════════════════════════════════════════════════════
FOR EACH STORY, CREATE: .quad/tickets/T00X-ticket-name.md
═══════════════════════════════════════════════════════════════════

Template:
```markdown
# T001 - Ticket Title

## Summary
Brief description of the work

## Story Reference
- Story: S001 - Story Title
- Feature: F001 - Feature Name
- Priority: High/Medium/Low (from PGCE)

## Labels
`backend` `frontend` `database` `api` `ui`

## Estimated Hours
X hours

## Assignee
[Team member or unassigned]

## Subtasks
- [ ] Subtask 1
- [ ] Subtask 2
- [ ] Write tests

## Definition of Done
- [ ] Code complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Documentation updated
```

═══════════════════════════════════════════════════════════════════
OUTPUT ORDER
═══════════════════════════════════════════════════════════════════
- Output tickets in PGCE dependency order
- Database tickets first
- API tickets before frontend tickets
- Number sequentially: T001, T002, etc.

Next command: `quad-write` to generate code

[End QUAD Ticket Creation]"""

    elif command == "quad-write":
        # quad-write - Generate code
        return """[QUAD Code Generation]

Read .quad/tickets/ and generate code.

═══════════════════════════════════════════════════════════════════
FOLLOW TECH STACK FROM .quad/project.json
═══════════════════════════════════════════════════════════════════

### Spring Boot Backend
```
src/main/java/com/project/
├── config/           # Configuration
├── controller/       # REST controllers
├── service/          # Business logic
├── repository/       # Data access
├── model/            # Entities
│   ├── entity/       # JPA entities
│   └── dto/          # Data transfer objects
└── exception/        # Error handling
```

### Node.js/Express Backend
```
src/
├── config/           # Configuration
├── routes/           # API routes
├── controllers/      # Request handlers
├── services/         # Business logic
├── models/           # Database models
├── middleware/       # Express middleware
└── utils/            # Utilities
```

### Next.js Frontend
```
src/
├── app/              # App router
├── components/       # React components
│   ├── ui/           # UI primitives
│   └── features/     # Feature components
├── lib/              # Utilities
├── hooks/            # Custom hooks
└── types/            # TypeScript types
```

═══════════════════════════════════════════════════════════════════
GENERATION ORDER (PGCE)
═══════════════════════════════════════════════════════════════════
1. Database migrations/schema
2. Backend models/entities
3. Backend repositories/DAOs
4. Backend services
5. Backend controllers/routes
6. Frontend API client
7. Frontend components
8. Frontend pages

═══════════════════════════════════════════════════════════════════
CODE STANDARDS
═══════════════════════════════════════════════════════════════════
- TypeScript for all new code
- Proper error handling
- No hardcoded secrets
- Follow existing patterns in codebase

[End QUAD Code Generation]"""

    elif command == "quad-cleanup":
        # Get project name from args or detect from .quad/
        project_name = args.strip() if args else None
        project_context = ""
        save_path = ""

        # Find project directory
        if project_name:
            # Look in quad-projects folder
            quad_projects = Path.cwd() / "QUAD" / "quad-projects" / project_name
            if not quad_projects.exists():
                quad_projects = Path.cwd() / "quad-projects" / project_name
            if quad_projects.exists():
                quad_dir = quad_projects / ".quad"
                save_path = f"QUAD/quad-projects/{project_name}/.quad/session-summary.md"
            else:
                return f"Error: Project '{project_name}' not found in quad-projects/"
        else:
            # Check current directory for .quad/
            quad_dir = Path.cwd() / ".quad"
            save_path = ".quad/session-summary.md"

        # Read project.json if exists
        if quad_dir.exists():
            project_file = quad_dir / "project.json"
            if project_file.exists():
                try:
                    with open(project_file) as f:
                        project_context = f"Current project:\n{f.read()}\n"
                except Exception:
                    pass

        return f"""[QUAD Cleanup Request]
Project: {project_name or 'current directory'}
Save to: {save_path}

{project_context}
Please help me clean up this conversation session:

1. **Summarize** the key decisions and outcomes from our conversation
2. **Save** the summary to `{save_path}` with:
   - Decisions made
   - Current project state
   - Pending tasks
   - Important context to preserve
3. **Tell me** to run `/compact` to reduce context size

After saving, future sessions working on this project will read the summary
to restore context without the full conversation history.

[End QUAD Cleanup Request]"""

    elif command == "quad-chart":
        # quad-chart <type> [domain]
        # Types: pgce, allocation, features
        chart_args = args.split() if args else []
        chart_type = chart_args[0] if chart_args else "pgce"
        chart_domain = chart_args[1] if len(chart_args) > 1 else domain

        if not chart_domain:
            return "Error: No domain specified. Usage: quad-chart <pgce|allocation|features> [domain]"

        endpoint_map = {
            "pgce": "/viz/pgce",
            "priority": "/viz/pgce",
            "allocation": "/viz/allocation",
            "team": "/viz/allocation",
            "features": "/viz/features",
            "table": "/viz/features"
        }

        endpoint = endpoint_map.get(chart_type, "/viz/pgce")
        result = get_visualization(endpoint, chart_domain)

        if result.get("success"):
            data = result["data"]
            # Return ASCII output for CLI
            ascii_key = "ascii" if "ascii" in data else "markdown" if "markdown" in data else None
            if ascii_key:
                return f"""[QUAD Chart: {data.get('title', chart_type)}]

{data[ascii_key]}

[End Chart]"""
            else:
                return f"Chart data: {json.dumps(data, indent=2)}"
        else:
            return f"[QUAD Chart Error: {result.get('error', 'Unknown error')}]"

    elif command == "quad-notify" or command == "quad-notifications":
        # quad-notify [domain]
        notify_domain = args.strip() if args else domain

        if not notify_domain:
            return "Error: No domain specified. Usage: quad-notify [domain]"

        result = get_visualization("/notifications", notify_domain)

        if result.get("success"):
            data = result["data"]
            return f"""[QUAD Notifications]

{data.get('cli', 'No notifications')}

[End Notifications]"""
        else:
            return f"[QUAD Notifications Error: {result.get('error', 'Unknown error')}]"

    elif command == "quad-help":
        return """QUAD Commands:
  quad-init <name>          - Initialize new project
  quad-plan                 - Generate feature plan (PGCE)
  quad-story                - Create user stories
  quad-ticket               - Create development tickets
  quad-write                - Generate code
  quad-cleanup [project]    - Summarize session for project
  quad-question <question>  - Ask with org context
  quad-team                 - Show team members
  quad-status               - Show project status
  quad-availability         - Show availability
  quad-stats                - Show token usage stats

Visualization Commands:
  quad-chart pgce [domain]       - PGCE priority pie chart
  quad-chart allocation [domain] - Team allocation chart
  quad-chart features [domain]   - Feature priority table
  quad-notify [domain]           - Show notifications

Context Files:
  CLAUDE.md                 - Repo-level rules (auto-loaded)
  .quad/project.json        - Project configuration
  .quad/session-summary.md  - Previous session context

Configuration:
  Set QUAD_API_URL, QUAD_API_KEY, QUAD_DOMAIN env vars
  Or create ~/.quad/config.json with domain_slug"""

    else:
        # Unknown quad command, pass through with general context
        # But first, check for session summary to restore context
        session_context = ""
        quad_dir = Path.cwd() / ".quad"
        if quad_dir.exists():
            summary_file = quad_dir / "session-summary.md"
            if summary_file.exists():
                try:
                    with open(summary_file) as f:
                        session_context = f"\n[Previous Session Context]\n{f.read()}\n[End Previous Session]\n\n"
                except Exception:
                    pass

        result = get_context(session_context + prompt, domain)

    # Return enhanced prompt or error
    if result.get("success"):
        return result.get("prompt_addition", prompt)
    else:
        error = result.get("error", "Unknown error")
        # On error, return original prompt with warning
        return f"[QUAD API unavailable: {error}]\n\n{prompt}"


def main():
    if len(sys.argv) < 2:
        print("Usage: quad-context-hook.py <prompt> [--post]", file=sys.stderr)
        sys.exit(1)

    # Check for post-hook mode (called after response)
    is_post = "--post" in sys.argv
    prompt = sys.argv[1]

    if is_post:
        # Post-hook: log the response
        response_text = prompt  # In post-hook, this is the response
        log_request("", response_text, "response", phase="post")
        # Don't print anything in post-hook (passthrough)
        return

    # Pre-hook: Check if this is a quad-* command
    is_quad = prompt.strip().lower().startswith(("quad-", "quad "))

    if is_quad:
        command = prompt.strip().split()[0].lower()
        if command == "quad":
            command = "quad-" + prompt.strip().split()[1].lower() if len(prompt.strip().split()) > 1 else "quad"
        enhanced = process_command(prompt)

        # Log QUAD request with context
        log_request(prompt, enhanced, command, phase="pre", is_quad=True)
        print(enhanced)
    else:
        # Non-QUAD request - log but don't enrich
        log_request(prompt, prompt, "general", phase="pre", is_quad=False)
        print(prompt)


if __name__ == "__main__":
    main()
