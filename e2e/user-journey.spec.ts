import { test, expect } from "@playwright/test";

/**
 * User Journey E2E Test
 *
 * 주요 사용자 시나리오를 순차적으로 검증:
 * 1. 로그인 → 대시보드 확인
 * 2. 프로젝트 CRUD (생성 → 조회 → 수정 → 삭제)
 * 3. 구독 페이지 확인
 * 4. 결제 checkout API 확인
 *
 * Prerequisites:
 * - Web-client running on port 3001
 * - Demo user: demo@killhouse.io / KillhouseDemo2025!
 */

const DEMO_EMAIL = "demo@killhouse.io";
const DEMO_PASSWORD = "KillhouseDemo2025!";

/**
 * 데모 유저로 로그인한다.
 * test-login API로 세션 쿠키를 세팅한다. rate limit 시 재시도.
 */
async function login(page: import("@playwright/test").Page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await page.request.get(
      `/api/auth/test-login?email=${DEMO_EMAIL}`,
      { maxRedirects: 0 }
    );

    // 307 (redirect to /dashboard) = 성공
    if (res.status() === 307 || res.ok()) {
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
      return;
    }

    // 429 rate limit → 대기 후 재시도
    if (res.status() === 429) {
      const body = await res.json().catch(() => ({}));
      const wait = (body.retryAfter || 20) * 1000 + 1000;
      await page.waitForTimeout(wait);
      continue;
    }

    // 그 외 에러 → 대기 후 재시도
    await page.waitForTimeout(3000);
  }

  // 최종 fallback: 폼 로그인
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

// 순차 실행: rate limit 방지 + projectId 공유
test.describe.serial(
  "User Journey: Login → Project CRUD → Subscription",
  () => {
    test.setTimeout(60_000);

    let projectId: string;
    const projectName = `E2E-Journey-${Date.now()}`;

    test("1. 로그인 → 대시보드 도달", async ({ page }) => {
      await page.goto("/login");
      await expect(page).toHaveURL(/\/login/);

      await page.getByLabel(/email/i).fill(DEMO_EMAIL);
      await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
      await page.getByRole("button", { name: /log in/i }).click();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
      await expect(page.getByText(/project/i).first()).toBeVisible();
    });

    test("2. 프로젝트 생성 → 목록에서 확인", async ({ page }) => {
      await login(page);

      const createRes = await page.request.post("/api/projects", {
        data: {
          name: projectName,
          description: "E2E user journey test project",
          repositories: [
            {
              provider: "GITHUB",
              name: "juice-shop",
              url: "https://github.com/juice-shop/juice-shop",
              owner: "juice-shop",
              defaultBranch: "master",
              isPrimary: true,
            },
          ],
        },
      });
      expect(createRes.ok()).toBe(true);
      const { data: created } = await createRes.json();
      projectId = created.id;
      expect(projectId).toBeTruthy();

      // UI 확인
      await page.goto("/projects");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(projectName)).toBeVisible({
        timeout: 10_000,
      });
    });

    test("3. 프로젝트 조회 → Legacy 필드 검증", async ({ page }) => {
      await login(page);

      // API 조회 — addLegacyFields 동작 검증
      const getRes = await page.request.get(`/api/projects/${projectId}`);
      expect(getRes.ok()).toBe(true);
      const { data } = await getRes.json();

      expect(data.repoProvider).toBe("GITHUB");
      expect(data.repoUrl).toBe(
        "https://github.com/juice-shop/juice-shop"
      );
      expect(data.repoOwner).toBe("juice-shop");
      expect(data.repoName).toBe("juice-shop");
      expect(data.defaultBranch).toBe("master");
      expect(data.repositories).toHaveLength(1);
      expect(data.repositories[0].isPrimary).toBe(true);

      // UI 확인
      await page.goto(`/projects/${projectId}`);
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(projectName)).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText("juice-shop").first()).toBeVisible();
    });

    test("4. 프로젝트 수정 → 이름 변경 반영", async ({ page }) => {
      await login(page);

      const updatedName = `${projectName}-Updated`;
      const patchRes = await page.request.patch(
        `/api/projects/${projectId}`,
        { data: { name: updatedName } }
      );
      expect(patchRes.ok()).toBe(true);
      const { data } = await patchRes.json();
      expect(data.name).toBe(updatedName);
      expect(data.repoProvider).toBe("GITHUB");

      await page.goto("/projects");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(updatedName)).toBeVisible({
        timeout: 10_000,
      });
    });

    test("5. 구독 페이지 → Enterprise 플랜 확인", async ({ page }) => {
      await login(page);

      await page.goto("/subscription");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByText("Enterprise 플랜을 사용 중입니다")
      ).toBeVisible({ timeout: 10_000 });

      await expect(
        page.getByRole("heading", { name: "Free" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Pro" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Enterprise" })
      ).toBeVisible();
    });

    test("6. 결제 checkout API → usecase 동작 확인", async ({ page }) => {
      await login(page);

      const checkoutRes = await page.request.post("/api/payment/checkout", {
        data: { planId: "pro" },
      });
      expect(checkoutRes.ok()).toBe(true);

      const { data } = await checkoutRes.json();
      expect(data.orderId).toMatch(/^order_/);
      expect(data.planName).toBe("Pro");
      expect(data.amount).toBe(29000);
      expect(data.currency).toBe("KRW");
      expect(data.orderName).toContain("Killhouse");
      expect(data.customer.email).toBe(DEMO_EMAIL);
    });

    test("7. 프로젝트 삭제 → 목록에서 제거", async ({ page }) => {
      await login(page);

      const deleteRes = await page.request.delete(
        `/api/projects/${projectId}`
      );
      expect(deleteRes.ok()).toBe(true);

      await page.goto("/projects");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(projectName)).not.toBeVisible({
        timeout: 5_000,
      });
    });
  }
);
