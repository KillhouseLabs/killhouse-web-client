import { Page, Locator, expect } from "@playwright/test";

/**
 * Base Page Object class
 * 모든 Page Object의 공통 기능 제공
 */
export abstract class BasePage {
  constructor(public readonly page: Page) {}

  /**
   * 페이지 이동
   */
  abstract goto(): Promise<void>;

  /**
   * 텍스트가 화면에 표시되는지 확인
   */
  async expectText(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  /**
   * 텍스트가 화면에 표시되지 않는지 확인
   */
  async expectNoText(text: string): Promise<void> {
    await expect(this.page.getByText(text)).not.toBeVisible();
  }

  /**
   * URL 확인
   */
  async expectUrl(pattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  /**
   * 버튼 클릭
   */
  async clickButton(name: string | RegExp): Promise<void> {
    await this.page.getByRole("button", { name }).click();
  }

  /**
   * 링크 클릭
   */
  async clickLink(name: string | RegExp): Promise<void> {
    await this.page.getByRole("link", { name }).click();
  }

  /**
   * 입력 필드에 값 입력
   */
  async fillInput(label: string | RegExp, value: string): Promise<void> {
    await this.page.getByLabel(label).fill(value);
  }

  /**
   * 토스트/알림 메시지 확인
   */
  async expectToast(message: string): Promise<void> {
    await expect(
      this.page.getByRole("alert").or(this.page.getByText(message))
    ).toBeVisible();
  }

  /**
   * 로딩 완료 대기
   */
  async waitForLoadingComplete(): Promise<void> {
    // 로딩 스피너가 사라질 때까지 대기
    const spinner = this.page.locator('[class*="animate-spin"]');
    if (await spinner.isVisible()) {
      await spinner.waitFor({ state: "hidden" });
    }
  }
}
