/**
 * Project DTO Validation Tests (Multi-Repository)
 *
 * 프로젝트 생성/수정 시 입력 데이터 검증 테스트
 * - repositories 배열 지원
 */

import {
  createProjectSchema,
  updateProjectSchema,
  parseRepoUrl,
} from "@/domains/project/dto/project.dto";

describe("createProjectSchema (Multi-Repo)", () => {
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

  describe("repositories 필드 검증", () => {
    it("GIVEN repositories 배열 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Multi-Repo Project",
        repositories: [
          {
            provider: "GITHUB",
            name: "frontend",
            url: "https://github.com/owner/frontend",
            defaultBranch: "main",
            isPrimary: true,
            role: "frontend",
          },
        ],
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repositories).toHaveLength(1);
        expect(result.data.repositories![0].name).toBe("frontend");
        expect(result.data.repositories![0].isPrimary).toBe(true);
      }
    });

    it("GIVEN 빈 repositories WHEN 검증 THEN 성공해야 한다 (기본값 [])", () => {
      // GIVEN
      const input = {
        name: "Project without repos",
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repositories).toEqual([]);
      }
    });

    it("GIVEN 여러 repositories WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Multi-Repo Project",
        repositories: [
          {
            provider: "GITHUB",
            name: "frontend",
            url: "https://github.com/owner/frontend",
            isPrimary: true,
            role: "frontend",
          },
          {
            provider: "GITHUB",
            name: "backend",
            url: "https://github.com/owner/backend",
            isPrimary: false,
            role: "backend",
          },
          {
            provider: "GITLAB",
            name: "shared",
            url: "https://gitlab.com/owner/shared",
            isPrimary: false,
            role: "shared",
          },
        ],
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repositories).toHaveLength(3);
        expect(result.data.repositories![0].role).toBe("frontend");
        expect(result.data.repositories![1].role).toBe("backend");
        expect(result.data.repositories![2].provider).toBe("GITLAB");
      }
    });

    it("GIVEN 잘못된 repository 객체 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Project",
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

    it("GIVEN repository name 없음 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Project",
        repositories: [
          {
            provider: "GITHUB",
            // name missing
          },
        ],
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN repository provider 없음 WHEN 검증 THEN 실패해야 한다", () => {
      // GIVEN
      const input = {
        name: "Project",
        repositories: [
          {
            name: "my-repo",
            // provider missing
          },
        ],
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(false);
    });

    it("GIVEN repositories 명시적 빈 배열 WHEN 검증 THEN 성공해야 한다", () => {
      // GIVEN
      const input = {
        name: "Project",
        repositories: [],
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repositories).toEqual([]);
      }
    });
  });

  describe("repositories 기본값 검증", () => {
    it("GIVEN repository defaultBranch 없음 WHEN 검증 THEN main이 기본값이어야 한다", () => {
      // GIVEN
      const input = {
        name: "Project",
        repositories: [
          {
            provider: "GITHUB",
            name: "repo",
          },
        ],
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repositories![0].defaultBranch).toBe("main");
      }
    });

    it("GIVEN repository isPrimary 없음 WHEN 검증 THEN false가 기본값이어야 한다", () => {
      // GIVEN
      const input = {
        name: "Project",
        repositories: [
          {
            provider: "GITHUB",
            name: "repo",
          },
        ],
      };

      // WHEN
      const result = createProjectSchema.safeParse(input);

      // THEN
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repositories![0].isPrimary).toBe(false);
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
