import fs from "fs";
import path from "path";
import Link from "next/link";

// All available docs for static generation
const allDocs = [
  "QUAD",
  "QUAD_PLATFORM",
  "QUAD_DETAILS",
  "QUAD_JARGONS",
  "QUAD_SUMMARY",
  "QUAD_CASE_STUDY",
  "QUAD_AGENT_ARCHITECTURE",
  "quad-workflow/QUAD_PROJECT_LIFECYCLE",
  "quad-workflow/QUAD_ADOPTION_JOURNEY",
  "quad-workflow/QUAD_ADOPTION_LEVELS",
  "quad-workflow/QUAD_CUSTOMIZABLE_TRIGGERS",
  "quad-workflow/QUAD_ASSIGNMENT_AGENT",
  "quad-workflow/QUAD_INTEGRATION_ARCHITECTURE",
  "quad-workflow/QUAD_CUSTOM_AGENTS",
  "quad-workflow/QUAD_COMMANDS",
  "quad-workflow/QUAD_STORY_LABELS",
  "quad-workflow/QUAD_SAMPLE_ENVIRONMENT",
];

// Generate static params for all docs
export function generateStaticParams() {
  return allDocs.map((doc) => ({
    slug: doc.split("/"),
  }));
}

// Title mapping
const docTitles: Record<string, string> = {
  "QUAD": "QUAD Methodology",
  "QUAD_PLATFORM": "QUAD Platform",
  "QUAD_DETAILS": "Technical Details",
  "QUAD_JARGONS": "Terminology",
  "QUAD_SUMMARY": "Executive Summary",
  "QUAD_CASE_STUDY": "Case Study",
  "QUAD_AGENT_ARCHITECTURE": "Agent Architecture",
  "QUAD_PROJECT_LIFECYCLE": "Project Lifecycle",
  "QUAD_ADOPTION_JOURNEY": "Adoption Journey",
  "QUAD_ADOPTION_LEVELS": "Adoption Levels (0D-4D)",
  "QUAD_CUSTOMIZABLE_TRIGGERS": "Customizable Triggers",
  "QUAD_ASSIGNMENT_AGENT": "Assignment Agent",
  "QUAD_INTEGRATION_ARCHITECTURE": "Integration Architecture",
  "QUAD_CUSTOM_AGENTS": "Custom Agents",
  "QUAD_COMMANDS": "QUAD Commands",
  "QUAD_STORY_LABELS": "Story Labels",
  "QUAD_SAMPLE_ENVIRONMENT": "Sample Environment",
};

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

async function getMarkdownContent(slug: string[]): Promise<string> {
  const slugPath = slug.join("/");
  const filePath = path.join(
    process.cwd(),
    "documentation",
    "methodology",
    `${slugPath}.md`
  );

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content;
  } catch {
    return `# Document Not Found\n\nThe document "${slugPath}" could not be found.`;
  }
}

// Simple markdown to HTML converter (basic)
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-white mt-8 mb-4">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-blue-300 mt-10 mb-6">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-white mb-8">$1</h1>');

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/gim, (_, lang, code) => {
    return `<pre class="bg-slate-900 rounded-lg p-4 overflow-x-auto my-4 border border-slate-700"><code class="text-sm text-green-400">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-800 px-2 py-0.5 rounded text-sm text-blue-300">$1</code>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank">$1</a>');

  // Unordered lists
  html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 text-slate-300">• $1</li>');

  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-slate-300 list-decimal list-inside">$1</li>');

  // Tables (basic)
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split("|").filter(Boolean).map((cell) => cell.trim());
    const isHeader = cells.some((c) => c.includes("---"));
    if (isHeader) return "";
    return `<tr>${cells.map((cell) => `<td class="border border-slate-700 px-4 py-2 text-slate-300">${cell}</td>`).join("")}</tr>`;
  });

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-slate-800/50 text-slate-400 italic">$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gim, '<hr class="my-8 border-slate-700">');

  // Paragraphs (wrap remaining text)
  html = html.split("\n\n").map((paragraph) => {
    if (
      paragraph.startsWith("<") ||
      paragraph.startsWith("#") ||
      paragraph.trim() === ""
    ) {
      return paragraph;
    }
    return `<p class="text-slate-300 mb-4 leading-relaxed">${paragraph}</p>`;
  }).join("\n");

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const content = await getMarkdownContent(slug);
  const htmlContent = markdownToHtml(content);

  const lastSlug = slug[slug.length - 1];
  const title = docTitles[lastSlug] || lastSlug.replace(/_/g, " ");
  const isWorkflow = slug.includes("quad-workflow");

  return (
    <div className="min-h-screen text-white">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/docs"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <span>←</span>
              <span className="text-sm">Back to Docs</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isWorkflow
                  ? "bg-green-500/20 text-green-300"
                  : "bg-blue-500/20 text-blue-300"
              }`}>
                {isWorkflow ? "QUAD Workflow" : "Core Docs"}
              </span>
            </div>

            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <span className="text-slate-500 text-sm">
            Documentation / {isWorkflow ? "QUAD Workflow / " : ""}{title}
          </span>
        </div>

        <article
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Bottom Navigation */}
        <div className="mt-16 pt-8 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <Link
              href="/docs"
              className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl p-4 border border-slate-700 transition-all group"
            >
              <span className="text-2xl text-slate-500 group-hover:text-blue-400">←</span>
              <div>
                <div className="text-xs text-slate-500">Back to</div>
                <div className="font-semibold text-white group-hover:text-blue-300">
                  All Documentation
                </div>
              </div>
            </Link>

            <a
              href={`/documentation/methodology/${slug.join("/")}.md`}
              target="_blank"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              View Raw Markdown ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
