import { Octokit } from "@octokit/rest";

export function createGitHubClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
  });
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  updated_at: string;
  language: string | null;
  description: string | null;
}

export interface GitHubBranch {
  name: string;
  protected: boolean;
}

export interface RepositoryListOptions {
  page?: number;
  per_page?: number;
  sort?: "created" | "updated" | "pushed" | "full_name";
  direction?: "asc" | "desc";
}

export async function getUserRepositories(
  client: Octokit,
  options: RepositoryListOptions = {}
): Promise<{ repositories: GitHubRepository[]; hasNext: boolean }> {
  const {
    page = 1,
    per_page = 30,
    sort = "updated",
    direction = "desc",
  } = options;

  const response = await client.repos.listForAuthenticatedUser({
    page,
    per_page: per_page + 1,
    sort,
    direction,
    visibility: "all",
  });

  const hasNext = response.data.length > per_page;
  const repositories = response.data.slice(0, per_page).map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    html_url: repo.html_url,
    default_branch: repo.default_branch,
    updated_at: repo.updated_at ?? new Date().toISOString(),
    language: repo.language,
    description: repo.description,
  }));

  return { repositories, hasNext };
}

export async function getRepositoryBranches(
  client: Octokit,
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  const response = await client.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });

  return response.data.map((branch) => ({
    name: branch.name,
    protected: branch.protected,
  }));
}
