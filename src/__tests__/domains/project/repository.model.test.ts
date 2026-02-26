/**
 * Repository Domain Model Tests
 *
 * URL 파싱, owner 추출이 constructor에서 수행되는지 검증
 */

import {
  Repository,
  type RepositoryInput,
} from "@/domains/project/model/repository";

describe("Repository Domain Model", () => {
  describe("GitHub URL로 생성", () => {
    it("GIVEN GitHub URL WHEN Repository 생성 THEN owner가 파싱되어야 한다", () => {
      // GIVEN
      const input: RepositoryInput = {
        provider: "GITHUB",
        url: "https://github.com/facebook/react",
        name: "react",
        defaultBranch: "main",
      };

      // WHEN
      const repo = new Repository(input, true);

      // THEN
      expect(repo.owner).toBe("facebook");
      expect(repo.url).toBe("https://github.com/facebook/react");
      expect(repo.provider).toBe("GITHUB");
      expect(repo.isPrimary).toBe(true);
    });
  });

  describe("GitLab URL로 생성", () => {
    it("GIVEN GitLab URL WHEN Repository 생성 THEN owner가 파싱되어야 한다", () => {
      // GIVEN
      const input: RepositoryInput = {
        provider: "GITLAB",
        url: "https://gitlab.com/gitlab-org/gitlab",
        name: "gitlab",
        defaultBranch: "main",
      };

      // WHEN
      const repo = new Repository(input, false);

      // THEN
      expect(repo.owner).toBe("gitlab-org");
      expect(repo.isPrimary).toBe(false);
    });
  });

  describe("URL 없이 생성", () => {
    it("GIVEN URL이 없는 입력 WHEN Repository 생성 THEN owner가 null이어야 한다", () => {
      // GIVEN
      const input: RepositoryInput = {
        provider: "MANUAL",
        name: "my-project",
        defaultBranch: "main",
      };

      // WHEN
      const repo = new Repository(input, true);

      // THEN
      expect(repo.url).toBeNull();
      expect(repo.owner).toBeNull();
    });

    it("GIVEN 빈 문자열 URL WHEN Repository 생성 THEN url/owner가 null이어야 한다", () => {
      // GIVEN
      const input: RepositoryInput = {
        provider: "MANUAL",
        url: "",
        name: "my-project",
        defaultBranch: "main",
      };

      // WHEN
      const repo = new Repository(input, false);

      // THEN
      expect(repo.url).toBeNull();
      expect(repo.owner).toBeNull();
    });
  });

  describe("파싱 불가능한 URL", () => {
    it("GIVEN 지원하지 않는 URL WHEN Repository 생성 THEN owner가 null이어야 한다", () => {
      // GIVEN
      const input: RepositoryInput = {
        provider: "MANUAL",
        url: "https://bitbucket.org/owner/repo",
        name: "repo",
        defaultBranch: "main",
      };

      // WHEN
      const repo = new Repository(input, true);

      // THEN
      expect(repo.url).toBe("https://bitbucket.org/owner/repo");
      expect(repo.owner).toBeNull();
    });
  });

  describe("isPrimary 전달", () => {
    it("GIVEN isPrimary=true WHEN Repository 생성 THEN isPrimary가 true여야 한다", () => {
      // GIVEN
      const input: RepositoryInput = {
        provider: "GITHUB",
        url: "https://github.com/org/repo",
        name: "repo",
        defaultBranch: "main",
      };

      // WHEN
      const repo = new Repository(input, true);

      // THEN
      expect(repo.isPrimary).toBe(true);
    });

    it("GIVEN isPrimary=false WHEN Repository 생성 THEN isPrimary가 false여야 한다", () => {
      // GIVEN
      const input: RepositoryInput = {
        provider: "GITHUB",
        url: "https://github.com/org/repo",
        name: "repo",
        defaultBranch: "main",
      };

      // WHEN
      const repo = new Repository(input, false);

      // THEN
      expect(repo.isPrimary).toBe(false);
    });
  });

  describe("optional 필드", () => {
    it("GIVEN role이 있는 입력 WHEN Repository 생성 THEN role이 설정되어야 한다", () => {
      // GIVEN
      const input: RepositoryInput = {
        provider: "GITHUB",
        url: "https://github.com/org/backend",
        name: "backend",
        defaultBranch: "main",
        role: "backend",
      };

      // WHEN
      const repo = new Repository(input, true);

      // THEN
      expect(repo.role).toBe("backend");
    });

    it("GIVEN role이 없는 입력 WHEN Repository 생성 THEN role이 undefined여야 한다", () => {
      // GIVEN
      const input: RepositoryInput = {
        provider: "GITHUB",
        url: "https://github.com/org/repo",
        name: "repo",
        defaultBranch: "main",
      };

      // WHEN
      const repo = new Repository(input, false);

      // THEN
      expect(repo.role).toBeUndefined();
    });
  });

  describe("Prisma 구조적 호환성", () => {
    it("GIVEN Repository 인스턴스 WHEN 스프레드 THEN Prisma create에 필요한 필드가 모두 포함되어야 한다", () => {
      // GIVEN
      const input: RepositoryInput = {
        provider: "GITHUB",
        url: "https://github.com/org/repo",
        name: "repo",
        defaultBranch: "main",
        role: "frontend",
      };

      // WHEN
      const repo = new Repository(input, true);

      // THEN
      expect(repo).toHaveProperty("provider");
      expect(repo).toHaveProperty("url");
      expect(repo).toHaveProperty("owner");
      expect(repo).toHaveProperty("name");
      expect(repo).toHaveProperty("defaultBranch");
      expect(repo).toHaveProperty("isPrimary");
      expect(repo).toHaveProperty("role");
    });
  });
});
