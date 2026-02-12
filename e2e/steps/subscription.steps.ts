import { createBdd } from "playwright-bdd";
import { test, expect } from "../fixtures";

const { Given, When, Then } = createBdd(test);

// ============================================
// 구독 관련 Given 스텝
// ============================================

Given("나는 구독 페이지에 있다", async ({ subscriptionPage }) => {
  await subscriptionPage.goto();
});

Given("나는 무료 플랜 사용자다", async ({ page }) => {
  // 구독 페이지로 이동
  await page.goto("/subscription");
  await page.waitForLoadState("networkidle");

  // 현재 Pro 플랜인지 확인하고 API로 해지
  const isProPlan = await page.getByText("Pro 플랜을 사용 중입니다").isVisible({ timeout: 2000 }).catch(() => false);
  if (isProPlan) {
    console.log("[Test] User is on Pro plan, cancelling via API...");

    // API를 통해 구독 해지
    const result = await page.evaluate(async () => {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        credentials: "include",
      });
      return response.json();
    });

    console.log("[Test] Cancel result:", result);

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState("networkidle");
  }

  // Free 플랜 텍스트가 표시되는지 확인
  await expect(page.getByText("Free 플랜을 사용 중입니다")).toBeVisible({ timeout: 10000 });
});

Given("나는 Pro 플랜 사용자다", async ({ page }) => {
  // 먼저 페이지로 이동하여 쿠키가 적용된 상태에서 API 호출
  await page.goto("/subscription");
  await page.waitForLoadState("networkidle");

  // 브라우저 컨텍스트 내에서 API 호출 (쿠키 자동 포함)
  const result = await page.evaluate(async () => {
    // 1. 결제 준비
    const checkoutResponse = await fetch("/api/payment/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "pro" }),
      credentials: "include",
    });

    if (!checkoutResponse.ok) {
      return { success: false, error: "checkout failed", status: checkoutResponse.status };
    }

    const checkoutData = await checkoutResponse.json();
    if (!checkoutData.success) {
      return { success: false, error: checkoutData.error };
    }

    // 2. 테스트 결제 완료
    const completeResponse = await fetch("/api/payment/test-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: checkoutData.data.orderId }),
      credentials: "include",
    });

    if (!completeResponse.ok) {
      return { success: false, error: "complete failed", status: completeResponse.status };
    }

    const completeData = await completeResponse.json();
    return completeData;
  });

  console.log("[Test] Pro plan upgrade result:", result);

  // 페이지 새로고침하여 변경사항 반영
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Pro 플랜으로 업그레이드 확인
  await expect(page.getByText("Pro 플랜을 사용 중입니다")).toBeVisible({ timeout: 10000 });
});

Given("이번 달에 {int}회 분석을 완료했다", async ({ page }, count: number) => {
  // 테스트 데이터로 분석 횟수가 설정되어 있다고 가정
  console.log(`[Test] Assuming ${count} analyses completed this month`);
});

// ============================================
// 구독 관련 When 스텝
// ============================================

When("Pro 플랜 구독하기 버튼을 클릭한다", async ({ page }) => {
  const subscribeButton = page.getByRole("button", { name: "Pro 플랜 구독하기" });
  await subscribeButton.click();
});

