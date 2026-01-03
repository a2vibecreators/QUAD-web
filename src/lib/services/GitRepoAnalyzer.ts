/**
 * GitRepoAnalyzer Service
 *
 * Clones and analyzes Git repositories to extract:
 * - Tech stack (frontend, backend, database)
 * - Code patterns and architecture
 * - Reusable components
 * - Styling patterns
 *
 * Results stored as JSON in QUAD_resource_attributes table
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { query } from '@/lib/db';

const execAsync = promisify(exec);

interface TechStackAnalysis {
  frontend?: {
    framework: string;      // 'nextjs', 'react', 'vue', 'angular', 'svelte'
    version?: string;
    cssFramework?: string;  // 'tailwind', 'bootstrap', 'mui', 'chakra'
    uiLibraries?: string[]; // Component libraries used
  };
  backend?: {
    framework: string;      // 'nodejs', 'java_spring_boot', 'python_fastapi', etc.
    version?: string;
    language: string;       // 'typescript', 'javascript', 'java', 'python'
  };
  database?: {
    type: string;          // 'postgresql', 'mysql', 'mongodb', 'sqlite'
    orm?: string;          // 'prisma', 'typeorm', 'sequelize', 'jpa'
  };
  buildTools?: string[];   // 'webpack', 'vite', 'turbopack', 'maven', 'gradle'
  deployment?: {
    platform?: string;     // 'vercel', 'docker', 'kubernetes', 'aws'
    configFiles?: string[]; // 'Dockerfile', 'docker-compose.yml', etc.
  };
}

interface CodePatterns {
  architecture?: string;    // 'mvc', 'mvvm', 'clean_architecture', 'microservices'
  components?: {
    name: string;
    path: string;
    reusable: boolean;
  }[];
  apiEndpoints?: {
    path: string;
    method: string;
  }[];
  stateManagement?: string; // 'redux', 'zustand', 'context', 'recoil'
}

interface AnalysisResult {
  success: boolean;
  techStack: TechStackAnalysis;
  codePatterns: CodePatterns;
  fileStructure: {
    totalFiles: number;
    fileTypes: Record<string, number>;
    directories: string[];
  };
  cloneUrl: string;
  analyzedAt: string;
  error?: string;
}

export class GitRepoAnalyzer {
  private tempDir: string;
  private repoDir: string | null = null;

  constructor() {
    this.tempDir = '/tmp/quad-repo-analysis';
  }

  /**
   * Main analysis method
   */
  async analyzeRepository(
    repoUrl: string,
    accessToken?: string,
    isPrivate: boolean = false
  ): Promise<AnalysisResult> {
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      // Clone repository
      await this.cloneRepo(repoUrl, accessToken, isPrivate);

      if (!this.repoDir) {
        throw new Error('Repository clone failed');
      }

      // Analyze tech stack
      const techStack = await this.analyzeTechStack(this.repoDir);

      // Analyze code patterns
      const codePatterns = await this.analyzeCodePatterns(this.repoDir);

      // Analyze file structure
      const fileStructure = await this.analyzeFileStructure(this.repoDir);

      // Cleanup
      await this.cleanup();

      return {
        success: true,
        techStack,
        codePatterns,
        fileStructure,
        cloneUrl: repoUrl,
        analyzedAt: new Date().toISOString(),
      };

    } catch (error: any) {
      await this.cleanup();
      return {
        success: false,
        techStack: {},
        codePatterns: {},
        fileStructure: { totalFiles: 0, fileTypes: {}, directories: [] },
        cloneUrl: repoUrl,
        analyzedAt: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Clone Git repository
   */
  private async cloneRepo(repoUrl: string, accessToken?: string, isPrivate: boolean = false): Promise<void> {
    const repoName = path.basename(repoUrl, '.git');
    this.repoDir = path.join(this.tempDir, `${repoName}-${Date.now()}`);

    let cloneUrl = repoUrl;

    // For private repos, inject token into URL
    if (isPrivate && accessToken) {
      const url = new URL(repoUrl);
      cloneUrl = `https://${accessToken}@${url.host}${url.pathname}`;
    }

    await execAsync(`git clone --depth 1 ${cloneUrl} ${this.repoDir}`);
  }

  /**
   * Analyze tech stack from package.json, pom.xml, requirements.txt, etc.
   */
  private async analyzeTechStack(repoPath: string): Promise<TechStackAnalysis> {
    const techStack: TechStackAnalysis = {};

    // Check for package.json (Node.js/JavaScript/TypeScript)
    const packageJsonPath = path.join(repoPath, 'package.json');
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      techStack.frontend = this.detectFrontendStack(packageJson);
      techStack.backend = this.detectBackendStack(packageJson);
      techStack.buildTools = this.detectBuildTools(packageJson);
    }

    // Check for pom.xml (Java/Spring Boot)
    const pomPath = path.join(repoPath, 'pom.xml');
    if (await this.fileExists(pomPath)) {
      techStack.backend = {
        framework: 'java_spring_boot',
        language: 'java',
      };
    }

    // Check for requirements.txt (Python)
    const requirementsPath = path.join(repoPath, 'requirements.txt');
    if (await this.fileExists(requirementsPath)) {
      const requirements = await fs.readFile(requirementsPath, 'utf-8');
      if (requirements.includes('fastapi')) {
        techStack.backend = { framework: 'python_fastapi', language: 'python' };
      } else if (requirements.includes('django')) {
        techStack.backend = { framework: 'python_django', language: 'python' };
      } else if (requirements.includes('flask')) {
        techStack.backend = { framework: 'python_flask', language: 'python' };
      }
    }

    // Check for Dockerfile
    const dockerfilePath = path.join(repoPath, 'Dockerfile');
    if (await this.fileExists(dockerfilePath)) {
      techStack.deployment = { platform: 'docker', configFiles: ['Dockerfile'] };
    }

    // Check for docker-compose.yml
    const composePath = path.join(repoPath, 'docker-compose.yml');
    if (await this.fileExists(composePath)) {
      const compose = await fs.readFile(composePath, 'utf-8');
      const dbType = this.detectDatabaseFromCompose(compose);
      if (dbType) {
        techStack.database = { type: dbType };
      }
      if (!techStack.deployment) {
        techStack.deployment = {};
      }
      techStack.deployment.configFiles = [...(techStack.deployment.configFiles || []), 'docker-compose.yml'];
    }

    return techStack;
  }

  /**
   * Detect frontend framework from package.json dependencies
   */
  private detectFrontendStack(packageJson: any): TechStackAnalysis['frontend'] {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const frontend: TechStackAnalysis['frontend'] = { framework: 'unknown' };

    if (deps.next) {
      frontend.framework = 'nextjs';
      frontend.version = deps.next;
    } else if (deps.react) {
      frontend.framework = 'react';
      frontend.version = deps.react;
    } else if (deps.vue) {
      frontend.framework = 'vue';
      frontend.version = deps.vue;
    } else if (deps['@angular/core']) {
      frontend.framework = 'angular';
      frontend.version = deps['@angular/core'];
    } else if (deps.svelte) {
      frontend.framework = 'svelte';
      frontend.version = deps.svelte;
    }

    // Detect CSS framework
    if (deps.tailwindcss) {
      frontend.cssFramework = 'tailwind';
    } else if (deps.bootstrap) {
      frontend.cssFramework = 'bootstrap';
    } else if (deps['@mui/material']) {
      frontend.cssFramework = 'mui';
    } else if (deps['@chakra-ui/react']) {
      frontend.cssFramework = 'chakra';
    }

    // Detect UI libraries
    const uiLibraries: string[] = [];
    if (deps['@mui/material']) uiLibraries.push('MUI');
    if (deps['@chakra-ui/react']) uiLibraries.push('Chakra UI');
    if (deps['antd']) uiLibraries.push('Ant Design');
    if (deps['@headlessui/react']) uiLibraries.push('Headless UI');
    if (uiLibraries.length > 0) {
      frontend.uiLibraries = uiLibraries;
    }

    return frontend;
  }

  /**
   * Detect backend framework from package.json
   */
  private detectBackendStack(packageJson: any): TechStackAnalysis['backend'] | undefined {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.express) {
      return { framework: 'nodejs', language: 'javascript', version: deps.express };
    } else if (deps.fastify) {
      return { framework: 'nodejs', language: 'javascript' };
    } else if (deps['@nestjs/core']) {
      return { framework: 'nodejs', language: 'typescript' };
    }

    return undefined;
  }

  /**
   * Detect build tools
   */
  private detectBuildTools(packageJson: any): string[] {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const tools: string[] = [];

    if (deps.webpack) tools.push('webpack');
    if (deps.vite) tools.push('vite');
    if (deps.turbopack) tools.push('turbopack');
    if (deps.rollup) tools.push('rollup');
    if (deps.esbuild) tools.push('esbuild');

    return tools;
  }

  /**
   * Detect database type from docker-compose.yml
   */
  private detectDatabaseFromCompose(composeContent: string): string | null {
    if (composeContent.includes('postgres')) return 'postgresql';
    if (composeContent.includes('mysql')) return 'mysql';
    if (composeContent.includes('mongo')) return 'mongodb';
    if (composeContent.includes('redis')) return 'redis';
    return null;
  }

  /**
   * Analyze code patterns and architecture
   */
  private async analyzeCodePatterns(repoPath: string): Promise<CodePatterns> {
    const patterns: CodePatterns = {};

    // Check for common component directories
    const componentDirs = ['src/components', 'components', 'src/app', 'app'];
    for (const dir of componentDirs) {
      const fullPath = path.join(repoPath, dir);
      if (await this.dirExists(fullPath)) {
        const components = await this.findComponents(fullPath);
        patterns.components = components;
        break;
      }
    }

    // Detect state management
    const packageJsonPath = path.join(repoPath, 'package.json');
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (deps.redux) patterns.stateManagement = 'redux';
      else if (deps.zustand) patterns.stateManagement = 'zustand';
      else if (deps.recoil) patterns.stateManagement = 'recoil';
    }

    return patterns;
  }

  /**
   * Find React/Vue components in directory
   */
  private async findComponents(dir: string): Promise<CodePatterns['components']> {
    const components: CodePatterns['components'] = [];

    try {
      const files = await fs.readdir(dir, { recursive: true, withFileTypes: true });

      for (const file of files) {
        if (file.isFile() && /\.(tsx|jsx|vue)$/.test(file.name)) {
          const fullPath = path.join(file.path || dir, file.name);
          components.push({
            name: file.name,
            path: fullPath.replace(dir, ''),
            reusable: file.name.startsWith('Button') || file.name.startsWith('Input') || file.name.startsWith('Card'),
          });
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return components;
  }

  /**
   * Analyze file structure
   */
  private async analyzeFileStructure(repoPath: string): Promise<AnalysisResult['fileStructure']> {
    const fileTypes: Record<string, number> = {};
    const directories: string[] = [];
    let totalFiles = 0;

    const walkDir = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            directories.push(fullPath.replace(repoPath, ''));
            await walkDir(fullPath);
          }
        } else if (entry.isFile()) {
          totalFiles++;
          const ext = path.extname(entry.name);
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        }
      }
    };

    await walkDir(repoPath);

    return { totalFiles, fileTypes, directories };
  }

  /**
   * Save analysis result to database
   */
  async saveAnalysisResult(resourceId: string, analysisResult: AnalysisResult): Promise<void> {
    const now = new Date().toISOString();

    // Update git_repo_analyzed flag
    await query(
      `UPDATE QUAD_resource_attributes
       SET attribute_value = 'true', updated_at = $1
       WHERE resource_id = $2 AND attribute_name = 'git_repo_analyzed'`,
      [now, resourceId]
    );

    // Store analysis result as JSON
    await query(
      `INSERT INTO QUAD_resource_attributes (resource_id, attribute_name, attribute_value, created_at, updated_at)
       VALUES ($1, 'git_repo_analysis_result', $2, $3, $3)
       ON CONFLICT (resource_id, attribute_name)
       DO UPDATE SET attribute_value = $2, updated_at = $3`,
      [resourceId, JSON.stringify(analysisResult), now]
    );
  }

  /**
   * Cleanup temporary directory
   */
  private async cleanup(): Promise<void> {
    if (this.repoDir) {
      try {
        await execAsync(`rm -rf ${this.repoDir}`);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
      this.repoDir = null;
    }
  }

  /**
   * Helper: Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if directory exists
   */
  private async dirExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}

export default GitRepoAnalyzer;
