/**
 * S3 Client 테스트
 *
 * S3 업로드, 삭제, 프리픽스 삭제, 버킷 자동 생성 폴백 테스트
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
  HeadBucketCommand: jest.fn().mockImplementation((params) => ({
    ...params,
    _type: "HeadBucket",
  })),
  CreateBucketCommand: jest.fn().mockImplementation((params) => ({
    ...params,
    _type: "CreateBucket",
  })),
}));

let mockBucket: string | undefined = "test-bucket";

jest.mock("@/config/env", () => ({
  serverEnv: {
    AWS_REGION: () => "ap-northeast-2",
    AWS_ACCESS_KEY_ID: () => "test-access-key",
    AWS_SECRET_ACCESS_KEY: () => "test-secret-key",
    AWS_S3_BUCKET: () => mockBucket,
  },
}));

import {
  uploadToS3,
  deleteFromS3,
  deleteS3Prefix,
  generateUploadKey,
  getProjectPrefix,
  _resetBucketCache,
} from "@/infrastructure/storage/s3-client";

describe("S3 Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
    mockBucket = "test-bucket";
    _resetBucketCache();
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
      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: "uploads/project-1/repo-1/source.zip" },
            { Key: "uploads/project-1/repo-2/app.zip" },
          ],
        })
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

  describe("getBucket 폴백", () => {
    it("GIVEN AWS_S3_BUCKET 미설정 + 버킷 존재 WHEN 업로드 THEN 기존 버킷을 사용해야 한다", async () => {
      mockBucket = undefined;
      // HeadBucket 성공 → 버킷 존재
      mockSend
        .mockResolvedValueOnce({}) // HeadBucket
        .mockResolvedValueOnce({}); // PutObject

      const buffer = Buffer.from("test");
      const result = await uploadToS3("key", buffer, "application/zip");

      expect(result).toBe("key");
      // HeadBucket + PutObject = 2 calls
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("GIVEN AWS_S3_BUCKET 미설정 + 버킷 미존재 WHEN 업로드 THEN 버킷을 생성해야 한다", async () => {
      mockBucket = undefined;
      mockSend
        .mockRejectedValueOnce(new Error("NotFound")) // HeadBucket 실패
        .mockResolvedValueOnce({}) // CreateBucket 성공
        .mockResolvedValueOnce({}); // PutObject

      const buffer = Buffer.from("test");
      const result = await uploadToS3("key", buffer, "application/zip");

      expect(result).toBe("key");
      // HeadBucket + CreateBucket + PutObject = 3 calls
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it("GIVEN AWS_S3_BUCKET 미설정 + 버킷 생성 실패 WHEN 업로드 THEN 에러가 throw되어야 한다", async () => {
      mockBucket = undefined;
      mockSend
        .mockRejectedValueOnce(new Error("NotFound")) // HeadBucket 실패
        .mockRejectedValueOnce(new Error("AccessDenied")); // CreateBucket 실패

      const buffer = Buffer.from("test");
      await expect(
        uploadToS3("key", buffer, "application/zip")
      ).rejects.toThrow("S3 버킷을 생성할 수 없습니다");
    });

    it("GIVEN 버킷이 한 번 resolve됨 WHEN 두 번째 업로드 THEN HeadBucket 재호출 없이 캐시 사용해야 한다", async () => {
      mockBucket = undefined;
      // 첫 번째: HeadBucket + PutObject
      mockSend
        .mockResolvedValueOnce({}) // HeadBucket
        .mockResolvedValueOnce({}) // PutObject (1st upload)
        .mockResolvedValueOnce({}); // PutObject (2nd upload)

      const buffer = Buffer.from("test");
      await uploadToS3("key1", buffer, "application/zip");
      await uploadToS3("key2", buffer, "application/zip");

      // HeadBucket(1) + PutObject(2) = 3, NOT 4
      expect(mockSend).toHaveBeenCalledTimes(3);
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
