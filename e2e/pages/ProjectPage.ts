import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

interface RepositoryInput {
  provider: "GITHUB" | "GITLAB" | "MANUAL";
  repository: string;
  role?: string;
}

/**
 * Project Page Object
 * 프로젝트 목록/생성/상세 페이지 관련 액션 및 검증
 */
export class ProjectPage extends BasePage {
  // 목록 페이지
  readonly projectList: Locator;
  readonly newProjectButton: Locator;
  readonly emptyState: Locator;

  // 생성 폼
  readonly projectNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly createButton: Locator;
  readonly addRepoButton: Locator;

  // 상세 페이지
  readonly repositoryList: Locator;
  readonly analysisList: Locator;
  readonly startAnalysisButton: Locator;

  constructor(page: Page) {
    super(page);
    // 목록 페이지
    this.projectList = page.getByTestId("project-list");
    this.newProjectButton = page.getByRole("button", { name: /새 프로젝트|new project/i });
    this.emptyState = page.getByTestId("empty-state");

    // 생성 폼
    this.projectNameInput = page.getByLabel(/프로젝트 이름|project name/i);
    this.descriptionInput = page.getByLabel(/설명|description/i);
    this.createButton = page.getByRole("button", { name: /생성|create/i });
    this.addRepoButton = page.getByRole("button", { name: /저장소 추가|add repository/i });

    // 상세 페이지
    this.repositoryList = page.getByTestId("repository-list");
    this.analysisList = page.getByTestId("analysis-list");
    this.startAnalysisButton = page.getByRole("button", { name: /분석 시작|start analysis/i });
  }

  async goto(): Promise<void> {
    await this.page.goto("/projects");
    await expect(this.page).toHaveURL(/\/projects/);
  }

  /**
   * 프로젝트 생성 페이지로 이동
   */
  async gotoCreate(): Promise<void> {
    await this.page.goto("/projects/new");
    await expect(this.page).toHaveURL(/\/projects\/new/);
  }

  /**
   * 특정 프로젝트 상세 페이지로 이동
   */
  async gotoDetail(projectId: string): Promise<void> {
    await this.page.goto(`/projects/${projectId}`);
    await expect(this.page).toHaveURL(new RegExp(`/projects/${projectId}`));
  }

  /**
   * 새 프로젝트 버튼 클릭
   */
  async clickNewProject(): Promise<void> {
    await this.newProjectButton.click();
  }

  /**
   * 프로젝트 이름 입력
   */
  async fillProjectName(name: string): Promise<void> {
    await this.projectNameInput.fill(name);
  }

  /**
   * 프로젝트 설명 입력
   */
  async fillDescription(description: string): Promise<void> {
    await this.descriptionInput.fill(description);
  }

  /**
   * GitHub 저장소 선택
   */
  async selectGitHubRepository(repoFullName: string): Promise<void> {
    // GitHub 탭 클릭
    await this.page.getByRole("tab", { name: /github/i }).click();

    // 저장소 검색
    const searchInput = this.page.getByPlaceholder(/저장소 검색|search/i);
    await searchInput.fill(repoFullName.split("/")[1] || repoFullName);

    // 저장소 선택
    await this.page.getByRole("option", { name: repoFullName }).or(
      this.page.getByText(repoFullName)
    ).click();
  }

  /**
   * 저장소 추가 (multi-repo)
   */
  async addRepository(input: RepositoryInput): Promise<void> {
    await this.addRepoButton.click();

    // Provider 탭 선택
    const providerTab = this.page.getByRole("tab", { name: new RegExp(input.provider, "i") });
    if (await providerTab.isVisible()) {
      await providerTab.click();
    }

    // 저장소 검색 및 선택
    const searchInput = this.page.getByPlaceholder(/저장소 검색|search/i);
    await searchInput.fill(input.repository);

    await this.page.getByRole("option", { name: input.repository }).or(
      this.page.getByText(input.repository)
    ).click();

    // Role 설정 (optional)
    if (input.role) {
      const roleInput = this.page.getByLabel(/역할|role/i);
      if (await roleInput.isVisible()) {
        await roleInput.fill(input.role);
      }
    }

    // 추가 버튼 클릭
    await this.page.getByRole("button", { name: /추가|add/i }).click();
  }

  /**
   * 프로젝트 생성 제출
   */
  async submitCreate(): Promise<void> {
    await this.createButton.click();
  }

  /**
   * 분석 시작
   */
  async startAnalysis(branch: string = "main"): Promise<void> {
    await this.startAnalysisButton.click();

    // 브랜치 선택
    const branchSelect = this.page.getByLabel(/브랜치|branch/i);
    if (await branchSelect.isVisible()) {
      await branchSelect.selectOption(branch);
    }

    // 시작 버튼 클릭
    await this.page.getByRole("button", { name: /시작|start/i }).click();
  }

  /**
   * 프로젝트 목록에 특정 프로젝트가 있는지 확인
   */
  async expectProjectInList(projectName: string): Promise<void> {
    await expect(this.projectList.getByText(projectName)).toBeVisible();
  }

  /**
   * 프로젝트 수 확인
   */
  async expectProjectCount(count: number): Promise<void> {
    const items = this.projectList.getByTestId("project-item");
    await expect(items).toHaveCount(count);
  }

  /**
   * 빈 상태 확인
   */
  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * 저장소가 primary로 표시되는지 확인
   */
  async expectPrimaryRepository(repoName: string): Promise<void> {
    const repoItem = this.repositoryList.getByTestId("repository-item").filter({ hasText: repoName });
    await expect(repoItem.getByText(/primary/i)).toBeVisible();
  }

  /**
   * 저장소 수 확인
   */
  async expectRepositoryCount(count: number): Promise<void> {
    const items = this.repositoryList.getByTestId("repository-item");
    await expect(items).toHaveCount(count);
  }

  /**
   * 분석 목록에 분석이 있는지 확인
   */
  async expectAnalysisInList(status: string): Promise<void> {
    await expect(this.analysisList.getByText(status)).toBeVisible();
  }
}
