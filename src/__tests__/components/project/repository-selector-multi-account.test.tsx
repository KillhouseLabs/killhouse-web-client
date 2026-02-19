/**
 * RepositorySelector Multi-Account Tests
 *
 * Phase 2: OAuth 멀티 계정 저장소 연동 - UI 테스트
 * - 단일/다중 계정 모두 계정 목록 표시 (항상 계정 선택 단계 거침)
 * - 계정 선택 시 accountId 파라미터로 저장소 조회
 * - onSelect 콜백에 accountId 포함
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RepositorySelector } from "@/components/project/repository-selector";

// Mock navigation
const mockNavigateTo = jest.fn();
jest.mock("@/lib/navigation", () => ({
  navigateTo: (...args: unknown[]) => mockNavigateTo(...args),
}));

// Mock fetch
global.fetch = jest.fn();

const mockOnClose = jest.fn();
const mockOnSelect = jest.fn();

const defaultProps = {
  isOpen: true,
  provider: "github" as const,
  onClose: mockOnClose,
  onSelect: mockOnSelect,
};

const singleAccount = [
  {
    id: "account-1",
    provider: "github",
    providerAccountId: "123",
    username: "gh-user-1",
  },
];

const multipleAccounts = [
  {
    id: "account-1",
    provider: "github",
    providerAccountId: "123",
    username: "gh-user-1",
  },
  {
    id: "account-2",
    provider: "github",
    providerAccountId: "456",
    username: "gh-user-2",
  },
];

const mockRepositories = [
  {
    id: 1,
    name: "test-repo",
    full_name: "gh-user-1/test-repo",
    private: false,
    html_url: "https://github.com/gh-user-1/test-repo",
    default_branch: "main",
    updated_at: "2024-01-01T00:00:00Z",
    language: "TypeScript",
    description: "Test repository",
  },
];

const mockBranches = [
  { name: "main", protected: true },
  { name: "develop", protected: false },
];

function mockFetchResponses(responses: Record<string, unknown>) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    for (const [pattern, data] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        });
      }
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ success: false, error: "Not found" }),
    });
  });
}

describe("RepositorySelector Multi-Account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("단일 계정도 계정 목록 표시", () => {
    it("GIVEN 1개의 GitHub 계정 WHEN 셀렉터 열림 THEN 계정 목록이 표시되어야 한다", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/integrations/accounts": {
          success: true,
          data: singleAccount,
        },
      });

      // WHEN
      render(<RepositorySelector {...defaultProps} />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("gh-user-1")).toBeInTheDocument();
      });
    });

    it("GIVEN 1개의 GitHub 계정 WHEN 계정 선택 THEN accountId 파라미터로 저장소가 조회되어야 한다", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/integrations/accounts": {
          success: true,
          data: singleAccount,
        },
        "/api/github/repositories": {
          success: true,
          data: {
            repositories: mockRepositories,
            pagination: { has_next: false },
          },
        },
      });

      // WHEN
      render(<RepositorySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("gh-user-1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("gh-user-1"));

      // THEN
      await waitFor(() => {
        const fetchCalls = (global.fetch as jest.Mock).mock.calls;
        const repoCall = fetchCalls.find((call: string[]) =>
          call[0].includes("/api/github/repositories")
        );
        expect(repoCall).toBeDefined();
        expect(repoCall[0]).toContain("accountId=account-1");
      });
    });

    it("GIVEN 단일 계정 저장소 목록 WHEN 뒤로가기 THEN 계정 목록으로 돌아가야 한다", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/integrations/accounts": {
          success: true,
          data: singleAccount,
        },
        "/api/github/repositories": {
          success: true,
          data: {
            repositories: mockRepositories,
            pagination: { has_next: false },
          },
        },
      });

      render(<RepositorySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("gh-user-1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("gh-user-1"));

      await waitFor(() => {
        expect(screen.getByText("test-repo")).toBeInTheDocument();
      });

      // WHEN
      const backButton = screen.getByRole("button", { name: /back|뒤로/i });
      fireEvent.click(backButton);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("gh-user-1")).toBeInTheDocument();
      });
    });
  });

  describe("다중 계정 목록 표시", () => {
    it("GIVEN 2개의 GitHub 계정 WHEN 셀렉터 열림 THEN 계정 목록이 표시되어야 한다", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/integrations/accounts": {
          success: true,
          data: multipleAccounts,
        },
      });

      // WHEN
      render(<RepositorySelector {...defaultProps} />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("gh-user-1")).toBeInTheDocument();
        expect(screen.getByText("gh-user-2")).toBeInTheDocument();
      });
    });

    it("GIVEN 다중 계정 목록 WHEN 헤더 확인 THEN '계정 선택' 텍스트가 표시되어야 한다", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/integrations/accounts": {
          success: true,
          data: multipleAccounts,
        },
      });

      // WHEN
      render(<RepositorySelector {...defaultProps} />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("계정 선택")).toBeInTheDocument();
      });
    });
  });

  describe("계정 선택 시 저장소 조회", () => {
    it("GIVEN 다중 계정 목록 WHEN 계정 선택 THEN 해당 accountId로 저장소가 조회되어야 한다", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/integrations/accounts": {
          success: true,
          data: multipleAccounts,
        },
        "/api/github/repositories": {
          success: true,
          data: {
            repositories: mockRepositories,
            pagination: { has_next: false },
          },
        },
      });

      // WHEN
      render(<RepositorySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("gh-user-2")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("gh-user-2"));

      // THEN
      await waitFor(() => {
        const fetchCalls = (global.fetch as jest.Mock).mock.calls;
        const repoCall = fetchCalls.find(
          (call: string[]) =>
            call[0].includes("/api/github/repositories") &&
            call[0].includes("accountId=account-2")
        );
        expect(repoCall).toBeDefined();
      });
    });

    it("GIVEN 계정 선택 후 저장소 목록 WHEN 뒤로가기 THEN 계정 목록으로 돌아가야 한다", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/integrations/accounts": {
          success: true,
          data: multipleAccounts,
        },
        "/api/github/repositories": {
          success: true,
          data: {
            repositories: mockRepositories,
            pagination: { has_next: false },
          },
        },
      });

      render(<RepositorySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("gh-user-1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("gh-user-1"));

      await waitFor(() => {
        expect(screen.getByText("test-repo")).toBeInTheDocument();
      });

      // WHEN
      const backButton = screen.getByRole("button", { name: /back|뒤로/i });
      fireEvent.click(backButton);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("gh-user-1")).toBeInTheDocument();
        expect(screen.getByText("gh-user-2")).toBeInTheDocument();
      });
    });
  });

  describe("onSelect에 accountId 포함", () => {
    it("GIVEN 계정 선택 후 저장소/브랜치 선택 WHEN onSelect 호출 THEN accountId가 포함되어야 한다", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/integrations/accounts": {
          success: true,
          data: singleAccount,
        },
        "/api/github/repositories/gh-user-1/test-repo/branches": {
          success: true,
          data: { branches: mockBranches },
        },
        "/api/github/repositories": {
          success: true,
          data: {
            repositories: mockRepositories,
            pagination: { has_next: false },
          },
        },
      });

      // WHEN
      render(<RepositorySelector {...defaultProps} />);

      // Select account first
      await waitFor(() => {
        expect(screen.getByText("gh-user-1")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("gh-user-1"));

      // Wait for repos to load
      await waitFor(() => {
        expect(screen.getByText("test-repo")).toBeInTheDocument();
      });

      // Select repo
      fireEvent.click(screen.getByText("test-repo"));

      // Wait for branches to load
      await waitFor(() => {
        expect(screen.getByText("main")).toBeInTheDocument();
      });

      // Select branch
      fireEvent.click(screen.getByText("main"));

      // THEN
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://github.com/gh-user-1/test-repo",
          owner: "gh-user-1",
          name: "test-repo",
          defaultBranch: "main",
          accountId: "account-1",
        })
      );
    });
  });

  describe("계정 없는 경우", () => {
    it("GIVEN 연결된 계정 없음 WHEN 셀렉터 열림 THEN 연동 안내가 표시되어야 한다", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/integrations/accounts": {
          success: true,
          data: [],
        },
      });

      // WHEN
      render(<RepositorySelector {...defaultProps} />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText(/연동이 필요합니다/i)).toBeInTheDocument();
      });
    });

    it("GIVEN 연결된 계정 없음 WHEN 연동하기 클릭 THEN 커스텀 링크 플로우로 리다이렉트되어야 한다", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/integrations/accounts": {
          success: true,
          data: [],
        },
      });

      render(<RepositorySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/연동하기/i)).toBeInTheDocument();
      });

      // WHEN
      fireEvent.click(screen.getByText(/연동하기/i));

      // THEN
      expect(mockNavigateTo).toHaveBeenCalledWith(
        expect.stringContaining("/api/integrations/link/github")
      );
    });
  });
});
