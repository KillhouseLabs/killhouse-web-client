import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Login Page Object
 * 로그인 페이지 관련 액션 및 검증
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly githubButton: Locator;
  readonly gitlabButton: Locator;
  readonly googleButton: Locator;
  readonly signupLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/이메일|email/i);
    this.passwordInput = page.getByLabel(/비밀번호|password/i);
    this.loginButton = page.getByRole("button", { name: /로그인|sign in/i });
    this.githubButton = page.getByRole("button", { name: /github/i });
    this.gitlabButton = page.getByRole("button", { name: /gitlab/i });
    this.googleButton = page.getByRole("button", { name: /google/i });
    this.signupLink = page.getByRole("link", { name: /회원가입|sign up/i });
    this.errorMessage = page.getByRole("alert");
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
    await expect(this.page).toHaveURL(/\/login/);
  }

  /**
   * 이메일/비밀번호로 로그인
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * GitHub OAuth 로그인 시작
   */
  async loginWithGitHub(): Promise<void> {
    await this.githubButton.click();
  }

  /**
   * GitLab OAuth 로그인 시작
   */
  async loginWithGitLab(): Promise<void> {
    await this.gitlabButton.click();
  }

  /**
   * Google OAuth 로그인 시작
   */
  async loginWithGoogle(): Promise<void> {
    await this.googleButton.click();
  }

  /**
   * 회원가입 페이지로 이동
   */
  async goToSignup(): Promise<void> {
    await this.signupLink.click();
  }

  /**
   * 에러 메시지 확인
   */
  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.errorMessage.or(this.page.getByText(message))).toBeVisible();
  }

  /**
   * 로그인 성공 후 대시보드 이동 확인
   */
  async expectLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard|\/projects/);
  }
}
