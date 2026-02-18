import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Forgot Password Page Object
 * 비밀번호 찾기 페이지 관련 액션 및 검증
 */
export class ForgotPasswordPage extends BasePage {
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/이메일|email/i);
    this.submitButton = page.getByRole("button", {
      name: /비밀번호 재설정 요청/i,
    });
    this.loginLink = page.getByRole("link", { name: /로그인/i });
    this.errorMessage = page.locator(".text-destructive").first();
    this.successMessage = page.getByText("이메일을 확인해주세요");
  }

  async goto(): Promise<void> {
    await this.page.goto("/forgot-password");
    await expect(this.page).toHaveURL(/\/forgot-password/);
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
