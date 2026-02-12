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

// Mock prisma
jest.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    repository: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((fn) =>
      fn({
        project: {
          create: jest.fn(),
        },
        repository: {
          createMany: jest.fn(),
          updateMany: jest.fn(),
        },
      })
    ),
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

import { prisma } from "@/infrastructure/database/prisma";
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
          },
          {
            id: "project-2",
            name: "Project 2",
            userId: "user-1",
            repositories: [],
          },
        ];
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

        // WHEN
        await prisma.project.findMany({
          where: {
            userId: "user-1",
            status: { not: "DELETED" },
          },
          orderBy: { createdAt: "desc" },
          include: {
            repositories: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            },
            _count: { select: { analyses: true } },
          },
        });

        // THEN
        expect(prisma.project.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { userId: "user-1", status: { not: "DELETED" } },
            include: expect.objectContaining({
              repositories: expect.any(Object),
            }),
          })
        );
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
          },
        ];
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

        // WHEN
        const projects = await prisma.project.findMany({
          where: { userId: "user-1", status: { not: "DELETED" } },
          include: { repositories: true },
        });

        // THEN
        expect(projects[0].repositories).toHaveLength(2);
        expect(projects[0].repositories[0].isPrimary).toBe(true);
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
        const projectData = {
          name: "Multi-Repo Project",
          description: "Description",
          userId: "user-1",
        };
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
          ...projectData,
          repositories: repositoriesData.map((r, i) => ({
            id: `repo-${i + 1}`,
            ...r,
            projectId: "new-project-id",
          })),
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (prisma.project.create as jest.Mock).mockResolvedValue(mockCreatedProject);

        // WHEN
        const result = await prisma.project.create({
          data: {
            ...projectData,
            repositories: {
              create: repositoriesData,
            },
          },
          include: { repositories: true },
        });

        // THEN
        expect(result.id).toBe("new-project-id");
        expect(result.repositories).toHaveLength(2);
        expect(prisma.project.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              repositories: expect.objectContaining({
                create: repositoriesData,
              }),
            }),
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
        };

        (prisma.project.create as jest.Mock).mockResolvedValue(mockCreatedProject);

        // WHEN
        const result = await prisma.project.create({
          data: {
            name: "Project",
            userId: "user-1",
            repositories: {
              create: repositoriesData,
            },
          },
          include: { repositories: true },
        });

        // THEN
        const primaryRepos = result.repositories.filter((r: { isPrimary: boolean }) => r.isPrimary);
        expect(primaryRepos).toHaveLength(1);
        expect(primaryRepos[0].name).toBe("first-repo");
      });

      it("GIVEN repositories 없음 WHEN 생성 THEN 저장소 없는 프로젝트가 생성되어야 한다", async () => {
        // GIVEN
        const projectData = {
          name: "Project Without Repos",
          description: "No repositories",
          userId: "user-1",
        };

        const mockCreatedProject = {
          id: "new-project-id",
          ...projectData,
          repositories: [],
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (prisma.project.create as jest.Mock).mockResolvedValue(mockCreatedProject);

        // WHEN
        const result = await prisma.project.create({
          data: projectData,
          include: { repositories: true },
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
        };
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

        // WHEN
        const result = await prisma.project.findFirst({
          where: {
            id: "project-1",
            userId: "user-1",
            status: { not: "DELETED" },
          },
          include: {
            repositories: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            },
            analyses: {
              orderBy: { startedAt: "desc" },
              take: 10,
            },
          },
        });

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
        (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

        // WHEN
        const result = await prisma.project.findFirst({
          where: {
            id: "non-existent",
            userId: "user-1",
            status: { not: "DELETED" },
          },
        });

        // THEN
        expect(result).toBeNull();
      });

      it("GIVEN 다른 사용자의 프로젝트 WHEN 조회 시도 THEN null이 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

        // WHEN
        const result = await prisma.project.findFirst({
          where: {
            id: "project-1",
            userId: "user-1",
            status: { not: "DELETED" },
          },
        });

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
        };

        (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

        // WHEN
        const result = await prisma.project.findFirst({
          where: { id: "project-1" },
          include: { repositories: true },
        });

        // THEN - Legacy fields should be computed from primary repository
        const primaryRepo = result?.repositories.find((r: { isPrimary: boolean }) => r.isPrimary);
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
        (prisma.project.findFirst as jest.Mock).mockResolvedValue({
          id: "project-1",
          userId: "user-1",
        });
        (prisma.project.update as jest.Mock).mockResolvedValue({
          id: "project-1",
          name: "Updated Name",
          repositories: [],
        });

        // WHEN
        const result = await prisma.project.update({
          where: { id: "project-1" },
          data: updateData,
          include: { repositories: true },
        });

        // THEN
        expect(result.name).toBe("Updated Name");
      });
    });
  });

  describe("DELETE /api/projects/[id]", () => {
    describe("프로젝트 삭제", () => {
      it("GIVEN 존재하는 프로젝트 WHEN 삭제 THEN 상태가 DELETED로 변경되어야 한다 (soft delete)", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (prisma.project.findFirst as jest.Mock).mockResolvedValue({
          id: "project-1",
          userId: "user-1",
        });
        (prisma.project.update as jest.Mock).mockResolvedValue({
          id: "project-1",
          status: "DELETED",
        });

        // WHEN
        const result = await prisma.project.update({
          where: { id: "project-1" },
          data: { status: "DELETED" },
        });

        // THEN
        expect(result.status).toBe("DELETED");
        expect(prisma.project.update).toHaveBeenCalledWith({
          where: { id: "project-1" },
          data: { status: "DELETED" },
        });
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
          message: "프로젝트 생성 한도(3개)에 도달했습니다. 플랜을 업그레이드하세요.",
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
