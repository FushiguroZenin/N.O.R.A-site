export type GithubEvidence = {
  configured: boolean;
  valid: boolean;
  repository?: string;
  updatedAt?: string;
  hasPackage?: boolean;
  hasLockfile?: boolean;
  hasStaticEntrypoint?: boolean;
  ci?: "passing" | "failing" | "pending" | "missing";
  message: string;
};

export function githubRepository(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    return owner && repo ? { owner, repo: repo.replace(/\.git$/, "") } : null;
  } catch { return null; }
}

export async function inspectGithubEvidence(url: string | null | undefined): Promise<GithubEvidence> {
  const target = githubRepository(url);
  if (!url) return { configured: false, valid: false, ci: "missing", message: "Add a public GitHub repository for technical evidence." };
  if (!target) return { configured: true, valid: false, ci: "missing", message: "Use a full public github.com/owner/repository URL." };
  try {
    const repoResponse = await fetch(`https://api.github.com/repos/${target.owner}/${target.repo}`);
    if (!repoResponse.ok) return { configured: true, valid: false, ci: "missing", message: "NORA could not read this public repository." };
    const repo = await repoResponse.json();
    const branch = repo.default_branch;
    const [contentsResponse, runsResponse] = await Promise.all([
      fetch(`https://api.github.com/repos/${target.owner}/${target.repo}/contents?ref=${branch}`),
      fetch(`https://api.github.com/repos/${target.owner}/${target.repo}/actions/workflows/nora-verify.yml/runs?per_page=1`),
    ]);
    const contents = contentsResponse.ok ? await contentsResponse.json() : [];
    const names = Array.isArray(contents) ? contents.map((entry) => entry.name) : [];
    let ci: GithubEvidence["ci"] = "missing";
    if (runsResponse.ok) {
      const runs = await runsResponse.json(); const latest = runs.workflow_runs?.[0];
      if (latest) ci = latest.status !== "completed" ? "pending" : latest.conclusion === "success" ? "passing" : "failing";
    }
    const hasPackage = names.includes("package.json");
    const hasLockfile = names.some((name) => ["package-lock.json", "pnpm-lock.yaml", "yarn.lock"].includes(name));
    const hasStaticEntrypoint = names.includes("index.html");
    const hasRecognisedProject = hasPackage ? hasLockfile : hasStaticEntrypoint;
    const valid = hasRecognisedProject && ci === "passing";
    return { configured: true, valid, repository: repo.full_name, updatedAt: repo.pushed_at, hasPackage, hasLockfile, hasStaticEntrypoint, ci, message: valid ? "Repository and NORA CI are verified." : "Repository found. Add a lockfile for a Node app or an index.html entry point for a vanilla site, then run NORA verify." };
  } catch { return { configured: true, valid: false, ci: "missing", message: "GitHub could not be reached. Try again shortly." }; }
}
