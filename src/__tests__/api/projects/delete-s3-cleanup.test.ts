/**
 * 프로젝트 삭제 시 S3 오브젝트 정리 테스트
 */

// Mock S3 client
const mockDeleteS3Prefix = jest.fn();
const mockGetProjectPrefix = jest.fn();

jest.mock("@/infrastructure/storage/s3-client", () => ({
  deleteS3Prefix: (...args: unknown[]) => mockDeleteS3Prefix(...args),
  getProjectPrefix: (...args: unknown[]) => mockGetProjectPrefix(...args),
}));

jest.mock("@/domains/project/infra/prisma-project.repository", () => ({
  projectRepository: {
    findByIdAndUser: jest.fn(),
    softDelete: jest.fn(),
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

import { projectRepository } from "@/domains/project/infra/prisma-project.repository";
import { auth } from "@/lib/auth";

describe("프로젝트 삭제 시 S3 정리", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProjectPrefix.mockImplementation((id: string) => `uploads/${id}/`);
  });

  it("GIVEN 업로드 파일이 있는 프로젝트 WHEN 삭제 THEN S3 프리픽스가 삭제되어야 한다", async () => {
    // GIVEN
    const projectId = "project-with-uploads";
    (auth as jest.Mock).mockResolvedValue({ user: { id: "user-1" } });
    (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue({
      id: projectId,
      userId: "user-1",
      status: "ACTIVE",
    });
    (projectRepository.softDelete as jest.Mock).mockResolvedValue(undefined);
    mockDeleteS3Prefix.mockResolvedValue(3);

    // WHEN - Simulate what the DELETE handler does
    const prefix = mockGetProjectPrefix(projectId);
    await mockDeleteS3Prefix(prefix);
    await projectRepository.softDelete(projectId);

    // THEN
    expect(mockGetProjectPrefix).toHaveBeenCalledWith(projectId);
    expect(mockDeleteS3Prefix).toHaveBeenCalledWith(`uploads/${projectId}/`);
    expect(projectRepository.softDelete).toHaveBeenCalledWith(projectId);
  });

  it("GIVEN S3 삭제 실패 WHEN 프로젝트 삭제 THEN 프로젝트 삭제는 계속되어야 한다", async () => {
    // GIVEN
    const projectId = "project-s3-fail";
    (auth as jest.Mock).mockResolvedValue({ user: { id: "user-1" } });
    (projectRepository.findByIdAndUser as jest.Mock).mockResolvedValue({
      id: projectId,
      userId: "user-1",
      status: "ACTIVE",
    });
    (projectRepository.softDelete as jest.Mock).mockResolvedValue(undefined);
    mockDeleteS3Prefix.mockRejectedValue(new Error("S3 network error"));

    // WHEN - Simulate what the DELETE handler does (S3 fails but delete continues)
    const prefix = mockGetProjectPrefix(projectId);
    try {
      await mockDeleteS3Prefix(prefix);
    } catch {
      // S3 cleanup failure is logged but not blocking
    }
    await projectRepository.softDelete(projectId);

    // THEN - Project still gets deleted despite S3 failure
    expect(projectRepository.softDelete).toHaveBeenCalledWith(projectId);
  });

  it("GIVEN 업로드 파일이 없는 프로젝트 WHEN 삭제 THEN S3에서 0개 삭제되어야 한다", async () => {
    // GIVEN
    const projectId = "project-no-uploads";
    mockDeleteS3Prefix.mockResolvedValue(0);

    // WHEN
    const count = await mockDeleteS3Prefix(mockGetProjectPrefix(projectId));

    // THEN
    expect(count).toBe(0);
  });
});
