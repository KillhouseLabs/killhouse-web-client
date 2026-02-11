/**
 * Repository DTO Validation Tests
 *
 * 저장소 생성/수정 시 입력 데이터 검증 테스트
 */

import {
  createRepositorySchema,
  updateRepositorySchema,
} from "@/domains/project/dto/repository.dto";

describe("createRepositorySchema", () => {
  describe("provider 필드 검증", () => {
    it("GIVEN GITHUB 프로바이더 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provider).toBe("GITHUB");
      }
    });

    it("GIVEN GITLAB 프로바이더 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITLAB",
        name: "my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provider).toBe("GITLAB");
      }
    });

    it("GIVEN MANUAL 프로바이더 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        provider: "MANUAL",
        name: "my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provider).toBe("MANUAL");
      }
    });

    it("GIVEN 잘못된 프로바이더 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        provider: "BITBUCKET",
        name: "my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 프로바이더 없음 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });
  });

  describe("name 필드 검증", () => {
    it("GIVEN 유효한 이름 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-awesome-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("my-awesome-repo");
      }
    });

    it("GIVEN 빈 이름 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 100자 초과 이름 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "a".repeat(101),
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 이름 없음 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });
  });

  describe("url 필드 검증", () => {
    it("GIVEN 유효한 GitHub URL WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
        url: "https://github.com/owner/my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe("https://github.com/owner/my-repo");
      }
    });

    it("GIVEN 유효한 GitLab URL WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITLAB",
        name: "my-repo",
        url: "https://gitlab.com/owner/my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe("https://gitlab.com/owner/my-repo");
      }
    });

    it("GIVEN 빈 URL WHEN 검증 THEN 성공해야 한다 (MANUAL용)", () => {
      // GIVEN
      const input = {
        provider: "MANUAL",
        name: "my-repo",
        url: "",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });

    it("GIVEN URL 없음 WHEN 검증 THEN 성공해야 한다 (optional)", () => {
      // GIVEN
      const input = {
        provider: "MANUAL",
        name: "my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });
  });

  describe("owner 필드 검증", () => {
    it("GIVEN 유효한 owner WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
        owner: "my-org",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.owner).toBe("my-org");
      }
    });

    it("GIVEN owner 없음 WHEN 검증 THEN 성공해야 한다 (optional)", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });
  });

  describe("defaultBranch 필드 검증", () => {
    it("GIVEN defaultBranch 없음 WHEN 검증 THEN main이 기본값이어야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultBranch).toBe("main");
      }
    });

    it("GIVEN 커스텀 브랜치 WHEN 검증 THEN 해당 값이 사용되어야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
        defaultBranch: "develop",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultBranch).toBe("develop");
      }
    });
  });

  describe("isPrimary 필드 검증", () => {
    it("GIVEN isPrimary 없음 WHEN 검증 THEN false가 기본값이어야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPrimary).toBe(false);
      }
    });

    it("GIVEN isPrimary: true WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
        isPrimary: true,
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPrimary).toBe(true);
      }
    });

    it("GIVEN isPrimary: false WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
        isPrimary: false,
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPrimary).toBe(false);
      }
    });
  });

  describe("role 필드 검증", () => {
    it("GIVEN 유효한 role WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
        role: "frontend",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("frontend");
      }
    });

    it("GIVEN role 없음 WHEN 검증 THEN 성공해야 한다 (optional)", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBeUndefined();
      }
    });

    it("GIVEN 50자 초과 role WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        provider: "GITHUB",
        name: "my-repo",
        role: "a".repeat(51),
      };

      // WHEN
      const result = createRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 다양한 role 값 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const roles = ["frontend", "backend", "shared", "api", "mobile"];

      for (const role of roles) {
        const input = {
          provider: "GITHUB",
          name: "my-repo",
          role,
        };

        // WHEN
        const result = createRepositorySchema.safeParse(input);

        // THEN
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.role).toBe(role);
        }
      }
    });
  });
});

describe("updateRepositorySchema", () => {
  describe("부분 업데이트 검증", () => {
    it("GIVEN name만 제공 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "updated-repo",
      };

      // WHEN
      const result = updateRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("updated-repo");
      }
    });

    it("GIVEN defaultBranch만 제공 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        defaultBranch: "release",
      };

      // WHEN
      const result = updateRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultBranch).toBe("release");
      }
    });

    it("GIVEN isPrimary만 제공 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        isPrimary: true,
      };

      // WHEN
      const result = updateRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPrimary).toBe(true);
      }
    });

    it("GIVEN role만 제공 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        role: "backend",
      };

      // WHEN
      const result = updateRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("backend");
      }
    });

    it("GIVEN 빈 객체 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {};

      // WHEN
      const result = updateRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });

    it("GIVEN 여러 필드 업데이트 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "updated-repo",
        defaultBranch: "develop",
        isPrimary: true,
        role: "frontend",
      };

      // WHEN
      const result = updateRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("updated-repo");
        expect(result.data.defaultBranch).toBe("develop");
        expect(result.data.isPrimary).toBe(true);
        expect(result.data.role).toBe("frontend");
      }
    });
  });

  describe("필드 제약 검증", () => {
    it("GIVEN 빈 이름 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "",
      };

      // WHEN
      const result = updateRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 100자 초과 이름 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "a".repeat(101),
      };

      // WHEN
      const result = updateRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 50자 초과 role WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        role: "a".repeat(51),
      };

      // WHEN
      const result = updateRepositorySchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });
  });
});