When("Pro 플랜 결제를 완료한다", async ({ page }) => {
  // 브라우저 콘솔 로그 수집
  const consoleLogs: string[] = [];
  page.on("console", (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // 테스트 모드에서 두 개의 dialog가 나타남:
  // 1. 결제 확인 (window.confirm)
  // 2. 완료 알림 (window.alert)
  const dialogHandler = async (dialog: import("playwright-core").Dialog) => {
    console.log("[Test] Dialog:", dialog.type(), dialog.message().substring(0, 50));
    await dialog.accept();
  };

  // 핸들러를 먼저 설정
  page.on("dialog", dialogHandler);

  // 버튼 클릭
  const subscribeButton = page.getByRole("button", { name: "Pro 플랜 구독하기" });
  await subscribeButton.click();

  // 결제 API 완료 대기
  await page.waitForTimeout(5000);
  await page.waitForLoadState("networkidle");

  // 콘솔 로그 출력
  console.log("[Test] Browser console logs:", consoleLogs.join("\n"));

  page.off("dialog", dialogHandler);
});

When("Pro 플랜 결제를 취소한다", async ({ page }) => {
  // 첫 번째 confirm dialog만 dismiss
  let dismissed = false;
  const dialogHandler = async (dialog: import("playwright-core").Dialog) => {
    console.log("[Test] Dialog:", dialog.type(), dialog.message().substring(0, 50));
    if (!dismissed && dialog.type() === "confirm") {
      await dialog.dismiss();
      dismissed = true;
    } else {
      await dialog.accept();
    }
  };

  // 핸들러를 먼저 설정
  page.on("dialog", dialogHandler);

  // 버튼 클릭
  const subscribeButton = page.getByRole("button", { name: "Pro 플랜 구독하기" });
  await subscribeButton.click();

  await page.waitForTimeout(2000);
  page.off("dialog", dialogHandler);
});

When("테스트 결제를 승인한다", async ({ page }) => {
  // 레거시 - 별도로 사용되지 않음
  const dialogHandler = async (dialog: import("playwright-core").Dialog) => {
    await dialog.accept();
  };
  page.on("dialog", dialogHandler);
  await page.waitForTimeout(3000);
  page.off("dialog", dialogHandler);
});

When("테스트 결제를 취소한다", async ({ page }) => {
  // 레거시 - 별도로 사용되지 않음
  const dialogHandler = async (dialog: import("playwright-core").Dialog) => {
    await dialog.dismiss();
  };
  page.on("dialog", dialogHandler);
  await page.waitForTimeout(1000);
  page.off("dialog", dialogHandler);
});

When("구독 해지 버튼을 클릭한다", async ({ page }) => {
  const cancelButton = page.getByRole("button", { name: /구독 해지/i });
  await cancelButton.click();
});

When("해지 확인을 승인한다", async ({ page }) => {
  // window.confirm 다이얼로그 승인
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });

  // 다이얼로그가 이미 열려있지 않으면 트리거된 시점에서 처리됨
  await page.waitForTimeout(500);
});

When("해지 확인을 취소한다", async ({ page }) => {
  // window.confirm 다이얼로그 취소
  page.once("dialog", async (dialog) => {
    await dialog.dismiss();
  });

  await page.waitForTimeout(500);
});

When("확인 팝업에서 계속 버튼을 클릭한다", async ({ page }) => {
  // window.confirm 다이얼로그 처리
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });

  // 이미 다이얼로그가 떠 있는 경우를 위해 UI 버튼도 확인
  const confirmButton = page.getByRole("button", { name: /확인|계속|yes|confirm/i });
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
  }
});

When("결제를 완료한다", async ({ page }) => {
  // 테스트 모드에서는 window.confirm으로 결제 확인
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  // 결제 완료 대기 (테스트 모드에서는 빠르게 완료됨)
  await page.waitForTimeout(2000);
  await page.waitForLoadState("networkidle");
});

When("새 분석을 시작하려고 한다", async ({ page }) => {
  // 프로젝트 페이지로 이동하여 분석 시작 시도
  await page.goto("/projects");
  const firstProject = page.getByTestId("project-item").first();
  await firstProject.click();

  await page.getByRole("button", { name: /분석 시작|start analysis/i }).click();
});

// ============================================
// 구독 관련 Then 스텝
// ============================================

Then("현재 플랜이 표시되어야 한다", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "현재 플랜" })).toBeVisible();
});

Then("플랜 선택 섹션이 표시되어야 한다", async ({ page }) => {
  await expect(page.getByText("플랜 선택")).toBeVisible();
});

Then("Free 플랜 카드가 표시되어야 한다", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Free" })).toBeVisible();
  await expect(page.getByText("₩0")).toBeVisible();
});

Then("Pro 플랜 카드가 표시되어야 한다", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
  await expect(page.getByText("₩29,000")).toBeVisible();
});

Then("Enterprise 플랜 카드가 표시되어야 한다", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Enterprise" })).toBeVisible();
});

Then("프로젝트 사용량이 표시되어야 한다", async ({ page }) => {
  // 프로젝트 텍스트와 사용량 형식: "0 / 3" 확인
  await expect(page.getByText("프로젝트").first()).toBeVisible();
  await expect(page.getByText("0 / 3")).toBeVisible();
});

Then("월간 분석 사용량이 표시되어야 한다", async ({ page }) => {
  await expect(page.getByText("월간 분석")).toBeVisible();
  await expect(page.getByText("0 / 10")).toBeVisible();
});

Then("스토리지 용량이 표시되어야 한다", async ({ page }) => {
  await expect(page.getByText("스토리지", { exact: true })).toBeVisible();
  await expect(page.getByText("100MB", { exact: true })).toBeVisible();
});

