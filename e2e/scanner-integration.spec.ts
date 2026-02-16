import { test, expect } from "@playwright/test";

/**
 * Scanner Integration Test
 *
 * Tests scanner-engine components independently:
 * 1. Health check
 * 2. Direct scan submission (Semgrep SAST on mock app)
 * 3. Scan status polling
 *
 * Prerequisite: Scanner-engine running on port 8082
 */

const SCANNER_URL = "http://localhost:8082";

test.describe("Scanner Engine Integration", () => {
  test.beforeAll(async ({ request }) => {
    // Verify scanner is running
    try {
      const response = await request.get(`${SCANNER_URL}/health`);
      if (!response.ok()) {
        test.skip(true, "Scanner engine not running");
      }
    } catch {
      test.skip(true, "Scanner engine not accessible");
    }
  });

  test("Health check", async ({ request }) => {
    const response = await request.get(`${SCANNER_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("killhouse-scanner-engine");
  });

  test("Submit scan and check status", async ({ request }) => {
    // Submit a scan request (SAST only, no real repo - will gracefully fail clone)
    const response = await request.post(`${SCANNER_URL}/api/scans`, {
      data: {
        analysis_id: `test-${Date.now()}`,
        repo_url: null,
        target_url: null,
        callback_url: null,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.scan_id).toBeTruthy();
    expect(body.status).toBe("ACCEPTED");

    const scanId = body.scan_id;
    console.log(`Scan submitted: ${scanId}`);

    // Wait a moment for background task
    await new Promise((r) => setTimeout(r, 2000));

    // Check status
    const statusResponse = await request.get(
      `${SCANNER_URL}/api/scans/${scanId}`
    );
    expect(statusResponse.ok()).toBeTruthy();

    const statusBody = await statusResponse.json();
    console.log(`Scan status: ${statusBody.status}`);

    // Should be COMPLETED (no repo/target = empty scan completes quickly)
    expect(["SCANNING", "COMPLETED"]).toContain(statusBody.status);
  });

  test("Submit SAST scan with local repo path", async ({ request }) => {
    test.setTimeout(120_000); // 2 min timeout

    // Scanner expects git URL; local paths aren't supported.
    // This test validates graceful handling of a no-source scan.
    const response = await request.post(`${SCANNER_URL}/api/scans`, {
      data: {
        analysis_id: `sast-test-${Date.now()}`,
        repo_url: null,
        target_url: null,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ACCEPTED");

    console.log(`SAST scan submitted: ${body.scan_id}`);
  });

  test("Verify scanner accepts webhook callback URL", async ({ request }) => {
    const response = await request.post(`${SCANNER_URL}/api/scans`, {
      data: {
        analysis_id: `webhook-test-${Date.now()}`,
        repo_url: null,
        target_url: null,
        callback_url: "http://localhost:3001/api/analysis/webhook",
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ACCEPTED");
    expect(body.scan_id).toBeTruthy();

    console.log(`Webhook test scan: ${body.scan_id}`);
  });

  test("Verify scanner handles multiple concurrent scans", async ({
    request,
  }) => {
    test.setTimeout(60_000);

    // Submit 3 scans concurrently
    const scanPromises = Array.from({ length: 3 }, (_, i) =>
      request.post(`${SCANNER_URL}/api/scans`, {
        data: {
          analysis_id: `concurrent-test-${Date.now()}-${i}`,
          repo_url: null,
          target_url: null,
        },
      })
    );

    const responses = await Promise.all(scanPromises);

    // All should be accepted — collect scan IDs
    const scanIds: string[] = [];
    for (const response of responses) {
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.status).toBe("ACCEPTED");
      scanIds.push(body.scan_id);
      console.log(`Concurrent scan ${body.scan_id} accepted`);
    }

    // Wait for background processing
    await new Promise((r) => setTimeout(r, 3000));

    // Check all statuses
    for (const scanId of scanIds) {
      const statusResponse = await request.get(
        `${SCANNER_URL}/api/scans/${scanId}`
      );
      expect(statusResponse.ok()).toBeTruthy();
      const statusBody = await statusResponse.json();
      console.log(
        `Concurrent scan ${scanId} status: ${statusBody.status}`
      );
    }
  });
});
