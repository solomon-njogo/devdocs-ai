/**
 * GitHub repository metadata via REST API.
 * repoId format: "owner/repo"
 */

const GITHUB_API = "https://api.github.com";

/**
 * Fetches repo name and description from GitHub.
 * Throws on 404/403 or other API errors.
 */
export async function getRepoMetadata(
  repoId: string,
  token: string
): Promise<{ name: string; description: string | null }> {
  const res = await fetch(`${GITHUB_API}/repos/${encodeURIComponent(repoId)}`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub getRepoMetadata failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { name?: string; description?: string | null };
  return {
    name: typeof data.name === "string" ? data.name : repoId,
    description: typeof data.description === "string" ? data.description : null,
  };
}
