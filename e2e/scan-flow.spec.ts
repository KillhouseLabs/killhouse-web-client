import { test, expect } from "@playwright/test";

/**
 * E2E Scan Flow Test
 *
 * Tests the complete security scan pipeline as a single sequential flow:
 * 1. Authenticate test user
 * 2. Create project
 * 3. Add repository with vulnerable app (Dockerfile)
 * 4. Start analysis → sandbox creates container → scanner runs SAST/DAST
 * 5. Poll until scanner sends results via webhook
 * 6. Verify analysis completes with vulnerability findings
 * 7. Cleanup
 *
 * Prerequisites:
 * - Web-client running on port 3001
 * - Sandbox running on port 8081
 * - Scanner-engine running on port 8082
 * - Docker daemon running
 */

const BASE_URL = "http://localhost:3001";
const SANDBOX_URL = "http://localhost:8081";
const SCANNER_URL = "http://localhost:8082";

const VULNERABLE_DOCKERFILE = `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python -c "import app; app.init_db()"

EXPOSE 8080

CMD ["python", "app.py"]`;

test.describe("Security Scan E2E Flow", () => {
  test("Complete scan pipeline: auth → project → analysis → verify", async ({
    page,
    request,
  }) => {
    test.setTimeout(360_000); // 6 minute timeout for entire flow

    // --- Step 0: Verify services ---
    console.log("=== Step 0: Verify services ===");

    const [sandboxHealth, scannerHealth] = await Promise.allSettled([
      request.get(`${SANDBOX_URL}/health`),
      request.get(`${SCANNER_URL}/health`),
    ]);

    if (scannerHealth.status !== "fulfilled" || !scannerHealth.value.ok()) {
      test.skip(true, "Scanner engine not running");
      return;
    }
    console.log("Scanner engine: OK");

    const sandboxAvailable =
      sandboxHealth.status === "fulfilled" && sandboxHealth.value.ok();
    if (sandboxAvailable) {
      console.log("Sandbox: OK");
    } else {
      console.warn("Sandbox not running - sandbox-dependent steps may fail");
    }

    // --- Step 1: Authenticate ---
    console.log("\n=== Step 1: Authenticate test user ===");

    await page.goto(
      `${BASE_URL}/api/auth/test-login?email=e2e-test@test.example.com`
    );
    await page.waitForURL(/\/dashboard|\/projects|\/login/, {
      timeout: 10000,
    });

    if (page.url().includes("/login")) {
      test.skip(true, "Test user not available");
      return;
    }

    const cookies = await page.context().cookies();
    const authCookies = cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
    }));
    expect(authCookies.length).toBeGreaterThan(0);

    const cookieHeader = authCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    console.log(`Authenticated with ${authCookies.length} cookies`);

    // --- Step 2: Create project ---
    console.log("\n=== Step 2: Create test project ===");

    const projectResponse = await request.post(`${BASE_URL}/api/projects`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      data: {
        name: `E2E Scan Test ${Date.now()}`,
        description: "E2E test project for security scan validation",
      },
    });

    expect(projectResponse.ok()).toBeTruthy();
    const projectBody = await projectResponse.json();
    expect(projectBody.success).toBe(true);
    const projectId = projectBody.data.id;
    console.log(`Created project: ${projectId}`);

    // Wrap remaining steps in try/finally to ensure cleanup
    try {
      // --- Step 3: Add repository ---
      console.log("\n=== Step 3: Add repository with vulnerable Dockerfile ===");

      const repoResponse = await request.post(
        `${BASE_URL}/api/projects/${projectId}/repositories`,
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          data: {
            provider: "GITHUB",
            name: "vulnerable-test-app",
            url: "https://github.com/test/vulnerable-app",
            defaultBranch: "main",
            dockerfileContent: VULNERABLE_DOCKERFILE,
          },
        }
      );

      expect(repoResponse.ok()).toBeTruthy();
      const repoBody = await repoResponse.json();
      expect(repoBody.success).toBe(true);
      console.log(`Added repository: ${repoBody.data.id}`);

      // --- Step 4: Create analysis record ---
      console.log("\n=== Step 4: Create analysis and trigger scanner ===");

      const analysisResponse = await request.post(
        `${BASE_URL}/api/projects/${projectId}/analyses`,
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          data: {
            branch: "main",
          },
        }
      );

      expect(analysisResponse.ok()).toBeTruthy();
      const analysisBody = await analysisResponse.json();
      expect(analysisBody.success).toBe(true);
      const analysisId = analysisBody.data.id;
      console.log(`Analysis created: ${analysisId}`);
      console.log(`Analysis status: ${analysisBody.data.status}`);

      // Submit scan directly to scanner-engine with local vulnerable app fixture
      // This bypasses the fake repo_url and uses the local fixture path for SAST
      const scanResponse = await request.post(`${SCANNER_URL}/api/scans`, {
        data: {
          analysis_id: analysisId,
          local_path:
            "/Users/limjihoon/dev/killhouse/killhouse-vuln-scanner-engine/tests/fixtures/vulnerable-app",
          callback_url: `${BASE_URL}/api/analyses/webhook`,
        },
      });

      expect(scanResponse.ok()).toBeTruthy();
      const scanBody = await scanResponse.json();
      console.log(`Scanner scan submitted: ${scanBody.scan_id}`);

      // --- Step 5: Poll until completion ---
      console.log("\n=== Step 5: Poll analysis until completion ===");

      let status = "PENDING";
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5s intervals

      while (
        status !== "COMPLETED" &&
        status !== "FAILED" &&
        attempts < maxAttempts
      ) {
        await new Promise((r) => setTimeout(r, 5000));
        attempts++;

        const pollResponse = await request.get(
          `${BASE_URL}/api/projects/${projectId}/analyses`,
          { headers: { Cookie: cookieHeader } }
        );

        if (pollResponse.ok()) {
          const pollBody = await pollResponse.json();
          const analysis = pollBody.data?.find(
            (a: { id: string }) => a.id === analysisId
          );
          if (analysis) {
            status = analysis.status;
            console.log(
              `[${attempts}] Analysis status: ${status} (vulns: ${analysis.vulnerabilitiesFound ?? "?"})`
            );
          }
        }
      }

      expect(status).toBe("COMPLETED");

      // --- Step 6: Verify results ---
      console.log("\n=== Step 6: Verify scan results ===");

      const resultResponse = await request.get(
        `${BASE_URL}/api/projects/${projectId}/analyses`,
        { headers: { Cookie: cookieHeader } }
      );

      expect(resultResponse.ok()).toBeTruthy();
      const resultBody = await resultResponse.json();
      const analysis = resultBody.data?.find(
        (a: { id: string }) => a.id === analysisId
      );

      expect(analysis).toBeTruthy();
      expect(analysis.status).toBe("COMPLETED");
      expect(analysis.vulnerabilitiesFound).toBeGreaterThan(0);
      expect(analysis.staticAnalysisReport).toBeTruthy();

      console.log("\n=== Scan Results ===");
      console.log(`Total vulnerabilities: ${analysis.vulnerabilitiesFound}`);
      console.log(`Critical: ${analysis.criticalCount}`);
      console.log(`High: ${analysis.highCount}`);
      console.log(`Medium: ${analysis.mediumCount}`);
      console.log(`Low: ${analysis.lowCount}`);
      console.log(`Sandbox status: ${analysis.sandboxStatus}`);

      if (analysis.staticAnalysisReport) {
        try {
          const sastReport =
            typeof analysis.staticAnalysisReport === "string"
              ? JSON.parse(analysis.staticAnalysisReport)
              : analysis.staticAnalysisReport;
          console.log(
            `SAST findings: ${sastReport.total || sastReport.findings?.length || 0}`
          );
        } catch {
          console.log(
            "SAST report (raw):",
            analysis.staticAnalysisReport.substring(0, 200)
          );
        }
      }

      if (analysis.penetrationTestReport) {
        try {
          const dastReport =
            typeof analysis.penetrationTestReport === "string"
              ? JSON.parse(analysis.penetrationTestReport)
              : analysis.penetrationTestReport;
          console.log(
            `DAST findings: ${dastReport.total || dastReport.findings?.length || 0}`
          );
        } catch {
          console.log(
            "DAST report (raw):",
            analysis.penetrationTestReport.substring(0, 200)
          );
        }
      }
    } finally {
      // --- Cleanup ---
      console.log("\n=== Cleanup ===");
      try {
        await request.delete(`${BASE_URL}/api/projects/${projectId}`, {
          headers: { Cookie: cookieHeader },
        });
        console.log(`Cleaned up project: ${projectId}`);
      } catch {
        console.log("Cleanup failed (non-critical)");
      }
    }
  });
});
