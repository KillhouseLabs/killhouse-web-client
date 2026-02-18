import { createBdd } from "playwright-bdd";
import { test, expect } from "../fixtures";

const { Given, When, Then } = createBdd(test);

// ============================================
// 비밀번호 찾기 관련 Given 스텝
// ============================================

Given("나는 비밀번호 찾기 페이지에 있다", async ({ forgotPasswordPage }) => {
  await forgotPasswordPage.goto();
});

// ============================================
// 비밀번호 찾기 관련 When 스텝
// ============================================

When("비밀번호 찾기 링크를 클릭한다", async ({ loginPage }) => {
  await loginPage.page.getByRole("link", { name: "비밀번호 찾기" }).click();
});

When(
  "이메일 입력란에 {string}을 입력한다",
  async ({ forgotPasswordPage }, email: string) => {
    await forgotPasswordPage.emailInput.fill(email);
  }
);

When(
  "이메일 입력란에 {string}를 입력한다",
  async ({ forgotPasswordPage }, email: string) => {
    await forgotPasswordPage.emailInput.fill(email);
  }
);

When(
  "비밀번호 재설정 요청 버튼을 클릭한다",
  async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.submitButton.click();
  }
);

// ============================================
// 비밀번호 찾기 관련 Then 스텝
// ============================================

Then("비밀번호 찾기 페이지로 이동해야 한다", async ({ page }) => {
  await expect(page).toHaveURL(/\/forgot-password/);
});

Then("로그인 페이지로 이동해야 한다", async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});
