import { createBdd } from "playwright-bdd";
import { test, expect } from "../fixtures";

const { Given, When, Then } = createBdd(test);

// ============================================
// 인증 관련 Given 스텝
// ============================================

Given("나는 로그인 페이지에 있다", async ({ page }) => {
  console.log("[Test] Navigating to /login...");
  const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
  console.log("[Test] Response status:", response?.status());
  console.log("[Test] Current URL:", page.url());

  // 페이지 로드 대기
  await page.waitForLoadState("networkidle");
  console.log("[Test] Page loaded, URL:", page.url());

  // 스크린샷 저장 (디버깅용)
  await page.screenshot({ path: "test-results/debug-login-page.png" });
});

Given("나는 회원가입 페이지에 있다", async ({ page }) => {
  await page.goto("/signup");
  await expect(page).toHaveURL(/\/signup/);
});

// ============================================
// 인증 관련 When 스텝
// ============================================

When("이메일 {string}을 입력한다", async ({ loginPage }, email: string) => {
  await loginPage.emailInput.fill(email);
});

When("이메일 {string}를 입력한다", async ({ loginPage }, email: string) => {
  await loginPage.emailInput.fill(email);
});

When("비밀번호 {string}을 입력한다", async ({ loginPage }, password: string) => {
  await loginPage.passwordInput.fill(password);
});

When("비밀번호 {string}를 입력한다", async ({ loginPage }, password: string) => {
  await loginPage.passwordInput.fill(password);
});

When("로그인 버튼을 클릭한다", async ({ loginPage }) => {
  await loginPage.loginButton.click();
});

When("{string}로 계속하기 버튼을 클릭한다", async ({ page }, provider: string) => {
  // 버튼 텍스트: "GitHub로 계속하기", "Google로 계속하기" 등
  const providerButton = page.getByRole("button", { name: new RegExp(`${provider}로 계속하기`, "i") });
  await providerButton.click();
});

When("회원가입 링크를 클릭한다", async ({ loginPage }) => {
  await loginPage.goToSignup();
});

// ============================================
// 인증 관련 Then 스텝
// ============================================

Then("대시보드로 이동해야 한다", async ({ page }) => {
  await expect(page).toHaveURL(/\/dashboard|\/projects/);
});

Then("로그인 페이지로 리다이렉트되어야 한다", async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});

Then("GitHub 인증 페이지로 리다이렉트되어야 한다", async ({ page }) => {
  await expect(page).toHaveURL(/github\.com.*oauth|github\.com.*login/);
});

Then("GitLab 인증 페이지로 리다이렉트되어야 한다", async ({ page }) => {
  await expect(page).toHaveURL(/gitlab\.com.*oauth|gitlab\.com.*sign_in/);
});

Then("Google 인증 페이지로 리다이렉트되어야 한다", async ({ page }) => {
  await expect(page).toHaveURL(/accounts\.google\.com/);
});

Then("로그인 에러 메시지가 표시되어야 한다", async ({ loginPage }) => {
  await expect(loginPage.errorMessage).toBeVisible();
});

Then("{string} 로그인 에러가 표시되어야 한다", async ({ loginPage }, message: string) => {
  await loginPage.expectError(message);
});

Then("회원가입 페이지로 이동해야 한다", async ({ page }) => {
  await expect(page).toHaveURL(/\/signup/);
});
