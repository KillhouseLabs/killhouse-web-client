import { createBdd } from "playwright-bdd";
import { test, expect } from "../fixtures";
import { DataTable } from "@cucumber/cucumber";

const { Given, When, Then } = createBdd(test);

// ============================================
// 프로젝트 관련 Given 스텝
// ============================================

Given("나는 프로젝트 목록 페이지에 있다", async ({ projectPage }) => {
  await projectPage.goto();
});

Given("나는 새 프로젝트 생성 페이지에 있다", async ({ projectPage }) => {
  await projectPage.gotoCreate();
});

Given("나는 프로젝트 상세 페이지에 있다", async ({ page }) => {
  // 현재 URL이 프로젝트 상세 페이지인지 확인
  await expect(page).toHaveURL(/\/projects\/[a-z0-9]+$/);
});

Given("{string} 프로젝트가 존재한다", async ({ page }, projectName: string) => {
  // 테스트 데이터로 프로젝트가 이미 존재한다고 가정
  // 실제로는 API를 통해 프로젝트를 생성하거나 DB 시딩 필요
  console.log(`[Test] Assuming project "${projectName}" exists`);
});

Given("프로젝트가 없다", async ({ projectPage }) => {
  await projectPage.goto();
  await projectPage.expectEmptyState();
});

// ============================================
// 프로젝트 관련 When 스텝
// ============================================

When("새 프로젝트 버튼을 클릭한다", async ({ projectPage }) => {
  await projectPage.clickNewProject();
});

When("프로젝트 이름을 {string}로 입력한다", async ({ projectPage }, name: string) => {
  await projectPage.fillProjectName(name);
});

When("프로젝트 설명을 {string}로 입력한다", async ({ projectPage }, description: string) => {
  await projectPage.fillDescription(description);
});

When("GitHub 저장소 {string}를 선택한다", async ({ projectPage }, repoName: string) => {
  await projectPage.selectGitHubRepository(repoName);
});

When("GitHub 저장소 {string}을 선택한다", async ({ projectPage }, repoName: string) => {
  await projectPage.selectGitHubRepository(repoName);
});

When("다음 저장소들을 추가한다:", async ({ projectPage }, dataTable: DataTable) => {
  for (const row of dataTable.hashes()) {
    await projectPage.addRepository({
      provider: row.provider as "GITHUB" | "GITLAB" | "MANUAL",
      repository: row.repository,
      role: row.role,
    });
  }
});

When("생성 버튼을 클릭한다", async ({ projectPage }) => {
  await projectPage.submitCreate();
});

When("프로젝트 {string}을 클릭한다", async ({ page }, projectName: string) => {
  await page.getByText(projectName).click();
});

When("프로젝트 {string}를 클릭한다", async ({ page }, projectName: string) => {
  await page.getByText(projectName).click();
});

When("분석 시작 버튼을 클릭한다", async ({ projectPage }) => {
  await projectPage.startAnalysisButton.click();
});

When("브랜치 {string}를 선택한다", async ({ page }, branch: string) => {
  const branchSelect = page.getByLabel(/브랜치|branch/i);
  await branchSelect.selectOption(branch);
});

When("브랜치 {string}을 선택한다", async ({ page }, branch: string) => {
  const branchSelect = page.getByLabel(/브랜치|branch/i);
  await branchSelect.selectOption(branch);
});

// ============================================
// 프로젝트 관련 Then 스텝
// ============================================

Then("프로젝트 상세 페이지로 이동해야 한다", async ({ page }) => {
  await expect(page).toHaveURL(/\/projects\/[a-z0-9]+$/);
});

Then("프로젝트 목록에 {string}가 표시되어야 한다", async ({ projectPage }, projectName: string) => {
  await projectPage.expectProjectInList(projectName);
});

Then("프로젝트 목록에 {string}이 표시되어야 한다", async ({ projectPage }, projectName: string) => {
  await projectPage.expectProjectInList(projectName);
});

Then("프로젝트가 {int}개 표시되어야 한다", async ({ projectPage }, count: number) => {
  await projectPage.expectProjectCount(count);
});

Then("저장소 {string}가 primary로 표시되어야 한다", async ({ projectPage }, repoName: string) => {
  await projectPage.expectPrimaryRepository(repoName);
});

Then("저장소 {string}이 primary로 표시되어야 한다", async ({ projectPage }, repoName: string) => {
  await projectPage.expectPrimaryRepository(repoName);
});

Then("프로젝트에 {int}개의 저장소가 연결되어야 한다", async ({ projectPage }, count: number) => {
  await projectPage.expectRepositoryCount(count);
});

Then("첫 번째 저장소가 primary로 설정되어야 한다", async ({ page }) => {
  const firstRepo = page.getByTestId("repository-item").first();
  await expect(firstRepo.getByText(/primary/i)).toBeVisible();
});

Then("분석이 {string} 상태로 생성되어야 한다", async ({ projectPage }, status: string) => {
  await projectPage.expectAnalysisInList(status);
});

Then("분석 목록에 새 분석이 표시되어야 한다", async ({ page }) => {
  await expect(page.getByTestId("analysis-item")).toBeVisible();
});

Then("빈 프로젝트 상태가 표시되어야 한다", async ({ projectPage }) => {
  await projectPage.expectEmptyState();
});
