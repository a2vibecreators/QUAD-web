/**
 * Prisma Seed Script - QUAD Framework Core Data
 *
 * Seeds:
 * - QUAD_core_roles: Master list of role templates
 * - QUAD Portal Organization: Platform admin org (invisible)
 * - Test Organizations: NutriNine Test, A2Vibes Test
 * - Portal Access: suman@quadframe.work as PORTAL_OWNER
 */

import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Core Roles - Master list that organizations can select from
const CORE_ROLES = [
  // ADMIN CATEGORY - Platform and Org level
  {
    role_code: 'QUAD_ADMIN',
    role_name: 'QUAD Administrator',
    category: 'ADMIN',
    description: 'Platform super admin - manages all organizations (internal only)',
    hierarchy_level: 100,
    can_manage_org: true,
    can_manage_users: true,
    can_manage_domains: true,
    can_manage_flows: true,
    can_view_all_metrics: true,
    can_manage_circles: true,
    can_manage_resources: true,
    can_delete_domain: true,
    q_participation: 'REVIEW',
    u_participation: 'REVIEW',
    a_participation: 'REVIEW',
    d_participation: 'REVIEW',
    color_code: '#FF0000',
    icon_name: 'shield-star',
    display_order: 1,
  },
  {
    role_code: 'ORG_ADMIN',
    role_name: 'Organization Admin',
    category: 'ADMIN',
    description: 'Organization administrator - full control over org settings and users',
    hierarchy_level: 90,
    can_manage_org: true,
    can_manage_users: true,
    can_manage_domains: true,
    can_manage_flows: true,
    can_view_all_metrics: true,
    can_manage_circles: true,
    can_manage_resources: true,
    can_delete_domain: true,
    q_participation: 'REVIEW',
    u_participation: 'REVIEW',
    a_participation: 'REVIEW',
    d_participation: 'REVIEW',
    color_code: '#E91E63',
    icon_name: 'shield-account',
    display_order: 2,
  },
  {
    role_code: 'DOMAIN_ADMIN',
    role_name: 'Domain Admin',
    category: 'ADMIN',
    description: 'Domain administrator - manages domain/project settings, can soft-delete domain',
    hierarchy_level: 80,
    can_manage_org: false,
    can_manage_users: true,
    can_manage_domains: true,
    can_manage_flows: true,
    can_view_all_metrics: true,
    can_manage_circles: true,
    can_manage_resources: true,
    can_delete_domain: true,
    q_participation: 'PRIMARY',
    u_participation: 'REVIEW',
    a_participation: 'REVIEW',
    d_participation: 'REVIEW',
    color_code: '#9C27B0',
    icon_name: 'folder-account',
    display_order: 3,
  },

  // MANAGEMENT CATEGORY - Leadership roles
  {
    role_code: 'ORG_HEAD',
    role_name: 'Organization Head',
    category: 'MANAGEMENT',
    description: 'Organization head/director - strategic oversight, no admin privileges',
    hierarchy_level: 85,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: true,
    can_view_all_metrics: true,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'REVIEW',
    u_participation: 'INFORM',
    a_participation: 'REVIEW',
    d_participation: 'REVIEW',
    color_code: '#673AB7',
    icon_name: 'account-tie',
    display_order: 10,
  },
  {
    role_code: 'DOMAIN_HEAD',
    role_name: 'Domain Head',
    category: 'MANAGEMENT',
    description: 'Domain/project head - leads domain, manages circles, cannot delete domain',
    hierarchy_level: 75,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: true,
    can_view_all_metrics: true,
    can_manage_circles: true,
    can_manage_resources: true,
    can_delete_domain: false,
    q_participation: 'PRIMARY',
    u_participation: 'REVIEW',
    a_participation: 'REVIEW',
    d_participation: 'REVIEW',
    color_code: '#3F51B5',
    icon_name: 'account-supervisor',
    display_order: 11,
  },
  {
    role_code: 'PROJECT_MANAGER',
    role_name: 'Project Manager',
    category: 'MANAGEMENT',
    description: 'Project manager - coordinates work, manages timelines and resources',
    hierarchy_level: 70,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: true,
    can_view_all_metrics: true,
    can_manage_circles: false,
    can_manage_resources: true,
    can_delete_domain: false,
    q_participation: 'PRIMARY',
    u_participation: 'PRIMARY',
    a_participation: 'REVIEW',
    d_participation: 'REVIEW',
    color_code: '#2196F3',
    icon_name: 'clipboard-account',
    display_order: 12,
  },
  {
    role_code: 'TEAM_LEAD',
    role_name: 'Team Lead',
    category: 'MANAGEMENT',
    description: 'Team lead - leads a circle/team, assigns work to developers',
    hierarchy_level: 60,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: true,
    can_view_all_metrics: false,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'SUPPORT',
    u_participation: 'PRIMARY',
    a_participation: 'PRIMARY',
    d_participation: 'REVIEW',
    color_code: '#03A9F4',
    icon_name: 'account-group',
    display_order: 13,
  },

  // BUSINESS CATEGORY - Business analysis and requirements
  {
    role_code: 'BUSINESS_ANALYST',
    role_name: 'Business Analyst',
    category: 'BUSINESS',
    description: 'Business analyst - gathers requirements, creates user stories',
    hierarchy_level: 55,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: true,
    can_view_all_metrics: true,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'PRIMARY',  // Question stage is their main focus
    u_participation: 'SUPPORT',
    a_participation: 'INFORM',
    d_participation: 'INFORM',
    color_code: '#00BCD4',
    icon_name: 'file-document-edit',
    display_order: 20,
  },
  {
    role_code: 'PRODUCT_OWNER',
    role_name: 'Product Owner',
    category: 'BUSINESS',
    description: 'Product owner - prioritizes backlog, accepts deliverables',
    hierarchy_level: 65,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: true,
    can_view_all_metrics: true,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'PRIMARY',
    u_participation: 'REVIEW',
    a_participation: 'PRIMARY',
    d_participation: 'REVIEW',
    color_code: '#009688',
    icon_name: 'account-check',
    display_order: 21,
  },

  // TECHNICAL CATEGORY - Development roles
  {
    role_code: 'DEVELOPER',
    role_name: 'Developer',
    category: 'TECHNICAL',
    description: 'Full-stack developer - writes code across all layers',
    hierarchy_level: 40,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: false,
    can_view_all_metrics: false,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'INFORM',
    u_participation: 'PRIMARY',
    a_participation: 'SUPPORT',
    d_participation: 'SUPPORT',
    color_code: '#4CAF50',
    icon_name: 'code-braces',
    display_order: 30,
  },
  {
    role_code: 'UI_DEVELOPER',
    role_name: 'UI Developer',
    category: 'TECHNICAL',
    description: 'UI/Frontend developer - React, Angular, Vue, mobile UI',
    hierarchy_level: 40,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: false,
    can_view_all_metrics: false,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'INFORM',
    u_participation: 'PRIMARY',
    a_participation: 'SUPPORT',
    d_participation: 'SUPPORT',
    color_code: '#8BC34A',
    icon_name: 'cellphone-link',
    display_order: 31,
  },
  {
    role_code: 'BACKEND_DEVELOPER',
    role_name: 'Backend Developer',
    category: 'TECHNICAL',
    description: 'Backend developer - APIs, services, business logic',
    hierarchy_level: 40,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: false,
    can_view_all_metrics: false,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'INFORM',
    u_participation: 'PRIMARY',
    a_participation: 'SUPPORT',
    d_participation: 'SUPPORT',
    color_code: '#CDDC39',
    icon_name: 'server',
    display_order: 32,
  },
  {
    role_code: 'DATABASE_DEVELOPER',
    role_name: 'Database Developer',
    category: 'TECHNICAL',
    description: 'Database developer - schema design, queries, optimization',
    hierarchy_level: 40,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: false,
    can_view_all_metrics: false,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'INFORM',
    u_participation: 'PRIMARY',
    a_participation: 'SUPPORT',
    d_participation: 'SUPPORT',
    color_code: '#FFEB3B',
    icon_name: 'database',
    display_order: 33,
  },
  {
    role_code: 'ETL_DEVELOPER',
    role_name: 'ETL Developer',
    category: 'TECHNICAL',
    description: 'ETL developer - data pipelines, batch processing, data integration',
    hierarchy_level: 40,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: false,
    can_view_all_metrics: false,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'INFORM',
    u_participation: 'PRIMARY',
    a_participation: 'SUPPORT',
    d_participation: 'SUPPORT',
    color_code: '#FFC107',
    icon_name: 'swap-horizontal',
    display_order: 34,
  },
  {
    role_code: 'BATCH_DEVELOPER',
    role_name: 'Batch Developer',
    category: 'TECHNICAL',
    description: 'Batch developer - scheduled jobs, background processing',
    hierarchy_level: 40,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: false,
    can_view_all_metrics: false,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'INFORM',
    u_participation: 'PRIMARY',
    a_participation: 'SUPPORT',
    d_participation: 'SUPPORT',
    color_code: '#FF9800',
    icon_name: 'timer-sand',
    display_order: 35,
  },
  {
    role_code: 'DEVOPS_ENGINEER',
    role_name: 'DevOps Engineer',
    category: 'TECHNICAL',
    description: 'DevOps engineer - CI/CD, infrastructure, deployments',
    hierarchy_level: 45,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: false,
    can_view_all_metrics: false,
    can_manage_circles: false,
    can_manage_resources: true,
    can_delete_domain: false,
    q_participation: 'INFORM',
    u_participation: 'SUPPORT',
    a_participation: 'SUPPORT',
    d_participation: 'PRIMARY',  // Deploy stage is their focus
    color_code: '#FF5722',
    icon_name: 'rocket-launch',
    display_order: 36,
  },

  // QA CATEGORY - Quality assurance
  {
    role_code: 'QA_ENGINEER',
    role_name: 'QA Engineer',
    category: 'QA',
    description: 'QA engineer - testing, quality assurance, bug verification',
    hierarchy_level: 42,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: false,
    can_view_all_metrics: false,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'INFORM',
    u_participation: 'SUPPORT',
    a_participation: 'PRIMARY',  // Accept stage is their focus
    d_participation: 'SUPPORT',
    color_code: '#795548',
    icon_name: 'test-tube',
    display_order: 40,
  },
  {
    role_code: 'QA_LEAD',
    role_name: 'QA Lead',
    category: 'QA',
    description: 'QA lead - leads QA team, test planning, quality metrics',
    hierarchy_level: 55,
    can_manage_org: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: true,
    can_view_all_metrics: true,
    can_manage_circles: false,
    can_manage_resources: false,
    can_delete_domain: false,
    q_participation: 'SUPPORT',
    u_participation: 'SUPPORT',
    a_participation: 'PRIMARY',
    d_participation: 'REVIEW',
    color_code: '#607D8B',
    icon_name: 'shield-check',
    display_order: 41,
  },
];

