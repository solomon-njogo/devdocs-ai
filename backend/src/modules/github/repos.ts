/**
 * GitHub repository metadata via REST API.
 * repoId format: "owner/repo"
 */

const GITHUB_API = "https://api.github.com";

const REPO_LIST_PER_PAGE = 100;
const REPO_LIST_MAX_PAGES = 20;

export interface UserRepoListItem {
  fullName: string;
  name: string;
  private: boolean;
  description: string | null;
}

function reposPathSegment(repoId: string): string {
  const idx = repoId.indexOf("/");
  if (idx === -1) {
    throw new Error("Invalid repoId: expected owner/repo");
  }
  const owner = encodeURIComponent(repoId.slice(0, idx));
  const repo = encodeURIComponent(repoId.slice(idx + 1));
  return `${owner}/${repo}`;
}

/**
 * Lists repositories the token can access (owned, collaborator, org member).
 * Paginates until exhausted or REPO_LIST_MAX_PAGES.
 */
export async function listUserRepositories(token: string): Promise<UserRepoListItem[]> {
  const out: UserRepoListItem[] = [];
  for (let page = 1; page <= REPO_LIST_MAX_PAGES; page += 1) {
    const q = new URLSearchParams({
      per_page: String(REPO_LIST_PER_PAGE),
      page: String(page),
      sort: "updated",
      affiliation: "owner,collaborator,organization_member",
    });
    const res = await fetch(`${GITHUB_API}/user/repos?${q.toString()}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub listUserRepositories failed: ${res.status} ${text}`);
    }
    const batch = (await res.json()) as Array<{
      full_name?: string;
      name?: string;
      private?: boolean;
      description?: string | null;
    }>;
    if (!batch.length) break;
    for (const r of batch) {
      const fullName = typeof r.full_name === "string" ? r.full_name : null;
      if (!fullName) continue;
      out.push({
        fullName,
        name: typeof r.name === "string" ? r.name : fullName.split("/").pop() ?? fullName,
        private: Boolean(r.private),
        description: typeof r.description === "string" ? r.description : null,
      });
    }
    if (batch.length < REPO_LIST_PER_PAGE) break;
  }
  return out;
}

/**
 * Fetches repo name, description, and default branch from GitHub.
 * Throws on 404/403 or other API errors.
 */
export async function getRepoMetadata(
  repoId: string,
  token: string
): Promise<{ name: string; description: string | null; defaultBranch: string }> {
  const pathSeg = reposPathSegment(repoId.trim());
  const res = await fetch(`${GITHUB_API}/repos/${pathSeg}`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub getRepoMetadata failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    name?: string;
    description?: string | null;
    default_branch?: string;
  };
  return {
    name: typeof data.name === "string" ? data.name : repoId,
    description: typeof data.description === "string" ? data.description : null,
    defaultBranch: typeof data.default_branch === "string" ? data.default_branch : "main",
  };
}
