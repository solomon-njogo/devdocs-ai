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
      </article>

      {/* Right rail — Table of Contents */}
      <TableOfContents content={doc.content} />
    </div>
  );
}

export const revalidate = 60;
