/**
 * Codebase Indexer - Token Optimization for AI Context
 *
 * Generates a summary of the codebase that can be sent to Claude
 * instead of full file contents. Reduces tokens from 50K+ to ~500.
 *
 * Usage:
 *   await generateCodebaseIndex(orgId, '/path/to/repo')
 *   const index = await getCodebaseIndex(orgId, 'quadframework')
 */

// NOTE: Prisma removed - using stubs until Java backend ready
import * as fs from 'fs';
import * as path from 'path';

// Types
export interface CodebaseIndex {
  tables: Record<string, string>;      // table_name: description
  apis: Record<string, string>;        // "METHOD /path": description
  files: Record<string, string>;       // file_path: description
  components: Record<string, string>;  // component_name: description
  patterns: Record<string, string>;    // pattern_name: description
  architecture: string;                 // High-level overview
}

export interface IndexStats {
  fileCount: number;
  tableCount: number;
  apiCount: number;
  locCount: number;
  totalTokens: number;
  tokenSavingsPercent: number;
}

// Configuration
const IGNORE_DIRS = [
  'node_modules', '.git', '.next', 'dist', 'build',
  'coverage', '.turbo', '.vercel', 'generated'
];

const IGNORE_FILES = [
  '.env', '.env.local', 'package-lock.json', 'yarn.lock',
  'pnpm-lock.yaml', '.DS_Store', '*.log'
];

const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.prisma', '.sql', '.json', '.md'
];

/**
 * Generate a codebase index for a repository
 */
export async function generateCodebaseIndex(
  orgId: string,
  repoPath: string,
  repoName: string,
  repoUrl?: string
): Promise<IndexStats> {
  console.log(`[Indexer] Starting index generation for ${repoName}...`);

  const index: CodebaseIndex = {
    tables: {},
    apis: {},
    files: {},
    components: {},
    patterns: {},
    architecture: ''
  };

  let locCount = 0;
  let fileCount = 0;

  // 1. Index Prisma schema (tables)
  const schemaPath = path.join(repoPath, 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const { tables, count } = await indexPrismaSchema(schemaPath);
    index.tables = tables;
    console.log(`[Indexer] Found ${count} tables in Prisma schema`);
  }

  // 2. Index API routes
  const apiPath = path.join(repoPath, 'src', 'app', 'api');
  if (fs.existsSync(apiPath)) {
    const { apis, count } = await indexApiRoutes(apiPath);
    index.apis = apis;
    console.log(`[Indexer] Found ${count} API routes`);
  }

  // 3. Index source files
  const srcPath = path.join(repoPath, 'src');
  if (fs.existsSync(srcPath)) {
    const { files, components, loc, count } = await indexSourceFiles(srcPath);
    index.files = files;
    index.components = components;
    locCount = loc;
    fileCount = count;
    console.log(`[Indexer] Indexed ${count} source files (${loc} LOC)`);
  }

  // 4. Detect patterns
  index.patterns = detectPatterns(repoPath, index);

  // 5. Generate architecture summary
  index.architecture = generateArchitectureSummary(repoName, index);

  // 6. Calculate token estimate
  const indexJson = JSON.stringify(index);
  const totalTokens = Math.ceil(indexJson.length / 4); // ~4 chars per token

  // Estimate full code tokens (rough: 50 tokens per file + 10 per table)
  const fullCodeTokens = (fileCount * 500) + (Object.keys(index.tables).length * 100);
  const tokenSavingsPercent = Math.round((1 - totalTokens / fullCodeTokens) * 100);

  // 7. Get commit hash
  let commitHash: string | null = null;
  try {
    const gitHeadPath = path.join(repoPath, '.git', 'HEAD');
    if (fs.existsSync(gitHeadPath)) {
      const head = fs.readFileSync(gitHeadPath, 'utf-8').trim();
      if (head.startsWith('ref:')) {
        const refPath = path.join(repoPath, '.git', head.replace('ref: ', ''));
        if (fs.existsSync(refPath)) {
          commitHash = fs.readFileSync(refPath, 'utf-8').trim().substring(0, 40);
        }
      } else {
        commitHash = head.substring(0, 40);
      }
    }
  } catch {
    // Ignore git errors
  }

  // 8. Save to database
  // TODO: Call Java backend to save codebase index
  console.log(`[Indexer] Index generated. Tokens: ${totalTokens} (${tokenSavingsPercent}% savings)`);

  return {
    fileCount,
    tableCount: Object.keys(index.tables).length,
    apiCount: Object.keys(index.apis).length,
    locCount,
    totalTokens,
    tokenSavingsPercent
  };
}

