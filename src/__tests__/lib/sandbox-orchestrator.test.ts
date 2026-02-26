/**
 * Sandbox Orchestrator Tests
 *
 * 샌드박스 오케스트레이터 테스트 (timeout + retry + circuit breaker + DAST trigger)
 */

import {
  orchestrateSandboxAndDast,
  resetCircuitBreaker,
} from "@/domains/analysis/usecase/sandbox-orchestrator";
import { prisma } from "@/infrastructure/database/prisma";
import { getResourceLimits } from "@/domains/subscription/usecase/subscription-limits";

// Mocks
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    analysis: { update: jest.fn() },
  },
}));

jest.mock("@/config/env", () => ({
  serverEnv: {
    SANDBOX_API_URL: jest.fn(() => "http://sandbox:8000"),
    SCANNER_API_URL: jest.fn(() => "http://scanner:8082"),
    NEXTAUTH_URL: jest.fn(() => "http://localhost:3000"),
  },
}));

jest.mock("@/domains/subscription/usecase/subscription-limits", () => ({
  getResourceLimits: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

interface RepoInput {
  url?: string | null;
  dockerfileContent?: string | null;
  composeContent?: string | null;
}

describe("SandboxOrchestrator", () => {
  const mockAnalysisId = "analysis-123";
  const mockUserId = "user-123";
  const mockRepository: RepoInput = {
    url: "https://github.com/test/repo",
    dockerfileContent: "FROM node:18",
    composeContent: null,
  };
  const mockBranch = "main";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    resetCircuitBreaker();

    (getResourceLimits as jest.Mock).mockResolvedValue({
      containerMemoryLimit: "512m",
      containerCpuLimit: 0.5,
      containerPidsLimit: 50,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("정상 흐름 (Happy path)", () => {
    it("GIVEN sandbox 정상 응답 WHEN orchestrate 호출 THEN sandboxStatus CREATING → RUNNING, DAST 스캔 트리거", async () => {
      // GIVEN
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            environment_id: "env-123",
            target_url: "http://sandbox-app:3000",
            network_name: "sandbox-net",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ scan_id: "scan-1" }),
        });

      // WHEN
      await orchestrateSandboxAndDast(
        mockAnalysisId,
        mockUserId,
        mockRepository,
        mockBranch
      );

      // THEN: sandboxStatus CREATING 업데이트
      expect(prisma.analysis.update).toHaveBeenCalledWith({
        where: { id: mockAnalysisId },
        data: { sandboxStatus: "CREATING" },
      });

      // THEN: sandboxStatus RUNNING + sandboxContainerId 업데이트
      expect(prisma.analysis.update).toHaveBeenCalledWith({
        where: { id: mockAnalysisId },
        data: {
          sandboxContainerId: "env-123",
          sandboxStatus: "RUNNING",
        },
      });

      // THEN: sandbox API 호출
      expect(mockFetch).toHaveBeenCalledWith(
        "http://sandbox:8000/api/environments",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );

      // THEN: DAST 스캔 트리거 (scanner API 호출)
      expect(mockFetch).toHaveBeenCalledWith(
        "http://scanner:8082/api/scans",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  describe("Circuit Breaker 동작", () => {
    it("GIVEN circuit breaker OPEN WHEN orchestrate 호출 THEN sandbox 호출 없이 sandboxStatus SKIPPED", async () => {
      // GIVEN: circuit breaker를 OPEN으로 만들기 위해 연속 실패
      mockFetch.mockRejectedValue(new Error("Network error"));

      for (let i = 0; i < 3; i++) {
        const promise = orchestrateSandboxAndDast(
          mockAnalysisId,
          mockUserId,
          mockRepository,
          mockBranch
        );
        await jest.runAllTimersAsync();
        await promise;
      }

      jest.clearAllMocks();

      // WHEN: circuit breaker OPEN 상태에서 호출
      await orchestrateSandboxAndDast(
        mockAnalysisId,
        mockUserId,
        mockRepository,
        mockBranch
      );

      // THEN: sandbox API 호출 없이 sandboxStatus SKIPPED
      expect(mockFetch).not.toHaveBeenCalled();
      expect(prisma.analysis.update).toHaveBeenCalledWith({
        where: { id: mockAnalysisId },
        data: { sandboxStatus: "SKIPPED" },
      });
    });
  });

  describe("Retry 동작", () => {
    it("GIVEN 첫 번째 시도 실패, 두 번째 성공 WHEN orchestrate 호출 THEN 최종 성공", async () => {
      // GIVEN
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            environment_id: "env-123",
            target_url: "http://sandbox-app:3000",
            network_name: "sandbox-net",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ scan_id: "scan-1" }),
        });

      // WHEN
      const promise = orchestrateSandboxAndDast(
        mockAnalysisId,
        mockUserId,
        mockRepository,
        mockBranch
      );
      await jest.runAllTimersAsync();
      await promise;

      // THEN: 최종 성공
      expect(prisma.analysis.update).toHaveBeenCalledWith({
        where: { id: mockAnalysisId },
        data: {
          sandboxContainerId: "env-123",
          sandboxStatus: "RUNNING",
        },
      });

      // THEN: sandbox API가 2번 호출됨
      const sandboxCalls = mockFetch.mock.calls.filter(
        (call: string[]) => call[0] === "http://sandbox:8000/api/environments"
      );
      expect(sandboxCalls.length).toBe(2);
    });

    it("GIVEN 모든 retry 실패 WHEN orchestrate 호출 THEN sandboxStatus FAILED", async () => {
      // GIVEN
      mockFetch.mockRejectedValue(new Error("Network error"));

      // WHEN
      const promise = orchestrateSandboxAndDast(
        mockAnalysisId,
        mockUserId,
        mockRepository,
        mockBranch
      );
      await jest.runAllTimersAsync();
      await promise;

      // THEN: sandboxStatus FAILED
      expect(prisma.analysis.update).toHaveBeenCalledWith({
        where: { id: mockAnalysisId },
        data: { sandboxStatus: "FAILED" },
      });

      // THEN: 3회 호출 (1 + 2 retries)
      const sandboxCalls = mockFetch.mock.calls.filter(
        (call: string[]) => call[0] === "http://sandbox:8000/api/environments"
      );
      expect(sandboxCalls.length).toBe(3);
    });
  });

  describe("4xx 에러 처리", () => {
    it("GIVEN sandbox 400 응답 WHEN orchestrate 호출 THEN retry 없이 즉시 실패", async () => {
      // GIVEN
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      // WHEN
      await orchestrateSandboxAndDast(
        mockAnalysisId,
        mockUserId,
        mockRepository,
        mockBranch
      );

      // THEN: sandboxStatus FAILED
      expect(prisma.analysis.update).toHaveBeenCalledWith({
        where: { id: mockAnalysisId },
        data: { sandboxStatus: "FAILED" },
      });

      // THEN: 1번만 호출
      const sandboxCalls = mockFetch.mock.calls.filter(
        (call: string[]) => call[0] === "http://sandbox:8000/api/environments"
      );
      expect(sandboxCalls.length).toBe(1);
    });
  });

  describe("리소스 제한 전달", () => {
    it("GIVEN pro 플랜 WHEN sandbox 호출 THEN container 리소스 제한 파라미터 포함", async () => {
      // GIVEN
      (getResourceLimits as jest.Mock).mockResolvedValue({
        containerMemoryLimit: "1g",
        containerCpuLimit: 1.0,
        containerPidsLimit: 100,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            environment_id: "env-123",
            target_url: "http://sandbox-app:3000",
            network_name: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ scan_id: "scan-1" }),
        });

      // WHEN
      await orchestrateSandboxAndDast(
        mockAnalysisId,
        mockUserId,
        mockRepository,
        mockBranch
      );

      // THEN: sandbox API 호출 시 리소스 제한 파라미터 포함
      const sandboxCall = mockFetch.mock.calls.find(
        (call: string[]) => call[0] === "http://sandbox:8000/api/environments"
      );
      expect(sandboxCall).toBeDefined();

      const requestBody = JSON.parse(sandboxCall![1].body);
      expect(requestBody.container_memory_limit).toBe("1g");
      expect(requestBody.container_cpu_limit).toBe(1.0);
      expect(requestBody.container_pids_limit).toBe(100);
    });
  });

  describe("DAST 스캔 트리거", () => {
    it("GIVEN sandbox 성공 + target_url 있음 WHEN orchestrate 완료 THEN scanner API 호출", async () => {
      // GIVEN
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            environment_id: "env-123",
            target_url: "http://sandbox-app:3000",
            network_name: "sandbox-net",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ scan_id: "scan-1" }),
        });

      // WHEN
      await orchestrateSandboxAndDast(
        mockAnalysisId,
        mockUserId,
        mockRepository,
        mockBranch
      );

      // THEN: scanner API 호출
      const scannerCall = mockFetch.mock.calls.find(
        (call: string[]) => call[0] === "http://scanner:8082/api/scans"
      );
      expect(scannerCall).toBeDefined();

      const requestBody = JSON.parse(scannerCall![1].body);
      expect(requestBody.analysis_id).toBe(mockAnalysisId);
      expect(requestBody.target_url).toBe("http://sandbox-app:3000");
      expect(requestBody.network_name).toBe("sandbox-net");
      expect(requestBody.callback_url).toBe(
        "http://localhost:3000/api/analyses/webhook"
      );
    });

    it("GIVEN sandbox 성공 + target_url 없음 WHEN orchestrate 완료 THEN scanner API 미호출", async () => {
      // GIVEN
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          environment_id: "env-123",
          target_url: null,
          network_name: null,
        }),
      });

      // WHEN
      await orchestrateSandboxAndDast(
        mockAnalysisId,
        mockUserId,
        mockRepository,
        mockBranch
      );

      // THEN: scanner API 미호출
      const scannerCall = mockFetch.mock.calls.find(
        (call: string[]) => call[0] === "http://scanner:8082/api/scans"
      );
      expect(scannerCall).toBeUndefined();
    });

    it("GIVEN DAST 스캔 트리거 실패 WHEN scanner API 에러 THEN sandbox 상태는 RUNNING 유지", async () => {
      // GIVEN
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            environment_id: "env-123",
            target_url: "http://sandbox-app:3000",
            network_name: null,
          }),
        })
        .mockRejectedValue(new Error("Scanner unavailable"));

      // WHEN
      const promise = orchestrateSandboxAndDast(
        mockAnalysisId,
        mockUserId,
        mockRepository,
        mockBranch
      );
      await jest.runAllTimersAsync();
      await promise;

      // THEN: sandboxStatus는 RUNNING 유지
      expect(prisma.analysis.update).toHaveBeenCalledWith({
        where: { id: mockAnalysisId },
        data: {
          sandboxContainerId: "env-123",
          sandboxStatus: "RUNNING",
        },
      });
    });
  });
});
