const GITLAB_API_BASE = "https://gitlab.com/api/v4";

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  visibility: "private" | "internal" | "public";
  web_url: string;
  default_branch: string;
  last_activity_at: string;
  description: string | null;
}

export interface GitLabBranch {
  name: string;
  protected: boolean;
}

export interface ProjectListOptions {
  page?: number;
  per_page?: number;
  order_by?:
    | "id"
    | "name"
    | "path"
    | "created_at"
    | "updated_at"
    | "last_activity_at";
  sort?: "asc" | "desc";
  search?: string;
}

async function gitlabFetch<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${GITLAB_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Bad credentials");
    }
    if (response.status === 404) {
      throw new Error("Not Found");
    }
    throw new Error(`GitLab API error: ${response.status}`);
  }

  return response.json();
}

export async function getUserProjects(
  accessToken: string,
  options: ProjectListOptions = {}
): Promise<{ projects: GitLabProject[]; hasNext: boolean }> {
  const {
    page = 1,
    per_page = 30,
    order_by = "last_activity_at",
    sort = "desc",
    search,
  } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    per_page: (per_page + 1).toString(),
    order_by,
    sort,
    membership: "true",
  });

  if (search) {
    params.append("search", search);
  }

  const projects = await gitlabFetch<GitLabProject[]>(
    accessToken,
    `/projects?${params}`
  );

  const hasNext = projects.length > per_page;

  return {
    projects: projects.slice(0, per_page),
    hasNext,
  };
}

export async function getProjectBranches(
  accessToken: string,
  projectId: number
): Promise<GitLabBranch[]> {
  const branches = await gitlabFetch<GitLabBranch[]>(
    accessToken,
    `/projects/${projectId}/repository/branches?per_page=100`
  );

  return branches.map((branch) => ({
    name: branch.name,
    protected: branch.protected,
  }));
}
