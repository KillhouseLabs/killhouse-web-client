import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Subscription Page Object
 * 구독 관리 페이지 관련 액션 및 검증
 */
export class SubscriptionPage extends BasePage {
  // 현재 플랜 섹션
  readonly currentPlanSection: Locator;
  readonly currentPlanBadge: Locator;
  readonly projectUsage: Locator;
  readonly analysisUsage: Locator;
  readonly storageUsage: Locator;

  // 버튼들
  readonly cancelButton: Locator;
  readonly proSubscribeButton: Locator;

  // 플랜 카드들
  readonly freePlanCard: Locator;
  readonly proPlanCard: Locator;
  readonly enterprisePlanCard: Locator;

  // 결제 내역 섹션
  readonly billingHistorySection: Locator;

  constructor(page: Page) {
    super(page);

    // 현재 플랜 섹션
    this.currentPlanSection = page.locator("div").filter({ hasText: "현재 플랜" }).first();
    this.currentPlanBadge = page.locator("span.rounded-full").filter({ hasText: /Free|Pro|Enterprise/ });
    this.projectUsage = page.locator("div").filter({ hasText: "프로젝트" }).locator("p.text-2xl");
    this.analysisUsage = page.locator("div").filter({ hasText: "월간 분석" }).locator("p.text-2xl");
    this.storageUsage = page.locator("div").filter({ hasText: "스토리지" }).locator("p.text-2xl");

    // 버튼들
    this.cancelButton = page.getByRole("button", { name: /구독 해지/i });
    this.proSubscribeButton = page.getByRole("button", { name: /Pro 구독하기/i });

    // 플랜 카드들
    this.freePlanCard = page.locator("div").filter({ hasText: /^Free/ }).first();
    this.proPlanCard = page.locator("div").filter({ hasText: /^Pro팀과 스타트업에 적합/ });
    this.enterprisePlanCard = page.locator("div").filter({ hasText: /^Enterprise대규모 조직에 적합/ });

    // 결제 내역 섹션
    this.billingHistorySection = page.locator("div").filter({ hasText: "결제 내역" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/subscription");
    await this.page.waitForLoadState("networkidle");
    await expect(this.page).toHaveURL(/\/subscription/);
  }

  /**
   * 현재 플랜 확인
   */
  async expectCurrentPlan(plan: "Free" | "Pro" | "Enterprise"): Promise<void> {
    await expect(this.page.getByText(`${plan} 플랜을 사용 중입니다`)).toBeVisible();
  }

  /**
   * 프로젝트 사용량 확인
   */
  async expectProjectUsage(current: number, limit: number | "무제한"): Promise<void> {
    const limitText = limit === "무제한" ? "무제한" : String(limit);
    await expect(this.page.getByText(new RegExp(`${current}.*${limitText}`))).toBeVisible();
  }

  /**
   * Pro 플랜으로 업그레이드 클릭
   */
  async clickUpgradeToPro(): Promise<void> {
    await this.proSubscribeButton.click();
  }

  /**
   * 구독 해지 클릭
   */
  async clickCancelSubscription(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * 결제 완료 대기 (테스트 모드)
   */
  async waitForPaymentComplete(): Promise<void> {
    // 테스트 모드에서 결제 완료 후 페이지 새로고침 대기
    await this.page.waitForLoadState("networkidle");
    await expect(this.page.getByText("Pro 플랜을 사용 중입니다")).toBeVisible({ timeout: 15000 });
  }

  /**
   * 해지 완료 확인
   */
  async expectCancellationComplete(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
    await expect(this.page.getByText("Free 플랜을 사용 중입니다")).toBeVisible({ timeout: 10000 });
  }

  /**
   * 플랜 카드 정보 확인
   */
  async expectPlanCards(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Free" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Pro" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Enterprise" })).toBeVisible();
  }

  /**
   * Pro 플랜 가격 확인
   */
  async expectProPlanPrice(): Promise<void> {
    await expect(this.page.getByText("₩29,000")).toBeVisible();
  }

  /**
   * 해지 버튼 표시 여부 확인
   */
  async expectCancelButtonVisible(): Promise<void> {
    await expect(this.cancelButton).toBeVisible();
  }

  /**
   * 해지 버튼이 없는지 확인
   */
  async expectCancelButtonNotVisible(): Promise<void> {
    await expect(this.cancelButton).not.toBeVisible();
  }

  /**
   * 구독하기 버튼 활성화 확인
   */
  async expectSubscribeButtonEnabled(): Promise<void> {
    await expect(this.proSubscribeButton).toBeVisible();
    await expect(this.proSubscribeButton).toBeEnabled();
  }

  /**
   * 결제 내역 섹션 확인
   */
  async expectBillingHistory(): Promise<void> {
    await expect(this.page.getByText("결제 내역")).toBeVisible();
  }
}
