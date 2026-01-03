/**
 * Default Memory Templates for QUAD Framework
 *
 * Run with: npx tsx prisma/seeds/memory-templates.ts
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

const templates = [
  {
    template_name: 'Standard Organization Memory',
    memory_level: 'org',
    template_type: 'default',
    is_default: true,
    sections: [
      { id: 'overview', title: 'Overview', required: true },
      { id: 'tech_stack', title: 'Tech Stack', required: true },
      { id: 'coding_standards', title: 'Coding Standards', required: false },
      { id: 'architecture', title: 'Architecture Patterns', required: false },
      { id: 'integrations', title: 'External Integrations', required: false },
    ],
    content_template: `# {{ORG_NAME}} Organization Memory

## Overview
- **Organization**: {{ORG_NAME}}
- **Industry**: {{INDUSTRY}}
- **Team Size**: {{TEAM_SIZE}}

*This memory captures organization-wide context for AI interactions.*

## Tech Stack

### Frontend
- {{FRONTEND_STACK}}

### Backend
- {{BACKEND_STACK}}

### Database
- {{DATABASE_STACK}}

### Infrastructure
- {{INFRA_STACK}}

## Coding Standards

### General Guidelines
- *Add coding standards here*

### Code Review Checklist
- [ ] Type safety
- [ ] Error handling
- [ ] Tests included
- [ ] Documentation updated

## Architecture Patterns

### Preferred Patterns
- *Add architecture patterns here*

### Anti-Patterns to Avoid
- *Add anti-patterns here*

## External Integrations

### Active Integrations
- *List external services here*

---
*Last updated: {{UPDATED_AT}}*
`,
  },
  {
    template_name: 'Standard Domain Memory',
    memory_level: 'domain',
    template_type: 'default',
    is_default: true,
    sections: [
      { id: 'overview', title: 'Domain Overview', required: true },
      { id: 'business_logic', title: 'Business Logic', required: true },
      { id: 'data_model', title: 'Data Model', required: true },
      { id: 'api_endpoints', title: 'API Endpoints', required: false },
    ],
    content_template: `# {{DOMAIN_NAME}} Domain Memory

## Domain Overview
- **Domain**: {{DOMAIN_NAME}}
- **Purpose**: {{DOMAIN_PURPOSE}}
- **Key Stakeholders**: {{STAKEHOLDERS}}

## Business Logic

### Core Rules
- *Add business rules here*

### Workflows
- *Describe key workflows*

## Data Model

### Key Entities
- *List main database tables/entities*

### Relationships
- *Describe entity relationships*

## API Endpoints

### Public APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/example | GET | Example endpoint |

### Internal APIs
- *List internal endpoints*

---
*Last updated: {{UPDATED_AT}}*
`,
  },
  {
    template_name: 'Standard Project Memory',
    memory_level: 'project',
    template_type: 'default',
    is_default: true,
    sections: [
      { id: 'overview', title: 'Project Overview', required: true },
      { id: 'structure', title: 'Project Structure', required: true },
      { id: 'key_files', title: 'Key Files', required: true },
      { id: 'recent_decisions', title: 'Recent Decisions', required: false },
    ],
    content_template: `# {{PROJECT_NAME}} Project Memory

## Project Overview
- **Project**: {{PROJECT_NAME}}
- **Repository**: {{REPO_URL}}
- **Status**: {{STATUS}}

## Project Structure

\`\`\`
{{PROJECT_STRUCTURE}}
\`\`\`

## Key Files

### Entry Points
- *List main entry files*

### Configuration
- *List config files*

### Core Logic
- *List important source files*

## Recent Decisions

### ADR Log
| Date | Decision | Rationale |
|------|----------|-----------|
| | | |

---
*Last updated: {{UPDATED_AT}}*
`,
  },
  {
    template_name: 'SaaS Product Template',
    memory_level: 'org',
    template_type: 'saas',
    is_default: false,
    sections: [
      { id: 'product', title: 'Product Overview', required: true },
      { id: 'tech_stack', title: 'Tech Stack', required: true },
      { id: 'multi_tenancy', title: 'Multi-Tenancy', required: true },
      { id: 'billing', title: 'Billing & Subscriptions', required: true },
      { id: 'security', title: 'Security', required: true },
    ],
    content_template: `# {{ORG_NAME}} - SaaS Organization Memory

## Product Overview
- **Product**: {{PRODUCT_NAME}}
- **Type**: B2B SaaS
- **Primary Users**: {{PRIMARY_USERS}}

## Tech Stack

### Frontend
- {{FRONTEND_STACK}}

### Backend
- {{BACKEND_STACK}}

### Database
- {{DATABASE_STACK}}

## Multi-Tenancy

### Tenant Isolation Strategy
- {{TENANT_STRATEGY}}

### Data Segregation
- *Describe how tenant data is separated*

## Billing & Subscriptions

### Payment Provider
- {{PAYMENT_PROVIDER}}

### Plans
- *List subscription plans*

## Security

### Authentication
- {{AUTH_METHOD}}

### Authorization
- *Describe RBAC/permissions*

### Compliance
- *List compliance requirements (SOC2, GDPR, etc.)*

---
*Last updated: {{UPDATED_AT}}*
`,
  },
  {
    template_name: 'User Preferences Template',
    memory_level: 'user',
    template_type: 'default',
    is_default: true,
    sections: [
      { id: 'preferences', title: 'Preferences', required: true },
      { id: 'expertise', title: 'Areas of Expertise', required: false },
      { id: 'working_style', title: 'Working Style', required: false },
    ],
    content_template: `# {{USER_NAME}} - User Preferences

## Preferences

### Communication Style
- **Verbosity**: {{VERBOSITY}}
- **Code Comment Preference**: {{COMMENT_STYLE}}

### Coding Preferences
- **Preferred Language**: {{PREFERRED_LANG}}
- **Indentation**: {{INDENTATION}}

## Areas of Expertise
- {{EXPERTISE_AREAS}}

## Working Style
- {{WORKING_STYLE}}

---
*Last updated: {{UPDATED_AT}}*
`,
  },
];

async function seedTemplates() {
  console.log('Seeding memory templates...');

  for (const template of templates) {
    const existing = await prisma.qUAD_memory_templates.findFirst({
      where: {
        template_name: template.template_name,
        memory_level: template.memory_level,
      },
    });

    if (existing) {
      console.log(`  Template "${template.template_name}" already exists, updating...`);
      await prisma.qUAD_memory_templates.update({
        where: { id: existing.id },
        data: {
          content_template: template.content_template,
          sections: template.sections,
          is_default: template.is_default,
          updated_at: new Date(),
        },
      });
    } else {
      console.log(`  Creating template "${template.template_name}"...`);
      await prisma.qUAD_memory_templates.create({
        data: template,
      });
    }
  }

  console.log('Memory templates seeded successfully!');
}

seedTemplates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
