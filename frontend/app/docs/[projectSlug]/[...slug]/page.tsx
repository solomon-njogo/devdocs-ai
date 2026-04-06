import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { MdxContent } from "../../_components/MdxContent";
import { LayerBadge } from "../../_components/LayerBadge";
import { TableOfContents } from "../../_components/TableOfContents";
import { Breadcrumbs } from "../../_components/Breadcrumbs";
import { SourceFiles } from "../../_components/SourceFiles";

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

  return (
    <article className="relative">
      <Breadcrumbs
        projectSlug={projectSlug}
        projectName={project.name}
        layer={doc.layer}
        docTitle={doc.title}
      />

      {/* Layer badge + metadata */}
      <div className="flex items-center gap-3 mb-4">
        <LayerBadge layer={doc.layer} />
        {doc.is_auto && (
          <span className="text-xs text-muted-foreground">
            Auto-generated · Last updated{" "}
            {new Date(doc.updated_at).toLocaleDateString()}
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-6">{doc.title}</h1>

      {/* Table of contents (right sidebar on wide screens) */}
      <TableOfContents content={doc.content} />

      {/* Markdown content */}
      <MdxContent source={doc.content} projectSlug={projectSlug} />

      {/* Source file links */}
      <SourceFiles
        files={doc.source_files ?? []}
        repoOwner={project.repo_owner}
        repoName={project.repo_name}
        repoBranch={project.repo_branch}
      />
    </article>
  );
}

export const revalidate = 60;
