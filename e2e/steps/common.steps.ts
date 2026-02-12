import { createBdd } from "playwright-bdd";
import { test, expect } from "../fixtures";

const { Given, When, Then } = createBdd(test);

// ============================================
// 공통 Given 스텝
// ============================================

Given("애플리케이션이 실행 중이다", async ({ page }) => {
  const response = await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(response?.status()).toBeLessThan(400);
});

Given("나는 {string} 페이지에 있다", async ({ page }, pagePath: string) => {
  const routes: Record<string, string> = {
    홈: "/",
    로그인: "/login",
    회원가입: "/signup",
    대시보드: "/dashboard",
    프로젝트: "/projects",
    "프로젝트 목록": "/projects",
    구독: "/subscription",
    설정: "/settings",
  };

  const path = routes[pagePath] || `/${pagePath}`;
  await page.goto(path);
});

Given("나는 로그인된 사용자다", async ({ authenticatedPage }) => {
  // authenticatedPage fixture가 이미 인증된 상태를 제공
  await authenticatedPage.goto("/dashboard");
  await expect(authenticatedPage).toHaveURL(/\/dashboard|\/projects/);
});

Given("나는 로그인되지 않은 상태다", async ({ page }) => {
  // 쿠키 및 스토리지 클리어
  await page.context().clearCookies();
});

// ============================================
// 공통 When 스텝
// ============================================

When("{string} 버튼을 클릭한다", async ({ page }, buttonName: string) => {
  await page.getByRole("button", { name: buttonName }).click();
});

When("{string} 링크를 클릭한다", async ({ page }, linkName: string) => {
  await page.getByRole("link", { name: linkName }).click();
});

When("{string}에 {string}을 입력한다", async ({ page }, label: string, value: string) => {
  await page.getByLabel(label).fill(value);
});

When("{string}에 {string}를 입력한다", async ({ page }, label: string, value: string) => {
  await page.getByLabel(label).fill(value);
});

When("{int}초 기다린다", async ({ page }, seconds: number) => {
  await page.waitForTimeout(seconds * 1000);
});

// ============================================
// 공통 Then 스텝
// ============================================

Then("{string} 메시지가 표시되어야 한다", async ({ page }, message: string) => {
  await expect(page.getByText(message)).toBeVisible();
});

Then("{string} 메시지가 표시되지 않아야 한다", async ({ page }, message: string) => {
  await expect(page.getByText(message)).not.toBeVisible();
});

Then("{string} 페이지로 이동해야 한다", async ({ page }, pagePath: string) => {
  const routes: Record<string, RegExp> = {
    홈: /^\/$/,
    로그인: /\/login/,
    회원가입: /\/signup/,
    대시보드: /\/dashboard/,
    프로젝트: /\/projects/,
    "프로젝트 목록": /\/projects$/,
    "프로젝트 상세": /\/projects\/[a-z0-9]+$/,
    구독: /\/subscription/,
  };

  const pattern = routes[pagePath] || new RegExp(pagePath);
  await expect(page).toHaveURL(pattern);
});

Then("URL이 {string}를 포함해야 한다", async ({ page }, urlPart: string) => {
  await expect(page).toHaveURL(new RegExp(urlPart));
});

Then("{string} 버튼이 표시되어야 한다", async ({ page }, buttonName: string) => {
  await expect(page.getByRole("button", { name: buttonName })).toBeVisible();
});

Then("{string} 버튼이 비활성화되어야 한다", async ({ page }, buttonName: string) => {
  await expect(page.getByRole("button", { name: buttonName })).toBeDisabled();
});

Then("로딩이 완료되어야 한다", async ({ page }) => {
  // 로딩 스피너가 사라질 때까지 대기
  const spinner = page.locator('[class*="animate-spin"]');
  if (await spinner.isVisible()) {
    await spinner.waitFor({ state: "hidden" });
  }
});

Then("{string} 에러가 표시되어야 한다", async ({ page }, errorMessage: string) => {
  await expect(
    page.getByRole("alert").or(page.getByText(errorMessage))
  ).toBeVisible();
});
