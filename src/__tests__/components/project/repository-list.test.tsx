/**
 * RepositoryList Component Tests
 *
 * 프로젝트 저장소 목록 표시 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RepositoryList } from "@/components/project/repository-list";

// Mock fetch
global.fetch = jest.fn();

interface Repository {
  id: string;
  provider: string;
  url: string | null;
  owner: string | null;
  name: string;
  defaultBranch: string;
  isPrimary: boolean;
  role: string | null;
  _count: { analyses: number };
}

const mockRepositories: Repository[] = [
  {
    id: "repo-1",
    provider: "GITHUB",
    url: "https://github.com/owner/frontend",
    owner: "owner",
    name: "frontend",
    defaultBranch: "main",
    isPrimary: true,
    role: "frontend",
    _count: { analyses: 5 },
  },
  {
    id: "repo-2",
    provider: "GITLAB",
    url: "https://gitlab.com/owner/backend",
    owner: "owner",
    name: "backend",
    defaultBranch: "develop",
    isPrimary: false,
    role: "backend",
    _count: { analyses: 3 },
  },
  {
    id: "repo-3",
    provider: "MANUAL",
    url: null,
    owner: null,
    name: "shared-lib",
    defaultBranch: "main",
    isPrimary: false,
    role: "shared",
    _count: { analyses: 0 },
  },
];

describe("RepositoryList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("저장소 목록 표시", () => {
    it("GIVEN 저장소 목록 WHEN 렌더링 THEN 모든 저장소가 표시되어야 한다", () => {
      // GIVEN
      const repositories = mockRepositories;

      // WHEN
      render(
        <RepositoryList projectId="project-1" repositories={repositories} />
      );

      // THEN
      // "frontend" and "backend" appear both as repo name and role badge
      const frontendElements = screen.getAllByText("frontend");
      expect(frontendElements.length).toBeGreaterThanOrEqual(1);
      const backendElements = screen.getAllByText("backend");
      expect(backendElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("shared-lib")).toBeInTheDocument();
    });

    it("GIVEN 저장소 목록 WHEN 렌더링 THEN Primary 저장소에 배지가 표시되어야 한다", () => {
      // GIVEN
      const repositories = mockRepositories;

      // WHEN
      render(
        <RepositoryList projectId="project-1" repositories={repositories} />
      );

      // THEN
      expect(screen.getByText("Primary")).toBeInTheDocument();
    });

    it("GIVEN 저장소 목록 WHEN 렌더링 THEN 역할(role)이 표시되어야 한다", () => {
      // GIVEN
      const repositories = mockRepositories;

      // WHEN
      const { container } = render(
        <RepositoryList projectId="project-1" repositories={repositories} />
      );

      // THEN
      const roleBadges = container.querySelectorAll(".role-badge");
      expect(roleBadges.length).toBe(3);
      expect(roleBadges[0].textContent).toBe("frontend");
      expect(roleBadges[1].textContent).toBe("backend");
      expect(roleBadges[2].textContent).toBe("shared");
    });

    it("GIVEN GitHub 저장소 WHEN 렌더링 THEN GitHub 아이콘이 표시되어야 한다", () => {
      // GIVEN
      const repositories = [mockRepositories[0]];

      // WHEN
      const { container } = render(
        <RepositoryList projectId="project-1" repositories={repositories} />
      );

      // THEN
      expect(
        container.querySelector('[data-testid="github-icon"]')
      ).toBeInTheDocument();
    });

    it("GIVEN GitLab 저장소 WHEN 렌더링 THEN GitLab 아이콘이 표시되어야 한다", () => {
      // GIVEN
      const repositories = [mockRepositories[1]];

      // WHEN
      const { container } = render(
        <RepositoryList projectId="project-1" repositories={repositories} />
      );

      // THEN
      expect(
        container.querySelector('[data-testid="gitlab-icon"]')
      ).toBeInTheDocument();
    });

    it("GIVEN 저장소 URL 있음 WHEN 렌더링 THEN owner/name 형식으로 표시되어야 한다", () => {
      // GIVEN
      const repositories = [mockRepositories[0]];

      // WHEN
      render(
        <RepositoryList projectId="project-1" repositories={repositories} />
      );

      // THEN
      expect(screen.getByText("owner/frontend")).toBeInTheDocument();
    });

    it("GIVEN 저장소 목록 WHEN 렌더링 THEN 분석 횟수가 표시되어야 한다", () => {
      // GIVEN
      const repositories = mockRepositories;

      // WHEN
      render(
        <RepositoryList projectId="project-1" repositories={repositories} />
      );

      // THEN
      expect(screen.getByText("분석 5회")).toBeInTheDocument();
      expect(screen.getByText("분석 3회")).toBeInTheDocument();
      expect(screen.getByText("분석 0회")).toBeInTheDocument();
    });

    it("GIVEN 저장소 목록 WHEN 렌더링 THEN 기본 브랜치가 표시되어야 한다", () => {
      // GIVEN
      const repositories = mockRepositories;

      // WHEN
      render(
        <RepositoryList projectId="project-1" repositories={repositories} />
      );

      // THEN
      // Multiple "main" branches exist (frontend and shared-lib)
      const mainBranches = screen.getAllByText("main");
      expect(mainBranches.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("develop")).toBeInTheDocument();
    });
  });

  describe("빈 상태", () => {
    it("GIVEN 저장소 없음 WHEN 렌더링 THEN 빈 상태 메시지가 표시되어야 한다", () => {
      // GIVEN
      const repositories: Repository[] = [];

      // WHEN
      render(
        <RepositoryList projectId="project-1" repositories={repositories} />
      );

      // THEN
      expect(screen.getByText("등록된 저장소가 없습니다")).toBeInTheDocument();
    });

    it("GIVEN 저장소 없음 WHEN 렌더링 THEN 저장소 추가 버튼이 표시되어야 한다", () => {
      // GIVEN
      const repositories: Repository[] = [];

      // WHEN
      render(
        <RepositoryList projectId="project-1" repositories={repositories} />
      );

      // THEN
      expect(screen.getByText("저장소 추가")).toBeInTheDocument();
    });
  });

  describe("저장소 삭제", () => {
    it("GIVEN 저장소 목록 WHEN 삭제 버튼 클릭 THEN 삭제 확인 모달이 표시되어야 한다", async () => {
      // GIVEN
      const repositories = [mockRepositories[1]]; // Non-primary

      // WHEN
      render(
        <RepositoryList projectId="project-1" repositories={repositories} />
      );
      const deleteButton = screen.getByRole("button", { name: /삭제/i });
      fireEvent.click(deleteButton);

      // THEN
      await waitFor(() => {
        expect(screen.getByText(/정말로 삭제하시겠습니까/)).toBeInTheDocument();
      });
    });

    it("GIVEN 삭제 확인 모달 WHEN 확인 클릭 THEN API가 호출되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      const onUpdate = jest.fn();
      const repositories = [mockRepositories[1]];

      // WHEN
      render(
        <RepositoryList
          projectId="project-1"
          repositories={repositories}
          onUpdate={onUpdate}
        />
      );
      const deleteButtons = screen.getAllByRole("button", { name: /삭제/i });
      fireEvent.click(deleteButtons[0]); // First delete button in list

      await waitFor(() => {
        expect(screen.getByText(/정말로 삭제하시겠습니까/)).toBeInTheDocument();
      });

      // Get all delete buttons again (now includes modal)
      const allDeleteButtons = screen.getAllByRole("button", { name: /삭제/i });
      // The last one is in the modal
      fireEvent.click(allDeleteButtons[allDeleteButtons.length - 1]);

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/projects/project-1/repositories/repo-2",
          expect.objectContaining({ method: "DELETE" })
        );
      });
    });
  });

  describe("Primary 저장소 변경", () => {
    it("GIVEN non-primary 저장소 WHEN Primary로 설정 클릭 THEN API가 호출되어야 한다", async () => {
      // GIVEN
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      const onUpdate = jest.fn();
      const repositories = mockRepositories;

      // WHEN
      render(
        <RepositoryList
          projectId="project-1"
          repositories={repositories}
          onUpdate={onUpdate}
        />
      );
      const setPrimaryButtons = screen.getAllByRole("button", {
        name: /Primary로 설정/i,
      });
      fireEvent.click(setPrimaryButtons[0]);

      // THEN
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/projects/project-1/repositories/repo-2",
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ isPrimary: true }),
          })
        );
      });
    });
  });

  describe("저장소 추가 모달", () => {
    it("GIVEN 저장소 목록 WHEN 추가 버튼 클릭 THEN onAdd 콜백이 호출되어야 한다", () => {
      // GIVEN
      const onAdd = jest.fn();
      const repositories = mockRepositories;

      // WHEN
      render(
        <RepositoryList
          projectId="project-1"
          repositories={repositories}
          onAdd={onAdd}
        />
      );
      const addButton = screen.getByRole("button", { name: /저장소 추가/i });
      fireEvent.click(addButton);

      // THEN
      expect(onAdd).toHaveBeenCalled();
    });
  });
});
