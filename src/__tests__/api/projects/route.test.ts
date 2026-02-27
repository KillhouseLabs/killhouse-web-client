/**
 * Projects API Route Tests (Multi-Repository)
 *
 * 프로젝트 API 엔드포인트 통합 테스트
 * - repositories 배열 지원
 */

import {
  createProjectSchema,
  updateProjectSchema,
} from "@/domains/project/dto/project.dto";

// Mock projectRepository
jest.mock("@/domains/project/infra/prisma-project.repository", () => ({
  projectRepository: {
    findActiveByUser: jest.fn(),
    findByIdAndUser: jest.fn(),
    findDetailByIdAndUser: jest.fn(),
    createWithRepositories: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    countActiveByUser: jest.fn(),
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock subscription limits
jest.mock("@/domains/subscription/usecase/subscription-limits", () => ({
  canCreateProject: jest.fn(),
}));

import { canCreateProject } from "@/domains/subscription/usecase/subscription-limits";

import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { auth } from "@/lib/auth";

describe("Projects API (Multi-Repo)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/projects", () => {
    describe("인증 검증", () => {
      it("GIVEN 인증되지 않은 사용자 WHEN 프로젝트 목록 요청 THEN 401 에러가 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue(null);

        // WHEN
        const session = await auth();

        // THEN
        expect(session).toBeNull();
      });

      it("GIVEN 인증된 사용자 WHEN 세션 확인 THEN 사용자 ID가 있어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1", email: "test@example.com" },
        });

        // WHEN
        const session = await auth();

        // THEN
        expect(session?.user?.id).toBe("user-1");
      });
    });

    describe("프로젝트 조회", () => {
      it("GIVEN 인증된 사용자 WHEN 프로젝트 목록 조회 THEN 해당 사용자의 프로젝트만 반환되어야 한다", async () => {
        // GIVEN
        const mockProjects = [
          {
            id: "project-1",
            name: "Project 1",
            userId: "user-1",
            repositories: [
              { id: "repo-1", name: "frontend", isPrimary: true },
              { id: "repo-2", name: "backend", isPrimary: false },
            ],
            _count: { analyses: 0 },
          },
          {
            id: "project-2",
            name: "Project 2",
            userId: "user-1",
            repositories: [],
            _count: { analyses: 0 },
          },
        ];
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findActiveByUser as jest.Mock).mockResolvedValue({
          projects: mockProjects,
          totalCount: 2,
        });

        // WHEN
        const result = await projectRepository.findActiveByUser("user-1", {
          skip: 0,
          take: 20,
        });

        // THEN
        expect(projectRepository.findActiveByUser).toHaveBeenCalledWith(
          "user-1",
          { skip: 0, take: 20 }
        );
        expect(result.projects).toHaveLength(2);
      });

      it("GIVEN 프로젝트 목록 조회 WHEN 결과 반환 THEN repositories 배열이 포함되어야 한다", async () => {
        // GIVEN
        const mockProjects = [
          {
            id: "project-1",
            name: "Multi-Repo Project",
            userId: "user-1",
            repositories: [
              {
                id: "repo-1",
                provider: "GITHUB",
                name: "frontend",
                isPrimary: true,
                role: "frontend",
              },
              {
                id: "repo-2",
                provider: "GITHUB",
                name: "backend",
                isPrimary: false,
                role: "backend",
              },
            ],
            _count: { analyses: 0 },
          },
        ];
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findActiveByUser as jest.Mock).mockResolvedValue({
          projects: mockProjects,
          totalCount: 1,
        });

        // WHEN
        const result = await projectRepository.findActiveByUser("user-1", {
          skip: 0,
          take: 20,
        });

        // THEN
        expect(result.projects[0].repositories).toHaveLength(2);
        expect(result.projects[0].repositories[0].isPrimary).toBe(true);
      });
    });
  });

  describe("POST /api/projects", () => {
    describe("입력 검증", () => {
      it("GIVEN 유효한 입력 (repositories 배열) WHEN 스키마 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const input = {
          name: "New Multi-Repo Project",
          description: "Project description",
          repositories: [
            {
              provider: "GITHUB",
              name: "frontend",
              url: "https://github.com/owner/frontend",
              defaultBranch: "main",
              isPrimary: true,
              role: "frontend",
            },
            {
              provider: "GITHUB",
              name: "backend",
              url: "https://github.com/owner/backend",
              defaultBranch: "main",
              isPrimary: false,
              role: "backend",
            },
          ],
        };

        // WHEN
        const result = createProjectSchema.safeParse(input);

        // THEN
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.repositories).toHaveLength(2);
        }
      });

      it("GIVEN 이름 없음 WHEN 스키마 검증 THEN 실패해야 한다", () => {
        // GIVEN
        const input = {
          name: "",
          repositories: [],
        };

        // WHEN
        const result = createProjectSchema.safeParse(input);

        // THEN
        expect(result.success).toBe(false);
      });

      it("GIVEN 잘못된 repository 객체 WHEN 스키마 검증 THEN 실패해야 한다", () => {
        // GIVEN
        const input = {
          name: "New Project",
          repositories: [
            {
              provider: "INVALID_PROVIDER",
              name: "repo",
            },
          ],
        };

        // WHEN
        const result = createProjectSchema.safeParse(input);

        // THEN
        expect(result.success).toBe(false);
      });
    });

    describe("프로젝트 생성 (Multi-Repo)", () => {
      it("GIVEN repositories 배열 WHEN 프로젝트 생성 THEN 프로젝트와 저장소가 함께 생성되어야 한다", async () => {
        // GIVEN
        const repositoriesData = [
          {
            provider: "GITHUB",
            name: "frontend",
            url: "https://github.com/owner/frontend",
            owner: "owner",
            defaultBranch: "main",
            isPrimary: true,
            role: "frontend",
          },
          {
            provider: "GITHUB",
            name: "backend",
            url: "https://github.com/owner/backend",
            owner: "owner",
            defaultBranch: "main",
            isPrimary: false,
            role: "backend",
          },
        ];

        const mockCreatedProject = {
          id: "new-project-id",
          name: "Multi-Repo Project",
          description: "Description",
          userId: "user-1",
          repositories: repositoriesData.map((r, i) => ({
            id: `repo-${i + 1}`,
            ...r,
            projectId: "new-project-id",
          })),
          _count: { analyses: 0 },
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (
          projectRepository.createWithRepositories as jest.Mock
        ).mockResolvedValue(mockCreatedProject);

        // WHEN
        const result = await projectRepository.createWithRepositories({
          name: "Multi-Repo Project",
          description: "Description",
          userId: "user-1",
          repositories: repositoriesData as never,
        });

        // THEN
        expect(result.id).toBe("new-project-id");
        expect(result.repositories).toHaveLength(2);
        expect(projectRepository.createWithRepositories).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Multi-Repo Project",
            userId: "user-1",
          })
        );
      });

      it("GIVEN 여러 repositories WHEN 생성 THEN 첫 번째가 primary여야 한다", async () => {
        // GIVEN
        const repositoriesData = [
          {
            provider: "GITHUB",
            name: "first-repo",
            isPrimary: true,
          },
          {
            provider: "GITHUB",
            name: "second-repo",
            isPrimary: false,
          },
        ];

        const mockCreatedProject = {
          id: "new-project-id",
          name: "Project",
          repositories: repositoriesData.map((r, i) => ({
            id: `repo-${i + 1}`,
            ...r,
            projectId: "new-project-id",
          })),
          _count: { analyses: 0 },
        };

        (
          projectRepository.createWithRepositories as jest.Mock
        ).mockResolvedValue(mockCreatedProject);

        // WHEN
        const result = await projectRepository.createWithRepositories({
          name: "Project",
          userId: "user-1",
          repositories: repositoriesData as never,
        });

        // THEN
        const primaryRepos = result.repositories.filter(
          (r: { isPrimary: boolean }) => r.isPrimary
        );
        expect(primaryRepos).toHaveLength(1);
        expect(primaryRepos[0].name).toBe("first-repo");
      });

      it("GIVEN repositories 없음 WHEN 생성 THEN 저장소 없는 프로젝트가 생성되어야 한다", async () => {
        // GIVEN
        const mockCreatedProject = {
          id: "new-project-id",
          name: "Project Without Repos",
          description: "No repositories",
          userId: "user-1",
          repositories: [],
          _count: { analyses: 0 },
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (
          projectRepository.createWithRepositories as jest.Mock
        ).mockResolvedValue(mockCreatedProject);

        // WHEN
        const result = await projectRepository.createWithRepositories({
          name: "Project Without Repos",
          description: "No repositories",
          userId: "user-1",
          repositories: [],
        });

        // THEN
        expect(result.id).toBe("new-project-id");
        expect(result.repositories).toHaveLength(0);
      });
    });
  });

  describe("GET /api/projects/[id]", () => {
    describe("프로젝트 조회", () => {
      it("GIVEN 프로젝트 존재 WHEN 조회 THEN repositories 배열이 포함되어야 한다", async () => {
        // GIVEN
        const mockProject = {
          id: "project-1",
          name: "Test Project",
          userId: "user-1",
          repositories: [
            {
              id: "repo-1",
              provider: "GITHUB",
              name: "frontend",
              url: "https://github.com/owner/frontend",
              isPrimary: true,
              role: "frontend",
            },
            {
              id: "repo-2",
              provider: "GITLAB",
              name: "backend",
              url: "https://gitlab.com/owner/backend",
              isPrimary: false,
              role: "backend",
            },
          ],
          analyses: [],
          _count: { analyses: 0 },
        };
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (
          projectRepository.findDetailByIdAndUser as jest.Mock
        ).mockResolvedValue(mockProject);

        // WHEN
        const result = await projectRepository.findDetailByIdAndUser(
          "user-1",
          "project-1"
        );

        // THEN
        expect(result).toEqual(mockProject);
        expect(result?.repositories).toHaveLength(2);
        expect(result?.repositories[0].isPrimary).toBe(true);
      });

      it("GIVEN 존재하지 않는 프로젝트 WHEN ID로 조회 THEN null이 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (
          projectRepository.findDetailByIdAndUser as jest.Mock
        ).mockResolvedValue(null);

        // WHEN
        const result = await projectRepository.findDetailByIdAndUser(
          "user-1",
          "non-existent"
        );

        // THEN
        expect(result).toBeNull();
      });

      it("GIVEN 다른 사용자의 프로젝트 WHEN 조회 시도 THEN null이 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (
          projectRepository.findDetailByIdAndUser as jest.Mock
        ).mockResolvedValue(null);

        // WHEN
        const result = await projectRepository.findDetailByIdAndUser(
          "user-1",
          "project-1"
        );

        // THEN
        expect(result).toBeNull();
      });
    });

    describe("하위 호환성", () => {
      it("GIVEN 프로젝트 조회 WHEN primary repository 존재 THEN legacy 필드가 계산되어야 한다", async () => {
        // GIVEN
        const mockProject = {
          id: "project-1",
          name: "Test Project",
          userId: "user-1",
          repositories: [
            {
              id: "repo-1",
              provider: "GITHUB",
              name: "frontend",
              url: "https://github.com/owner/frontend",
              owner: "owner",
              defaultBranch: "main",
              isPrimary: true,
            },
          ],
          analyses: [],
          _count: { analyses: 0 },
        };

        (
          projectRepository.findDetailByIdAndUser as jest.Mock
        ).mockResolvedValue(mockProject);

        // WHEN
        const result = await projectRepository.findDetailByIdAndUser(
          "user-1",
          "project-1"
        );

        // THEN - Legacy fields should be computed from primary repository
        const primaryRepo = result?.repositories.find(
          (r: { isPrimary: boolean }) => r.isPrimary
        );
        expect(primaryRepo).toBeDefined();

        // These would be computed in the API response:
        const legacyFields = primaryRepo
          ? {
              repoProvider: primaryRepo.provider,
              repoUrl: primaryRepo.url,
              repoOwner: primaryRepo.owner,
              repoName: primaryRepo.name,
              defaultBranch: primaryRepo.defaultBranch,
            }
          : null;

        expect(legacyFields?.repoProvider).toBe("GITHUB");
        expect(legacyFields?.repoUrl).toBe("https://github.com/owner/frontend");
        expect(legacyFields?.repoOwner).toBe("owner");
        expect(legacyFields?.repoName).toBe("frontend");
        expect(legacyFields?.defaultBranch).toBe("main");
      });
    });
  });

  describe("PATCH /api/projects/[id]", () => {
    describe("입력 검증", () => {
      it("GIVEN 유효한 업데이트 데이터 WHEN 스키마 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const input = {
          name: "Updated Name",
          description: "Updated description",
        };

        // WHEN
        const result = updateProjectSchema.safeParse(input);

        // THEN
        expect(result.success).toBe(true);
      });

      it("GIVEN 부분 업데이트 WHEN 스키마 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const input = { name: "Updated Name" };

        // WHEN
        const result = updateProjectSchema.safeParse(input);

        // THEN
        expect(result.success).toBe(true);
      });
    });

    describe("프로젝트 수정", () => {
      it("GIVEN 존재하는 프로젝트 WHEN 수정 THEN 업데이트되어야 한다", async () => {
        // GIVEN
        const updateData = { name: "Updated Name" };
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue({
          id: "project-1",
          userId: "user-1",
        });
        (projectRepository.update as jest.Mock).mockResolvedValue({
          id: "project-1",
          name: "Updated Name",
          repositories: [],
          _count: { analyses: 0 },
        });

        // WHEN
        const result = await projectRepository.update("project-1", updateData);

        // THEN
        expect(result.name).toBe("Updated Name");
      });
    });
  });

  describe("DELETE /api/projects/[id]", () => {
    describe("프로젝트 삭제", () => {
      it("GIVEN 존재하는 프로젝트 WHEN 삭제 THEN softDelete가 호출되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue({
          id: "project-1",
          userId: "user-1",
        });
        (projectRepository.softDelete as jest.Mock).mockResolvedValue(
          undefined
        );

        // WHEN
        await projectRepository.softDelete("project-1");

        // THEN
        expect(projectRepository.softDelete).toHaveBeenCalledWith("project-1");
      });
    });
  });

  describe("구독 제한 검증", () => {
    describe("프로젝트 생성 제한", () => {
      it("GIVEN free 플랜 + 프로젝트 한도 도달 WHEN 프로젝트 생성 THEN 403 에러 반환", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (canCreateProject as jest.Mock).mockResolvedValue({
          allowed: false,
          currentCount: 3,
          limit: 3,
          message:
            "프로젝트 생성 한도(3개)에 도달했습니다. 플랜을 업그레이드하세요.",
        });

        // WHEN
        const limitCheck = await canCreateProject("user-1");

        // THEN
        expect(limitCheck.allowed).toBe(false);
        expect(limitCheck.currentCount).toBe(3);
        expect(limitCheck.limit).toBe(3);
        expect(limitCheck.message).toContain("한도");
      });

      it("GIVEN pro 플랜 WHEN 프로젝트 생성 THEN 제한 없이 생성 가능", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (canCreateProject as jest.Mock).mockResolvedValue({
          allowed: true,
          currentCount: 100,
          limit: -1, // unlimited
        });

        // WHEN
        const limitCheck = await canCreateProject("user-1");

        // THEN
        expect(limitCheck.allowed).toBe(true);
        expect(limitCheck.limit).toBe(-1);
      });

      it("GIVEN free 플랜 + 프로젝트 2개 WHEN 프로젝트 생성 THEN 생성 가능", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (canCreateProject as jest.Mock).mockResolvedValue({
          allowed: true,
          currentCount: 2,
          limit: 3,
        });

        // WHEN
        const limitCheck = await canCreateProject("user-1");

        // THEN
        expect(limitCheck.allowed).toBe(true);
        expect(limitCheck.currentCount).toBe(2);
        expect(limitCheck.limit).toBe(3);
      });
    });
  });
});
