/**
 * Project DTO Validation Tests
 *
 * 프로젝트 생성/수정 시 입력 데이터 검증 테스트
 */

import {
  createProjectSchema,
  updateProjectSchema,
  parseRepoUrl,
} from "@/domains/project/dto/project.dto";

describe("createProjectSchema", () => {
  describe("name 필드 검증", () => {
    it("GIVEN 빈 이름 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "프로젝트 이름을 입력하세요"
        );
      }
    });

    it("GIVEN 100자 초과 이름 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "a".repeat(101),
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "프로젝트 이름은 100자 이하여야 합니다"
        );
      }
    });

    it("GIVEN 유효한 이름 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "My Test Project",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });
  });

  describe("description 필드 검증", () => {
    it("GIVEN 500자 초과 설명 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        description: "a".repeat(501),
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "설명은 500자 이하여야 합니다"
        );
      }
    });

    it("GIVEN 설명 없음 WHEN 검증 THEN 성공해야 한다 (optional)", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });

    it("GIVEN 유효한 설명 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        description: "This is a valid description",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("This is a valid description");
      }
    });
  });

  describe("repoProvider 필드 검증", () => {
    it("GIVEN GITHUB 프로바이더 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        repoProvider: "GITHUB",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repoProvider).toBe("GITHUB");
      }
    });

    it("GIVEN GITLAB 프로바이더 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        repoProvider: "GITLAB",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repoProvider).toBe("GITLAB");
      }
    });

    it("GIVEN MANUAL 프로바이더 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        repoProvider: "MANUAL",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repoProvider).toBe("MANUAL");
      }
    });

    it("GIVEN 잘못된 프로바이더 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        repoProvider: "INVALID",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 프로바이더 없음 WHEN 검증 THEN GITHUB이 기본값이어야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repoProvider).toBe("GITHUB");
      }
    });
  });

  describe("repoUrl 필드 검증", () => {
    it("GIVEN 유효한 GitHub URL WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        repoUrl: "https://github.com/owner/repo",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });

    it("GIVEN 유효한 GitLab URL WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        repoUrl: "https://gitlab.com/owner/repo",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });

    it("GIVEN 잘못된 URL WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        repoUrl: "https://bitbucket.org/owner/repo",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN 빈 URL WHEN 검증 THEN 성공해야 한다 (optional)", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        repoUrl: "",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });
  });

  describe("defaultBranch 필드 검증", () => {
    it("GIVEN 브랜치 없음 WHEN 검증 THEN main이 기본값이어야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultBranch).toBe("main");
      }
    });

    it("GIVEN 커스텀 브랜치 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Valid Name",
        defaultBranch: "develop",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultBranch).toBe("develop");
      }
    });
  });
});

describe("updateProjectSchema", () => {
  describe("부분 업데이트 검증", () => {
    it("GIVEN 이름만 제공 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Updated Name",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Name");
        expect(result.data.description).toBeUndefined();
      }
    });

    it("GIVEN 설명만 제공 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        description: "Updated description",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Updated description");
      }
    });

    it("GIVEN 빈 객체 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {};

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });
  });

  describe("status 필드 검증", () => {
    it("GIVEN ACTIVE 상태 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        status: "ACTIVE",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("ACTIVE");
      }
    });

    it("GIVEN ARCHIVED 상태 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        status: "ARCHIVED",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("ARCHIVED");
      }
    });

    it("GIVEN 잘못된 상태 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        status: "INVALID",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });
  });

  describe("repoUrl 업데이트 검증", () => {
    it("GIVEN 새로운 GitHub URL WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        repoUrl: "https://github.com/new-owner/new-repo",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
    });

    it("GIVEN defaultBranch 업데이트 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        defaultBranch: "feature-branch",
      };

      // WHEN
      const result = updateProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultBranch).toBe("feature-branch");
      }
    });
  });
});

describe("parseRepoUrl", () => {
  describe("GitHub URL 파싱", () => {
    it("GIVEN 유효한 GitHub URL WHEN 파싱 THEN owner와 name이 추출되어야 한다", () => {
      // GIVEN
      const url = "https://github.com/facebook/react";

      // WHEN
      const result = parseRepoUrl(url);

      // THEN
      expect(result).toEqual({
        provider: "GITHUB",
        owner: "facebook",
        name: "react",
      });
    });

    it("GIVEN .git 접미사가 있는 GitHub URL WHEN 파싱 THEN .git이 제거되어야 한다", () => {
      // GIVEN
      const url = "https://github.com/facebook/react.git";

      // WHEN
      const result = parseRepoUrl(url);

      // THEN
      expect(result).toEqual({
        provider: "GITHUB",
        owner: "facebook",
        name: "react",
      });
    });

    it("GIVEN 슬래시로 끝나는 GitHub URL WHEN 파싱 THEN 성공해야 한다", () => {
      // GIVEN
      const url = "https://github.com/facebook/react/";

      // WHEN
      const result = parseRepoUrl(url);

      // THEN
      expect(result).toEqual({
        provider: "GITHUB",
        owner: "facebook",
        name: "react",
      });
    });
  });

  describe("GitLab URL 파싱", () => {
    it("GIVEN 유효한 GitLab URL WHEN 파싱 THEN owner와 name이 추출되어야 한다", () => {
      // GIVEN
      const url = "https://gitlab.com/gitlab-org/gitlab";

      // WHEN
      const result = parseRepoUrl(url);

      // THEN
      expect(result).toEqual({
        provider: "GITLAB",
        owner: "gitlab-org",
        name: "gitlab",
      });
    });
  });

  describe("잘못된 URL 파싱", () => {
    it("GIVEN 지원하지 않는 호스트 URL WHEN 파싱 THEN null이 반환되어야 한다", () => {
      // GIVEN
      const url = "https://bitbucket.org/owner/repo";

      // WHEN
      const result = parseRepoUrl(url);

      // THEN
      expect(result).toBeNull();
    });

    it("GIVEN 잘못된 형식의 URL WHEN 파싱 THEN null이 반환되어야 한다", () => {
      // GIVEN
      const url = "https://github.com/only-owner";

      // WHEN
      const result = parseRepoUrl(url);

      // THEN
      expect(result).toBeNull();
    });
  });
});
