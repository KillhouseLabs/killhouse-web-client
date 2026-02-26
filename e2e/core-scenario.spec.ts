import { test, expect } from "@playwright/test";

/**
 * New Analysis Flow E2E Test
 *
 * Validates the pipeline log refactoring by running a fresh analysis:
 * 1. Login with demo credentials
 * 2. Create a new project with a GitHub repository via API
 * 3. Start analysis via API (to get the analysis ID reliably)
 * 4. Navigate directly to the analysis detail page
 * 5. Verify pipeline logs appear in real-time (CLONING, STATIC_ANALYSIS, BUILDING)
 * 6. Wait for the analysis to reach a terminal state
 *
 * Prerequisites:
 * - Web-client running on port 3001
 * - Scanner-engine running on port 8082 (with refactored pipeline)
 * - Demo user exists: demo@killhouse.io / KillhouseDemo2025!
 */

const DEMO_EMAIL = "demo@killhouse.io";
const DEMO_PASSWORD = "KillhouseDemo2025!";
const TEST_PROJECT_NAME = `E2E-Pipeline-Test-${Date.now()}`;
const TEST_REPO_URL = "https://github.com/juice-shop/juice-shop";

test.describe("New Analysis Flow: Pipeline Log Verification", () => {
  test.setTimeout(180_000);

  test("Create project → Start analysis → Verify pipeline logs", async ({ page }) => {
    // --- Step 1: Login ---
    await test.step("Login with demo credentials", async () => {
      await page.goto("/login");
      await expect(page).toHaveURL(/\/login/);

      await page.getByLabel(/이메일|email/i).fill(DEMO_EMAIL);
      await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
      await page.getByRole("button", { name: /로그인|log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    });

    // --- Step 2: Create project via API ---
    let projectId: string;
    await test.step("Create project with GitHub repository via API", async () => {
      const createResponse = await page.request.post("/api/projects", {
        data: {
          name: TEST_PROJECT_NAME,
          description: "E2E test project for pipeline log verification",
          repositories: [
            {
              provider: "GITHUB",
              name: "juice-shop",
              url: TEST_REPO_URL,
              owner: "juice-shop",
              defaultBranch: "master",
              isPrimary: true,
            },
          ],
        },
      });

      expect(createResponse.ok()).toBe(true);
      const body = await createResponse.json();
      projectId = body.data.id;
      expect(projectId).toBeTruthy();
    });

    // --- Step 3: Start analysis via API and get analysis ID ---
    let analysisId: string;
    await test.step("Start analysis via API", async () => {
      const analysisResponse = await page.request.post(
        `/api/projects/${projectId}/analyses`,
        {
          data: { branch: "master" },
        }
      );

      const body = await analysisResponse.json();
      // Log the response for debugging
      console.log("Analysis API response:", JSON.stringify(body, null, 2));

      expect(analysisResponse.ok()).toBe(true);
      analysisId = body.data.id;
      expect(analysisId).toBeTruthy();
    });

    // --- Step 4: Navigate directly to analysis detail ---
    await test.step("Navigate to analysis detail page", async () => {
      await page.goto(`/projects/${projectId}/analyses/${analysisId}`);
      await page.waitForLoadState("networkidle");

      // Verify we're on the analysis detail page
      await expect(page.getByRole("heading", { name: "분석 결과" })).toBeVisible({ timeout: 10_000 });
    });

    // --- Step 5: Verify pipeline logs appear ---
    await test.step("Verify pipeline logs appear with status messages", async () => {
      // Wait for the "분석 로그" section to appear (logs arrive via polling)
      const logsHeading = page.getByText("분석 로그");
      await expect(logsHeading).toBeVisible({ timeout: 60_000 });

      // Check that log entries with timestamps exist
      const logEntry = page.locator(".font-mono.text-xs");
      await expect(logEntry.first()).toBeVisible({ timeout: 30_000 });

      // Verify the "저장소 클론" (CLONING) step logs appear
      await expect(page.getByText("저장소 클론").first()).toBeVisible({ timeout: 30_000 });
    });

    // --- Step 6: Wait for BUILDING phase log (core fix validation) ---
    await test.step("Verify BUILDING phase sends log_message (core fix)", async () => {
      // This is the core test: BUILDING previously didn't send log_message.
      // After the refactoring, the "빌드" step should appear in the logs.
      // The log section groups entries by step name inside collapsible <details>.

      // Wait for the "빌드" step to appear in the logs (pipeline must progress past SAST)
      const buildingSummary = page.locator("summary").filter({ hasText: "빌드" });
      await expect(buildingSummary).toBeVisible({ timeout: 120_000 });

      // Open the "빌드" details section by setting the open attribute directly
      // (clicking may get undone by polling re-renders)
      const buildingDetails = page.locator("details").filter({ hasText: "빌드" });
      await buildingDetails.evaluate((el) => el.setAttribute("open", ""));

      // Verify the custom log message "Building sandbox environment" exists
      // This message was added by the refactoring — previously BUILDING sent no log_message
      await expect(page.getByText("Building sandbox environment")).toBeVisible({
        timeout: 5_000,
      });
    });

    // --- Step 7: Wait for terminal state and verify structure ---
    await test.step("Wait for analysis completion and verify log structure", async () => {
      // Wait for a terminal status indicator
      await expect(
        page.getByText(/완료|일부 오류와 함께 완료|실패/).first()
      ).toBeVisible({ timeout: 120_000 });

      // Verify logs section has collapsible details elements
      const detailCount = await page.locator("details").count();
      expect(detailCount).toBeGreaterThanOrEqual(1);

      // Verify multiple log entries exist
      const logCount = await page.locator(".font-mono.text-xs").count();
      expect(logCount).toBeGreaterThanOrEqual(2);

      // Take screenshot for visual verification
      await page.screenshot({
        path: "e2e/screenshots/pipeline-logs-result.png",
        fullPage: true,
      });
    });
  });
});