/**
 * Get codebase index for AI context
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function getCodebaseIndex(
  orgId: string,
  repoName: string
): Promise<CodebaseIndex | null> {
  // TODO: Call Java backend to get codebase index
  console.log(`[Indexer] getCodebaseIndex for org: ${orgId}, repo: ${repoName}`);
  return null; // Return null until backend ready
}

/**
 * Format index as context string for AI
 */
export function formatIndexForAI(index: CodebaseIndex): string {
  const sections: string[] = [];

  // Architecture overview
  if (index.architecture) {
    sections.push(`## Architecture\n${index.architecture}`);
  }

  // Tables (database)
  if (Object.keys(index.tables).length > 0) {
    const tableLines = Object.entries(index.tables)
      .map(([name, desc]) => `- ${name}: ${desc}`)
      .join('\n');
    sections.push(`## Database Tables\n${tableLines}`);
  }

  // API routes
  if (Object.keys(index.apis).length > 0) {
    const apiLines = Object.entries(index.apis)
      .map(([route, desc]) => `- ${route}: ${desc}`)
      .join('\n');
    sections.push(`## API Routes\n${apiLines}`);
  }

  // Key files
  if (Object.keys(index.files).length > 0) {
    const fileLines = Object.entries(index.files)
      .slice(0, 30) // Limit to 30 most important files
      .map(([file, desc]) => `- ${file}: ${desc}`)
      .join('\n');
    sections.push(`## Key Files\n${fileLines}`);
  }

  // Components
  if (Object.keys(index.components).length > 0) {
    const compLines = Object.entries(index.components)
      .map(([name, desc]) => `- ${name}: ${desc}`)
      .join('\n');
    sections.push(`## Components\n${compLines}`);
  }

  // Patterns
  if (Object.keys(index.patterns).length > 0) {
    const patternLines = Object.entries(index.patterns)
      .map(([name, desc]) => `- ${name}: ${desc}`)
      .join('\n');
    sections.push(`## Tech Stack & Patterns\n${patternLines}`);
  }

  return sections.join('\n\n');
}

// ============================================================================
// INDEXING HELPERS
// ============================================================================

async function indexPrismaSchema(schemaPath: string): Promise<{
  tables: Record<string, string>;
  count: number;
}> {
  const tables: Record<string, string> = {};
  const content = fs.readFileSync(schemaPath, 'utf-8');

  // Match model definitions with comments
  const modelRegex = /\/\/\s*(.+?)?\n?model\s+(\w+)\s*\{([^}]+)\}/g;
  let match;

  while ((match = modelRegex.exec(content)) !== null) {
    const comment = match[1]?.trim() || '';
    const modelName = match[2];
    const modelBody = match[3];

    // Extract field names for context
    const fields = modelBody
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('@@'))
      .map(line => line.trim().split(/\s+/)[0])
      .filter(f => f && !['', '{', '}'].includes(f))
      .slice(0, 5) // First 5 fields
      .join(', ');

    const description = comment || `Fields: ${fields}`;
    tables[modelName] = description.substring(0, 100);
  }

  return { tables, count: Object.keys(tables).length };
}