async function main() {
  console.log('🌱 Seeding QUAD Framework core data...\n');

  // Seed Core Roles
  console.log('📋 Seeding Core Roles...');
  for (const role of CORE_ROLES) {
    const existing = await prisma.qUAD_core_roles.findUnique({
      where: { role_code: role.role_code }
    });

    if (existing) {
      console.log(`  ⏭️  ${role.role_code} already exists, skipping`);
    } else {
      await prisma.qUAD_core_roles.create({ data: role });
      console.log(`  ✅ Created ${role.role_code}`);
    }
  }

  console.log(`\n✅ Core roles seeded: ${CORE_ROLES.length} roles\n`);

  // ==========================================================================
  // PORTAL ORGANIZATION
  // ==========================================================================
  console.log('🏢 Seeding Portal Organization...');

  // Find or create portal admin user
  let portalUser = await prisma.qUAD_users.findUnique({
    where: { email: 'suman@quadframe.work' }
  });

  // Create QUAD Portal Organization first (needed for user creation)
  let portalOrg = await prisma.qUAD_organizations.findFirst({
    where: { org_type: 'PORTAL' }
  });

  if (!portalOrg) {
    portalOrg = await prisma.qUAD_organizations.create({
      data: {
        name: 'QUAD Portal',
        slug: 'portal',
        admin_email: 'suman@quadframe.work',
        description: 'QUAD Framework platform administration and testing',
        size: 'small',
        org_type: 'PORTAL',
        is_visible: false, // Hidden from org listings
        is_active: true,
      }
    });
    console.log('  ✅ Created QUAD Portal organization');
  } else {
    console.log('  ⏭️  QUAD Portal organization already exists');
  }

  // Create portal admin user if not exists
  if (!portalUser) {
    const hashedPassword = await bcrypt.hash('portal-admin-temp-123', 10);
    portalUser = await prisma.qUAD_users.create({
      data: {
        email: 'suman@quadframe.work',
        password_hash: hashedPassword,
        full_name: 'Suman Addanki',
        org_id: portalOrg.id,
        role: 'ADMIN',
        is_active: true,
        email_verified: true,
      }
    });
    console.log('  ✅ Created portal admin user: suman@quadframe.work');
  } else {
    console.log('  ⏭️  Portal admin user already exists');
  }

  // Create org membership for portal user
  const portalMembership = await prisma.qUAD_org_members.findFirst({
    where: { org_id: portalOrg.id, user_id: portalUser.id }
  });

  if (!portalMembership) {
    await prisma.qUAD_org_members.create({
      data: {
        org_id: portalOrg.id,
        user_id: portalUser.id,
        role: 'OWNER',
        is_primary: true,
        is_active: true,
      }
    });
    console.log('  ✅ Created org membership for portal admin');
  }

  // Grant portal access
  const existingAccess = await prisma.qUAD_portal_access.findUnique({
    where: { user_id: portalUser.id }
  });

  if (!existingAccess) {
    await prisma.qUAD_portal_access.create({
      data: {
        user_id: portalUser.id,
        portal_role: 'PORTAL_OWNER',
        can_view_all_orgs: true,
        can_impersonate: true,
        can_manage_billing: true,
        can_manage_ai_pool: true,
        can_access_test_orgs: true,
        is_active: true,
      }
    });
    console.log('  ✅ Granted PORTAL_OWNER access to suman@quadframe.work');
  } else {
    console.log('  ⏭️  Portal access already exists');
  }

  // ==========================================================================
  // TEST ORGANIZATIONS
  // ==========================================================================
  console.log('\n🧪 Seeding Test Organizations...');

  // NutriNine Test Org
  let nutriNineTestOrg = await prisma.qUAD_organizations.findFirst({
    where: { slug: 'nutrinine-test' }
  });

  if (!nutriNineTestOrg) {
    nutriNineTestOrg = await prisma.qUAD_organizations.create({
      data: {
        name: 'NutriNine Test',
        slug: 'nutrinine-test',
        admin_email: 'suman@quadframe.work',
        description: 'Test organization for nutrinine.ai - health tracking domain testing',
        size: 'small',
        org_type: 'TEST',
        is_visible: false,
        is_active: true,
      }
    });
    console.log('  ✅ Created NutriNine Test organization');

    // Add portal admin as member
    await prisma.qUAD_org_members.create({
      data: {
        org_id: nutriNineTestOrg.id,
        user_id: portalUser.id,
        role: 'OWNER',
        is_primary: false,
        is_active: true,
      }
    });
  } else {
    console.log('  ⏭️  NutriNine Test organization already exists');
  }

  // A2Vibes Test Org
  let a2VibesTestOrg = await prisma.qUAD_organizations.findFirst({
    where: { slug: 'a2vibes-test' }
  });

  if (!a2VibesTestOrg) {
    a2VibesTestOrg = await prisma.qUAD_organizations.create({
      data: {
        name: 'A2Vibes Test',
        slug: 'a2vibes-test',
        admin_email: 'suman@quadframe.work',
        description: 'Test organization for a2vibes.life - lifestyle project testing',
        size: 'small',
        org_type: 'TEST',
        is_visible: false,
        is_active: true,
      }
    });
    console.log('  ✅ Created A2Vibes Test organization');

    // Add portal admin as member
    await prisma.qUAD_org_members.create({
      data: {
        org_id: a2VibesTestOrg.id,
        user_id: portalUser.id,
        role: 'OWNER',
        is_primary: false,
        is_active: true,
      }
    });
  } else {
    console.log('  ⏭️  A2Vibes Test organization already exists');
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n✨ Seed completed!');
  console.log('   - Core roles: ' + CORE_ROLES.length);
  console.log('   - Portal org: QUAD Portal (hidden)');
  console.log('   - Test orgs: NutriNine Test, A2Vibes Test');
  console.log('   - Portal admin: suman@quadframe.work (PORTAL_OWNER)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