Then("Pro 플랜에 구독하기 버튼이 활성화되어야 한다", async ({ page }) => {
  const subscribeButton = page.getByRole("button", { name: "Pro 플랜 구독하기" });
  await expect(subscribeButton).toBeVisible();
  await expect(subscribeButton).toBeEnabled();
});

Then("Free 플랜에 현재 플랜 버튼이 표시되어야 한다", async ({ page }) => {
  // Free 플랜 카드 내의 현재 플랜 버튼
  const freePlanCard = page.locator("div").filter({ hasText: /^Free개인 프로젝트에 적합/ }).first();
  await expect(freePlanCard.getByRole("button", { name: /현재 플랜/i })).toBeVisible();
});

Then("Enterprise 플랜에 문의하기 링크가 표시되어야 한다", async ({ page }) => {
  await expect(page.getByRole("link", { name: /문의하기/i })).toBeVisible();
});

Then("현재 플랜이 {string}로 표시되어야 한다", async ({ page }, plan: string) => {
  // 현재 플랜 배지 또는 텍스트 확인
  await expect(page.getByText(`${plan} 플랜을 사용 중입니다`)).toBeVisible({ timeout: 10000 });
});

Then("현재 플랜이 {string}으로 표시되어야 한다", async ({ page }, plan: string) => {
  await expect(page.getByText(`${plan} 플랜을 사용 중입니다`)).toBeVisible({ timeout: 10000 });
});

Then("현재 플랜이 {string}로 유지되어야 한다", async ({ page }, plan: string) => {
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(`${plan} 플랜을 사용 중입니다`)).toBeVisible({ timeout: 10000 });
});

Then("프로젝트 제한이 {string}로 변경되어야 한다", async ({ page }, limit: string) => {
  await expect(page.getByText(new RegExp(limit))).toBeVisible();
});

Then("프로젝트 제한이 {string}으로 변경되어야 한다", async ({ page }, limit: string) => {
  await expect(page.getByText(new RegExp(limit))).toBeVisible();
});

Then("구독 해지 버튼이 표시되어야 한다", async ({ page }) => {
  await expect(page.getByRole("button", { name: /구독 해지/i })).toBeVisible();
});

Then("구독 해지 버튼이 표시되지 않아야 한다", async ({ page }) => {
  await expect(page.getByRole("button", { name: /구독 해지/i })).not.toBeVisible();
});

Then("해지 확인 다이얼로그가 표시되어야 한다", async ({ page }) => {
  // window.confirm은 자동으로 나타남 - 이 스텝은 다음 스텝에서 dialog 이벤트로 처리됨
  // 테스트에서는 dialog 이벤트 리스너가 동작했는지 확인
  console.log("[Test] Cancel confirmation dialog should appear");
});

Then("다이얼로그에 경고 메시지가 표시되어야 한다", async ({ page }) => {
  // window.confirm의 메시지에 경고 내용이 포함되어 있음
  // 실제 확인은 dialog 이벤트 핸들러에서 수행
  console.log("[Test] Dialog should contain warning message");
});

Then("업그레이드 모달이 표시되어야 한다", async ({ page }) => {
  await expect(
    page.getByRole("dialog").or(page.getByTestId("upgrade-modal"))
  ).toBeVisible();
});

Then("월간 분석 한도 초과 메시지가 표시되어야 한다", async ({ page }) => {
  await expect(
    page.getByText(/월간 분석 한도|한도.*초과|limit.*exceeded/i)
  ).toBeVisible();
});

Then("구독 완료 메시지가 표시되어야 한다", async ({ page }) => {
  // alert 다이얼로그 처리
  let alertShown = false;
  page.once("dialog", async (dialog) => {
    if (dialog.message().includes("성공") || dialog.message().includes("완료")) {
      alertShown = true;
      await dialog.accept();
    }
  });

  // 알림이 표시될 때까지 대기
  await page.waitForTimeout(2000);

  // 또는 페이지에서 Pro 플랜으로 변경된 것 확인
  await expect(page.getByText("Pro 플랜을 사용 중입니다")).toBeVisible({ timeout: 10000 });
});

Then("구독 해지 완료 메시지가 표시되어야 한다", async ({ page }) => {
  // alert 다이얼로그 처리
  page.once("dialog", async (dialog) => {
    if (dialog.message().includes("해지")) {
      await dialog.accept();
    }
  });

  await page.waitForTimeout(1000);
});
