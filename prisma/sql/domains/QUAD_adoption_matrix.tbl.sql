-- Table: QUAD_adoption_matrix
-- Section: domains
-- Purpose: Track user position on Skill × Trust matrix for AI adoption
-- Also tracks multi-agent preferences, AI platform preferences, and external tool usage
-- Updated: January 2026

CREATE TABLE IF NOT EXISTS "QUAD_adoption_matrix" (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL UNIQUE,

    -- ========================================================================
    -- SKILL × TRUST MATRIX (Original)
    -- ========================================================================
    -- Position on the 3×3 (extensible to 5×5) adoption matrix
    skill_level          INT NOT NULL DEFAULT 1,    -- 1-3: Beginner, Intermediate, Expert
    trust_level          INT NOT NULL DEFAULT 1,    -- 1-3: Low, Medium, High
    previous_skill_level INT,
    previous_trust_level INT,
    level_changed_at     TIMESTAMP WITH TIME ZONE,

    -- ========================================================================
    -- MULTI-AGENT PREFERENCES
    -- ========================================================================
    -- Which AI agents does the user prefer/enable?
    agent_developer_enabled     BOOLEAN NOT NULL DEFAULT true,  -- Code generation agent
    agent_reviewer_enabled      BOOLEAN NOT NULL DEFAULT true,  -- Code review agent
    agent_tester_enabled        BOOLEAN NOT NULL DEFAULT false, -- Test generation agent
    agent_docs_enabled          BOOLEAN NOT NULL DEFAULT true,  -- Documentation agent
    agent_devops_enabled        BOOLEAN NOT NULL DEFAULT false, -- Deployment agent
    agent_scrum_master_enabled  BOOLEAN NOT NULL DEFAULT false, -- Virtual Scrum Master

    -- Agent autonomy level: 'supervised', 'semi_autonomous', 'autonomous'
    agent_autonomy_level        VARCHAR(20) NOT NULL DEFAULT 'supervised',

    -- Preferred agent for different tasks (JSON for flexibility)
    -- { "code_gen": "developer", "review": "reviewer", "docs": "docs" }
    agent_task_preferences      JSONB,

    -- ========================================================================
    -- AI PLATFORM PREFERENCES
    -- ========================================================================
    -- Preferred AI provider for different task types
    ai_provider_code            VARCHAR(20) NOT NULL DEFAULT 'claude',  -- claude, gemini, deepseek
    ai_provider_review          VARCHAR(20) NOT NULL DEFAULT 'claude',
    ai_provider_docs            VARCHAR(20) NOT NULL DEFAULT 'gemini',
    ai_provider_chat            VARCHAR(20) NOT NULL DEFAULT 'gemini',
    ai_provider_extraction      VARCHAR(20) NOT NULL DEFAULT 'groq',

    -- Cost/Quality preference: 'turbo', 'balanced', 'quality'
    ai_tier_preference          VARCHAR(20) NOT NULL DEFAULT 'balanced',

    -- Response language preference
    ai_response_language        VARCHAR(20) NOT NULL DEFAULT 'english',

    -- ========================================================================
    -- PLATFORM PREFERENCES
    -- ========================================================================
    -- External platform preferences (for complementary use)
    uses_antigravity            BOOLEAN NOT NULL DEFAULT false, -- Uses Google Antigravity
    uses_cursor                 BOOLEAN NOT NULL DEFAULT false, -- Uses Cursor IDE
    uses_copilot                BOOLEAN NOT NULL DEFAULT false, -- Uses GitHub Copilot
    preferred_ide               VARCHAR(20) NOT NULL DEFAULT 'vscode', -- vscode, jetbrains, vim, etc.

    -- Notes
    notes                       TEXT,

    -- Metadata
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_adoption_user FOREIGN KEY (user_id)
        REFERENCES "QUAD_users"(id) ON DELETE CASCADE,
    CONSTRAINT chk_skill_level CHECK (skill_level BETWEEN 1 AND 5),
    CONSTRAINT chk_trust_level CHECK (trust_level BETWEEN 1 AND 5),
    CONSTRAINT chk_autonomy_level CHECK (agent_autonomy_level IN ('supervised', 'semi_autonomous', 'autonomous')),
    CONSTRAINT chk_ai_tier CHECK (ai_tier_preference IN ('turbo', 'balanced', 'quality'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quad_adoption_matrix_user ON "QUAD_adoption_matrix"(user_id);
CREATE INDEX IF NOT EXISTS idx_quad_adoption_matrix_levels ON "QUAD_adoption_matrix"(skill_level, trust_level);
CREATE INDEX IF NOT EXISTS idx_quad_adoption_matrix_autonomy ON "QUAD_adoption_matrix"(agent_autonomy_level);
CREATE INDEX IF NOT EXISTS idx_quad_adoption_matrix_tier ON "QUAD_adoption_matrix"(ai_tier_preference);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_quad_adoption_matrix_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quad_adoption_matrix_updated ON "QUAD_adoption_matrix";
CREATE TRIGGER trg_quad_adoption_matrix_updated
    BEFORE UPDATE ON "QUAD_adoption_matrix"
    FOR EACH ROW
    EXECUTE FUNCTION update_quad_adoption_matrix_timestamp();

-- Comments
COMMENT ON TABLE "QUAD_adoption_matrix" IS 'Tracks user position on Skill × Trust matrix, multi-agent preferences, AI provider preferences, and external platform usage';
COMMENT ON COLUMN "QUAD_adoption_matrix".skill_level IS '1=Beginner, 2=Intermediate, 3=Expert (extensible to 5)';
COMMENT ON COLUMN "QUAD_adoption_matrix".trust_level IS '1=Low Trust, 2=Medium Trust, 3=High Trust (extensible to 5)';
COMMENT ON COLUMN "QUAD_adoption_matrix".agent_autonomy_level IS 'supervised=human approves, semi_autonomous=auto with alerts, autonomous=full auto';
COMMENT ON COLUMN "QUAD_adoption_matrix".ai_tier_preference IS 'turbo=cheapest/fastest, balanced=mix, quality=best models';
