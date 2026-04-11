import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { MdxContent } from "../../_components/MdxContent";
import { LayerBadge } from "../../_components/LayerBadge";
import { TableOfContents } from "../../_components/TableOfContents";
import { Breadcrumbs } from "../../_components/Breadcrumbs";
import { SourceFiles } from "../../_components/SourceFiles";

const LAYER_ORDER = ["quickstart", "concept", "howto", "reference"];
const LAYER_LABELS: Record<string, string> = {
  quickstart: "Getting started",
  concept: "Concepts",
  howto: "How-to guides",
  reference: "API reference",
};

interface NavGroup {
  label: string;
  layer: string;
  items: { title: string; slug: string }[];
}

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

export default async function DocPage({
  params,
}: {
  params: Promise<{ projectSlug: string; slug: string[] }>;
}) {
  const { projectSlug, slug: slugParts } = await params;
  const slug = slugParts.join("/");
  const supabase = createServerSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, repo_owner, repo_name, repo_branch")
    .eq("slug", projectSlug)
    .single();

  if (!project) notFound();

  const { data: doc } = await supabase
    .from("docs_pages")
    .select("title, content, layer, is_auto, updated_at, source_files")
    .eq("project_id", project.id)
    .eq("slug", slug)
    .single();

  if (!doc) notFound();

  const navTree = await getNavTree(project.id);
  const orderedItems = navTree.flatMap((group) => group.items);
  const currentIndex = orderedItems.findIndex((item) => item.slug === slug);
  const previousItem = currentIndex > 0 ? orderedItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < orderedItems.length - 1
      ? orderedItems[currentIndex + 1]
      : null;

  return (
    <div className="flex gap-10 items-start">
      {/* Main content */}
      <article className="flex-1 min-w-0 max-w-[720px]">
        <Breadcrumbs
          projectSlug={projectSlug}
          projectName={project.name}
          layer={doc.layer}
          docTitle={doc.title}
        />

        <div className="flex items-center gap-3 mb-5">
          <LayerBadge layer={doc.layer} />
          {doc.is_auto && (
            <span className="text-[12px] text-muted-foreground">
              Auto-generated &middot; Updated{" "}
              {new Date(doc.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        <h1 className="text-[2rem] font-bold tracking-tight leading-[1.2] text-foreground mb-3">
          {doc.title}
        </h1>

        <MdxContent source={doc.content} projectSlug={projectSlug} />

        <SourceFiles
          files={doc.source_files ?? []}
          repoOwner={project.repo_owner}
          repoName={project.repo_name}
          repoBranch={project.repo_branch}
        />

        {(previousItem || nextItem) && (
          <nav
            aria-label="Page navigation"
            className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {previousItem ? (
              <Link
                href={`/docs/${projectSlug}/${previousItem.slug}`}
                className="group rounded-xl border border-border px-4 py-3.5 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <p className="text-[12px] text-muted-foreground mb-1">Previous</p>
                <p className="flex items-center gap-1.5 text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors">
                  <span aria-hidden="true">&lsaquo;</span>
                  <span>{previousItem.title}</span>
                </p>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}

            {nextItem ? (
              <Link
                href={`/docs/${projectSlug}/${nextItem.slug}`}
                className="group rounded-xl border border-border px-4 py-3.5 transition-colors hover:border-primary/40 hover:bg-accent/40 sm:text-right"
              >
                <p className="text-[12px] text-muted-foreground mb-1">Next</p>
                <p className="flex items-center justify-start gap-1.5 text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors sm:justify-end">
                  <span>{nextItem.title}</span>
                  <span aria-hidden="true">&rsaquo;</span>
                </p>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}
          </nav>
        )}
      </article>

      {/* Right rail — Table of Contents */}
      <TableOfContents content={doc.content} />
    </div>
  );
}

export const revalidate = 60;
