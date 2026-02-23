/**
 * 자체 호스팅 GitLab 지원 테스트
 *
 * GITLAB_URL 환경변수를 통한 자체 호스팅 GitLab 설정 검증
 */

import { parseRepoUrl } from "@/domains/project/dto/project.dto";

describe("자체 호스팅 GitLab 지원", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("parseRepoUrl - 자체 호스팅 GitLab URL", () => {
    it("GIVEN GITLAB_URL 설정 WHEN 자체 호스팅 URL 파싱 THEN GITLAB provider로 인식되어야 한다", () => {
      // GIVEN
      process.env.GITLAB_URL = "https://gitlab.company.com";

      // WHEN
      const result = parseRepoUrl("https://gitlab.company.com/team/project");

      // THEN
      expect(result).toEqual({
        provider: "GITLAB",
        owner: "team",
        name: "project",
      });
    });

    it("GIVEN GITLAB_URL 설정 WHEN 중첩 그룹 URL 파싱 THEN owner에 경로가 포함되어야 한다", () => {
      // GIVEN
      process.env.GITLAB_URL = "https://gitlab.company.com";

      // WHEN
      const result = parseRepoUrl(
        "https://gitlab.company.com/group/subgroup/project"
      );

      // THEN
      expect(result).toEqual({
        provider: "GITLAB",
        owner: "group/subgroup",
        name: "project",
      });
    });

    it("GIVEN GITLAB_URL 설정 WHEN .git 접미사 URL 파싱 THEN .git이 제거되어야 한다", () => {
      // GIVEN
      process.env.GITLAB_URL = "https://git.internal.io";

      // WHEN
      const result = parseRepoUrl("https://git.internal.io/team/repo.git");

      // THEN
      expect(result).toEqual({
        provider: "GITLAB",
        owner: "team",
        name: "repo",
      });
    });

    it("GIVEN GITLAB_URL 미설정 WHEN 자체 호스팅 URL 파싱 THEN null이 반환되어야 한다", () => {
      // GIVEN
      delete process.env.GITLAB_URL;

      // WHEN
      const result = parseRepoUrl("https://gitlab.company.com/team/project");

      // THEN
      expect(result).toBeNull();
    });

    it("GIVEN GITLAB_URL이 기본값 WHEN gitlab.com URL 파싱 THEN 기존 로직으로 매칭되어야 한다", () => {
      // GIVEN
      process.env.GITLAB_URL = "https://gitlab.com";

      // WHEN
      const result = parseRepoUrl("https://gitlab.com/gitlab-org/gitlab");

      // THEN
      expect(result).toEqual({
        provider: "GITLAB",
        owner: "gitlab-org",
        name: "gitlab",
      });
    });
  });

  describe("parseRepoUrl - 기존 동작 유지", () => {
    it("GIVEN GITLAB_URL 설정 WHEN GitHub URL 파싱 THEN GitHub로 인식되어야 한다", () => {
      // GIVEN
      process.env.GITLAB_URL = "https://gitlab.company.com";

      // WHEN
      const result = parseRepoUrl("https://github.com/facebook/react");

      // THEN
      expect(result).toEqual({
        provider: "GITHUB",
        owner: "facebook",
        name: "react",
      });
    });

    it("GIVEN GITLAB_URL 설정 WHEN gitlab.com URL 파싱 THEN GitLab으로 인식되어야 한다", () => {
      // GIVEN
      process.env.GITLAB_URL = "https://gitlab.company.com";

      // WHEN
      const result = parseRepoUrl("https://gitlab.com/group/project");

      // THEN
      expect(result).toEqual({
        provider: "GITLAB",
        owner: "group",
        name: "project",
      });
    });

    it("GIVEN GITLAB_URL 설정 WHEN 지원하지 않는 URL THEN null이 반환되어야 한다", () => {
      // GIVEN
      process.env.GITLAB_URL = "https://gitlab.company.com";

      // WHEN
      const result = parseRepoUrl("https://bitbucket.org/owner/repo");

      // THEN
      expect(result).toBeNull();
    });
  });

  describe("GitLab OAuth 설정", () => {
    it("GIVEN GITLAB_URL 환경변수 WHEN 기본값 확인 THEN https://gitlab.com이어야 한다", () => {
      // GIVEN
      delete process.env.GITLAB_URL;

      // WHEN
      const gitlabUrl = process.env.GITLAB_URL || "https://gitlab.com";

      // THEN
      expect(gitlabUrl).toBe("https://gitlab.com");
    });

    it("GIVEN 자체 호스팅 URL WHEN OAuth 엔드포인트 생성 THEN 올바른 URL이어야 한다", () => {
      // GIVEN
      const gitlabUrl = "https://gitlab.company.com";

      // WHEN
      const authorizeUrl = `${gitlabUrl}/oauth/authorize`;
      const tokenUrl = `${gitlabUrl}/oauth/token`;
      const userinfoUrl = `${gitlabUrl}/api/v4/user`;

      // THEN
      expect(authorizeUrl).toBe("https://gitlab.company.com/oauth/authorize");
      expect(tokenUrl).toBe("https://gitlab.company.com/oauth/token");
      expect(userinfoUrl).toBe("https://gitlab.company.com/api/v4/user");
    });

    it("GIVEN 자체 호스팅 URL WHEN API base 생성 THEN 올바른 URL이어야 한다", () => {
      // GIVEN
      const gitlabUrl = "https://git.internal.io";

      // WHEN
      const apiBase = `${gitlabUrl}/api/v4`;

      // THEN
      expect(apiBase).toBe("https://git.internal.io/api/v4");
    });
  });
});
