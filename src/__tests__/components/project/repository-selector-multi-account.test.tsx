/**
 * RepositorySelector Simplified Flow Tests
 *
 * Phase 2 Integrated: Simplified repository selection
 * - No account selection step (removed)
 * - Direct repository selection
 * - No accountId in API or callbacks
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
  {
    id: 2,
    name: "another-repo",
    full_name: "gh-user-1/another-repo",
    private: true,
    html_url: "https://github.com/gh-user-1/another-repo",
    default_branch: "develop",
    updated_at: "2024-01-02T00:00:00Z",
    language: "JavaScript",
    description: "Another test repository",
  },
];

const mockBranches = [
  { name: "main", protected: true },
  { name: "develop", protected: false },
];

function mockFetchResponses(responses: Record<string, unknown>) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    // Sort patterns by length (longest first) to match more specific patterns first
    const sortedPatterns = Object.entries(responses).sort(
      ([a], [b]) => b.length - a.length
    );

    for (const [pattern, data] of sortedPatterns) {
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

describe("RepositorySelector Simplified Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Direct repository selection", () => {
    it("GIVEN connected GitHub WHEN selector opens THEN repositories are displayed immediately", async () => {
      // GIVEN
      mockFetchResponses({
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

      // THEN
      await waitFor(() => {
        expect(screen.getByText("test-repo")).toBeInTheDocument();
        expect(screen.getByText("another-repo")).toBeInTheDocument();
      });
    });

    it("GIVEN repositories WHEN selecting repo THEN branches are fetched and displayed", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/github/repositories": {
          success: true,
          data: {
            repositories: mockRepositories,
            pagination: { has_next: false },
          },
        },
        "/api/github/repositories/gh-user-1/test-repo/branches": {
          success: true,
          data: { branches: mockBranches },
        },
      });

      render(<RepositorySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("test-repo")).toBeInTheDocument();
      });

      // WHEN
      fireEvent.click(screen.getByText("test-repo"));

      // THEN
      await waitFor(() => {
        expect(screen.getByText("main")).toBeInTheDocument();
        expect(screen.getByText("develop")).toBeInTheDocument();
      });
    });

    it("GIVEN branch selection WHEN selecting branch THEN onSelect is called without accountId", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/github/repositories": {
          success: true,
          data: {
            repositories: mockRepositories,
            pagination: { has_next: false },
          },
        },
        "/api/github/repositories/gh-user-1/test-repo/branches": {
          success: true,
          data: { branches: mockBranches },
        },
      });

      render(<RepositorySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("test-repo")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("test-repo"));

      await waitFor(() => {
        expect(screen.getByText("main")).toBeInTheDocument();
      });

      // WHEN
      fireEvent.click(screen.getByText("main"));

      // THEN
      expect(mockOnSelect).toHaveBeenCalledWith({
        url: "https://github.com/gh-user-1/test-repo",
        owner: "gh-user-1",
        name: "test-repo",
        defaultBranch: "main",
      });
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.not.objectContaining({
          accountId: expect.anything(),
        })
      );
    });
  });

  describe("Back navigation", () => {
    it("GIVEN branch selection step WHEN clicking back THEN returns to repository list", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/github/repositories": {
          success: true,
          data: {
            repositories: mockRepositories,
            pagination: { has_next: false },
          },
        },
        "/api/github/repositories/gh-user-1/test-repo/branches": {
          success: true,
          data: { branches: mockBranches },
        },
      });

      render(<RepositorySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("test-repo")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("test-repo"));

      await waitFor(() => {
        expect(screen.getByText("main")).toBeInTheDocument();
      });

      // WHEN
      const backButton = screen.getByRole("button", { name: /뒤로/i });
      fireEvent.click(backButton);

      // THEN
      await waitFor(() => {
        expect(screen.getByText("test-repo")).toBeInTheDocument();
        expect(screen.queryByText("main")).not.toBeInTheDocument();
      });
    });

    it("GIVEN repository step WHEN checking back button THEN back button is not shown", async () => {
      // GIVEN
      mockFetchResponses({
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
        expect(screen.getByText("test-repo")).toBeInTheDocument();
      });

      // THEN
      expect(
        screen.queryByRole("button", { name: /뒤로/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Search functionality", () => {
    it("GIVEN repositories WHEN searching THEN search query is sent to API", async () => {
      // GIVEN
      mockFetchResponses({
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
        expect(screen.getByText("test-repo")).toBeInTheDocument();
      });

      // WHEN
      const searchInput = screen.getByPlaceholderText("저장소 검색...");
      fireEvent.change(searchInput, { target: { value: "test" } });
      fireEvent.click(screen.getByText("검색"));

      // THEN
      await waitFor(() => {
        const fetchCalls = (global.fetch as jest.Mock).mock.calls;
        const searchCall = fetchCalls.find(
          (call: string[]) =>
            call[0].includes("/api/github/repositories") &&
            call[0].includes("search=test")
        );
        expect(searchCall).toBeDefined();
      });
    });
  });

  describe("Not connected state", () => {
    it("GIVEN not connected WHEN selector opens THEN connect prompt is shown", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/github/repositories": {
          success: false,
          code: "GITHUB_NOT_CONNECTED",
          error: "GitHub 연동이 필요합니다",
        },
      });

      // WHEN
      render(<RepositorySelector {...defaultProps} />);

      // THEN
      await waitFor(() => {
        expect(screen.getByText(/연동이 필요합니다/i)).toBeInTheDocument();
      });
    });

    it("GIVEN not connected WHEN clicking connect THEN redirects to integration link", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/github/repositories": {
          success: false,
          code: "GITHUB_NOT_CONNECTED",
          error: "GitHub 연동이 필요합니다",
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

  describe("Pagination", () => {
    it("GIVEN more repositories available WHEN clicking load more THEN next page is fetched", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/github/repositories": {
          success: true,
          data: {
            repositories: mockRepositories,
            pagination: { has_next: true },
          },
        },
      });

      render(<RepositorySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("더 보기")).toBeInTheDocument();
      });

      // WHEN
      fireEvent.click(screen.getByText("더 보기"));

      // THEN
      await waitFor(() => {
        const fetchCalls = (global.fetch as jest.Mock).mock.calls;
        const page2Call = fetchCalls.find((call: string[]) =>
          call[0].includes("page=2")
        );
        expect(page2Call).toBeDefined();
      });
    });
  });

  describe("Header title", () => {
    it("GIVEN repository step WHEN checking header THEN shows provider repository selection title", async () => {
      // GIVEN
      mockFetchResponses({
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

      // THEN
      await waitFor(() => {
        expect(screen.getByText("GitHub 저장소 선택")).toBeInTheDocument();
      });
    });

    it("GIVEN branch step WHEN checking header THEN shows branch selection title", async () => {
      // GIVEN
      mockFetchResponses({
        "/api/github/repositories": {
          success: true,
          data: {
            repositories: mockRepositories,
            pagination: { has_next: false },
          },
        },
        "/api/github/repositories/gh-user-1/test-repo/branches": {
          success: true,
          data: { branches: mockBranches },
        },
      });

      render(<RepositorySelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("test-repo")).toBeInTheDocument();
      });

      // WHEN
      fireEvent.click(screen.getByText("test-repo"));

      // THEN
      await waitFor(() => {
        expect(screen.getByText("브랜치 선택")).toBeInTheDocument();
      });
    });
  });
});
