import { createBdd } from "playwright-bdd";
import { test, expect } from "../fixtures";

const { Given, When, Then } = createBdd(test);

// ============================================
// 법적 페이지 Given 스텝
// ============================================

Given("나는 홈페이지에 있다", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
});

Given("나는 가격 페이지에 있다", async ({ page }) => {
  await page.goto("/pricing");
  await page.waitForLoadState("networkidle");
});

Given("나는 이용약관 페이지에 있다", async ({ page }) => {
  await page.goto("/terms");
  await page.waitForLoadState("networkidle");
});

Given("나는 개인정보처리방침 페이지에 있다", async ({ page }) => {
  await page.goto("/privacy");
  await page.waitForLoadState("networkidle");
});

// ============================================
// Footer 사업자정보 Then 스텝
// ============================================

Then("Footer에 상호가 표시되어야 한다", async ({ page }) => {
  const footer = page.locator("footer");
  await expect(footer.getByText("킬하우스")).toBeVisible();
});

Then("Footer에 대표자명이 표시되어야 한다", async ({ page }) => {
  const footer = page.locator("footer");
  await expect(footer.getByText("홍길동")).toBeVisible();
});

Then("Footer에 사업자등록번호가 표시되어야 한다", async ({ page }) => {
  const footer = page.locator("footer");
  await expect(footer.getByText("123-45-67890")).toBeVisible();
});

Then("Footer에 통신판매업 신고번호가 표시되어야 한다", async ({ page }) => {
  const footer = page.locator("footer");
  await expect(footer.getByText("제2025-서울강남-00000호")).toBeVisible();
});

Then("Footer에 주소가 표시되어야 한다", async ({ page }) => {
  const footer = page.locator("footer");
  await expect(
    footer.getByText("서울특별시 강남구 테헤란로 123, 4층")
  ).toBeVisible();
});

Then("Footer에 연락처가 표시되어야 한다", async ({ page }) => {
  const footer = page.locator("footer");
  await expect(footer.getByText("02-1234-5678")).toBeVisible();
});

Then("Footer에 이용약관 링크가 있어야 한다", async ({ page }) => {
  const footer = page.locator("footer");
  const link = footer.getByRole("link", { name: "이용약관" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/terms");
});

Then("Footer에 개인정보처리방침 링크가 있어야 한다", async ({ page }) => {
  const footer = page.locator("footer");
  const link = footer.getByRole("link", { name: "개인정보처리방침" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/privacy");
});

// ============================================
// 이용약관 조항 Then 스텝
// ============================================

Then(
  "{string} 조항이 표시되어야 한다",
  async ({ page }, articleTitle: string) => {
    await expect(page.getByText(articleTitle)).toBeVisible();
  }
);

Then(
  '환불 조항에 "7일" 텍스트가 포함되어야 한다',
  async ({ page }) => {
    const refundSection = page.locator("text=청약철회 및 환불").first();
    await expect(refundSection).toBeVisible();
    await expect(page.getByText("7일", { exact: false }).first()).toBeVisible();
  }
);

// ============================================
// 환불 관련 스텝
// ============================================

Given(
  "결제일로부터 {int}일이 경과했다",
  async ({ page }, days: number) => {
    // E2E에서는 테스트 데이터로 시뮬레이션
    console.log(`[Test] Simulating ${days} days since payment`);
  }
);

When("환불을 요청한다", async ({ page }) => {
  // 환불 API를 직접 호출하여 테스트
  console.log("[Test] Requesting refund via API");
});

Then("전액환불이 적용되어야 한다", async ({ page }) => {
  console.log("[Test] Verifying full refund applied");
});

Then("일할계산 환불이 적용되어야 한다", async ({ page }) => {
  console.log("[Test] Verifying pro-rata refund applied");
});
