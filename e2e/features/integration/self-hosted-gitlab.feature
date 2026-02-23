Feature: 자체 호스팅 GitLab 지원
  사용자가 자체 호스팅 GitLab 인스턴스와 연동할 수 있다

  Background:
    Given GITLAB_URL 환경변수가 설정되어 있다

  Scenario: 자체 호스팅 GitLab OAuth 인증
    Given GITLAB_URL이 "https://gitlab.company.com"으로 설정되어 있다
    When GitLab으로 로그인을 시도한다
    Then OAuth 인증 URL이 "https://gitlab.company.com/oauth/authorize"이다
    And 토큰 엔드포인트가 "https://gitlab.company.com/oauth/token"이다

  Scenario: 자체 호스팅 GitLab API 호출
    Given GITLAB_URL이 "https://gitlab.company.com"으로 설정되어 있다
    When GitLab 저장소 목록을 조회한다
    Then API 호출이 "https://gitlab.company.com/api/v4"로 전송된다

  Scenario: 자체 호스팅 GitLab URL 파싱
    Given GITLAB_URL이 "https://gitlab.company.com"으로 설정되어 있다
    When "https://gitlab.company.com/group/project" URL을 파싱한다
    Then provider가 "GITLAB"이다
    And owner가 "group"이다
    And name이 "project"이다

  Scenario: GITLAB_URL 미설정 시 기본값
    Given GITLAB_URL 환경변수가 설정되지 않았다
    When GitLab OAuth 설정을 확인한다
    Then 기본 URL이 "https://gitlab.com"이다
