import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { NavTree, type NavGroup } from "../_components/Sidebar";
import { SearchModal } from "../_components/SearchModal";
import { DocsMobileNav } from "../_components/DocsMobileNav";
import { ThemeToggle } from "../_components/ThemeToggle";
import { RegenerateDocsButton } from "../_components/RegenerateDocsButton";
import Link from "next/link";

const LAYER_ORDER = ["quickstart", "concept", "howto", "reference"];
const LAYER_LABELS: Record<string, string> = {
  quickstart: "Getting started",
  concept: "Concepts",
  howto: "How-to guides",
  reference: "API reference",
};

async function getNavTree(projectId: string): Promise<NavGroup[]> {
  const supabase = createServerSupabase();

  const { data: custom } = await supabase
    .from("docs_nav")
    .select("config")
    .eq("project_id", projectId)
    .maybeSingle();

  if (custom?.config) {
    return (custom.config as { groups: NavGroup[] }).groups;
  }

  const { data: pages } = await supabase
    .from("docs_pages")
    .select("slug, title, layer")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (!pages) return [];

  const grouped = new Map<string, { title: string; slug: string }[]>();
  for (const page of pages as Array<{ slug: string; title: string; layer: string }>) {
    if (!grouped.has(page.layer)) grouped.set(page.layer, []);
    grouped.get(page.layer)!.push({ title: page.title, slug: page.slug });
  }

  return LAYER_ORDER.filter((layer) => grouped.has(layer)).map((layer) => ({
    label: LAYER_LABELS[layer],
    layer,
    items: grouped.get(layer)!.sort((a, b) => a.slug.localeCompare(b.slug)),
  }));
}

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  const supabase = createServerSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, is_public")
    .eq("slug", projectSlug)
    .single();

  if (!project || !project.is_public) notFound();

  const navTree = await getNavTree(project.id);

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Left sidebar ── */}
      <aside className="hidden lg:flex w-[272px] shrink-0 flex-col border-r border-border sticky top-0 h-screen overflow-hidden bg-surface-sidebar">
        <div className="px-5 pt-5 pb-4">
          <Link
            href={`/docs/${projectSlug}`}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-semibold text-[15px] text-foreground group-hover:text-primary transition-colors">
              {project.name}
            </span>
          </Link>
        </div>

        <div className="px-4 pb-4">
          <SearchModal projectId={project.id} projectSlug={projectSlug} />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <NavTree tree={navTree} projectSlug={projectSlug} />
        </nav>

        <div className="px-4 py-3 border-t border-border space-y-3">
          <RegenerateDocsButton projectId={project.id} />
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-md z-10">
          <DocsMobileNav
            tree={navTree}
            projectSlug={projectSlug}
            projectName={project.name}
          />
          <div className="flex-1">
            <SearchModal projectId={project.id} projectSlug={projectSlug} />
          </div>
          <ThemeToggle />
        </header>

        {/* Content */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto">
          <div className="px-6 sm:px-10 lg:px-16 py-10 lg:py-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
