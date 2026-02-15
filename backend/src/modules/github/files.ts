/**
 * GitHub file operations via REST API.
 * repoId format: "owner/repo"
 */

const GITHUB_API = "https://api.github.com";

async function fetchApi(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return res;
}

/**
 * Reads file content from a repository. Returns empty string if file not found.
 */
export async function readFile(
  repoId: string,
  path: string,
  token: string
): Promise<string> {
  const res = await fetchApi(
    `/repos/${repoId}/contents/${path}`,
    token,
    { headers: { Accept: "application/vnd.github.v3.raw" } }
  );
  if (res.status === 404) return "";
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub readFile failed: ${res.status} ${text}`);
  }
  return res.text();
}

/**
 * Creates or updates a file in the repository. Content must be UTF-8; we base64-encode for the API.
 */
export async function createOrUpdateFile(
  repoId: string,
  path: string,
  content: string,
  token: string
): Promise<void> {
  let sha: string | undefined;
  try {
    const getRes = await fetchApi(`/repos/${repoId}/contents/${path}`, token);
    if (getRes.ok) {
      const data = (await getRes.json()) as { sha?: string };
      sha = data.sha;
    }
  } catch {
    // File does not exist, create new
  }

  const body = {
    message: `DevDocs AI: update ${path}`,
    content: Buffer.from(content, "utf8").toString("base64"),
    ...(sha && { sha }),
  };

  const res = await fetchApi(`/repos/${repoId}/contents/${path}`, token, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub createOrUpdateFile failed: ${res.status} ${text}`);
  }
}