async function indexApiRoutes(apiPath: string): Promise<{
  apis: Record<string, string>;
  count: number;
}> {
  const apis: Record<string, string> = {};

  function scanDir(dir: string, basePath: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const newBase = basePath + '/' + entry.name.replace(/\[(\w+)\]/g, ':$1');
        scanDir(fullPath, newBase);
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const routePath = basePath || '/';

        // Detect HTTP methods
        const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
          .filter(m => content.includes(`export async function ${m}`) ||
                       content.includes(`export function ${m}`));

        for (const method of methods) {
          const key = `${method} /api${routePath}`;
          // Try to extract first comment or function description
          const desc = extractRouteDescription(content, method);
          apis[key] = desc;
        }
      }
    }
  }

  scanDir(apiPath);
  return { apis, count: Object.keys(apis).length };
}

function extractRouteDescription(content: string, method: string): string {
  // Try to find JSDoc comment before the function
  const funcRegex = new RegExp(`\\/\\*\\*([^*]|\\*[^/])*\\*\\/\\s*export\\s+(async\\s+)?function\\s+${method}`, 'g');
  const match = funcRegex.exec(content);

  if (match) {
    const comment = match[0];
    const descMatch = comment.match(/@description\s+(.+?)(?=\n|@|\*\/)/);
    if (descMatch) return descMatch[1].trim();

    // Try first line of comment
    const firstLine = comment.match(/\/\*\*\s*\n?\s*\*?\s*(.+?)(?=\n|\*\/)/);
    if (firstLine) return firstLine[1].trim().substring(0, 80);
  }

  // Default descriptions by method
  const defaults: Record<string, string> = {
    GET: 'Fetch resource(s)',
    POST: 'Create resource',
    PUT: 'Update resource',
    PATCH: 'Partial update',
    DELETE: 'Delete resource'
  };

  return defaults[method] || 'API endpoint';
}

async function indexSourceFiles(srcPath: string): Promise<{
  files: Record<string, string>;
  components: Record<string, string>;
  loc: number;
  count: number;
}> {
  const files: Record<string, string> = {};
  const components: Record<string, string> = {};
  let totalLoc = 0;
  let fileCount = 0;

  function scanDir(dir: string, relativePath: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.includes(entry.name)) {
          scanDir(fullPath, relPath);
        }
      } else {
        const ext = path.extname(entry.name);
        if (!CODE_EXTENSIONS.includes(ext)) continue;
        if (IGNORE_FILES.some(pattern => {
          if (pattern.startsWith('*')) {
            return entry.name.endsWith(pattern.slice(1));
          }
          return entry.name === pattern;
        })) continue;

        fileCount++;
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').length;
        totalLoc += lines;

        // Extract description
        const desc = extractFileDescription(content, entry.name);
        files[`src/${relPath}`] = desc;

        // Check if it's a React component
        if ((ext === '.tsx' || ext === '.jsx') &&
            (content.includes('export default function') ||
             content.includes('export function') ||
             content.includes('export const'))) {
          const compName = entry.name.replace(/\.(tsx|jsx)$/, '');
          components[compName] = desc;
        }
      }
    }
  }

  scanDir(srcPath);
  return { files, components, loc: totalLoc, count: fileCount };
}

function extractFileDescription(content: string, filename: string): string {
  // Try to find file-level JSDoc
  const jsdocMatch = content.match(/^\/\*\*\s*\n([^*]|\*[^/])*\*\//);
  if (jsdocMatch) {
    const firstLine = jsdocMatch[0].match(/\*\s*([A-Z].*?)(?=\n|\*\/)/);
    if (firstLine) return firstLine[1].trim().substring(0, 80);
  }

  // Try first meaningful comment
  const commentMatch = content.match(/^\/\/\s*(.+)/m);
  if (commentMatch) return commentMatch[1].trim().substring(0, 80);

  // Infer from filename and exports
  if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
    const exportMatch = content.match(/export\s+(default\s+)?function\s+(\w+)/);
    if (exportMatch) return `React component: ${exportMatch[2]}`;
  }

  if (filename.includes('hook')) return 'React hook';
  if (filename.includes('util')) return 'Utility functions';
  if (filename.includes('context')) return 'React context provider';
  if (filename.includes('service')) return 'Service layer';
  if (filename.includes('types')) return 'TypeScript types';

  return 'Source file';
}

