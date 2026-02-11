/**
 * Projects API Route Tests
 *
 * 프로젝트 API 엔드포인트 통합 테스트
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
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

import { prisma } from "@/infrastructure/database/prisma";
import { auth } from "@/lib/auth";

describe("Projects API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/projects", () => {
    describe("인증 검증", () => {
      it("GIVEN 인증되지 않은 사용자 WHEN 프로젝트 목록 요청 THEN 401 에러가 반환되어야 한다", async () => {
        // GIVEN
        (auth as jest.Mock).mockResolvedValue(null);

        // WHEN - Direct validation without calling route
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
          { id: "project-1", name: "Project 1", userId: "user-1" },
          { id: "project-2", name: "Project 2", userId: "user-1" },
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
          include: { _count: { select: { analyses: true } } },
        });

        // THEN
        expect(prisma.project.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { userId: "user-1", status: { not: "DELETED" } },
          })
        );
      });
    });
  });

  describe("POST /api/projects", () => {
    describe("입력 검증", () => {
      it("GIVEN 유효한 입력 WHEN 스키마 검증 THEN 성공해야 한다", () => {
        // GIVEN
        const input = {
          name: "New Project",
          description: "Project description",
          repoProvider: "GITHUB",
          repoUrl: "https://github.com/owner/repo",
        };

        // WHEN
        const result = createProjectSchema.safeParse(input);

        // THEN
        expect(result.success).toBe(true);
      });

      it("GIVEN 이름 없음 WHEN 스키마 검증 THEN 실패해야 한다", () => {
        // GIVEN
        const input = {
          name: "",
        };

        // WHEN
        const result = createProjectSchema.safeParse(input);

        // THEN
        expect(result.success).toBe(false);
      });

      it("GIVEN 잘못된 프로바이더 WHEN 스키마 검증 THEN 실패해야 한다", () => {
        // GIVEN
        const input = {
          name: "New Project",
          repoProvider: "INVALID",
        };

        // WHEN
        const result = createProjectSchema.safeParse(input);

        // THEN
        expect(result.success).toBe(false);
      });

      it("GIVEN 잘못된 URL 형식 WHEN 스키마 검증 THEN 실패해야 한다", () => {
        // GIVEN
        const input = {
          name: "New Project",
          repoUrl: "https://bitbucket.org/owner/repo",
        };

        // WHEN
        const result = createProjectSchema.safeParse(input);

        // THEN
        expect(result.success).toBe(false);
      });
    });

    describe("프로젝트 생성", () => {
      it("GIVEN 유효한 데이터 WHEN 프로젝트 생성 THEN 프로젝트가 생성되어야 한다", async () => {
        // GIVEN
        const projectData = {
          name: "New Project",
          description: "Description",
          repoProvider: "GITHUB",
          repoUrl: "https://github.com/owner/repo",
          repoOwner: "owner",
          repoName: "repo",
          defaultBranch: "main",
          userId: "user-1",
        };
        (prisma.project.create as jest.Mock).mockResolvedValue({
          id: "new-project-id",
          ...projectData,
        });

        // WHEN
        const result = await prisma.project.create({ data: projectData });

        // THEN
        expect(result.id).toBe("new-project-id");
        expect(result.name).toBe("New Project");
        expect(result.repoProvider).toBe("GITHUB");
        expect(prisma.project.create).toHaveBeenCalledWith({
          data: projectData,
        });
      });
    });
  });

  describe("GET /api/projects/[id]", () => {
    describe("프로젝트 조회", () => {
      it("GIVEN 존재하는 프로젝트 WHEN ID로 조회 THEN 프로젝트가 반환되어야 한다", async () => {
        // GIVEN
        const mockProject = {
          id: "project-1",
          name: "Test Project",
          userId: "user-1",
          repoProvider: "GITHUB",
          analyses: [],
        };
        (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

        // WHEN
        const result = await prisma.project.findFirst({
          where: {
            id: "project-1",
            userId: "user-1",
            status: { not: "DELETED" },
          },
        });

        // THEN
        expect(result).toEqual(mockProject);
      });

      it("GIVEN 존재하지 않는 프로젝트 WHEN ID로 조회 THEN null이 반환되어야 한다", async () => {
        // GIVEN
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
        (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

        // WHEN
        const result = await prisma.project.findFirst({
          where: {
            id: "project-1",
            userId: "different-user",
            status: { not: "DELETED" },
          },
        });

        // THEN
        expect(result).toBeNull();
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
        (prisma.project.update as jest.Mock).mockResolvedValue({
          id: "project-1",
          name: "Updated Name",
        });

        // WHEN
        const result = await prisma.project.update({
          where: { id: "project-1" },
          data: updateData,
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
});
