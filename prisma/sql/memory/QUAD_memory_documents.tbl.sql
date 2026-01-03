-- QUAD_memory_documents Table
-- Stores hierarchical memory content for AI context management
--
-- Hierarchy Levels:
--   ORG → DOMAIN → PROJECT → CIRCLE → USER
--
-- Each level can have multiple documents (architecture, conventions, etc.)
--
-- Part of: QUAD Memory Management System
-- Created: January 2026
-- Last Modified: January 3, 2026

CREATE TABLE IF NOT EXISTS QUAD_memory_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Memory hierarchy (only one should be set)
    org_id          UUID REFERENCES QUAD_organizations(id) ON DELETE CASCADE,
    domain_id       UUID REFERENCES QUAD_domains(id) ON DELETE CASCADE,
    project_id      UUID,  -- Would reference QUAD_projects if exists
    circle_id       UUID REFERENCES QUAD_circles(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES QUAD_users(id) ON DELETE CASCADE,

    -- Document metadata
    title           VARCHAR(255) NOT NULL,
    document_type   VARCHAR(50) NOT NULL DEFAULT 'general',
    -- Types: architecture, conventions, api_patterns, business_rules,
    --        tech_stack, testing_standards, deployment, security, general

    -- Content
    content         TEXT NOT NULL,       -- Full document content
    summary         TEXT,                -- AI-generated summary (~500 tokens)
    keywords        TEXT[] DEFAULT '{}', -- Extracted keywords for search

    -- Token tracking
    token_count     INTEGER DEFAULT 0,   -- Estimated tokens in content
    summary_tokens  INTEGER DEFAULT 0,   -- Tokens in summary

    -- Versioning
    version         INTEGER DEFAULT 1,
    last_editor_id  UUID REFERENCES QUAD_users(id),
    edit_reason     VARCHAR(255),

    -- Status
    is_active       BOOLEAN DEFAULT true,
    is_auto_generated BOOLEAN DEFAULT false, -- True if AI created from MOM/tickets

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for hierarchical lookup
CREATE INDEX IF NOT EXISTS idx_quad_memory_docs_org ON QUAD_memory_documents(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quad_memory_docs_domain ON QUAD_memory_documents(domain_id) WHERE domain_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quad_memory_docs_circle ON QUAD_memory_documents(circle_id) WHERE circle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quad_memory_docs_user ON QUAD_memory_documents(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quad_memory_docs_type ON QUAD_memory_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_quad_memory_docs_active ON QUAD_memory_documents(is_active);

-- GIN index for keyword search
CREATE INDEX IF NOT EXISTS idx_quad_memory_docs_keywords ON QUAD_memory_documents USING GIN(keywords);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_quad_memory_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quad_memory_documents_updated ON QUAD_memory_documents;
CREATE TRIGGER trg_quad_memory_documents_updated
    BEFORE UPDATE ON QUAD_memory_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_quad_memory_documents_timestamp();

-- Check constraint: exactly one hierarchy level should be set
-- (Implemented in application layer for Prisma compatibility)

-- Comments
COMMENT ON TABLE QUAD_memory_documents IS 'Hierarchical memory documents for AI context';
COMMENT ON COLUMN QUAD_memory_documents.document_type IS 'Category: architecture, conventions, api_patterns, etc.';
COMMENT ON COLUMN QUAD_memory_documents.keywords IS 'Extracted keywords for fast search';
COMMENT ON COLUMN QUAD_memory_documents.token_count IS 'Estimated OpenAI tokens in content';
