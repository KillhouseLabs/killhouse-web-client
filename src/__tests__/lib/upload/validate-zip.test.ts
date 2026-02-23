/**
 * ZIP 파일 유효성 검사 테스트
 */

import {
  validateZipExtension,
  validateZipMagicBytes,
  validateFileSize,
  validateZipFile,
} from "@/lib/upload/validate-zip";

describe("ZIP 유효성 검사", () => {
  describe("validateZipExtension", () => {
    it("GIVEN .zip 확장자 WHEN 검증 THEN 유효해야 한다", () => {
      expect(validateZipExtension("source.zip").valid).toBe(true);
    });

    it("GIVEN .ZIP 대문자 확장자 WHEN 검증 THEN 유효해야 한다", () => {
      expect(validateZipExtension("SOURCE.ZIP").valid).toBe(true);
    });

    it("GIVEN .txt 확장자 WHEN 검증 THEN 에러가 반환되어야 한다", () => {
      const result = validateZipExtension("readme.txt");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("ZIP 파일만 업로드할 수 있습니다");
    });

    it("GIVEN .tar.gz 확장자 WHEN 검증 THEN 에러가 반환되어야 한다", () => {
      const result = validateZipExtension("archive.tar.gz");
      expect(result.valid).toBe(false);
    });

    it("GIVEN 확장자 없음 WHEN 검증 THEN 에러가 반환되어야 한다", () => {
      const result = validateZipExtension("noextension");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateZipMagicBytes", () => {
    it("GIVEN 유효한 ZIP 매직 바이트 WHEN 검증 THEN 유효해야 한다", () => {
      // PK\x03\x04 + extra bytes
      const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      expect(validateZipMagicBytes(buffer).valid).toBe(true);
    });

    it("GIVEN 잘못된 매직 바이트 WHEN 검증 THEN 에러가 반환되어야 한다", () => {
      // Plain text file
      const buffer = Buffer.from("Hello, world!", "utf-8");
      const result = validateZipMagicBytes(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("유효한 ZIP 파일이 아닙니다");
    });

    it("GIVEN 4바이트 미만 WHEN 검증 THEN 에러가 반환되어야 한다", () => {
      const buffer = Buffer.from([0x50, 0x4b]);
      const result = validateZipMagicBytes(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("유효한 ZIP 파일이 아닙니다");
    });

    it("GIVEN PDF 매직 바이트 WHEN 검증 THEN 에러가 반환되어야 한다", () => {
      // %PDF
      const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);
      const result = validateZipMagicBytes(buffer);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateFileSize", () => {
    it("GIVEN 1MB 파일 WHEN 검증 THEN 유효해야 한다", () => {
      expect(validateFileSize(1 * 1024 * 1024).valid).toBe(true);
    });

    it("GIVEN 100MB 파일 WHEN 검증 THEN 유효해야 한다", () => {
      expect(validateFileSize(100 * 1024 * 1024).valid).toBe(true);
    });

    it("GIVEN 101MB 파일 WHEN 검증 THEN 에러가 반환되어야 한다", () => {
      const result = validateFileSize(101 * 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("파일 크기는 100MB 이하여야 합니다");
    });

    it("GIVEN 0바이트 파일 WHEN 검증 THEN 에러가 반환되어야 한다", () => {
      const result = validateFileSize(0);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("빈 파일은 업로드할 수 없습니다");
    });
  });

  describe("validateZipFile (종합 검증)", () => {
    it("GIVEN 유효한 ZIP 파일 WHEN 종합 검증 THEN 유효해야 한다", () => {
      const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      const result = validateZipFile("source.zip", buffer, buffer.length);
      expect(result.valid).toBe(true);
    });

    it("GIVEN .txt 파일 WHEN 종합 검증 THEN 확장자 에러가 반환되어야 한다", () => {
      const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const result = validateZipFile("source.txt", buffer, buffer.length);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("ZIP 파일만 업로드할 수 있습니다");
    });

    it("GIVEN .zip 확장자지만 텍스트 내용 WHEN 종합 검증 THEN 매직 바이트 에러가 반환되어야 한다", () => {
      const buffer = Buffer.from("Not a zip file", "utf-8");
      const result = validateZipFile("fake.zip", buffer, buffer.length);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("유효한 ZIP 파일이 아닙니다");
    });

    it("GIVEN 초과 크기 ZIP WHEN 종합 검증 THEN 크기 에러가 반환되어야 한다", () => {
      const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const result = validateZipFile("big.zip", buffer, 200 * 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("파일 크기는 100MB 이하여야 합니다");
    });
  });
});
