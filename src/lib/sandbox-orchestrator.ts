import { prisma } from "@/infrastructure/database/prisma";
import { serverEnv } from "@/config/env";
import { getResourceLimits } from "@/domains/subscription/usecase/subscription-limits";
import { CircuitBreaker } from "@/lib/circuit-breaker";

const SANDBOX_TIMEOUT_MS = 10 * 60 * 1000; // 10분
const RETRY_DELAYS = [5000, 15000]; // 2회 retry: 5초, 15초

const sandboxCircuitBreaker = new CircuitBreaker(3, 5 * 60 * 1000);

export function resetCircuitBreaker(): void {
  sandboxCircuitBreaker.reset();
}

interface SandboxResult {
  success: boolean;
  envId?: string;
  targetUrl?: string | null;
  networkName?: string | null;
  error?: string;
}

interface RepoInput {
  url?: string | null;
  dockerfileContent?: string | null;
  composeContent?: string | null;
}

async function callSandboxWithTimeout(
  sandboxUrl: string,
  payload: object,
  timeoutMs: number = SANDBOX_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${sandboxUrl}/api/environments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callSandboxWithRetry(
  sandboxUrl: string,
  payload: object,
  maxRetries: number = 2
): Promise<SandboxResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await callSandboxWithTimeout(sandboxUrl, payload);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          envId: data.environment_id,
          targetUrl: data.target_url || null,
          networkName: data.network_name || null,
        };
      }

      // 4xx는 retry하지 않음 (클라이언트 에러)
      if (response.status >= 400 && response.status < 500) {
        return {
          success: false,
          error: `Sandbox returned ${response.status}`,
        };
      }
    } catch (err) {
      // timeout 또는 network error — retry 가능
      if (attempt === maxRetries) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }

    // retry 대기
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
    }
  }

  return { success: false, error: "All retry attempts exhausted" };
}

export async function orchestrateSandboxAndDast(
  analysisId: string,
  userId: string,
  repository: RepoInput,
  branch: string
): Promise<void> {
  // Circuit Breaker 체크
  if (!sandboxCircuitBreaker.canExecute()) {
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { sandboxStatus: "SKIPPED" },
    });
    return;
  }

  await prisma.analysis.update({
    where: { id: analysisId },
    data: { sandboxStatus: "CREATING" },
  });

  // 리소스 제한 조회
  const resourceLimits = await getResourceLimits(userId);

  const result = await callSandboxWithRetry(serverEnv.SANDBOX_API_URL(), {
    repo_url: repository.url || undefined,
    branch,
    dockerfile_content: repository.dockerfileContent || undefined,
    compose_content: repository.composeContent || undefined,
    container_memory_limit: resourceLimits.containerMemoryLimit,
    container_cpu_limit: resourceLimits.containerCpuLimit,
    container_pids_limit: resourceLimits.containerPidsLimit,
  });

  if (!result.success) {
    sandboxCircuitBreaker.onFailure();
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { sandboxStatus: "FAILED" },
    });
    return;
  }

  sandboxCircuitBreaker.onSuccess();
  await prisma.analysis.update({
    where: { id: analysisId },
    data: {
      sandboxContainerId: result.envId,
      sandboxStatus: "RUNNING",
    },
  });

  // DAST 스캔 트리거
  if (result.targetUrl) {
    try {
      await fetch(`${serverEnv.SCANNER_API_URL()}/api/scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis_id: analysisId,
          callback_url: `${serverEnv.NEXTAUTH_URL()}/api/analyses/webhook`,
          target_url: result.targetUrl,
          network_name: result.networkName || undefined,
        }),
      });
    } catch (err) {
      console.error("DAST scan trigger failed:", err);
    }
  }
}
