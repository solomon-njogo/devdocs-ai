export function SourceFiles({
  files,
  repoOwner,
  repoName,
  repoBranch,
}: {
  files: string[];
  repoOwner?: string | null;
  repoName?: string | null;
  repoBranch?: string | null;
}) {
  if (!files.length) return null;

  const hasGitHub = repoOwner && repoName;
  const branch = repoBranch ?? "main";

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Source files
      </h3>
      <ul className="space-y-1.5">
        {files.map((file) => (
          <li key={file}>
            {hasGitHub ? (
              <a
                href={`https://github.com/${repoOwner}/${repoName}/blob/${branch}/${file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors font-mono group"
              >
                <svg className="w-3.5 h-3.5 shrink-0 opacity-50 group-hover:opacity-80 transition-opacity" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                {file}
                <svg className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <span className="text-[13px] text-muted-foreground font-mono">{file}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
