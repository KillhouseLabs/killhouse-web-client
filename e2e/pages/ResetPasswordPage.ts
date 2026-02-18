import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Reset Password Page Object
 * 비밀번호 재설정 페이지 관련 액션 및 검증
 */
export class ResetPasswordPage extends BasePage {
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.passwordInput = page.getByLabel("새 비밀번호");
    this.confirmPasswordInput = page.getByLabel("비밀번호 확인");
    this.submitButton = page.getByRole("button", {
      name: /비밀번호 재설정/i,
    });
    this.errorMessage = page.locator(".text-destructive").first();
    this.successMessage = page.getByText("비밀번호가 변경되었습니다");
  }

  async goto(token?: string): Promise<void> {
    const url = token
      ? `/reset-password?token=${token}`
      : "/reset-password";
    await this.page.goto(url);
  }

  async resetPassword(
    password: string,
    confirmPassword: string
  ): Promise<void> {
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }
}
