import { serverEnv } from "@/config/env";
import { getResourceLimits } from "@/domains/subscription/usecase/subscription-limits";
import { CircuitBreaker } from "@/lib/circuit-breaker";
import { resilientFetch } from "@/lib/resilient-fetch";
import { analysisRepository } from "../infra/prisma-analysis.repository";

const SANDBOX_TIMEOUT_MS = 10 * 60 * 1000; // 10분
const SANDBOX_RETRY_DELAYS = [5_000, 15_000];
const DAST_TIMEOUT_MS = 30_000;
const DAST_RETRY_DELAYS = [2_000, 5_000];

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
  dockerfilePath?: string | null;
  buildContext?: string | null;
  targetService?: string | null;
}

async function callSandbox(
  sandboxUrl: string,
  payload: object
): Promise<SandboxResult> {
  try {
    const response = await resilientFetch(
      `${sandboxUrl}/api/environments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      {
        timeoutMs: SANDBOX_TIMEOUT_MS,
        maxRetries: 2,
        retryDelays: SANDBOX_RETRY_DELAYS,
        circuitBreaker: sandboxCircuitBreaker,
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        envId: data.environment_id,
        targetUrl: data.target_url || null,
        networkName: data.network_name || null,
      };
    }

    return {
      success: false,
      error: `Sandbox returned ${response.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function orchestrateSandboxAndDast(
  analysisId: string,
  userId: string,
  repository: RepoInput,
  branch: string
): Promise<void> {
  // Circuit Breaker 체크
  if (!sandboxCircuitBreaker.canExecute()) {
    await analysisRepository.updateStatus(analysisId, {
      sandboxStatus: "SKIPPED",
    });
    return;
  }

  await analysisRepository.updateStatus(analysisId, {
    sandboxStatus: "CREATING",
  });

  // 리소스 제한 조회
  const resourceLimits = await getResourceLimits(userId);

  const result = await callSandbox(serverEnv.SANDBOX_API_URL(), {
    repo_url: repository.url || undefined,
    branch,
    dockerfile_content: repository.dockerfileContent || undefined,
    compose_content: repository.composeContent || undefined,
    dockerfile_path: repository.dockerfilePath || undefined,
    build_context: repository.buildContext || undefined,
    target_service: repository.targetService || undefined,
    container_memory_limit: resourceLimits.containerMemoryLimit,
    container_cpu_limit: resourceLimits.containerCpuLimit,
    container_pids_limit: resourceLimits.containerPidsLimit,
  });

  if (!result.success) {
    await analysisRepository.updateStatus(analysisId, {
      sandboxStatus: "FAILED",
    });
    return;
  }

  await analysisRepository.updateStatus(analysisId, {
    sandboxContainerId: result.envId,
    sandboxStatus: "RUNNING",
  });

  // DAST 스캔 트리거
  if (result.targetUrl) {
    try {
      await resilientFetch(
        `${serverEnv.SCANNER_API_URL()}/api/scans`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysis_id: analysisId,
            callback_url: `${serverEnv.NEXTAUTH_URL()}/api/analyses/webhook`,
            target_url: result.targetUrl,
            network_name: result.networkName || undefined,
          }),
        },
        {
          timeoutMs: DAST_TIMEOUT_MS,
          maxRetries: 2,
          retryDelays: DAST_RETRY_DELAYS,
        }
      );
    } catch (err) {
      console.error("DAST scan trigger failed after retries:", err);
    }
  }
}
