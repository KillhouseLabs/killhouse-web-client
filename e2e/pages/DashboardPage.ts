import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Dashboard Page Object
 * 대시보드 페이지 관련 액션 및 검증
 */
export class DashboardPage extends BasePage {
  readonly projectCount: Locator;
  readonly analysisCount: Locator;
  readonly recentProjects: Locator;
  readonly newProjectButton: Locator;
  readonly subscriptionBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.projectCount = page.getByTestId("project-count");
    this.analysisCount = page.getByTestId("analysis-count");
    this.recentProjects = page.getByTestId("recent-projects");
    this.newProjectButton = page.getByRole("button", { name: /새 프로젝트|new project/i });
    this.subscriptionBadge = page.getByTestId("subscription-badge");
  }

  async goto(): Promise<void> {
    await this.page.goto("/dashboard");
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  /**
   * 새 프로젝트 버튼 클릭
   */
  async clickNewProject(): Promise<void> {
    await this.newProjectButton.click();
  }

  /**
   * 프로젝트 수 확인
   */
  async expectProjectCount(count: number): Promise<void> {
    await expect(this.projectCount).toContainText(String(count));
  }

  /**
   * 분석 수 확인
   */
  async expectAnalysisCount(count: number): Promise<void> {
    await expect(this.analysisCount).toContainText(String(count));
  }

  /**
   * 구독 플랜 확인
   */
  async expectSubscriptionPlan(plan: "Free" | "Pro" | "Enterprise"): Promise<void> {
    await expect(this.subscriptionBadge).toContainText(plan);
  }

  /**
   * 최근 프로젝트 목록에 프로젝트가 있는지 확인
   */
  async expectRecentProjectVisible(projectName: string): Promise<void> {
    await expect(this.recentProjects.getByText(projectName)).toBeVisible();
  }
}
