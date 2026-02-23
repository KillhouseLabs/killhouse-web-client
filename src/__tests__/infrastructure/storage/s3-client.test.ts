/**
 * S3 Client 테스트
 *
 * S3 업로드, 삭제, 프리픽스 삭제 기능 테스트
 */

// Mock AWS SDK before imports
const mockSend = jest.fn();
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn().mockImplementation((params) => ({
    ...params,
    _type: "PutObject",
  })),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => ({
    ...params,
    _type: "DeleteObject",
  })),
  DeleteObjectsCommand: jest.fn().mockImplementation((params) => ({
    ...params,
    _type: "DeleteObjects",
  })),
  ListObjectsV2Command: jest.fn().mockImplementation((params) => ({
    ...params,
    _type: "ListObjectsV2",
  })),
}));

jest.mock("@/config/env", () => ({
  serverEnv: {
    AWS_REGION: () => "ap-northeast-2",
    AWS_ACCESS_KEY_ID: () => "test-access-key",
    AWS_SECRET_ACCESS_KEY: () => "test-secret-key",
    AWS_S3_BUCKET: () => "test-bucket",
  },
}));

import {
  uploadToS3,
  deleteFromS3,
  deleteS3Prefix,
  generateUploadKey,
  getProjectPrefix,
} from "@/infrastructure/storage/s3-client";

describe("S3 Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  describe("uploadToS3", () => {
    it("GIVEN 유효한 파일 WHEN 업로드 THEN S3에 저장되어야 한다", async () => {
      const buffer = Buffer.from("test content");
      const key = "uploads/project-1/repo-1/source.zip";

      const result = await uploadToS3(key, buffer, "application/zip");

      expect(result).toBe(key);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("GIVEN S3 오류 WHEN 업로드 THEN 에러가 전파되어야 한다", async () => {
      mockSend.mockRejectedValue(new Error("S3 upload failed"));
      const buffer = Buffer.from("test");

      await expect(
        uploadToS3("uploads/test/key", buffer, "application/zip")
      ).rejects.toThrow("S3 upload failed");
    });
  });

  describe("deleteFromS3", () => {
    it("GIVEN 존재하는 키 WHEN 삭제 THEN S3에서 삭제되어야 한다", async () => {
      await deleteFromS3("uploads/project-1/repo-1/source.zip");

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteS3Prefix", () => {
    it("GIVEN 오브젝트가 있는 프리픽스 WHEN 삭제 THEN 모든 오브젝트가 삭제되어야 한다", async () => {
      // First call: ListObjectsV2 returns objects
      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: "uploads/project-1/repo-1/source.zip" },
            { Key: "uploads/project-1/repo-2/app.zip" },
          ],
        })
        // Second call: DeleteObjects succeeds
        .mockResolvedValueOnce({});

      const count = await deleteS3Prefix("uploads/project-1/");

      expect(count).toBe(2);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("GIVEN 빈 프리픽스 WHEN 삭제 THEN 0이 반환되어야 한다", async () => {
      mockSend.mockResolvedValueOnce({ Contents: [] });

      const count = await deleteS3Prefix("uploads/empty-project/");

      expect(count).toBe(0);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("GIVEN Contents가 없는 프리픽스 WHEN 삭제 THEN 0이 반환되어야 한다", async () => {
      mockSend.mockResolvedValueOnce({});

      const count = await deleteS3Prefix("uploads/no-content/");

      expect(count).toBe(0);
    });
  });

  describe("generateUploadKey", () => {
    it("GIVEN 프로젝트/저장소/파일명 WHEN 키 생성 THEN 올바른 경로가 반환되어야 한다", () => {
      const key = generateUploadKey("proj-1", "repo-1", "source.zip");
      expect(key).toBe("uploads/proj-1/repo-1/source.zip");
    });
  });

  describe("getProjectPrefix", () => {
    it("GIVEN 프로젝트 ID WHEN 프리픽스 생성 THEN 올바른 프리픽스가 반환되어야 한다", () => {
      const prefix = getProjectPrefix("proj-1");
      expect(prefix).toBe("uploads/proj-1/");
    });
  });
});
