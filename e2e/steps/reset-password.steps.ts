import { createBdd } from "playwright-bdd";
import { test, expect } from "../fixtures";

const { Given, When, Then } = createBdd(test);

// ============================================
// 비밀번호 재설정 관련 Given 스텝
// ============================================

Given("유효한 비밀번호 재설정 토큰이 있다", async ({ page }) => {
  // E2E 테스트용: API를 통해 토큰을 생성하거나 DB에 직접 삽입
  // 실제 E2E에서는 test-setup에서 토큰을 미리 생성해야 함
  (page as unknown as { _resetToken: string })._resetToken =
    "e2e-test-valid-token";
});

Given("만료된 비밀번호 재설정 토큰이 있다", async ({ page }) => {
  (page as unknown as { _resetToken: string })._resetToken =
    "e2e-test-expired-token";
});

// ============================================
// 비밀번호 재설정 관련 When 스텝
// ============================================

When("비밀번호 재설정 페이지에 접근한다", async ({ page }) => {
  const token = (page as unknown as { _resetToken: string })._resetToken;
  await page.goto(`/reset-password?token=${token}`);
});

When("토큰 없이 비밀번호 재설정 페이지에 접근한다", async ({ page }) => {
  await page.goto("/reset-password");
});

When(
  "새 비밀번호에 {string}을 입력한다",
  async ({ resetPasswordPage }, password: string) => {
    await resetPasswordPage.passwordInput.fill(password);
  }
);

When(
  "새 비밀번호에 {string}를 입력한다",
  async ({ resetPasswordPage }, password: string) => {
    await resetPasswordPage.passwordInput.fill(password);
  }
);

When(
  "비밀번호 확인에 {string}을 입력한다",
  async ({ resetPasswordPage }, password: string) => {
    await resetPasswordPage.confirmPasswordInput.fill(password);
  }
);

When(
  "비밀번호 확인에 {string}를 입력한다",
  async ({ resetPasswordPage }, password: string) => {
    await resetPasswordPage.confirmPasswordInput.fill(password);
  }
);

When("비밀번호 재설정 버튼을 클릭한다", async ({ resetPasswordPage }) => {
  await resetPasswordPage.submitButton.click();
});

// ============================================
// 비밀번호 재설정 관련 Then 스텝
// ============================================

Then("비밀번호 재설정 폼이 표시되어야 한다", async ({ resetPasswordPage }) => {
  await expect(resetPasswordPage.passwordInput).toBeVisible();
  await expect(resetPasswordPage.confirmPasswordInput).toBeVisible();
  await expect(resetPasswordPage.submitButton).toBeVisible();
});
