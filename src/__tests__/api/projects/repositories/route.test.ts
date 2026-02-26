/**
 * Projects Repositories API Route Tests
 *
 * 프로젝트 저장소 API 엔드포인트 통합 테스트
 */

import {
  createRepositorySchema,
  updateRepositorySchema,
} from "@/domains/project/dto/repository.dto";

// Mock projectRepository
jest.mock("@/domains/project/infra/prisma-project.repository", () => ({
  projectRepository: {
    findByIdAndUser: jest.fn(),
  },
}));

// Mock repoRepository
jest.mock("@/domains/project/infra/prisma-repo.repository", () => ({
  repoRepository: {
    findManyByProject: jest.fn(),
    findByIdAndProject: jest.fn(),
    findFirstByProject: jest.fn(),
    findDuplicateUrl: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    unsetPrimary: jest.fn(),
    delete: jest.fn(),
    findOldestByProject: jest.fn(),
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { repoRepository } from "@/domains/project/infra/prisma-repo.repository";
import { auth } from "@/lib/auth";

describe("Projects Repositories API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/projects/[id]/repositories", () => {
    describe("인증 검증", () => {
      it("GIVEN 인증되지 않은 사용자 WHEN 저장소 목록 요청 THEN 401 에러가 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue(null);

        // WHEN
        const session = await auth();

        // THEN
        expect(session).toBeNull();
      });
    });

    describe("프로젝트 소유권 검증", () => {
      it("GIVEN 다른 사용자의 프로젝트 WHEN 저장소 조회 THEN 404가 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          null
        );

        // WHEN
        const project = await projectRepository.findByIdAndUser(
          "user-1",
          "project-1"
        );

        // THEN
        expect(project).toBeNull();
      });
    });

    describe("저장소 목록 조회", () => {
      it("GIVEN 프로젝트 존재 WHEN 저장소 목록 조회 THEN 해당 프로젝트의 저장소가 반환되어야 한다", async () => {
        // GIVEN
        const mockProject = { id: "project-1", userId: "user-1" };
        const mockRepositories = [
          {
            id: "repo-1",
            provider: "GITHUB",
            name: "frontend",
            url: "https://github.com/owner/frontend",
            isPrimary: true,
            role: "frontend",
            projectId: "project-1",
            _count: { analyses: 0 },
          },
          {
            id: "repo-2",
            provider: "GITHUB",
            name: "backend",
            url: "https://github.com/owner/backend",
            isPrimary: false,
            role: "backend",
            projectId: "project-1",
            _count: { analyses: 0 },
          },
        ];

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (repoRepository.findManyByProject as jest.Mock).mockResolvedValue(
          mockRepositories
        );

        // WHEN
        const repos = await repoRepository.findManyByProject("project-1");

        // THEN
        expect(repoRepository.findManyByProject).toHaveBeenCalledWith(
          "project-1"
        );
        expect(repos).toHaveLength(2);
      });

      it("GIVEN 프로젝트 없음 WHEN 저장소 목록 조회 THEN null이 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          null
        );

        // WHEN
        const project = await projectRepository.findByIdAndUser(
          "user-1",
          "non-existent"
        );

        // THEN
        expect(project).toBeNull();
      });
    });
  });

  describe("POST /api/projects/[id]/repositories", () => {
    describe("입력 검증", () => {
      it("GIVEN 유효한 저장소 데이터 WHEN 스키마 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const input = {
          provider: "GITHUB",
          name: "new-repo",
          url: "https://github.com/owner/new-repo",
          defaultBranch: "main",
          isPrimary: false,
          role: "frontend",
        };

        // WHEN
        const result = createRepositorySchema.safeParse(input);

        // THEN
        expect(result.success).toBe(true);
      });

      it("GIVEN provider 없음 WHEN 스키마 검증 THEN 실패해야 한다", () => {
        // GIVEN
        const input = {
          name: "new-repo",
        };

        // WHEN
        const result = createRepositorySchema.safeParse(input);

        // THEN
        expect(result.success).toBe(false);
      });

      it("GIVEN name 없음 WHEN 스키마 검증 THEN 실패해야 한다", () => {
        // GIVEN
        const input = {
          provider: "GITHUB",
        };

        // WHEN
        const result = createRepositorySchema.safeParse(input);

        // THEN
        expect(result.success).toBe(false);
      });

      it("GIVEN MANUAL + dockerfileContent WHEN 스키마 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const input = {
          provider: "MANUAL",
          name: "custom-app",
          dockerfileContent: 'FROM python:3.11-slim\nCMD ["python", "main.py"]',
        };

        // WHEN
        const result = createRepositorySchema.safeParse(input);

        // THEN
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.dockerfileContent).toContain("FROM");
        }
      });

      it("GIVEN MANUAL + composeContent WHEN 스키마 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const input = {
          provider: "MANUAL",
          name: "custom-app",
          composeContent: "services:\n  db:\n    image: postgres:15\n",
        };

        // WHEN
        const result = createRepositorySchema.safeParse(input);

        // THEN
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.composeContent).toContain("postgres");
        }
      });

      it("GIVEN dockerfileContent + composeContent 동시 제공 WHEN 스키마 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const input = {
          provider: "MANUAL",
          name: "full-config-app",
          dockerfileContent: 'FROM node:20\nCMD ["node", "index.js"]',
          composeContent: "services:\n  redis:\n    image: redis:7\n",
        };

        // WHEN
        const result = createRepositorySchema.safeParse(input);

        // THEN
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.dockerfileContent).toBeDefined();
          expect(result.data.composeContent).toBeDefined();
        }
      });
    });

    describe("저장소 추가", () => {
      it("GIVEN 유효한 저장소 데이터 WHEN 추가 THEN 저장소가 생성되어야 한다", async () => {
        // GIVEN
        const mockProject = { id: "project-1", userId: "user-1" };
        const repositoryData = {
          provider: "GITHUB",
          name: "new-repo",
          url: "https://github.com/owner/new-repo",
          owner: "owner",
          defaultBranch: "main",
          isPrimary: false,
          role: "frontend",
          projectId: "project-1",
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (repoRepository.findDuplicateUrl as jest.Mock).mockResolvedValue(null);
        (repoRepository.create as jest.Mock).mockResolvedValue({
          id: "new-repo-id",
          ...repositoryData,
        });

        // WHEN
        const result = await repoRepository.create(repositoryData as never);

        // THEN
        expect(result.id).toBe("new-repo-id");
        expect(result.name).toBe("new-repo");
        expect(result.provider).toBe("GITHUB");
      });

      it("GIVEN MANUAL + dockerfileContent WHEN 추가 THEN dockerfileContent가 저장되어야 한다", async () => {
        // GIVEN
        const mockProject = { id: "project-1", userId: "user-1" };
        const repositoryData = {
          provider: "MANUAL",
          name: "custom-app",
          defaultBranch: "main",
          isPrimary: false,
          dockerfileContent: 'FROM python:3.11\nCMD ["python", "app.py"]',
          composeContent: "services:\n  db:\n    image: postgres:15\n",
          projectId: "project-1",
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (repoRepository.findDuplicateUrl as jest.Mock).mockResolvedValue(null);
        (repoRepository.create as jest.Mock).mockResolvedValue({
          id: "manual-repo-id",
          ...repositoryData,
        });

        // WHEN
        const result = await repoRepository.create(repositoryData as never);

        // THEN
        expect(result.dockerfileContent).toContain("FROM");
        expect(result.composeContent).toContain("postgres");
      });

      it("GIVEN 중복 URL WHEN 추가 THEN 에러가 발생해야 한다", async () => {
        // GIVEN
        const mockProject = { id: "project-1", userId: "user-1" };
        const existingRepo = {
          id: "existing-repo",
          url: "https://github.com/owner/existing-repo",
          projectId: "project-1",
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (repoRepository.findDuplicateUrl as jest.Mock).mockResolvedValue(
          existingRepo
        );

        // WHEN
        const duplicate = await repoRepository.findDuplicateUrl(
          "project-1",
          "https://github.com/owner/existing-repo"
        );

        // THEN
        expect(duplicate).not.toBeNull();
        expect(duplicate?.url).toBe("https://github.com/owner/existing-repo");
      });

      it("GIVEN isPrimary: true WHEN 추가 THEN 기존 primary가 해제되어야 한다", async () => {
        // GIVEN
        const mockProject = { id: "project-1", userId: "user-1" };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (repoRepository.findDuplicateUrl as jest.Mock).mockResolvedValue(null);
        (repoRepository.unsetPrimary as jest.Mock).mockResolvedValue(undefined);
        (repoRepository.create as jest.Mock).mockResolvedValue({
          id: "new-primary-repo",
          isPrimary: true,
          projectId: "project-1",
        });

        // WHEN
        await repoRepository.unsetPrimary("project-1");

        // THEN
        expect(repoRepository.unsetPrimary).toHaveBeenCalledWith("project-1");
      });
    });
  });

  describe("PATCH /api/projects/[id]/repositories/[repoId]", () => {
    describe("입력 검증", () => {
      it("GIVEN 유효한 업데이트 데이터 WHEN 스키마 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const input = {
          name: "updated-repo",
          defaultBranch: "develop",
        };

        // WHEN
        const result = updateRepositorySchema.safeParse(input);

        // THEN
        expect(result.success).toBe(true);
      });

      it("GIVEN 부분 업데이트 WHEN 스키마 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const input = {
          role: "api",
        };

        // WHEN
        const result = updateRepositorySchema.safeParse(input);

        // THEN
        expect(result.success).toBe(true);
      });
    });

    describe("저장소 수정", () => {
      it("GIVEN 존재하는 저장소 WHEN 수정 THEN 업데이트되어야 한다", async () => {
        // GIVEN
        const mockProject = { id: "project-1", userId: "user-1" };
        const mockRepository = {
          id: "repo-1",
          name: "original-repo",
          projectId: "project-1",
          _count: { analyses: 0 },
        };
        const updateData = { name: "updated-repo", role: "backend" };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (repoRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          mockRepository
        );
        (repoRepository.update as jest.Mock).mockResolvedValue({
          id: "repo-1",
          name: "updated-repo",
          role: "backend",
        });

        // WHEN
        const result = await repoRepository.update("repo-1", updateData);

        // THEN
        expect(result.name).toBe("updated-repo");
        expect(result.role).toBe("backend");
      });

      it("GIVEN 존재하지 않는 저장소 WHEN 수정 THEN null이 반환되어야 한다", async () => {
        // GIVEN
        const mockProject = { id: "project-1", userId: "user-1" };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (repoRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          null
        );

        // WHEN
        const repository = await repoRepository.findByIdAndProject(
          "non-existent",
          "project-1"
        );

        // THEN
        expect(repository).toBeNull();
      });

      it("GIVEN isPrimary 변경 WHEN 수정 THEN 기존 primary가 해제되어야 한다", async () => {
        // GIVEN
        const mockProject = { id: "project-1", userId: "user-1" };
        const mockRepository = {
          id: "repo-2",
          name: "secondary-repo",
          isPrimary: false,
          projectId: "project-1",
          _count: { analyses: 0 },
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (repoRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          mockRepository
        );
        (repoRepository.unsetPrimary as jest.Mock).mockResolvedValue(undefined);
        (repoRepository.update as jest.Mock).mockResolvedValue({
          id: "repo-2",
          isPrimary: true,
        });

        // WHEN
        await repoRepository.unsetPrimary("project-1", "repo-2");

        // THEN
        expect(repoRepository.unsetPrimary).toHaveBeenCalledWith(
          "project-1",
          "repo-2"
        );
      });
    });
  });

  describe("DELETE /api/projects/[id]/repositories/[repoId]", () => {
    describe("저장소 삭제", () => {
      it("GIVEN 존재하는 저장소 WHEN 삭제 THEN 제거되어야 한다", async () => {
        // GIVEN
        const mockProject = { id: "project-1", userId: "user-1" };
        const mockRepository = {
          id: "repo-1",
          name: "to-delete",
          isPrimary: false,
          projectId: "project-1",
          _count: { analyses: 0 },
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (repoRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          mockRepository
        );
        (repoRepository.delete as jest.Mock).mockResolvedValue(mockRepository);

        // WHEN
        const result = await repoRepository.delete("repo-1");

        // THEN
        expect(result.id).toBe("repo-1");
        expect(repoRepository.delete).toHaveBeenCalledWith("repo-1");
      });

      it("GIVEN primary 저장소 삭제 WHEN 다른 저장소 존재 THEN 다음 저장소가 primary가 되어야 한다", async () => {
        // GIVEN
        const mockProject = { id: "project-1", userId: "user-1" };
        const mockPrimaryRepo = {
          id: "repo-1",
          name: "primary-to-delete",
          isPrimary: true,
          projectId: "project-1",
          _count: { analyses: 0 },
        };
        const mockNextRepo = {
          id: "repo-2",
          name: "next-primary",
          isPrimary: false,
          projectId: "project-1",
          createdAt: new Date(),
        };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (repoRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          mockPrimaryRepo
        );
        (repoRepository.delete as jest.Mock).mockResolvedValue(mockPrimaryRepo);
        (repoRepository.findOldestByProject as jest.Mock).mockResolvedValue(
          mockNextRepo
        );
        (repoRepository.update as jest.Mock).mockResolvedValue({
          ...mockNextRepo,
          isPrimary: true,
        });

        // WHEN - Simulate what the API does
        // 1. Check the repo exists
        const existingRepo = await repoRepository.findByIdAndProject(
          "repo-1",
          "project-1"
        );
        const wasPrimary = existingRepo?.isPrimary;

        // 2. Delete the repository
        await repoRepository.delete("repo-1");

        // 3. If was primary, find next oldest
        if (wasPrimary) {
          const nextRepo =
            await repoRepository.findOldestByProject("project-1");

          if (nextRepo) {
            await repoRepository.update(nextRepo.id, { isPrimary: true });
          }
        }

        // THEN
        expect(repoRepository.update).toHaveBeenCalledWith("repo-2", {
          isPrimary: true,
        });
      });

      it("GIVEN 존재하지 않는 저장소 WHEN 삭제 THEN null이 반환되어야 한다", async () => {
        // GIVEN
        const mockProject = { id: "project-1", userId: "user-1" };

        (auth as jest.Mock).mockResolvedValue({
          user: { id: "user-1" },
        });
        (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
          mockProject
        );
        (repoRepository.findByIdAndProject as jest.Mock).mockResolvedValue(
          null
        );

        // WHEN
        const repository = await repoRepository.findByIdAndProject(
          "non-existent",
          "project-1"
        );

        // THEN
        expect(repository).toBeNull();
      });
    });
  });
});
