import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { NavTree, type NavGroup } from "../_components/Sidebar";
import { SearchModal } from "../_components/SearchModal";
import { DocsMobileNav } from "../_components/DocsMobileNav";

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
    <div className="flex min-h-screen">
      {/* Left sidebar — desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r px-4 py-6 sticky top-0 h-screen overflow-y-auto bg-background">
        <div className="mb-6">
          <h1 className="font-semibold text-lg">{project.name}</h1>
          <p className="text-xs text-muted-foreground mt-1">Documentation</p>
        </div>
        <NavTree tree={navTree} projectSlug={projectSlug} />
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        <header className="border-b px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur z-10">
          <DocsMobileNav tree={navTree} projectSlug={projectSlug} projectName={project.name} />
          <SearchModal projectId={project.id} projectSlug={projectSlug} />
        </header>
        <main className="px-4 sm:px-8 py-8 max-w-3xl">{children}</main>
      </div>
    </div>
  );
}
