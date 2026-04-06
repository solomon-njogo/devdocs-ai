import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function DocsIndex({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  const supabase = createServerSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .single();

  if (!project) return redirect("/");

  // Redirect to quickstart or first available doc
  const { data: first } = await supabase
    .from("docs_pages")
    .select("slug")
    .eq("project_id", project.id)
    .order("layer", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (first) {
    redirect(`/docs/${projectSlug}/${first.slug}`);
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-2xl font-bold mb-3">No documentation yet</h2>
      <p className="text-muted-foreground max-w-md">
        This project hasn&apos;t generated any documentation pages yet. Trigger indexing
        from the dashboard to get started.
      </p>
    </div>
  );
}