function detectPatterns(repoPath: string, index: CodebaseIndex): Record<string, string> {
  const patterns: Record<string, string> = {};

  // Check package.json for dependencies
  const pkgPath = path.join(repoPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['next']) patterns['framework'] = 'Next.js App Router';
    if (deps['react']) patterns['ui'] = 'React with TypeScript';
    if (deps['@prisma/client']) patterns['database'] = 'PostgreSQL via Prisma ORM';
    if (deps['next-auth']) patterns['auth'] = 'NextAuth.js (OAuth + Email)';
    if (deps['tailwindcss']) patterns['styling'] = 'Tailwind CSS';
    if (deps['zod']) patterns['validation'] = 'Zod schema validation';
    if (deps['@anthropic-ai/sdk'] || deps['anthropic']) patterns['ai'] = 'Claude AI integration';
    if (deps['openai']) patterns['ai'] = (patterns['ai'] || '') + ', OpenAI';
  }

  // Detect from file structure
  if (Object.keys(index.apis).length > 0) {
    patterns['api'] = 'REST API with Next.js route handlers';
  }

  if (fs.existsSync(path.join(repoPath, '.github', 'workflows'))) {
    patterns['ci'] = 'GitHub Actions CI/CD';
  }

  return patterns;
}

function generateArchitectureSummary(repoName: string, index: CodebaseIndex): string {
  const tableCount = Object.keys(index.tables).length;
  const apiCount = Object.keys(index.apis).length;
  const compCount = Object.keys(index.components).length;

  const parts = [
    `${repoName} is a ${index.patterns.framework || 'web'} application`,
    tableCount > 0 ? `with ${tableCount} database tables` : '',
    apiCount > 0 ? `${apiCount} API endpoints` : '',
    compCount > 0 ? `${compCount} React components` : ''
  ].filter(Boolean);

  let summary = parts.join(', ') + '.';

  // Add pattern info
  const patternDesc = Object.entries(index.patterns)
    .filter(([k]) => !['framework'].includes(k))
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');

  if (patternDesc) {
    summary += ` Tech stack: ${patternDesc}.`;
  }

  return summary;
}

// ============================================================================
// CLI SUPPORT (for manual execution)
// ============================================================================

export async function runIndexer(args: string[]): Promise<void> {
  const [orgId, repoPath, repoName] = args;

  if (!orgId || !repoPath || !repoName) {
    console.error('Usage: npx ts-node codebase-indexer.ts <org_id> <repo_path> <repo_name>');
    process.exit(1);
  }

  console.log(`\nGenerating codebase index for ${repoName}...`);
  console.log(`Repo path: ${repoPath}`);
  console.log(`Org ID: ${orgId}\n`);

  try {
    const stats = await generateCodebaseIndex(orgId, repoPath, repoName);

    console.log('\n✅ Index generated successfully!');
    console.log('─'.repeat(40));
    console.log(`Files indexed: ${stats.fileCount}`);
    console.log(`Tables found: ${stats.tableCount}`);
    console.log(`API routes: ${stats.apiCount}`);
    console.log(`Lines of code: ${stats.locCount}`);
    console.log(`Index tokens: ${stats.totalTokens}`);
    console.log(`Token savings: ${stats.tokenSavingsPercent}%`);
    console.log('─'.repeat(40));
  } catch (error) {
    console.error('Failed to generate index:', error);
    process.exit(1);
  }
}
