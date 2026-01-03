-- QUAD_organizations Table
-- Core organization entity with hierarchical support
--
-- Parent Structure:
--   parent_id = NULL → Root organization
--   parent_id != NULL → Sub-organization (nested under parent)
--
-- Path Example: /acme/engineering/frontend
--
-- Created: January 2026
-- Last Modified: January 3, 2026

CREATE TABLE IF NOT EXISTS QUAD_organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID REFERENCES QUAD_organizations(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) UNIQUE,
    admin_email     VARCHAR(255) NOT NULL,
    description     TEXT,
    size            VARCHAR(50) DEFAULT 'medium',
    tier_id         UUID REFERENCES QUAD_org_tiers(id) ON DELETE SET NULL,
    path            VARCHAR(500), -- Materialized path: /parent/child/grandchild
    is_active       BOOLEAN DEFAULT true,

    -- Portal organization support
    org_type        VARCHAR(20) DEFAULT 'CUSTOMER',
    -- CUSTOMER = normal customer org
    -- PORTAL = system portal org (platform admin access)
    -- TEST = internal testing org
    -- DEMO = demo/showcase org
    is_visible      BOOLEAN DEFAULT true, -- false hides from org listings

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quad_organizations_tier_id ON QUAD_organizations(tier_id);
CREATE INDEX IF NOT EXISTS idx_quad_organizations_slug ON QUAD_organizations(slug);
CREATE INDEX IF NOT EXISTS idx_quad_organizations_parent_id ON QUAD_organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_quad_organizations_org_type ON QUAD_organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_quad_organizations_path ON QUAD_organizations(path);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_quad_organizations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quad_organizations_updated ON QUAD_organizations;
CREATE TRIGGER trg_quad_organizations_updated
    BEFORE UPDATE ON QUAD_organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_quad_organizations_timestamp();

-- Comments
COMMENT ON TABLE QUAD_organizations IS 'Core organization entity with hierarchical sub-org support';
COMMENT ON COLUMN QUAD_organizations.parent_id IS 'NULL for root orgs, references parent for sub-orgs';
COMMENT ON COLUMN QUAD_organizations.path IS 'Materialized path for fast hierarchy queries';
COMMENT ON COLUMN QUAD_organizations.org_type IS 'CUSTOMER, PORTAL, TEST, or DEMO';
